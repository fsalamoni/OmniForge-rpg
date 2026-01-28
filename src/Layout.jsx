import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, 
  Sparkles, 
  BookOpen, 
  Library, 
  User, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  Scroll,
  Settings
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const navItems = [
    { name: 'Início', page: 'Dashboard', icon: Home },
    { name: 'Novo Gerador', page: 'Generator', icon: Sparkles },
    { name: 'Minhas Campanhas', page: 'MyCampaigns', icon: BookOpen },
    { name: 'Biblioteca', page: 'Library', icon: Library },
    { name: 'Perfil', page: 'Profile', icon: User },
    { name: 'Sistemas', page: 'Settings', icon: Settings },
    { name: 'Ajuda', page: 'Help', icon: HelpCircle }
  ];

  // Landing page não tem layout
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <style>{`
        :root {
          --bg-primary: #0f0f1a;
          --bg-secondary: #1a1a2e;
          --accent-purple: #8b5cf6;
          --accent-gold: #fbbf24;
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
        }
      `}</style>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-slate-950/95 backdrop-blur-xl border-r border-purple-900/20 transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-purple-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scroll className="w-8 h-8 text-purple-400" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                  RPG Forge
                </h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Footer */}
          {user && (
            <div className="p-4 border-t border-purple-900/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-white font-bold">
                  {user.full_name?.[0] || user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Top Bar (Mobile) */}
        <div className="lg:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-purple-900/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Scroll className="w-6 h-6 text-purple-400" />
              <span className="font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                RPG Forge
              </span>
            </div>
            <div className="w-6" />
          </div>
        </div>

        {/* Page Content */}
        <main className="min-h-screen p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay para mobile quando sidebar aberto */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}