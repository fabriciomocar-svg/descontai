
import React, { useState } from 'react';
import { Store, Promotion, ViewType } from '../types';
import { usePromotions } from '../hooks/usePromotions';
import { getAuthUser } from '../constants';
import { ArrowLeft, MapPin, Phone, Instagram, Star, Clock, ChevronRight, Share2, Edit3, X } from 'lucide-react';
import ReelCard from './ReelCard';

interface StoreProfileScreenProps {
  store: Store;
  onBack: () => void;
  onEdit?: () => void;
  initialPromoId?: string | null;
}

const StoreProfileScreen: React.FC<StoreProfileScreenProps> = ({ store, onBack, onEdit, initialPromoId }) => {
  const user = getAuthUser();
  const isOwner = user?.merchantId === store.id || user?.role === 'ADMIN';
  const { promotions } = usePromotions();
  const storePromos = promotions.filter(p => p.storeId === store.id);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(() => {
    if (initialPromoId) {
      return storePromos.find(p => p.id === initialPromoId) || null;
    }
    return null;
  });

  // Atualiza o selectedPromo se as promoções mudarem (ex: carregamento assíncrono) e tivermos um initialPromoId
  React.useEffect(() => {
    if (initialPromoId && !selectedPromo && storePromos.length > 0) {
      const found = storePromos.find(p => p.id === initialPromoId);
      if (found) setSelectedPromo(found);
    }
  }, [initialPromoId, storePromos, selectedPromo]);

  const handleOpenMaps = () => {
    const query = encodeURIComponent(`${store.name} ${store.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleWhatsApp = () => {
    if (store.phone) {
      window.open(`https://wa.me/${store.phone}`, '_blank');
    }
  };

  const getInstagramUrl = () => {
    if (!store?.instagram) return undefined;
    let handle = store.instagram.trim();
    
    if (handle.startsWith('@')) {
      handle = handle.substring(1);
    } else if (handle.toLowerCase().includes('instagram.com/')) {
      const parts = handle.split(/instagram\.com\//i);
      if (parts[1]) {
        handle = parts[1].split('/')[0].split('?')[0];
      }
    }
    
    return `https://instagram.com/${handle}`;
  };

  return (
    <div className="h-full w-full bg-white overflow-y-auto no-scrollbar pb-24 text-left">
      {/* Top Banner & Header */}
      <div className="relative h-48 w-full bg-neutral-900">
        <img 
          src={store.coverImage || `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80`} 
          className="w-full h-full object-cover opacity-60" 
          alt="Capa"
        />
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
        <button className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-transform">
          <Share2 size={20} />
        </button>

        {isOwner && onEdit && (
          <button 
            onClick={onEdit}
            className="absolute bottom-4 right-6 px-4 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Edit3 size={14} /> Editar Perfil
          </button>
        )}
      </div>

      {/* Info Card Overlay */}
      <div className="px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <img 
              src={store.logo} 
              className="w-20 h-20 rounded-[24px] object-cover border-4 border-white shadow-lg -mt-16" 
              alt={store.name}
            />
            <div className="flex gap-2">
              <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full flex items-center gap-1">
                <Star size={12} fill="currentColor" />
                <span className="text-xs font-black">{store.rating}</span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{store.name}</h1>
          <div className="flex flex-wrap gap-1 mt-1">
            {(store.categories && store.categories.length > 0 ? store.categories : [store.category]).map((cat, idx) => (
              <span key={idx} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                {cat}
              </span>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 mt-4 leading-relaxed font-medium">
            {store.description || 'Uma das melhores lojas parceiras do Descontaí, oferecendo sempre as melhores promoções da cidade.'}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 active:scale-95 transition-all"
            >
              <Phone size={16} /> WHATSAPP
            </button>
            <button 
              onClick={() => {
                const url = getInstagramUrl();
                if (url) {
                  window.open(url, '_blank');
                } else if (isOwner && onEdit) {
                  // Se for o dono e não tiver link, leva para editar
                  onEdit();
                }
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-tr from-yellow-500 via-rose-500 to-purple-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all"
            >
              <Instagram size={16} /> INSTAGRAM
            </button>
          </div>
        </div>
      </div>

      {/* Endereço & Localização */}
      <div className="p-6">
        <div className="bg-gray-50 rounded-[24px] p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Localização</h4>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{store.address}</p>
            </div>
          </div>
          
          <button 
            onClick={handleOpenMaps}
            className="w-full py-3.5 bg-white border border-indigo-100 rounded-xl text-indigo-600 font-black text-[11px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
          >
            <MapPin size={14} /> Como Chegar agora
          </button>
        </div>
      </div>

      {/* Promoções da Loja */}
      <div className="px-6 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Ofertas Ativas ({storePromos.length})</h3>
        </div>

        {storePromos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {storePromos.map(promo => (
              <div 
                key={promo.id} 
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer active:scale-95 transition-transform"
                onClick={() => setSelectedPromo(promo)}
              >
                <div className="aspect-[3/4] relative">
                  <img src={promo.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg">
                    {promo.discount}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-gray-600 font-bold line-clamp-2 leading-tight">
                    {promo.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 text-center">
             <Clock size={32} className="mx-auto text-gray-300 mb-2" />
             <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Sem ofertas no momento</p>
          </div>
        )}
      </div>

      {/* Fullscreen Promotion Modal */}
      {selectedPromo && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200">
          <button 
            onClick={() => setSelectedPromo(null)}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex-1 h-full w-full">
            <ReelCard 
              promotion={selectedPromo} 
              isActive={true}
              onStoreClick={() => setSelectedPromo(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreProfileScreen;
