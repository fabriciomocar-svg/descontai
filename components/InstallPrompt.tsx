import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Only show iOS prompt if not in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isIosDevice && !isStandalone) {
      // Show prompt after a delay on iOS
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Handle Android/Desktop installation prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50 pointer-events-none"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-4 relative overflow-hidden pointer-events-auto max-w-sm mx-auto">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
            
            <button 
              onClick={() => setShowPrompt(false)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4 pr-6">
              <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 shrink-0 flex items-center justify-center w-12 h-12">
                <Download size={24} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-black text-gray-900 text-sm mb-1">
                  Instale o App Descontaí
                </h3>
                
                {isIOS ? (
                  <div className="text-xs text-gray-600 space-y-2">
                    <p>Para instalar no iPhone/iPad:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Toque no botão <span className="inline-flex items-center mx-1"><Share size={12} /> Compartilhar</span></li>
                      <li>Selecione <span className="font-bold">"Adicionar à Tela de Início"</span></li>
                    </ol>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-600 mb-3">
                      Adicione à sua tela inicial para acesso rápido e melhor experiência.
                    </p>
                    <button
                      onClick={handleInstallClick}
                      className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
                    >
                      Instalar Agora
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
