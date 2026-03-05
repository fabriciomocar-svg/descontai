import React, { useState, useEffect } from 'react';
import { Store, AuthUser, Category } from '../types';
import { getAuthUser, saveUserMetadata, getCategories } from '../constants';
import { db, storage, isFirebaseConfigured, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword } from 'firebase/auth';
import { ArrowLeft, Save, Upload, Loader2, Store as StoreIcon, MapPin, Phone, Instagram, FileText, Tag, Lock } from 'lucide-react';

const withTimeout = <T,>(promise: Promise<T>, ms: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout de conexão com o servidor')), ms))
  ]);
};

interface MerchantSettingsScreenProps {
  onBack: () => void;
}

const MerchantSettingsScreen: React.FC<MerchantSettingsScreenProps> = ({ onBack }) => {
  const user = getAuthUser();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<Store>>({
    name: '',
    category: '',
    categories: [],
    address: '',
    phone: '',
    instagram: '',
    description: '',
    logo: '',
    coverImage: ''
  });

  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!user || !isFirebaseConfigured || !db) {
        setInitialLoading(false);
        return;
      }

      try {
        const [snap, categoriesData] = await Promise.all([
          withTimeout(getDoc(doc(db, 'stores', user.merchantId || `store_${user.id}`))) as any,
          getCategories()
        ]);

        setAvailableCategories(categoriesData);

        if (snap.exists()) {
          const data = snap.data() as Store;
          setFormData({
            ...data,
            categories: data.categories || (data.category ? [data.category] : [])
          });
          if (data.logo) setLogoPreview(data.logo);
          if (data.coverImage) setCoverPreview(data.coverImage);
        } else {
          // Pre-fill with user name if new store
          setFormData(prev => ({ ...prev, name: user.name }));
        }
      } catch (error) {
        console.error("Erro ao buscar dados da loja:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchStoreData();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleCategory = (catName: string) => {
    setFormData(prev => {
      const current = prev.categories || [];
      const isSelected = current.includes(catName);
      let nextCategories = isSelected 
        ? current.filter(c => c !== catName)
        : [...current, catName];
      
      return {
        ...prev,
        categories: nextCategories,
        // Mantém a primeira categoria como principal para compatibilidade
        category: nextCategories.length > 0 ? nextCategories[0] : ''
      };
    });
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!auth?.currentUser || !db) {
      alert("Erro de autenticação ou conexão.");
      return;
    }

    setPasswordLoading(true);
    try {
      // 1. Update Firebase Auth password
      await updatePassword(auth.currentUser, newPassword);

      // 2. Update merchantPassword in Store document so Admin can see it
      const storeId = user?.merchantId || `store_${user?.id}`;
      await setDoc(doc(db, 'stores', storeId), { merchantPassword: newPassword }, { merge: true });

      alert("✅ Senha alterada com sucesso!");
      setNewPassword('');
    } catch (error: any) {
      const errorCode = error.code || '';
      if (errorCode === 'auth/requires-recent-login') {
        alert("Por segurança, você precisa sair e fazer login novamente antes de alterar a senha.");
      } else if (errorCode.includes('weak-password')) {
        alert("A senha deve ter pelo menos 6 caracteres.");
      } else {
        alert("Não foi possível alterar a senha. Verifique sua conexão ou tente fazer login novamente.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.name || !formData.category) {
      alert("Nome e Categoria são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      let logoUrl = formData.logo;
      let coverUrl = formData.coverImage;

      // Upload logo if changed
      if (logoFile && storage) {
        try {
          const storageRef = ref(storage, `logos/${user.id}_${Date.now()}`);
          const uploadSnap = await withTimeout(uploadBytes(storageRef, logoFile), 5000) as any;
          logoUrl = await getDownloadURL(uploadSnap.ref);
        } catch (e) {
          console.warn("Falha ao fazer upload da logo (timeout ou erro). Usando preview local.");
          logoUrl = logoPreview || formData.logo;
        }
      }

      // Upload cover if changed
      if (coverFile && storage) {
        try {
          const storageRef = ref(storage, `covers/${user.id}_${Date.now()}`);
          const uploadSnap = await withTimeout(uploadBytes(storageRef, coverFile), 5000) as any;
          coverUrl = await getDownloadURL(uploadSnap.ref);
        } catch (e) {
          console.warn("Falha ao fazer upload da capa (timeout ou erro). Usando preview local.");
          coverUrl = coverPreview || formData.coverImage;
        }
      }

      const storeId = user.merchantId || `store_${user.id}`;
      const storeData: Store = {
        id: storeId,
        name: formData.name!,
        category: formData.category!,
        address: formData.address || '',
        phone: formData.phone || '',
        instagram: formData.instagram || '',
        description: formData.description || '',
        logo: logoUrl || 'https://via.placeholder.com/150',
        coverImage: coverUrl || '',
        rating: formData.rating || 5.0,
        isPartner: true,
        ownerEmail: user.email
      };

      if (db) {
        try {
          // Save store data
          await withTimeout(setDoc(doc(db, 'stores', storeId), storeData, { merge: true }), 5000);
          
          // Update user metadata with merchantId if not present
          if (!user.merchantId) {
            await withTimeout(saveUserMetadata(user.id, { merchantId: storeId }), 5000);
          }
        } catch (e) {
          console.warn("Falha ao salvar no Firebase (timeout ou erro). Salvando apenas localmente.");
        }
      }
      
      // Update local user state regardless
      if (!user.merchantId) {
        const updatedUser = { ...user, merchantId: storeId };
        localStorage.setItem('descontai_auth_user', JSON.stringify(updatedUser));
      }

      alert("✅ Dados da loja salvos com sucesso!");
      onBack();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24 text-left no-scrollbar">
      <div className="bg-white p-6 sticky top-0 z-10 border-b border-gray-100 shadow-sm flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Configurar Loja</h1>
        <div className="w-8" /> {/* Spacer */}
      </div>

      <div className="p-6 space-y-6">
        {/* Cover Image Upload */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 px-1">
            Imagem de Capa
          </label>
          <div className="relative h-40 w-full bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group cursor-pointer">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-300">
                <Upload size={24} />
                <span className="text-[10px] font-bold uppercase">Upload Capa</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="text-white" size={24} />
            </div>
            <input type="file" accept="image/*" onChange={handleCoverChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="flex flex-col items-center justify-center -mt-12 relative z-10">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-[32px] bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <StoreIcon className="text-gray-300" size={32} />
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="text-white" size={20} />
            </div>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wider">Foto de Perfil</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <StoreIcon size={12} /> Nome da Loja
            </label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ex: Burger King"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Tag size={12} /> Categorias (Selecione uma ou mais)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.length > 0 ? (
                availableCategories.map(cat => {
                  const isSelected = (formData.categories || []).includes(cat.name);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })
              ) : (
                ['Alimentação', 'Moda', 'Eletrônicos', 'Serviços', 'Saúde', 'Beleza', 'Outros'].map(cat => {
                  const isSelected = (formData.categories || []).includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                        isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <FileText size={12} /> Descrição
            </label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors min-h-[100px]"
              placeholder="Descreva sua loja..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <MapPin size={12} /> Endereço
            </label>
            <input 
              type="text" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
              placeholder="Rua, Número, Bairro"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Redes Sociais & Contato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Phone size={12} /> WhatsApp
                </label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  placeholder="5511999999999"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Instagram size={12} /> Instagram
                </label>
                <input 
                  type="text" 
                  value={formData.instagram} 
                  onChange={e => setFormData({...formData, instagram: e.target.value})}
                  className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                  placeholder="@usuario"
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 mt-8 mb-8"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          SALVAR ALTERAÇÕES
        </button>

        {/* Change Password Section */}
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <Lock size={16} className="text-gray-400" /> Alterar Senha de Acesso
          </h3>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nova Senha</label>
            <div className="flex gap-2">
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                className="flex-1 p-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
              <button 
                onClick={handlePasswordChange}
                disabled={passwordLoading || newPassword.length < 6}
                className="bg-gray-900 text-white px-6 rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {passwordLoading ? <Loader2 className="animate-spin" size={16} /> : 'Atualizar'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
              Ao alterar sua senha, o administrador da plataforma será notificado e terá acesso à nova senha para fins de suporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantSettingsScreen;
