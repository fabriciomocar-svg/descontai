import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Loader2, CloudLightning } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import ReelCard from '../ReelCard';
import { Promotion, Store } from '../../types';
import { calculateDistance } from '../../constants';

interface FeedListProps {
  promotions: Promotion[];
  stores: Store[];
  userLocation: { lat: number; lng: number } | null;
  onStoreClick?: (storeId: string) => void;
  onOpenChat?: (merchantId: string, storeName: string, promotionId?: string) => void;
  loadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  initialPromoId: string | null;
  header?: React.ReactNode;
}

export const FeedList: React.FC<FeedListProps> = ({
  promotions,
  stores,
  userLocation,
  onStoreClick,
  onOpenChat,
  loadMore,
  hasMore,
  loadingMore,
  initialPromoId,
  header
}) => {
  const [activePromoId, setActivePromoId] = useState<string | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Scroll to initial promo
  useEffect(() => {
    if (initialPromoId && promotions.length > 0) {
      const index = promotions.findIndex(p => p.id === initialPromoId);
      if (index !== -1) {
        // Small timeout to ensure Virtuoso is ready
        setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({ index, align: 'start', behavior: 'smooth' });
          setActivePromoId(initialPromoId);
        }, 100);
      }
    }
  }, [initialPromoId, promotions]);

  // We need to track the active item for auto-play.
  const handleRangeChanged = ({ startIndex }: { startIndex: number }) => {
    if (promotions[startIndex]) {
      setActivePromoId(promotions[startIndex].id);
    }
  };

  const Footer = () => {
    if (!hasMore) return <div className="h-[1px]" />;
    
    return (
      <div className="w-full py-8 flex justify-center items-center h-24">
        {loadingMore && <Loader2 className="animate-spin text-indigo-600" size={24} />}
      </div>
    );
  };

  const Header = () => {
    if (!header) return null;
    return <>{header}</>;
  };

  const EmptyPlaceholder = () => (
    <div className="h-full w-full flex flex-col items-center justify-center text-gray-900 p-8 text-center bg-gray-50 min-h-[50vh]">
      <CloudLightning size={48} className="text-indigo-500 mb-4 opacity-50" />
      <h2 className="text-2xl font-black mb-2 tracking-tighter italic">CIDADE SILENCIOSA</h2>
      <p className="text-gray-500 text-sm">Nenhuma oferta ativa no momento. Seja o primeiro lojista a publicar!</p>
    </div>
  );

  if (promotions.length === 0) {
    return (
      <div className="h-full w-full overflow-y-auto no-scrollbar">
        {header}
        <EmptyPlaceholder />
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{ height: '100%', width: '100%' }}
      className="no-scrollbar"
      data={promotions}
      endReached={() => {
        if (hasMore && !loadingMore) {
          loadMore();
        }
      }}
      rangeChanged={handleRangeChanged}
      components={{
        Header: Header,
        Footer: Footer
      }}
      itemContent={(index, promo) => {
        const store = stores.find(s => s.id === promo.storeId);
        let distance: number | undefined;
        
        if (userLocation && store?.lat && store?.lng) {
          distance = calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng);
        }

        const isActive = activePromoId === promo.id;
        let shouldPreload = false;
        
        if (isActive) {
          shouldPreload = true;
        } else if (activePromoId) {
          const activeIndex = promotions.findIndex(p => p.id === activePromoId);
          if (activeIndex !== -1) {
            if (index > activeIndex && index <= activeIndex + 2) {
              shouldPreload = true;
            }
          }
        } else if (index < 2) {
          shouldPreload = true;
        }

        return (
          <div 
            id={`promo-${promo.id}`}
            data-promo-id={promo.id}
            className="h-full mb-1"
            style={{ height: '100dvh' }} // Full viewport height for each reel
          >
            <ReelCard 
              promotion={promo} 
              onStoreClick={onStoreClick} 
              onOpenChat={onOpenChat} 
              isActive={isActive}
              distance={distance}
              shouldPreload={shouldPreload}
            />
          </div>
        );
      }}
    />
  );
};
