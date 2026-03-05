import React from 'react';
import { Logo } from './Logo';
import { motion } from 'motion/react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <Logo size="lg" />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 100 }}
          transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
          className="h-1 bg-indigo-600 rounded-full mt-8"
        />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-4 animate-pulse">
          Carregando...
        </p>
      </motion.div>
    </div>
  );
};
