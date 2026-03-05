
import React, { useState, useEffect } from 'react';
import ReelCard from './ReelCard';
import { usePromotions } from '../hooks/usePromotions';
import { getStores, getAuthUser, getUserLocation, calculateDistance } from '../constants';
import { logFeedTime, logScreenView } from '../utils/analytics';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader2, AlertCircle, CloudLightning, MessageCircle, MapPin } from 'lucide-react';
import { Store, Chat } from '../types';
import { Logo } from './Logo';

interface FeedScreenProps {
  onStoreClick?: (storeId: string) => void;
  onOpenChat?: (merchantId: string, storeName: string, promotionId?: string) => void;
  onOpenMessages?: () => void;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ onStoreClick, onOpenChat, onOpenMessages }) => {
  const { promotions, loading: promoLoading, loadingMore, hasMore, loadMore, isUsingMock } = usePromotions();
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activePromoId, setActivePromoId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const observerTarget = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const user = getAuthUser();

  useEffect(() => {
    logScreenView('Feed');
    const startTime = Date.now();
    
    return () => {
      const duration = (Date.now() - startTime) / 1000;
      logFeedTime(duration);
    };
  }, []);

  useEffect(() => {
    const fetchStoresAndLocation = async () => {
      try {
        // 1. Get User Location
        const location = await getUserLocation();
        if (location) {
          setUserLocation(location);
        } else {
          setLocationPermissionDenied(true);
        }

        // 2. Get Stores
        const allStores = await getStores();
        setStores(allStores.filter(s => s.isPartner));
      } catch (err) {
        console.error("Erro ao carregar dados no feed:", err);
      } finally {
        setStoresLoading(false);
      }
    };
    fetchStoresAndLocation();
  }, []);

  // Sort promotions by distance if location is available
  const sortedPromotions = React.useMemo(() => {
    if (!userLocation || promotions.length === 0) return promotions;

    return [...promotions].sort((a, b) => {
      const storeA = stores.find(s => s.id === a.storeId);
      const storeB = stores.find(s => s.id === b.storeId);

      if (!storeA?.lat || !storeA?.lng) return 1; // Push to bottom if no location
      if (!storeB?.lat || !storeB?.lng) return -1;

      const distA = calculateDistance(userLocation.lat, userLocation.lng, storeA.lat, storeA.lng);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, storeB.lat, storeB.lng);

      return distA - distB;
    });
  }, [promotions, userLocation, stores]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  // Detect which card is currently active/visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cards = container.querySelectorAll('[data-promo-id]');
      let maxVisibility = 0;
      let currentActiveId = null;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate visibility percentage
        const intersectionHeight = Math.max(0, Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top));
        const visibility = intersectionHeight / rect.height;

        if (visibility > 0.6 && visibility > maxVisibility) { // 60% visible to be active
          maxVisibility = visibility;
          currentActiveId = card.getAttribute('data-promo-id');
        }
      });

      if (currentActiveId && currentActiveId !== activePromoId) {
        setActivePromoId(currentActiveId);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [sortedPromotions]); // Re-run when sortedPromotions change

  useEffect(() => {
    if (!user) return;
    const chatsCol = collection(db, 'chats');
    const q = query(chatsCol, where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Chat;
        if (data.unreadCount && data.unreadCount > 0 && data.lastSenderId !== user.id) {
          count += data.unreadCount;
        }
      });
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, [user?.id]);

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
    <div 
      ref={containerRef}
      className="h-full w-full bg-gray-50 overflow-y-scroll snap-y-mandatory no-scrollbar relative"
    >
      <div className="bg-white border-b border-gray-100 flex flex-col shrink-0 snap-start min-h-[140px]">
        <div className="w-full py-3 px-4 relative flex items-center justify-center">
          <div className="absolute left-4 w-8" /> {/* Spacer */}
          <Logo size="sm" />
          <div className="absolute right-4 flex items-center gap-2">
            {!isUsingMock && promotions.length > 0 && (
              <div className="bg-rose-500 px-2 py-1 rounded-md flex items-center gap-1.5 animate-fade-in shadow-sm">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                <span className="text-white text-[9px] font-black uppercase tracking-tighter">AO VIVO</span>
              </div>
            )}
            <button 
              onClick={onOpenMessages}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
            >
              <MessageCircle size={20} />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>
          </div>
        </div>
        
        {/* Location Status Bar */}
        {userLocation ? (
          <div className="w-full bg-indigo-50 py-1 flex items-center justify-center gap-1.5 animate-fade-in">
            <MapPin size={10} className="text-indigo-600" />
            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wide">
              Localização Ativa • Ofertas Próximas
            </span>
          </div>
        ) : locationPermissionDenied ? (
           <div className="w-full bg-gray-100 py-1 flex items-center justify-center gap-1.5 animate-fade-in">
            <MapPin size={10} className="text-gray-400" />
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">
              Localização Indisponível • Mostrando Tudo
            </span>
          </div>
        ) : null}

        <div className="px-4 flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-3">
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
                <span className="text-[9px] text-gray-800 font-bold tracking-tight w-20 text-center leading-3 line-clamp-2 h-8 flex items-center justify-center overflow-hidden">
                  {store.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {sortedPromotions.map((promo) => {
        const store = stores.find(s => s.id === promo.storeId);
        let distance: number | undefined;
        
        if (userLocation && store?.lat && store?.lng) {
          distance = calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng);
        }

        return (
          <div 
            key={promo.id} 
            data-promo-id={promo.id}
            className="h-full snap-start mb-1"
          >
            <ReelCard 
              promotion={promo} 
              onStoreClick={onStoreClick} 
              onOpenChat={onOpenChat} 
              isActive={activePromoId === promo.id}
              distance={distance}
            />
          </div>
        );
      })}
      
      {promotions.length === 0 && (
        <div className="h-full w-full flex flex-col items-center justify-center text-gray-900 p-8 text-center bg-gray-50 snap-start">
          <CloudLightning size={48} className="text-indigo-500 mb-4 opacity-50" />
          <h2 className="text-2xl font-black mb-2 tracking-tighter italic">CIDADE SILENCIOSA</h2>
          <p className="text-gray-500 text-sm">Nenhuma oferta ativa no momento. Seja o primeiro lojista a publicar!</p>
        </div>
      )}

      {/* Loading More Indicator */}
      {hasMore && (
        <div ref={observerTarget} className="w-full py-8 flex justify-center items-center snap-start">
          {loadingMore && <Loader2 className="animate-spin text-indigo-600" size={24} />}
        </div>
      )}
      
      <div className="h-[1px]" />
    </div>
  );
};

export default FeedScreen;
