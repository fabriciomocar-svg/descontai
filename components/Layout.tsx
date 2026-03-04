
import React from 'react';
import { ViewType, AuthUser } from '../types';
import { Home, Search, Store as StoreIcon, User, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  user: AuthUser | null;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, user }) => {
  if (activeView === 'AUTH') {
    return (
      <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
        {children}
      </div>
    );
  }

  const showNav = ['FEED', 'EXPLORE', 'MERCHANT', 'ADMIN_STORES', 'PROFILE'].includes(activeView);

  return (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
      <main className="flex-1 overflow-hidden relative bg-white">
        {children}
      </main>

      {showNav && (
        <nav className="h-20 pb-safe bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-2 z-50 transition-transform duration-300">
          {/* Itens visíveis para todos os usuários logados (Consumidor, Admin e Lojista) */}
          <button 
            onClick={() => onViewChange('FEED')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'FEED' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home size={22} strokeWidth={activeView === 'FEED' ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Início</span>
          </button>
          
          <button 
            onClick={() => onViewChange('EXPLORE')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'EXPLORE' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Search size={22} strokeWidth={activeView === 'EXPLORE' ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Explorar</span>
          </button>

          {/* Item exclusivo Admin */}
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => onViewChange('ADMIN_STORES')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'ADMIN_STORES' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ShieldCheck size={22} strokeWidth={activeView === 'ADMIN_STORES' ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Dashboard</span>
            </button>
          )}

          {/* Item exclusivo Lojista */}
          {user?.role === 'MERCHANT' && (
            <button 
              onClick={() => onViewChange('MERCHANT')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'MERCHANT' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <StoreIcon size={22} strokeWidth={activeView === 'MERCHANT' ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Painel</span>
            </button>
          )}

          {/* Perfil (Todos) */}
          <button 
            onClick={() => onViewChange('PROFILE')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'PROFILE' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Perfil" 
                className={`w-[22px] h-[22px] rounded-full object-cover border ${activeView === 'PROFILE' ? 'border-indigo-600' : 'border-gray-300'}`} 
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={22} strokeWidth={activeView === 'PROFILE' ? 2.5 : 2} />
            )}
            <span className="text-[9px] font-black uppercase tracking-tighter">Perfil</span>
          </button>
        </nav>
      )}

      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-200 rounded-full sm:hidden pointer-events-none z-[60]" />
    </div>
  );
};

export default Layout;
