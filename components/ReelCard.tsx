import React, { useState, useRef, useEffect } from 'react';
import { Promotion } from '../types';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, MoreHorizontal, CheckCircle, X } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    <>
    <div id={`promo-${promotion.id}`} className="relative h-full w-full bg-white overflow-hidden flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 px-4 bg-white z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onStoreClick?.(promotion.storeId)}>
          <div className="relative">
            <img 
              src={promotion.storeLogo} 
              alt={promotion.storeName}
              className="w-9 h-9 rounded-full border border-gray-100 object-cover"
            />
            <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 rounded-full p-0.5 border border-white">
              <CheckCircle size={8} className="text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 leading-none">{promotion.storeName}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-gray-400" />
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">A 500m</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onStoreClick?.(promotion.storeId)}
            className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wide transition-colors"
          >
            Visitar
          </button>
          <button className="text-gray-400 p-1">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area (Video or Image) */}
      <div 
        className="flex-1 relative bg-gray-50 overflow-hidden flex items-center justify-center group cursor-pointer"
        onClick={() => setIsFullscreen(true)}
      >
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
      </div>

      {/* Footer Actions & Info */}
      <div className="p-3 px-4 bg-white z-10">
        {/* Action Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`transition-transform active:scale-90 ${isLiked ? 'text-rose-500' : 'text-gray-900 hover:text-gray-600'}`}
            >
              <Heart size={26} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 2} />
            </button>
            <button 
              onClick={() => onOpenChat?.(promotion.storeId, promotion.storeName, promotion.id)}
              className="text-gray-900 hover:text-gray-600 transition-transform active:scale-90"
            >
              <MessageCircle size={26} />
            </button>
            <button 
              onClick={handleShare}
              className="text-gray-900 hover:text-gray-600 transition-transform active:scale-90"
            >
              <Share2 size={26} />
            </button>
          </div>
          <button 
            onClick={handleSave}
            className={`transition-transform active:scale-90 ${isSaved ? 'text-gray-900' : 'text-gray-900 hover:text-gray-600'}`}
          >
            <Bookmark size={26} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Likes Count */}
        <div className="font-black text-xs text-gray-900 mb-1.5">
          {promotion.likes + (isLiked ? 1 : 0)} curtidas
        </div>

        {/* Description */}
        <div className="text-sm text-gray-800 leading-snug mb-2 line-clamp-2">
          <span className="font-black mr-1.5">{promotion.storeName}</span>
          {promotion.description}
        </div>

        {/* Tags/Expiry */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-2">
            {promotion.discount && (
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                {promotion.discount}
              </span>
            )}
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
              Expira em {promotion.expiresAt}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Fullscreen Modal */}
    {isFullscreen && (
      <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center animate-in fade-in duration-200">
        <button 
          onClick={() => setIsFullscreen(false)}
          className="absolute top-6 right-6 z-50 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X size={24} />
        </button>
        
        {promotion.videoUrl ? (
          <video 
            src={promotion.videoUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img 
            src={promotion.imageUrl} 
            alt={promotion.description}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    )}
    </>
  );
};

export default ReelCard;