
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, CheckCircle, Loader2, X, Trash2, ShieldCheck, Zap, Camera, Edit3, LogOut, Film, Image as ImageIcon, Calendar, Percent, Trash, Eye, Heart, Bookmark, TrendingUp, BarChart3, Wand2, LayoutGrid, Settings, MousePointerClick, MessageCircle } from 'lucide-react';
import { saveLocalPromotion, getAuthUser, logoutUser, getStoreById } from '../constants';
import { storage, isFirebaseConfigured } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { Promotion, ViewType, Store } from '../types';
import { usePromotions } from '../hooks/usePromotions';

interface MerchantDashboardProps {
  onViewChange?: (view: ViewType) => void;
  onOpenStoreProfile?: (storeId: string) => void;
  onOpenMessages?: () => void;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ onViewChange, onOpenStoreProfile, onOpenMessages }) => {
  const user = getAuthUser();
  const { promotions } = usePromotions();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storeData, setStoreData] = useState<Store | null>(null);
  
  const [formData, setFormData] = useState({
    description: '',
    discount: '',
    expiresAt: ''
  });
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  useEffect(() => {
    const fetchStore = async () => {
      if (user?.merchantId) {
        const store = await getStoreById(user.merchantId);
        setStoreData(store);
      }
    };
    fetchStore();
  }, [user?.merchantId]);

  const merchantPromos = useMemo(() => {
    return promotions.filter(p => p.storeId === user?.merchantId);
  }, [promotions, user?.merchantId]);

  const stats = useMemo(() => {
    return merchantPromos.reduce((acc, promo) => {
      return {
        views: acc.views + (promo.views || 0),
        likes: acc.likes + (promo.likes || 0),
        saves: acc.saves + (promo.saves || 0)
      };
    }, { views: 0, likes: 0, saves: 0 });
  }, [merchantPromos]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePromo = async () => {
    if (!formData.description || !mediaFile || !formData.expiresAt) {
      alert("⚠️ Preencha a descrição, selecione uma imagem/vídeo e defina a validade.");
      return;
    }

    setLoading(true);
    try {
      let downloadUrl = mediaPreview || '';

      if (isFirebaseConfigured && storage) {
        // 1. Upload para o Firebase Storage
        const storageRef = ref(storage, `promotions/${Date.now()}_${mediaFile.name}`);
        const uploadSnap = await uploadBytes(storageRef, mediaFile);
        downloadUrl = await getDownloadURL(uploadSnap.ref);
      } else {
        console.warn("Firebase não configurado. Usando mídia em base64 local.");
      }

      // 2. Salvar metadados no Firestore ou LocalStorage
      const [year, month, day] = formData.expiresAt.split('-');
      
      const promoData: any = {
        storeId: user?.merchantId || 'unknown',
        storeName: storeData?.name || user?.name || 'Minha Loja',
        storeLogo: storeData?.logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=100&h=100&fit=crop', // Fallback
        description: formData.description,
        discount: formData.discount ? `${formData.discount}% OFF` : '',
        expiresAt: `${day}/${month}/${year}`,
        likes: 0,
        saves: 0,
        views: 0,
        saved: false
      };

      if (mediaType === 'video') {
        promoData.videoUrl = downloadUrl;
        promoData.imageUrl = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=600&fit=crop'; // Placeholder para vídeo
      } else {
        promoData.imageUrl = downloadUrl;
      }

      await saveLocalPromotion(promoData);

      setShowModal(false);
      setFormData({ description: '', discount: '', expiresAt: '' });
      setMediaPreview(null);
      setMediaFile(null);
      setMediaType('image');
      alert("🎉 Oferta publicada com sucesso!");
    } catch (err: any) {
      alert("Erro ao publicar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Sair do Dashboard?")) await logoutUser();
  };

  return (
    <div className="p-4 h-full bg-gray-50 overflow-y-auto pb-24 text-left no-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter italic uppercase">Painel Lojista</h1>
          <p className="text-[10px] text-indigo-600 font-bold tracking-widest uppercase">Sincronizado em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenMessages}
            className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm text-indigo-600 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <MessageCircle size={16} /> Chat
          </button>
          <button 
            onClick={() => {
              if (user?.merchantId) {
                onOpenStoreProfile?.(user.merchantId);
              }
            }} 
            className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm text-indigo-600 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <Eye size={16} /> Ver Perfil
          </button>
          <button onClick={() => onViewChange?.('MERCHANT_SETTINGS')} className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm text-gray-600"><Settings size={20} /></button>
          <button onClick={handleLogout} className="bg-rose-600 p-3 rounded-2xl text-white shadow-sm"><LogOut size={20} /></button>
        </div>
      </div>

      {storeData && (
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-8 flex items-center gap-4">
          <img src={storeData.logo} alt={storeData.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100" />
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-tight">{storeData.name}</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{storeData.category}</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Resumo de Estatísticas</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><Eye size={16} /></div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-800">{stats.views}</p>
              <span className="text-[9px] font-bold text-gray-400 uppercase">Visualizações</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-rose-50 p-2 rounded-xl text-rose-500"><Heart size={16} /></div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-800">{stats.likes}</p>
              <span className="text-[9px] font-bold text-gray-400 uppercase">Curtidas</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-purple-50 p-2 rounded-xl text-purple-500"><Bookmark size={16} /></div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-800">{stats.saves}</p>
              <span className="text-[9px] font-bold text-gray-400 uppercase">Salvamentos</span>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => setShowModal(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 mb-8">
        <Plus size={24} /> NOVA OFERTA CLOUD
      </button>

      {/* Modal simplificado para brevidade */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-7 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-gray-400 p-2"><X size={24} /></button>
            <h3 className="text-xl font-black italic mb-6">NOVA OFERTA</h3>
            
            <div className="space-y-4 mb-6">
              <div className="border-2 border-dashed rounded-[32px] p-6 flex flex-col items-center justify-center gap-2 relative min-h-[160px] overflow-hidden bg-black">
                <input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                {mediaPreview ? (
                  <>
                    <div 
                      className="absolute inset-0 opacity-50 blur-xl scale-110 bg-cover bg-center"
                      style={{ backgroundImage: mediaType === 'image' ? `url(${mediaPreview})` : 'none', backgroundColor: mediaType === 'video' ? '#000' : 'transparent' }}
                    />
                    {mediaType === 'video' ? (
                      <video src={mediaPreview} className="w-full h-full object-contain absolute inset-0 z-10" autoPlay loop muted playsInline />
                    ) : (
                      <img src={mediaPreview} className="w-full h-full object-contain absolute inset-0 z-10" />
                    )}
                  </>
                ) : (
                  <span className="text-[10px] font-black text-gray-400 uppercase relative z-10 text-center">Selecione uma imagem ou vídeo</span>
                )}
              </div>
              <textarea placeholder="Descrição..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border p-4 rounded-2xl text-sm outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Desconto %" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="bg-gray-50 border p-4 rounded-xl text-sm" />
                <input type="date" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="bg-gray-50 border p-4 rounded-xl text-xs" />
              </div>
            </div>

            <button onClick={handleCreatePromo} disabled={loading} className="w-full py-5 bg-indigo-600 rounded-[24px] font-black text-white flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={20} />}
              {loading ? 'PUBLICANDO...' : 'PUBLICAR NO FIREBASE'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
