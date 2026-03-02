
import React, { useState, useEffect } from 'react';
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
import { ViewType, AuthUser, Store } from './types';
import { getAuthUser, getStoreById, trackVisit, getOrCreateChat } from './constants';
import { auth } from './firebase';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(getAuthUser());
  const [currentView, setCurrentView] = useState<ViewType>('AUTH');
  const [previousView, setPreviousView] = useState<ViewType>('FEED');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeChat, setActiveChat] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    // Registra a visita ao carregar o app
    trackVisit();

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
      });
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
      case 'MESSAGES':
        return <MessagesListScreen onBack={() => setCurrentView(previousView)} onOpenChat={handleOpenExistingChat} />;
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
    <div className="min-h-screen bg-gray-50 flex justify-center items-center overflow-hidden">
      <Layout activeView={currentView} onViewChange={setCurrentView} user={user}>
        <div className="h-full w-full animate-fade-in">
          {renderContent()}
        </div>
      </Layout>
    </div>
  );
};

export default App;
