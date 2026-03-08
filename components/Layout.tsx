
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthUser } from '../types';
import { Home, Search, Store as StoreIcon, User, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: AuthUser | null;
}

const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  if (path === '/auth') {
    return (
      <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
        {children}
      </div>
    );
  }

  const showNav = ['/', '/explore', '/merchant', '/admin', '/profile'].includes(path);

  return (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
      <main className="flex-1 overflow-hidden relative bg-white">
        {children}
      </main>

      {showNav && (
        <nav className="h-20 pb-safe bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-2 z-50 transition-transform duration-300">
          {/* Itens visíveis para todos os usuários logados (Consumidor, Admin e Lojista) */}
          <button 
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${path === '/' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home size={22} strokeWidth={path === '/' ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Início</span>
          </button>
          
          <button 
            onClick={() => navigate('/explore')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${path === '/explore' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Search size={22} strokeWidth={path === '/explore' ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Explorar</span>
          </button>

          {/* Item exclusivo Admin */}
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => navigate('/admin')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${path === '/admin' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ShieldCheck size={22} strokeWidth={path === '/admin' ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Dashboard</span>
            </button>
          )}

          {/* Item exclusivo Lojista */}
          {user?.role === 'MERCHANT' && (
            <button 
              onClick={() => navigate('/merchant')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${path === '/merchant' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <StoreIcon size={22} strokeWidth={path === '/merchant' ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Painel</span>
            </button>
          )}

          {/* Perfil (Todos) */}
          <button 
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${path === '/profile' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Perfil" 
                className={`w-[22px] h-[22px] rounded-full object-cover border ${path === '/profile' ? 'border-indigo-600' : 'border-gray-300'}`} 
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={22} strokeWidth={path === '/profile' ? 2.5 : 2} />
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
