
import React, { useState, useEffect } from 'react';
import { Plus, Store, Mail, X, Camera, LogOut, UserCheck, Loader2, Trash2, AlertTriangle, BarChart3, Users, Ticket, TrendingUp, ChevronRight, UserX, HelpCircle, Tags } from 'lucide-react';
import { getStores, saveStore, deleteStore, deleteAllStores, logoutUser, db, isFirebaseConfigured, getDailyVisits, getCategories, addCategory, deleteCategory } from '../constants';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Store as StoreType, AuthUser, ViewType, Category } from '../types';
import { Logo } from './Logo';

interface AdminDashboardProps {
  onViewChange?: (view: ViewType) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewChange }) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'STORES' | 'USERS' | 'CATEGORIES'>('STATS');
  const [stores, setStores] = useState<StoreType[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [stats, setStats] = useState({
    totalStores: 0,
    totalPromotions: 0,
    totalUsers: 0,
    activePromotions: 0,
    dailyVisits: 0
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Alimentação',
    address: '',
    ownerEmail: '',
    merchantPassword: '',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop',
    coverImage: ''
  });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Busca lojas - getStores já tem try/catch interno e retorna MOCK_STORES em caso de erro
      const storesData = await getStores();
      setStores(storesData || []);
      
      const categoriesData = await getCategories();
      setCategories(categoriesData || []);
      
      let promoCount = 0;
      let userCount = 0;
      let visitCount = 0;
      let usersData: AuthUser[] = [];

      // Tenta buscar estatísticas extras se o Firebase estiver configurado
      if (isFirebaseConfigured && db) {
        // Busca Visitas
        try {
          visitCount = await getDailyVisits();
        } catch (vErr) {
          console.warn("Erro ao buscar visitas:", vErr);
        }

        // Busca Promoções
        try {
          const promosSnap = await getDocs(collection(db, 'promotions'));
          promoCount = promosSnap.size;
        } catch (promoErr: any) {
          // Silencia erro de permissão, apenas loga aviso
          if (promoErr.code === 'permission-denied' || promoErr.message?.includes('permissions')) {
            console.warn("Dashboard Admin: Sem permissão para ler coleção 'promotions'.");
          } else {
            console.error("Erro ao buscar promoções para o dashboard:", promoErr);
          }
        }
        
        // Busca Usuários
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          userCount = usersSnap.size;
          usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuthUser));
          setUsers(usersData);
        } catch (userErr: any) {
          // Silencia erro de permissão, apenas loga aviso
          if (userErr.code === 'permission-denied' || userErr.message?.includes('permissions')) {
            console.warn("Dashboard Admin: Sem permissão para ler coleção 'users'.");
          } else {
            console.error("Erro ao buscar usuários para o dashboard:", userErr);
          }
        }
      }

      setStats({
        totalStores: (storesData || []).length,
        totalPromotions: promoCount,
        totalUsers: userCount,
        activePromotions: promoCount,
        dailyVisits: visitCount
      });
    } catch (err: any) {
      // Erro genérico no processamento dos dados
      console.error("Erro ao processar dados do dashboard admin:", err);
      
      // Se chegamos aqui, pelo menos tentamos mostrar o que temos
      setStats(prev => ({
        ...prev,
        totalStores: stores.length
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const newStore: Partial<StoreType> = {
      id: editingStoreId || undefined,
      ...formData,
      rating: 5.0,
      isPartner: true
    };
    
    try {
      await saveStore(newStore);
      await fetchAllData();
      setShowModal(false);
      setEditingStoreId(null);
      setFormData({
        name: '', category: 'Alimentação', address: '', ownerEmail: '', merchantPassword: '',
        logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop',
        coverImage: ''
      });
    } catch (err: any) {
      console.error("Erro ao salvar parceiro:", err);
      const errorMessage = err.message || "Erro desconhecido";
      alert(`Erro ao salvar parceiro: ${errorMessage}. Verifique sua conexão ou permissões do Firebase.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStore = (store: StoreType) => {
    setEditingStoreId(store.id);
    setFormData({
      name: store.name,
      category: store.category,
      address: store.address,
      ownerEmail: store.ownerEmail || '',
      merchantPassword: store.merchantPassword || '',
      logo: store.logo,
      coverImage: store.coverImage || ''
    });
    setShowModal(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({...formData, logo: reader.result as string});
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({...formData, coverImage: reader.result as string});
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    if (confirm("Deseja sair do painel administrativo?")) {
      await logoutUser();
    }
  };

  const handleDeleteStore = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o parceiro "${name}"? Esta ação não pode ser desfeita.`)) {
      setLoading(true);
      try {
        await deleteStore(id);
        // Remove from local state immediately for better UX
        setStores(prev => prev.filter(store => store.id !== id));
        setStats(prev => ({ ...prev, totalStores: prev.totalStores - 1 }));
        alert(`Parceiro "${name}" excluído com sucesso.`);
      } catch (err: any) {
        console.error("Erro ao excluir parceiro:", err);
        const errorMessage = err.message || "Erro desconhecido";
        alert(`Erro ao excluir parceiro: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === 'admin@descontai.com') {
      alert("O administrador principal não pode ser excluído.");
      return;
    }

    if (confirm(`Deseja excluir permanentemente o usuário ${email}?`)) {
      setLoading(true);
      try {
        if (db) {
          await deleteDoc(doc(db, 'users', userId));
          setUsers(prev => prev.filter(u => u.id !== userId));
          setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
          alert("Usuário excluído com sucesso.");
        }
      } catch (err: any) {
        alert("Erro ao excluir usuário: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAllStores = async () => {
    if (stores.length === 0) {
      alert("Não há lojas para excluir.");
      return;
    }
    
    if (confirm(`ATENÇÃO: Você está prestes a excluir TODAS as ${stores.length} lojas e TODOS os usuários cadastrados (exceto o admin principal). Esta ação é IRREVERSÍVEL. Deseja continuar?`)) {
      setLoading(true);
      try {
        await deleteAllStores();
        setStores([]);
        setStats(prev => ({ 
          ...prev, 
          totalStores: 0, 
          totalPromotions: 0, 
          totalUsers: 1, // Apenas o admin principal sobra
          activePromotions: 0 
        }));
        alert("Todas as lojas, promoções e usuários foram excluídos com sucesso.");
      } catch (err: any) {
        console.error("Erro ao excluir todas as lojas:", err);
        const errorMessage = err.message || "Erro desconhecido";
        alert(`Erro ao excluir as lojas: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setLoading(true);
    try {
      const newCat = await addCategory(newCategoryName.trim());
      if (newCat) {
        setCategories(prev => [...prev, newCat]);
        setNewCategoryName('');
      }
    } catch (err: any) {
      console.error("Erro ao adicionar categoria:", err);
      alert("Erro ao adicionar categoria: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategoryObj = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
      setLoading(true);
      try {
        await deleteCategory(id);
        setCategories(prev => prev.filter(c => c.id !== id));
      } catch (err: any) {
        console.error("Erro ao excluir categoria:", err);
        alert("Erro ao excluir categoria: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 h-full bg-gray-50 overflow-y-auto pb-24 text-left">
      <div className="mb-6 flex justify-between items-center">
        <Logo size="sm" showText={false} />
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onViewChange?.('FAQ_MANAGER')}
            title="Gerenciar FAQ"
            className="bg-white p-2.5 rounded-2xl border border-gray-200 shadow-sm text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <HelpCircle size={20} />
          </button>
          <button 
            onClick={handleLogout}
            title="Sair"
            className="bg-white p-2.5 rounded-2xl border border-gray-200 shadow-sm text-gray-400 hover:text-rose-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="mb-6 flex p-1 bg-gray-200/50 rounded-2xl overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('STATS')}
          className={`flex-1 min-w-[120px] py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'STATS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
        >
          <BarChart3 size={14} /> Visão
        </button>
        <button 
          onClick={() => setActiveTab('STORES')}
          className={`flex-1 min-w-[120px] py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'STORES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
        >
          <Store size={14} /> Lojistas
        </button>
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`flex-1 min-w-[120px] py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'USERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
        >
          <Users size={14} /> Usuários
        </button>
        <button 
          onClick={() => setActiveTab('CATEGORIES')}
          className={`flex-1 min-w-[120px] py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'CATEGORIES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
        >
          <Tags size={14} /> Categorias
        </button>
      </div>

      {activeTab === 'STATS' ? (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm cursor-pointer" onClick={() => setActiveTab('STORES')}>
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <Store size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Parceiros</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.totalStores}</h3>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                <Ticket size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Promoções</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.totalPromotions}</h3>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm cursor-pointer" onClick={() => setActiveTab('USERS')}>
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                <Users size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuários</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.totalUsers}</h3>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                <TrendingUp size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visitas Hoje</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.dailyVisits}</h3>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-sm font-black uppercase tracking-widest opacity-80">Crescimento da Rede</h4>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-4xl font-black">{stats.totalStores > 0 ? 'Ativo' : 'Iniciando'}</span>
                <span className="text-xs font-bold mb-1 opacity-70">Monitoramento em tempo real</span>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <BarChart3 size={120} />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Atividades Recentes</h4>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                    <ChevronRight size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-800">Novo parceiro cadastrado</p>
                    <p className="text-[10px] text-gray-400">Há {i * 2} horas atrás</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'STORES' ? (
        <div className="animate-fade-in">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestão de Parceiros</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Painel do Idealizador v1.1</p>
            </div>
            {stores.length > 0 && (
              <button 
                onClick={handleDeleteAllStores}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-colors"
              >
                <AlertTriangle size={14} /> Excluir Todas
              </button>
            )}
          </div>

          <div className="space-y-4 pb-24">
            {stores.map(store => (
              <div key={store.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 relative pr-12">
                <img src={store.logo} className="w-14 h-14 rounded-2xl object-cover shrink-0" alt={store.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-800 truncate">{store.name}</h3>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase truncate">
                      <Mail size={10} className="shrink-0" /> <span className="truncate">{store.ownerEmail}</span>
                    </div>
                    {store.merchantPassword && (
                      <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold uppercase truncate">
                        <span className="shrink-0">Senha:</span> <span className="truncate">{store.merchantPassword}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="bg-green-50 px-3 py-1 rounded-full text-green-600 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                    <UserCheck size={12} /> Ativo
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditStore(store)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors active:scale-95"
                      title="Editar parceiro"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteStore(store.id, store.name)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors active:scale-95"
                      title="Excluir parceiro"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {loading && !showModal && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>}
            {!loading && stores.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-bold">Nenhum parceiro cadastrado.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'USERS' ? (
        <div className="animate-fade-in">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Usuários</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Controle de Acessos</p>
          </div>

          <div className="space-y-4 pb-24">
            {users.map(user => (
              <div key={user.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
                    <Users size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-800 truncate">{user.name || 'Usuário'}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{user.email}</p>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${user.role === 'ADMIN' ? 'bg-rose-100 text-rose-600' : user.role === 'MERCHANT' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                {user.email !== 'admin@descontai.com' && (
                  <button 
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors active:scale-95"
                    title="Excluir usuário"
                  >
                    <UserX size={20} />
                  </button>
                )}
              </div>
            ))}
            {loading && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>}
            {!loading && users.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-bold">Nenhum usuário encontrado.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Gerenciar Categorias de Lojas</p>
          </div>

          <form onSubmit={handleAddCategory} className="mb-8 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nova categoria..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!newCategoryName.trim() || loading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Adicionar
            </button>
          </form>

          <div className="space-y-3 pb-24">
            {categories.map(category => (
              <div key={category.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Tags size={20} />
                  </div>
                  <span className="font-bold text-gray-800">{category.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteCategoryObj(category.id, category.name)}
                  className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors active:scale-95"
                  title="Excluir categoria"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            {loading && categories.length === 0 && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>}
            {!loading && categories.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-bold">Nenhuma categoria cadastrada.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => { setShowModal(false); setEditingStoreId(null); setFormData({ name: '', category: 'Alimentação', address: '', ownerEmail: '', merchantPassword: '', logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop', coverImage: '' }); }} className="absolute top-4 right-4 text-gray-400 p-2">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-6">{editingStoreId ? 'Editar Parceiro' : 'Nova Empresa Parceira'}</h3>
            
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div className="space-y-4 mb-6">
                <div className="relative h-32 w-full bg-gray-100 rounded-2xl overflow-hidden group cursor-pointer border-2 border-dashed border-gray-200">
                  {formData.coverImage ? (
                    <img src={formData.coverImage} className="w-full h-full object-cover" alt="Cover preview" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Camera size={24} />
                      <span className="text-[10px] font-bold uppercase mt-1">Capa da Loja</span>
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                    <input type="file" className="hidden" onChange={handleCoverUpload} />
                  </label>
                </div>

                <div className="flex flex-col items-center -mt-12 relative z-10">
                  <div className="relative group">
                    <img src={formData.logo} className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-xl" alt="Logo preview" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                      <input type="file" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase mt-2">Foto de Perfil</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome da Loja</label>
                <input required className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm mt-1" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">E-mail do Lojista (Login)</label>
                <input required type="email" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm mt-1" 
                  value={formData.ownerEmail} onChange={e => setFormData({...formData, ownerEmail: e.target.value})} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Senha Provisória do Lojista</label>
                <input required type="text" minLength={6} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm mt-1" 
                  value={formData.merchantPassword} onChange={e => setFormData({...formData, merchantPassword: e.target.value})} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoria</label>
                <select className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm mt-1"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <button disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-xl mt-4 flex justify-center gap-2 items-center">
                {loading ? <Loader2 className="animate-spin" size={18} /> : (editingStoreId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PARCEIRO')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
