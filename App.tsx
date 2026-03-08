
import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import { SplashScreen } from './components/SplashScreen';
import { AuthUser, Store } from './types';
import { getAuthUser, getStoreById, trackVisit, getOrCreateChat, getPromotionById } from './constants';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

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

import { PageTransition } from './components/PageTransition';

const LoadingFallback = () => (
  <div className="h-full w-full flex items-center justify-center bg-gray-50">
    <Loader2 className="animate-spin text-indigo-600" size={32} />
  </div>
);

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const user = getAuthUser();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const AppRoutes: React.FC<{ user: AuthUser | null; setUser: (user: AuthUser | null) => void }> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { info } = useToast();

  const handleOpenChat = async (merchantId: string, storeName: string, promotionId?: string) => {
    if (!user) return;
    const chatId = await getOrCreateChat(user.id, merchantId, user.name, storeName, promotionId);
    if (chatId) {
      navigate(`/chat/${chatId}`, { state: { recipientName: storeName } });
    }
  };

  return (
    <>
      <Layout user={user}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/auth" element={
              !user ? (
                <PageTransition direction="none">
                  <AuthScreen />
                </PageTransition>
              ) : <Navigate to="/" replace />
            } />
            
            <Route path="/" element={
              <RequireAuth>
                <PageTransition direction="none">
                  <Suspense fallback={<LoadingFallback />}>
                    <FeedScreen 
                      onStoreClick={(id) => navigate(`/store/${id}`)} 
                      onOpenChat={handleOpenChat} 
                      onOpenMessages={() => navigate('/messages')} 
                    />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/explore" element={
              <RequireAuth>
                <PageTransition direction="none">
                  <Suspense fallback={<LoadingFallback />}>
                    <ExploreScreen onStoreClick={(id) => navigate(`/store/${id}`)} />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/merchant" element={
              <RequireAuth>
                <PageTransition direction="none">
                  <Suspense fallback={<LoadingFallback />}>
                    <MerchantDashboard 
                      onViewChange={(view) => {
                        if (view === 'MERCHANT_SETTINGS') navigate('/merchant/settings');
                        if (view === 'MESSAGES') navigate('/messages');
                      }} 
                      onOpenStoreProfile={(id) => navigate(`/store/${id}`)} 
                      onOpenMessages={() => navigate('/messages')} 
                    />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/merchant/settings" element={
              <RequireAuth>
                <PageTransition direction="left" enableSwipeBack>
                  <Suspense fallback={<LoadingFallback />}>
                    <MerchantSettingsScreen onBack={() => navigate('/merchant')} />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/profile" element={
              <RequireAuth>
                <PageTransition direction="none">
                  <Suspense fallback={<LoadingFallback />}>
                    <ProfileScreen onViewChange={(view) => {
                      if (view === 'FAQ_VIEW') navigate('/faq');
                      if (view === 'PRIVACY_VIEW') navigate('/privacy');
                    }} />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/admin" element={
              <RequireAuth>
                <PageTransition direction="none">
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminDashboard onViewChange={(view) => {
                      if (view === 'FAQ_MANAGER') navigate('/admin/faq');
                    }} />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/admin/faq" element={
              <RequireAuth>
                <PageTransition direction="left" enableSwipeBack>
                  <Suspense fallback={<LoadingFallback />}>
                    <FAQManager onBack={() => navigate('/admin')} />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/faq" element={
              <RequireAuth>
                <PageTransition direction="left" enableSwipeBack>
                  <Suspense fallback={<LoadingFallback />}>
                    <FAQScreen onBack={() => navigate('/profile')} />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/privacy" element={
              <RequireAuth>
                <PageTransition direction="left" enableSwipeBack>
                  <Suspense fallback={<LoadingFallback />}>
                    <PrivacyScreen onBack={() => navigate('/profile')} />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/messages" element={
              <RequireAuth>
                <PageTransition direction="left" enableSwipeBack>
                  <Suspense fallback={<LoadingFallback />}>
                    <MessagesListScreen 
                      onBack={() => navigate(-1)} 
                      onOpenChat={(chatId, name) => navigate(`/chat/${chatId}`, { state: { recipientName: name } })} 
                    />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/chat/:chatId" element={
              <RequireAuth>
                <PageTransition direction="left" enableSwipeBack>
                  <Suspense fallback={<LoadingFallback />}>
                    <ChatScreen />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="/store/:storeId" element={
              <RequireAuth>
                <PageTransition direction="up" enableSwipeBack>
                  <Suspense fallback={<LoadingFallback />}>
                    <StoreProfileScreen />
                  </Suspense>
                </PageTransition>
              </RequireAuth>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Layout>
      <InstallPrompt />
    </>
  );
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(getAuthUser());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar Deep Linking (URL params)
    const checkDeepLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const promoId = params.get('promo');

      if (promoId) {
        try {
          const promo = await getPromotionById(promoId);
          if (promo) {
             navigate(`/store/${promo.storeId}?promo=${promoId}`);
          }
        } catch (error) {
          console.error("Erro ao processar deep link:", error);
        }
      }
    };

    checkDeepLink();
  }, [navigate]);

  useEffect(() => {
    // Solicitar permissão de notificação se o usuário estiver logado
    if (user) {
      requestNotificationPermission();
      
      // Listener para mensagens em primeiro plano
      onMessageListener().then((payload: any) => {
        if (payload?.notification) {
          // info(`🔔 ${payload.notification.title}: ${payload.notification.body}`);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    // Registra a visita ao carregar o app
    trackVisit();

    const splashTimer = setTimeout(() => {
      // O loading só será false quando o auth também tiver respondido
    }, 2000);

    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) {
          const currentUser = getAuthUser();
          const isMockUser = currentUser?.id.startsWith('guest_') || 
                             currentUser?.id.startsWith('mock_') || 
                             currentUser?.id.startsWith('master_');
          
          if (!isMockUser) {
            setUser(null);
            navigate('/auth');
          }
        }
        setTimeout(() => setIsLoading(false), 1500);
      });
    } else {
      setTimeout(() => setIsLoading(false), 1500);
    }

    const handleAuthChange = () => {
      const newUser = getAuthUser();
      setUser(newUser);
      
      if (!newUser) {
        navigate('/auth');
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
  }, [navigate]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return <AppRoutes user={user} setUser={setUser} />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};

export default App;
