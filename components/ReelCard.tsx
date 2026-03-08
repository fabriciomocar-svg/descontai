import React, { useState, useRef, useEffect } from 'react';
import { Promotion } from '../types';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, MoreHorizontal, CheckCircle, X, Flag, Ban, Volume2, VolumeX } from 'lucide-react';
import { toggleSavePromotion, toggleLikePromotion, incrementPromotionView, getUserMetadata, getAuthUser, blockUser } from '../constants';
import { logViewPromotion, logClickVisitStore } from '../utils/analytics';
import ReportModal from './ReportModal';
import { useToast } from '../context/ToastContext';

interface ReelCardProps {
  promotion: Promotion;
  onStoreClick?: (storeId: string) => void;
  onOpenChat?: (merchantId: string, storeName: string, promotionId?: string) => void;
  isActive?: boolean;
  distance?: number;
  shouldPreload?: boolean;
  disableFullscreen?: boolean;
}

const ReelCard: React.FC<ReelCardProps> = ({ promotion, onStoreClick, onOpenChat, isActive = false, distance, shouldPreload = false, disableFullscreen = false }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savePop, setSavePop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { success, error } = useToast();

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
    logViewPromotion(promotion.id, promotion.storeName);
  }, [promotion.id, promotion.storeName]);

  // Handle video play/pause based on isActive prop
  useEffect(() => {
    if (videoRef.current) {
      if (isActive && !isFullscreen) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log("Autoplay with sound blocked. Muting and retrying.");
            // Fallback: mute and try again
            setIsMuted(true);
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(e => console.error("Autoplay failed even when muted:", e));
            }
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, isFullscreen]);

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
    const shareUrl = `${window.location.origin}?promo=${promotion.id}`;
    const shareText = `Confira esta oferta de ${promotion.storeName}: ${promotion.description}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Oferta de ${promotion.storeName}`,
          text: promotion.description,
          url: shareUrl,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(`${shareText}\n\nLink: ${shareUrl}`);
        alert('Link da promoção copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleBlockUser = async () => {
    if (window.confirm(`Tem certeza que deseja bloquear ${promotion.storeName}? Você não verá mais conteúdo desta loja.`)) {
      try {
        await blockUser(promotion.storeId);
        success(`Você bloqueou ${promotion.storeName}.`);
        setShowMenu(false);
      } catch (err: any) {
        error("Erro ao bloquear usuário: " + err.message);
      }
    }
  };

  return (
    <>
    <div id={`promo-${promotion.id}`} className="relative h-full w-full bg-white overflow-hidden flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 px-4 bg-white z-10 relative">
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
              <MapPin size={10} className="text-gray-600" />
              <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                {distance !== undefined 
                  ? distance < 1 
                    ? `A ${Math.round(distance * 1000)}m` 
                    : `A ${distance.toFixed(1)}km`
                  : 'Localização indisponível'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => {
              onStoreClick?.(promotion.storeId);
              logClickVisitStore(promotion.storeId, promotion.storeName);
            }}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wide transition-colors"
          >
            Visitar
          </button>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-600 p-3 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Mais opções"
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Context Menu */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
              <button 
                onClick={() => {
                  setShowMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Flag size={16} className="text-gray-500" /> Denunciar
              </button>
              <button 
                onClick={handleBlockUser}
                className="w-full text-left px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-gray-50"
              >
                <Ban size={16} /> Bloquear
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Main Content Area (Video or Image) */}
      <div 
        className="flex-1 relative bg-gray-50 overflow-hidden flex items-center justify-center group cursor-pointer"
        onClick={() => !disableFullscreen && setIsFullscreen(true)}
      >
        {promotion.videoUrl ? (
          <>
            <video 
              ref={videoRef}
              src={promotion.videoUrl}
              className="w-full h-full object-contain relative z-10"
              loop
              muted={isMuted}
              playsInline
              preload={isActive || shouldPreload ? "auto" : "metadata"}
              poster={promotion.imageUrl === 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=600&fit=crop' 
                ? 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=600&fit=crop' 
                : promotion.imageUrl}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute bottom-4 right-4 z-20 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              aria-label={isMuted ? "Ativar som" : "Desativar som"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </>
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
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLike}
              className={`p-2 transition-transform active:scale-90 ${isLiked ? 'text-rose-500' : 'text-gray-900 hover:text-gray-600'}`}
              aria-label={isLiked ? "Descurtir" : "Curtir"}
            >
              <Heart size={26} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 2} />
            </button>
            <button 
              onClick={() => onOpenChat?.(promotion.storeId, promotion.storeName, promotion.id)}
              className="p-2 text-gray-900 hover:text-gray-600 transition-transform active:scale-90"
              aria-label="Mensagem"
            >
              <MessageCircle size={26} />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 text-gray-900 hover:text-gray-600 transition-transform active:scale-90"
              aria-label="Compartilhar"
            >
              <Share2 size={26} />
            </button>
          </div>
          <button 
            onClick={handleSave}
            className={`p-2 transition-transform active:scale-90 ${isSaved ? 'text-gray-900' : 'text-gray-900 hover:text-gray-600'}`}
            aria-label={isSaved ? "Remover dos salvos" : "Salvar"}
          >
            <Bookmark size={26} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Likes Count */}
        <div className="font-black text-xs text-gray-900 mb-1.5 px-2">
          {promotion.likes + (isLiked ? 1 : 0)} curtidas
        </div>

        {/* Description */}
        <div className="text-sm text-gray-800 leading-snug mb-2 line-clamp-2 px-2">
          <span className="font-black mr-1.5">{promotion.storeName}</span>
          {promotion.description}
        </div>

        {/* Tags/Expiry */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 px-2">
          <div className="flex items-center gap-2">
            {promotion.discount && (
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                {promotion.discount}
              </span>
            )}
            <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">
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
          className="absolute top-6 right-6 z-50 p-4 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          aria-label="Fechar"
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
    
    <ReportModal 
      isOpen={showReportModal} 
      onClose={() => setShowReportModal(false)} 
      contentId={promotion.id} 
      contentType="promotion" 
    />
    </>
  );
};

export default ReelCard;