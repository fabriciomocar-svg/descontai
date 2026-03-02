
import React, { useState, useEffect } from 'react';
import ReelCard from './ReelCard';
import { usePromotions } from '../hooks/usePromotions';
import { getStores } from '../constants';
import { Loader2, AlertCircle, CloudLightning, MessageCircle } from 'lucide-react';
import { Store } from '../types';
import { Logo } from './Logo';

interface FeedScreenProps {
  onStoreClick?: (storeId: string) => void;
  onOpenChat?: (merchantId: string, storeName: string, promotionId?: string) => void;
  onOpenMessages?: () => void;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ onStoreClick, onOpenChat, onOpenMessages }) => {
  const { promotions, loading: promoLoading, error, isUsingMock } = usePromotions();
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const allStores = await getStores();
        setStores(allStores.filter(s => s.isPartner));
      } catch (err) {
        console.error("Erro ao carregar lojas no feed:", err);
      } finally {
        setStoresLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Filtra as lojas que possuem pelo menos uma promoção ativa
  const storesWithPromos = React.useMemo(() => {
    return stores.filter(store => promotions.some(p => p.storeId === store.id));
  }, [stores, promotions]);

  const loading = promoLoading || storesLoading;

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-white text-gray-900 gap-4">
        <div className="relative">
          <Loader2 size={48} className="animate-spin text-indigo-500" />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.2em] animate-pulse text-center px-6 italic">
          Conectando à Cidade...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white overflow-y-scroll snap-y-mandatory no-scrollbar relative">
      <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 flex flex-col">
        <div className="w-full py-3 flex justify-between items-center px-4">
          <div className="w-8" /> {/* Spacer */}
          <Logo size="sm" />
          <button 
            onClick={onOpenMessages}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MessageCircle size={20} />
          </button>
        </div>
        <div className="px-4 flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
          {storesWithPromos.map((store) => {
            // Encontra a promoção mais recente desta loja
            const latestPromo = promotions.find(p => p.storeId === store.id);
            const displayImage = store.logo;
            
            const handleCircleClick = () => {
              if (latestPromo) {
                const element = document.getElementById(`promo-${latestPromo.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              } else {
                onStoreClick?.(store.id);
              }
            };

            return (
              <button 
                key={store.id} 
                onClick={handleCircleClick}
                className="flex flex-col items-center gap-1.5 shrink-0 animate-fade-in group"
              >
                <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 shadow-sm group-active:scale-95 transition-transform duration-200 text-left">
                  <div className="p-0.5 bg-white rounded-full">
                    <img 
                      src={displayImage} 
                      alt={store.name} 
                      className="w-16 h-16 rounded-full object-cover border border-gray-100"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-gray-800 font-medium tracking-tight truncate w-16 text-center">
                  {store.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!isUsingMock && promotions.length > 0 && (
        <div className="absolute top-[140px] right-4 z-[60] bg-rose-500 px-2 py-1 rounded-md flex items-center gap-1.5 animate-fade-in shadow-md">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          <span className="text-white text-[9px] font-black uppercase tracking-tighter">AO VIVO</span>
        </div>
      )}

      {/* Spacer for the top stories bar */}
      <div className="h-[148px] snap-start bg-white w-full" />

      {promotions.map((promo) => (
        <ReelCard key={promo.id} promotion={promo} onStoreClick={onStoreClick} onOpenChat={onOpenChat} />
      ))}
      
      {promotions.length === 0 && (
        <div className="h-full w-full flex flex-col items-center justify-center text-gray-900 p-8 text-center bg-gray-50 snap-start">
          <CloudLightning size={48} className="text-indigo-500 mb-4 opacity-50" />
          <h2 className="text-2xl font-black mb-2 tracking-tighter italic">CIDADE SILENCIOSA</h2>
          <p className="text-gray-500 text-sm">Nenhuma oferta ativa no momento. Seja o primeiro lojista a publicar!</p>
        </div>
      )}
      
      <div className="h-[1px]" />
    </div>
  );
};

export default FeedScreen;
