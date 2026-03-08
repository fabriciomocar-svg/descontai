import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Logo } from '../Logo';

interface FeedHeaderProps {
  onOpenMessages?: () => void;
  unreadCount: number;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({ onOpenMessages, unreadCount }) => {
  return (
    <div className="w-full py-3 px-4 relative flex items-center justify-center bg-white shrink-0">
      <div className="absolute left-4 w-8" /> {/* Spacer */}
      <Logo size="sm" />
      <div className="absolute right-4 flex items-center gap-2">
        <button 
          onClick={onOpenMessages}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
          aria-label="Mensagens"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <div className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
