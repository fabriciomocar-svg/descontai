
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReelCard from './ReelCard';
import { usePromotions } from '../hooks/usePromotions';
import { useChat } from '../hooks/useChat';
import { getStores, getAuthUser, getUserLocation, getPromotionById } from '../constants';
import { logFeedTime, logScreenView } from '../utils/analytics';
import { Loader2, X } from 'lucide-react';
import { Store, Promotion } from '../types';
import { FeedHeader } from './feed/FeedHeader';
import { StoryRail, StoryItem } from './feed/StoryRail';
import { FeedList } from './feed/FeedList';
import { FeedSkeleton } from './feed/FeedSkeleton';
import { AnimatePresence, motion } from 'motion/react';

interface FeedScreenProps {
  onStoreClick?: (storeId: string) => void;
  onOpenChat?: (merchantId: string, storeName: string, promotionId?: string) => void;
  onOpenMessages?: () => void;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ onStoreClick, onOpenChat, onOpenMessages }) => {
  const [searchParams] = useSearchParams();
  const initialPromoId = searchParams.get('promo');
  
  const { promotions, stories, loading: promoLoading, loadingMore, hasMore, loadMore } = usePromotions();
  const { useUnreadCount } = useChat();
  const unreadCount = useUnreadCount();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  
  // Story Modal State
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [currentStoryPromo, setCurrentStoryPromo] = useState<Promotion | null>(null);
  const [loadingStory, setLoadingStory] = useState(false);

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
    const fetchData = async () => {
      // Iniciar busca de lojas imediatamente (não bloqueia UI)
      getStores().then(allStores => {
        setStores(allStores.filter(s => s.isPartner));
        setStoresLoading(false);
      }).catch(err => {
        console.error("Erro ao carregar lojas:", err);
        setStoresLoading(false);
      });

      // Iniciar busca de localização em paralelo
      getUserLocation().then(location => {
        if (location) {
          setUserLocation(location);
        } else {
          setLocationPermissionDenied(true);
        }
      }).catch(err => {
        console.error("Erro ao obter localização:", err);
        setLocationPermissionDenied(true);
      });
    };
    
    fetchData();
  }, []);

  // Sort promotions by creation date (newest first) - As requested by user
  const sortedPromotions = React.useMemo(() => {
    // O array 'promotions' já vem ordenado por data (desc) do contexto.
    // Mantemos essa ordem para garantir que os posts mais recentes fiquem no topo.
    return promotions;
  }, [promotions]);

  // Filtra as lojas que possuem stories ativos (baseado na lista completa de stories do contexto)
  const storiesToRender = React.useMemo(() => {
    // Se tiver stories carregados, usa eles.
    if (stories.length > 0) {
      const storesMap = new Map<string, Store>(stores.map(s => [s.id, s]));
      return stories.map(story => {
        const store = storesMap.get(story.storeId);
        if (!store) return null;
        return {
          ...store,
          promoId: story.promoId,
          uniqueKey: story.storeId // Chave única é o ID da loja, pois só tem uma bolinha por loja
        };
      }).filter(Boolean) as StoryItem[];
    }
    
    // Fallback para promotions locais (para evitar vazio inicial)
    const storesMap = new Map<string, Store>(stores.map(s => [s.id, s]));
    const uniqueStoreIds = new Set<string>();
    const result: StoryItem[] = [];

    // Ordenar promoções por data para pegar a mais recente primeiro
    const sortedPromos = [...promotions].sort((a, b) => {
      const timeA = (a as any).createdAt?.seconds || 0;
      const timeB = (b as any).createdAt?.seconds || 0;
      return timeB - timeA;
    });

    sortedPromos.forEach(p => {
      if (!uniqueStoreIds.has(p.storeId)) {
        const store = storesMap.get(p.storeId);
        if (store) {
          uniqueStoreIds.add(p.storeId);
          result.push({
            ...store,
            promoId: p.id,
            uniqueKey: p.storeId
          });
        }
      }
    });
    return result;
  }, [stores, promotions, stories]);

  const handleStoryClick = async (item: any) => {
    if (item.promoId) {
      // Check if we already have it in the loaded promotions
      const found = promotions.find(p => p.id === item.promoId);
      if (found) {
        setCurrentStoryPromo(found);
        setStoryModalOpen(true);
      } else {
        // Fetch it
        setLoadingStory(true);
        try {
          const fetched = await getPromotionById(item.promoId);
          if (fetched) {
            setCurrentStoryPromo(fetched);
            setStoryModalOpen(true);
          }
        } catch (e) {
          console.error("Failed to fetch story promo", e);
        } finally {
          setLoadingStory(false);
        }
      }
    } else {
      onStoreClick?.(item.id);
    }
  };

  const loading = promoLoading || storesLoading;

  if (loading) {
    return <FeedSkeleton />;
  }

  return (
    <>
      <div className="h-full w-full bg-gray-50 relative flex flex-col">
        <FeedList 
          header={
            <div className="bg-white border-b border-gray-100 flex flex-col shrink-0 snap-start min-h-[140px]">
              <FeedHeader onOpenMessages={onOpenMessages} unreadCount={unreadCount} />
              <StoryRail 
                stories={storiesToRender} 
                onStoryClick={handleStoryClick}
                loadingStory={loadingStory}
                currentStoryPromo={currentStoryPromo}
              />
            </div>
          }
          promotions={sortedPromotions}
          stores={stores}
          userLocation={userLocation}
          onStoreClick={onStoreClick}
          onOpenChat={onOpenChat}
          loadMore={loadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
          initialPromoId={initialPromoId}
        />
      </div>

      {/* Story Modal (Full Screen) */}
      <AnimatePresence>
        {storyModalOpen && currentStoryPromo && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 && info.velocity.y > 200) {
                setStoryModalOpen(false);
                setCurrentStoryPromo(null);
              }
            }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col"
          >
            <button 
              onClick={() => {
                setStoryModalOpen(false);
                setCurrentStoryPromo(null);
              }}
              className="absolute top-6 right-6 z-[10000] p-3 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-all shadow-lg active:scale-90"
              aria-label="Fechar story"
            >
              <X size={28} />
            </button>
            
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black">
               <div className="w-full max-w-md h-full bg-white relative shadow-2xl">
                  <ReelCard 
                    promotion={currentStoryPromo} 
                    onStoreClick={(id) => {
                      setStoryModalOpen(false);
                      onStoreClick?.(id);
                    }}
                    onOpenChat={onOpenChat}
                    isActive={true} // Auto-play in modal
                    shouldPreload={true}
                    disableFullscreen={true}
                  />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedScreen;
