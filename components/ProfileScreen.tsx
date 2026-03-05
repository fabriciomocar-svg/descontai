
import React, { useState, useEffect } from 'react';
import { logoutUser, getAuthUser, saveUserMetadata, setAuthUser, getUserMetadata, deleteAccount } from '../constants';
import { usePromotions } from '../hooks/usePromotions';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Settings, Bookmark, Bell, HelpCircle, LogOut, ChevronRight, MapPin, Camera, Loader2, BellOff, Shield, Trash2, Download } from 'lucide-react';
import { AuthUser, ViewType, Promotion } from '../types';

interface ProfileScreenProps {
  onViewChange?: (view: ViewType) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onViewChange }) => {
  const user = getAuthUser();
  const { promotions } = usePromotions();
  const { permission, requestPermission } = usePushNotifications();
  const [savedPromos, setSavedPromos] = useState<Promotion[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSavedPromos = async () => {
      if (user) {
        const metadata = await getUserMetadata(user.id);
        if (metadata?.savedPromotions) {
          const saved = promotions.filter(p => metadata.savedPromotions?.includes(p.id));
          setSavedPromos(saved);
        } else {
          setSavedPromos([]);
        }
      }
    };
    fetchSavedPromos();
  }, [user?.id, promotions]);

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleNotificationToggle = async () => {
    if (permission === 'default') {
      await requestPermission();
    } else if (permission === 'denied') {
      alert('As notificações estão bloqueadas. Por favor, habilite nas configurações do seu navegador.');
    } else {
      alert('Notificações já estão ativadas!');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.")) {
      setIsDeleting(true);
      try {
        await deleteAccount();
      } catch (error: any) {
        alert(error.message || "Erro ao excluir conta. Tente novamente.");
        setIsDeleting(false);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const updatedUser: AuthUser = { ...user, photoURL: base64 };
        await saveUserMetadata(user.id, { photoURL: base64 });
        setAuthUser(updatedUser);
        alert("Foto de perfil atualizada com sucesso!");
      } catch (err: any) {
        console.error("Erro ao salvar foto de perfil:", err);
        alert("Erro ao salvar foto de perfil. Tente novamente.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24 text-left">
      <div className="bg-white p-8 flex flex-col items-center border-b border-gray-100 shadow-sm">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-indigo-50 overflow-hidden relative">
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
              </div>
            ) : (
              <img 
                src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'guest'}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full border-2 border-white shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors active:scale-90">
            <Camera size={14} />
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        </div>
        <h2 className="mt-4 text-xl font-black text-gray-800">{user?.name || 'Visitante'}</h2>
        <div className="flex items-center gap-1 text-gray-400 mt-1">
          <MapPin size={12} />
          <p className="text-xs font-bold uppercase tracking-widest">
            {user?.role === 'ADMIN' ? 'Gestor Master' : user?.role === 'MERCHANT' ? 'Lojista Oficial' : 'Consumidor'}
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bookmark className="text-indigo-600" size={18} />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Minhas Salvas</h3>
            </div>
            <span className="text-xs font-bold text-gray-400">{savedPromos.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {savedPromos.map(promo => (
              <div key={promo.id} className="aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <img src={promo.imageUrl} className="w-full h-full object-cover" alt="Oferta Salva" />
              </div>
            ))}
            {savedPromos.length === 0 && (
              <div className="col-span-3 py-10 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-400 font-medium">Nenhuma oferta salva ainda.</p>
              </div>
            )}
          </div>
        </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-1">Conta & Preferências</h3>
            
            <button 
              onClick={handleNotificationToggle}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${permission === 'granted' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  {permission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-gray-700 block">Notificações</span>
                  <span className="text-[10px] font-medium text-gray-400">
                    {permission === 'granted' ? 'Ativadas' : permission === 'denied' ? 'Bloqueadas' : 'Toque para ativar'}
                  </span>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={18} />
            </button>

            <button 
              onClick={() => window.dispatchEvent(new Event('show-install-prompt'))}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg"><Download size={18} /></div>
                <span className="text-sm font-bold text-gray-700">Instalar Aplicativo</span>
              </div>
              <ChevronRight className="text-gray-300" size={18} />
            </button>

          <button 
            onClick={() => onViewChange?.('FAQ_VIEW')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 text-amber-600 p-2 rounded-lg"><HelpCircle size={18} /></div>
              <span className="text-sm font-bold text-gray-700">Central de Ajuda</span>
            </div>
            <ChevronRight className="text-gray-300" size={18} />
          </button>

          <button 
            onClick={() => onViewChange?.('PRIVACY_VIEW')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><Shield size={18} /></div>
              <span className="text-sm font-bold text-gray-700">Privacidade & Termos</span>
            </div>
            <ChevronRight className="text-gray-300" size={18} />
          </button>

          <div className="pt-6 space-y-3">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <LogOut size={20} />
              <span className="font-black text-sm uppercase tracking-wider">Sair da Conta</span>
            </button>

            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-2 p-3 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors opacity-60 hover:opacity-100"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              <span className="font-bold text-xs uppercase tracking-wider">Excluir Minha Conta</span>
            </button>

            <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-[0.2em]">Versão 1.0.5 - Cloud</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
