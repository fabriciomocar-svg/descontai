import React, { useState, useEffect } from 'react';
import { X, Share, Download, ChevronDown, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';

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
      // const timer = setTimeout(() => setShowPrompt(true), 3000);
      // return () => clearTimeout(timer);
    }

    // Handle Android/Desktop installation prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // setShowPrompt(true);
    };

    // Listen for manual trigger from ProfileScreen
    const handleManualTrigger = () => {
      if (deferredPrompt || (isIosDevice && !isStandalone)) {
        setShowPrompt(true);
      } else {
        if (!isStandalone) {
           alert('Para instalar, toque em Compartilhar e depois em "Adicionar à Tela de Início"');
        } else {
           alert('O aplicativo já está instalado!');
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('show-install-prompt', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-install-prompt', handleManualTrigger);
    };
  }, [deferredPrompt]);

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
          className="fixed bottom-20 left-4 right-4 z-[9999] pointer-events-none"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-indigo-100 p-5 relative overflow-hidden pointer-events-auto max-w-sm mx-auto">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
            
            <button 
              onClick={() => setShowPrompt(false)}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4 pr-6">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                  <Logo size="sm" showText={false} />
                </div>
              </div>
              
              <div className="flex-1 pt-1">
                <h3 className="font-black text-gray-900 text-sm mb-1 leading-tight">
                  Instale o App Descontaí
                </h3>
                
                {isIOS ? (
                  <div className="text-xs text-gray-600 space-y-3 mt-3">
                    <p className="font-bold text-indigo-600">Instalação no iPhone/iPad:</p>
                    <ol className="list-decimal pl-4 space-y-2 font-medium">
                      <li>
                        Toque no botão <span className="inline-flex items-center justify-center bg-gray-100 p-1 rounded mx-1 align-middle"><Share size={14} className="text-blue-500" /></span> 
                        na barra inferior do navegador.
                      </li>
                      <li>
                        Role para baixo e selecione <span className="inline-flex items-center font-bold text-gray-900 mx-1 align-middle"><PlusSquare size={14} className="mr-1" /> "Adicionar à Tela de Início"</span>.
                      </li>
                      <li>
                        Confirme clicando em <span className="font-bold text-blue-600">"Adicionar"</span> no topo da tela.
                      </li>
                    </ol>
                    
                    {/* Visual cue pointing down */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-70 pointer-events-none">
                        <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full mb-1 whitespace-nowrap">O botão fica aqui embaixo</span>
                        <ChevronDown size={24} className="text-indigo-600 drop-shadow-sm" />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                      Adicione à sua tela inicial para acesso rápido, notificações e melhor experiência.
                    </p>
                    <button
                      onClick={handleInstallClick}
                      className="bg-indigo-600 text-white text-xs font-black uppercase tracking-wide px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors w-full shadow-lg shadow-indigo-200 active:scale-95"
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
