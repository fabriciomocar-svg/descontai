import React, { useState, useRef, useEffect } from 'react';
import { Promotion } from '../types';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, MoreHorizontal, CheckCircle } from 'lucide-react';
import { toggleSavePromotion, toggleLikePromotion, incrementPromotionView, getUserMetadata, getAuthUser } from '../constants';

interface ReelCardProps {
  promotion: Promotion;
  onStoreClick?: (storeId: string) => void;
  onOpenChat?: (merchantId: string, storeName: string, promotionId?: string) => void;
}

const ReelCard: React.FC<ReelCardProps> = ({ promotion, onStoreClick, onOpenChat }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savePop, setSavePop] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const checkInteractionState = async () => {
      const user = getAuthUser();
      if (user) {
        const metadata = await getUserMetadata(user.id);
        if (metadata?.savedPromotions?.includes(promotion.id)) {
          setIsSaved(true);
        }
        if (metadata?.likedPromotions?.includes(promotion.id)) {
          setIsLiked(true);
        }
      }
    };
    checkInteractionState();
    
    // Increment view when card is rendered
    incrementPromotionView(promotion.id);
  }, [promotion.id]);

  // Auto-play logic simulation for video reels
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked by browser until user interacts
        console.log("Autoplay blocked, waiting for interaction");
      });
    }
  }, []);

  const handleSave = async () => {
    const newState = !isSaved;
    setIsSaved(newState);
    
    // Trigger animation
    setSavePop(true);
    setTimeout(() => setSavePop(false), 400);

    try {
      await toggleSavePromotion(promotion.id, isSaved);
    } catch (error) {
      console.error("Failed to save promotion:", error);
      // Revert state on failure
      setIsSaved(isSaved);
    }
  };

  const handleLike = async () => {
    const newState = !isLiked;
    setIsLiked(newState);
    
    try {
      await toggleLikePromotion(promotion.id, isLiked);
    } catch (error) {
      console.error("Failed to like promotion:", error);
      // Revert state on failure
      setIsLiked(isLiked);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Oferta de ${promotion.storeName}`,
          text: promotion.description,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(`${promotion.description}\n\nConfira em: ${window.location.href}`);
        alert('Link da promoção copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  return (
    <div id={`promo-${promotion.id}`} className="relative h-[calc(100vh-192px)] w-full snap-start bg-white overflow-hidden flex flex-col border-b border-gray-100">
      {/* Top Header */}
      <div className="absolute top-0 right-0 p-4 z-30 flex justify-end items-center bg-gradient-to-b from-black/20 to-transparent w-full">
        <button className="text-white p-2 bg-black/20 rounded-full backdrop-blur-sm">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Main Content Area (Video or Image) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black overflow-hidden">
        {/* Blurred background to fill empty space */}
        <div 
          className="absolute inset-0 opacity-50 blur-2xl scale-110 bg-cover bg-center"
          style={{ backgroundImage: `url(${promotion.imageUrl})` }}
        />
        
        {promotion.videoUrl ? (
          <video 
            ref={videoRef}
            src={promotion.videoUrl}
            className="w-full h-full object-contain relative z-10"
            loop
            muted
            playsInline
            poster={promotion.imageUrl}
          />
        ) : (
          <img 
            src={promotion.imageUrl} 
            alt={promotion.description}
            className="w-full h-full object-contain relative z-10"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none z-10" />
      </div>

      {/* Interaction Side Column */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
        <div className="flex flex-col items-center">
          <button 
            onClick={handleLike}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg ${isLiked ? 'bg-rose-500' : 'bg-black/20 backdrop-blur-md border border-white/20'}`}
          >
            <Heart size={24} className="text-white" fill={isLiked ? 'white' : 'none'} />
          </button>
          <span className="text-white text-[11px] mt-1.5 font-bold drop-shadow-md">{promotion.likes}</span>
        </div>

        <div className="flex flex-col items-center">
          <button 
            onClick={() => onOpenChat?.(promotion.storeId, promotion.storeName, promotion.id)}
            className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 shadow-lg"
          >
            <MessageCircle size={24} className="text-white" />
          </button>
          <span className="text-white text-[11px] mt-1.5 font-bold drop-shadow-md">Chat</span>
        </div>

        <div className="flex flex-col items-center">
          <button 
            onClick={handleSave}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg relative overflow-hidden ${
              isSaved ? 'bg-indigo-500' : 'bg-black/20 backdrop-blur-md border border-white/20'
            } ${savePop ? 'scale-110' : 'scale-100'}`}
          >
            <Bookmark 
              size={24} 
              className={`text-white transition-transform duration-300 ${savePop ? 'scale-125' : 'scale-100'}`} 
              fill={isSaved ? 'white' : 'none'} 
            />
            {/* Feedback pulse effect */}
            {savePop && (
              <span className="absolute inset-0 bg-white/20 animate-ping rounded-full" />
            )}
          </button>
          <span className={`text-[11px] mt-1.5 font-bold drop-shadow-md transition-colors duration-300 ${isSaved ? 'text-indigo-300' : 'text-white'}`}>
            {isSaved ? 'Salvo' : 'Salvar'}
          </span>
        </div>

        <button onClick={handleShare} className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 shadow-lg">
          <Share2 size={24} className="text-white" />
        </button>
      </div>

      {/* Info Area */}
      <div className="mt-auto p-4 pb-6 relative z-20 w-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <img 
              src={promotion.storeLogo} 
              alt={promotion.storeName}
              className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-0.5 border border-white">
              <CheckCircle size={10} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-base leading-none truncate drop-shadow-md">{promotion.storeName}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-black/30 backdrop-blur-sm rounded-md border border-white/10">
                <MapPin size={8} className="text-indigo-300" />
                <span className="text-[9px] font-bold text-gray-200 uppercase tracking-tighter">A 500m</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onStoreClick?.(promotion.storeId)}
            className="px-4 py-1.5 bg-white text-black rounded-full text-[10px] font-black shadow-lg transition-all active:scale-95"
          >
            VISITAR
          </button>
        </div>

        <p className="text-white text-xs font-medium leading-relaxed drop-shadow-md mb-3 line-clamp-2 pr-16">
          {promotion.description}
        </p>

        <div className="flex items-center gap-3">
          {promotion.discount && (
            <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg transform -rotate-1">
              <span className="text-black text-xs font-black uppercase italic tracking-tighter">
                {promotion.discount}
              </span>
            </div>
          )}
          <div className="flex-1 h-[1px] bg-white/20 rounded-full" />
          <span className="text-[9px] text-white/80 font-black uppercase tracking-widest whitespace-nowrap drop-shadow-sm">
            EXPIRA: {promotion.expiresAt}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReelCard;