import React from 'react';
import { Loader2 } from 'lucide-react';
import { Store, Promotion } from '../../types';

export interface StoryItem extends Store {
  promoId?: string;
  uniqueKey: string;
}

interface StoryRailProps {
  stories: StoryItem[];
  onStoryClick: (item: StoryItem) => void;
  loadingStory: boolean;
  currentStoryPromo: Promotion | null;
}

export const StoryRail: React.FC<StoryRailProps> = ({ stories, onStoryClick, loadingStory, currentStoryPromo }) => {
  return (
    <div className="px-4 flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-3">
      {stories.map((item) => {
        const displayImage = item.logo;
        
        return (
          <button 
            key={item.uniqueKey} 
            onClick={() => onStoryClick(item)}
            className="flex flex-col items-center gap-1.5 shrink-0 animate-fade-in group relative"
            disabled={loadingStory}
          >
            <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 shadow-sm group-active:scale-95 transition-transform duration-200 text-left relative">
              <div className="p-0.5 bg-white rounded-full">
                <img 
                  src={displayImage} 
                  alt={item.name} 
                  className="w-16 h-16 rounded-full object-cover border border-gray-100"
                  referrerPolicy="no-referrer"
                />
              </div>
              {loadingStory && currentStoryPromo === null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                   <Loader2 className="animate-spin text-white" size={20} />
                </div>
              )}
            </div>
            <span className="text-[9px] text-gray-800 font-bold tracking-tight w-20 text-center leading-3 line-clamp-2 h-8 flex items-center justify-center overflow-hidden">
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
