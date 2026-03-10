import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { FeedHeader } from './FeedHeader';

export const FeedSkeleton: React.FC = () => {
  return (
    <div className="h-full w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header & Stories Skeleton */}
      <div className="bg-white border-b border-gray-100 flex flex-col shrink-0 min-h-[140px]">
        <FeedHeader unreadCount={0} />
        
        {/* Story Rail Skeleton */}
        <div className="px-4 flex gap-4 overflow-x-hidden pb-4 pt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-2 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Reel Card Skeleton */}
      <div className="flex-1 bg-white flex flex-col relative border-b border-gray-100 mb-2">
        {/* Card Header */}
        <div className="flex items-center justify-between p-3 px-4 bg-white z-10 relative">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-24 h-3" />
              <Skeleton className="w-16 h-2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-16 h-6 rounded-full" />
            <Skeleton className="w-6 h-6 rounded-full" />
          </div>
        </div>

        {/* Video Area */}
        <div className="w-full aspect-[4/5] bg-gray-100 flex items-center justify-center">
          <Skeleton className="w-full h-full rounded-none" />
        </div>

        {/* Card Footer */}
        <div className="p-3 px-4 bg-white z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
            <Skeleton className="w-6 h-6 rounded-full" />
          </div>
          <Skeleton className="w-20 h-3 mb-2" />
          <Skeleton className="w-full h-3 mb-1.5" />
          <Skeleton className="w-3/4 h-3 mb-3" />
          
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
            <Skeleton className="w-12 h-4 rounded-md" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
