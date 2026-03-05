
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Layout from './components/Layout';
import FeedScreen from './components/FeedScreen';
import ExploreScreen from './components/ExploreScreen';
import MerchantDashboard from './components/MerchantDashboard';
import MerchantSettingsScreen from './components/MerchantSettingsScreen';
import ProfileScreen from './components/ProfileScreen';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/AdminDashboard';
import StoreProfileScreen from './components/StoreProfileScreen';
import FAQManager from './components/FAQManager';
import FAQScreen from './components/FAQScreen';
import MessagesListScreen from './components/MessagesListScreen';
import ChatScreen from './components/ChatScreen';
import PrivacyScreen from './components/PrivacyScreen';
import { SplashScreen } from './components/SplashScreen';
import { ViewType, AuthUser, Store } from './types';
import { getAuthUser, getStoreById, trackVisit, getOrCreateChat } from './constants';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Smartphone } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(getAuthUser());
  const [currentView, setCurrentView] = useState<ViewType>('AUTH');
  const [previousView, setPreviousView] = useState<ViewType>('FEED');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeChat, setActiveChat] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    handleAuthChange();
    window.addEventListener('auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('auth_change', handleAuthChange);
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
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      {/* Main App Container - Centered on Desktop */}
      <div className="h-full w-full sm:max-w-[480px] bg-gray-50 overflow-hidden sm:shadow-2xl relative">
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
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </Layout>
      </div>
    </div>
  );
};

export default App;
