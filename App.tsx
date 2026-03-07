
import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import { SplashScreen } from './components/SplashScreen';
import { ViewType, AuthUser, Store } from './types';
import { getAuthUser, getStoreById, trackVisit, getOrCreateChat, getPromotionById } from './constants';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Smartphone, Loader2 } from 'lucide-react';

import { PromotionsProvider } from './context/PromotionsContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { requestNotificationPermission, onMessageListener } from './services/notification';
import InstallPrompt from './components/InstallPrompt';

// Lazy Load Components
const FeedScreen = React.lazy(() => import('./components/FeedScreen'));
const ExploreScreen = React.lazy(() => import('./components/ExploreScreen'));
const MerchantDashboard = React.lazy(() => import('./components/MerchantDashboard'));
const MerchantSettingsScreen = React.lazy(() => import('./components/MerchantSettingsScreen'));
const ProfileScreen = React.lazy(() => import('./components/ProfileScreen'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const StoreProfileScreen = React.lazy(() => import('./components/StoreProfileScreen'));
const FAQManager = React.lazy(() => import('./components/FAQManager'));
const FAQScreen = React.lazy(() => import('./components/FAQScreen'));
const MessagesListScreen = React.lazy(() => import('./components/MessagesListScreen'));
const ChatScreen = React.lazy(() => import('./components/ChatScreen'));
const PrivacyScreen = React.lazy(() => import('./components/PrivacyScreen'));

const LoadingFallback = () => (
  <div className="h-full w-full flex items-center justify-center bg-gray-50">
    <Loader2 className="animate-spin text-indigo-600" size={32} />
  </div>
);

const AppContent: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(getAuthUser());
  const [currentView, setCurrentView] = useState<ViewType>('AUTH');
  const [previousView, setPreviousView] = useState<ViewType>('FEED');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [initialPromoId, setInitialPromoId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { info } = useToast();

  useEffect(() => {
    // Verificar Deep Linking (URL params)
    const checkDeepLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const promoId = params.get('promo');

      if (promoId) {
        console.log(`🔗 Deep link detectado para promoção: ${promoId}`);
        try {
          const promo = await getPromotionById(promoId);
          if (promo) {
            const store = await getStoreById(promo.storeId);
            if (store) {
              setSelectedStore(store);
              setInitialPromoId(promoId);
              setCurrentView('STORE_PROFILE');
              // Limpar URL para não reabrir ao recarregar
              window.history.replaceState({}, '', window.location.pathname);
            }
          }
        } catch (error) {
          console.error("Erro ao processar deep link:", error);
        }
      }
    };

    checkDeepLink();
  }, []);

  useEffect(() => {
    // Solicitar permissão de notificação se o usuário estiver logado
    if (user) {
      requestNotificationPermission();
      
      // Listener para mensagens em primeiro plano
      onMessageListener().then((payload: any) => {
        if (payload?.notification) {
          info(`🔔 ${payload.notification.title}: ${payload.notification.body}`);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    // Registra a visita ao carregar o app
    trackVisit();

    // Simula um tempo mínimo de splash screen para experiência "app nativo"
    const splashTimer = setTimeout(() => {
      // O loading só será false quando o auth também tiver respondido (veja abaixo)
    }, 2000);

    // Sincroniza com o Firebase Auth
    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) {
          // Só desloga se o usuário atual NÃO for um usuário mock/guest/master
          const currentUser = getAuthUser();
          const isMockUser = currentUser?.id.startsWith('guest_') || 
                             currentUser?.id.startsWith('mock_') || 
                             currentUser?.id.startsWith('master_');
          
          if (!isMockUser) {
            setUser(null);
            setCurrentView('AUTH');
          }
        }
        // Garante que o splash screen fique visível por pelo menos 1.5s
        setTimeout(() => setIsLoading(false), 1500);
      });
    } else {
      setTimeout(() => setIsLoading(false), 1500);
    }

    const handleAuthChange = () => {
      const newUser = getAuthUser();
      setUser(newUser);
      
      if (newUser) {
        if (newUser.role === 'ADMIN') setCurrentView('ADMIN_STORES');
        else if (newUser.role === 'MERCHANT') setCurrentView('MERCHANT');
        else setCurrentView('FEED');
      } else {
        setCurrentView('AUTH');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleAuthChange();
      }
    };

    handleAuthChange();
    window.addEventListener('auth_change', handleAuthChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('auth_change', handleAuthChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribe();
      clearTimeout(splashTimer);
    };
  }, []);

  const handleOpenStoreProfile = async (storeId: string) => {
    const store = await getStoreById(storeId);
    if (store) {
      setPreviousView(currentView);
      setSelectedStore(store);
      setCurrentView('STORE_PROFILE');
    }
  };

  const handleOpenChat = async (merchantId: string, storeName: string, promotionId?: string) => {
    if (!user) return;
    const chatId = await getOrCreateChat(user.id, merchantId, user.name, storeName, promotionId);
    if (chatId) {
      setActiveChat({ id: chatId, name: storeName });
      setPreviousView(currentView);
      setCurrentView('CHAT');
    }
  };

  const handleOpenExistingChat = (chatId: string, recipientName: string) => {
    setActiveChat({ id: chatId, name: recipientName });
    setPreviousView(currentView);
    setCurrentView('CHAT');
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  const renderContent = () => {
    if (!user) return <AuthScreen />;

    switch (currentView) {
      case 'FEED': 
        return <FeedScreen onStoreClick={handleOpenStoreProfile} onOpenChat={handleOpenChat} onOpenMessages={() => { setPreviousView(currentView); setCurrentView('MESSAGES'); }} />;
      case 'EXPLORE': 
        return <ExploreScreen onStoreClick={handleOpenStoreProfile} />;
      case 'MERCHANT': 
        return <MerchantDashboard onViewChange={setCurrentView} onOpenStoreProfile={handleOpenStoreProfile} onOpenMessages={() => { setPreviousView(currentView); setCurrentView('MESSAGES'); }} />;
      case 'MERCHANT_SETTINGS':
        return <MerchantSettingsScreen onBack={() => setCurrentView('MERCHANT')} />;
      case 'PROFILE': 
        return <ProfileScreen onViewChange={setCurrentView} />;
      case 'ADMIN_STORES': 
        return <AdminDashboard onViewChange={setCurrentView} />;
      case 'FAQ_MANAGER':
        return <FAQManager onBack={() => setCurrentView('ADMIN_STORES')} />;
      case 'FAQ_VIEW':
        return <FAQScreen onBack={() => setCurrentView('PROFILE')} />;
      case 'PRIVACY_VIEW':
        return <PrivacyScreen onBack={() => setCurrentView('PROFILE')} />;
      case 'MESSAGES':
        return <MessagesListScreen onBack={() => setCurrentView(user?.role === 'MERCHANT' ? 'MERCHANT' : 'FEED')} onOpenChat={handleOpenExistingChat} />;
      case 'CHAT':
        return activeChat ? (
          <ChatScreen 
            chatId={activeChat.id} 
            recipientName={activeChat.name} 
            onBack={() => setCurrentView(previousView)} 
          />
        ) : <FeedScreen onStoreClick={handleOpenStoreProfile} onOpenChat={handleOpenChat} />;
      case 'STORE_PROFILE': 
        return selectedStore ? (
          <StoreProfileScreen 
            store={selectedStore} 
            initialPromoId={initialPromoId}
            onBack={() => setCurrentView(previousView)} 
            onEdit={() => {
              if (user.role === 'ADMIN') setCurrentView('ADMIN_STORES');
              else setCurrentView('MERCHANT_SETTINGS');
            }}
          />
        ) : <FeedScreen onStoreClick={handleOpenStoreProfile} onOpenChat={handleOpenChat} />;
      default: 
        return <FeedScreen onStoreClick={handleOpenStoreProfile} onOpenChat={handleOpenChat} />;
    }
  };

  return (
    <>
      <Layout activeView={currentView} onViewChange={setCurrentView} user={user}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            <Suspense fallback={<LoadingFallback />}>
              {renderContent()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </Layout>
      <InstallPrompt />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <PromotionsProvider>
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
          {/* Main App Container - Centered on Desktop */}
          <div className="h-full w-full sm:max-w-[480px] bg-gray-50 overflow-hidden sm:shadow-2xl relative">
            <AppContent />
          </div>
        </div>
      </PromotionsProvider>
    </ToastProvider>
  );
};

export default App;
