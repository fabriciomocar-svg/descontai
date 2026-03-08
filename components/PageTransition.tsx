import React, { ReactNode } from 'react';
import { motion, PanInfo } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down' | 'none';
  enableSwipeBack?: boolean;
  onSwipeBack?: () => void;
}

const variants = {
  initial: (direction: string) => {
    if (direction === 'none') return { opacity: 0 };
    if (direction === 'left') return { x: '100%', opacity: 1 };
    if (direction === 'right') return { x: '-100%', opacity: 1 };
    if (direction === 'up') return { y: '100%', opacity: 1 };
    if (direction === 'down') return { y: '-100%', opacity: 1 };
    return { opacity: 0 };
  },
  animate: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: (direction: string) => {
    if (direction === 'none') return { opacity: 0 };
    if (direction === 'left') return { x: '-30%', opacity: 0.5 };
    if (direction === 'right') return { x: '100%', opacity: 1 };
    if (direction === 'up') return { y: '-30%', opacity: 0.5 };
    if (direction === 'down') return { y: '100%', opacity: 1 };
    return { opacity: 0 };
  },
};

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  direction = 'left',
  enableSwipeBack = false,
  onSwipeBack
}) => {
  const navigate = useNavigate();

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!enableSwipeBack) return;
    
    // Swipe right to go back
    if (info.offset.x > 100 && info.velocity.x > 200) {
      if (onSwipeBack) {
        onSwipeBack();
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      drag={enableSwipeBack ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 1 }}
      onDragEnd={handleDragEnd}
      className="h-full w-full absolute inset-0 bg-gray-50 overflow-hidden"
    >
      {children}
    </motion.div>
  );
};
