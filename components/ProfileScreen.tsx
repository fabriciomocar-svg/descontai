
import React, { useState, useEffect } from 'react';
import { logoutUser, getAuthUser, saveUserMetadata, setAuthUser, getUserMetadata } from '../constants';
import { usePromotions } from '../hooks/usePromotions';
import { Settings, Bookmark, Bell, HelpCircle, LogOut, ChevronRight, MapPin, Camera, Loader2 } from 'lucide-react';
import { AuthUser, ViewType, Promotion } from '../types';

interface ProfileScreenProps {
  onViewChange?: (view: ViewType) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onViewChange }) => {
  const user = getAuthUser();
  const { promotions } = usePromotions();
  const [savedPromos, setSavedPromos] = useState<Promotion[]>([]);
  const [uploading, setUploading] = useState(false);

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
          
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Bell size={18} /></div>
              <span className="text-sm font-bold text-gray-700">Notificações</span>
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

          <div className="pt-6">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 bg-rose-600 rounded-2xl shadow-lg shadow-rose-100 text-white hover:bg-rose-700 active:scale-95 transition-all"
            >
              <LogOut size={20} />
              <span className="font-black text-sm uppercase tracking-wider">Sair da Minha Conta</span>
            </button>
            <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-[0.2em]">Versão 1.0.5 - Cloud</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
