import React from 'react';
import { useAuth } from '../lib/auth';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Key, 
  LogOut,
  Settings as SettingsIcon,
  Menu,
  X,
  User,
  Users,
  Wallet,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Terminal', path: '/dashboard', icon: LayoutDashboard },
    ...(profile?.role !== 'user' ? [
      { name: 'Licenses', path: '/licenses', icon: Key },
      { name: 'Market', path: '/plans', icon: Zap },
      ...(isAdmin ? [{ name: 'Resellers', path: '/resellers', icon: Users }] : []),
    ] : []),
    { name: 'System', path: '/settings', icon: SettingsIcon },
  ];

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-black border-r border-zinc-900">
      <div className="flex h-20 items-center px-8 border-b border-zinc-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white">
          <Zap size={22} fill="currentColor" />
        </div>
        <span className="ml-4 text-xl font-display font-bold tracking-tight text-white">ONECore<span className="text-blue-500">.</span></span>
      </div>

      <nav className="flex-1 space-y-2 px-6 py-10">
        <div className="mb-4 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Main Navigation</div>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`group flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
              location.pathname === item.path
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent'
            }`}
          >
            <item.icon size={20} className={location.pathname === item.path ? 'text-blue-400' : 'text-zinc-600 group-hover:text-zinc-400'} />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-6">
        <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-blue-500 border border-zinc-700">
              <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold text-white">{profile?.email.split('@')[0] || 'User'}</p>
              <p className="truncate text-[10px] uppercase font-bold tracking-wider text-blue-500">{profile?.role}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => logout()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-xs font-bold text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-500 border border-zinc-700 hover:border-red-500/30"
            >
              <LogOut size={14} />
              Terminate Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Dynamic Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 opacity-10 pointer-events-none bg-center bg-cover bg-no-repeat"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop')`,
          filter: 'hue-rotate(240deg) brightness(0.5)' 
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-black via-transparent to-blue-900/10 pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden w-72 md:block fixed h-full inset-y-0 z-30 border-r border-zinc-900 shadow-2xl shadow-blue-500/5">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 relative min-h-screen overflow-x-hidden z-10">
        {/* Glow dots */}
        <div className="fixed top-0 right-0 -mr-40 -mt-40 h-96 w-96 rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />
        <div className="fixed bottom-0 left-0 -ml-40 -mb-40 h-96 w-96 rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

      {/* Mobile Header */}
      <header className="flex h-20 items-center justify-between border-b border-zinc-900 bg-black/80 backdrop-blur-md px-6 md:hidden sticky top-0 z-40">
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Zap size={22} fill="currentColor" />
          </div>
          <span className="ml-3 text-xl font-display font-bold text-white tracking-widest">ONECore</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-emerald-500">
             ₹{(profile?.balance || 0).toLocaleString()}
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-xl border border-zinc-800 p-2.5 text-zinc-400 hover:bg-zinc-900"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 md:p-12 max-w-[1400px] mx-auto min-h-screen">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-zinc-900 bg-black/80 p-2 pb-6 backdrop-blur-xl md:hidden">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${
              location.pathname === item.path ? 'text-blue-500' : 'text-zinc-500'
            }`}
          >
            <item.icon size={20} className={location.pathname === item.path ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
          </Link>
        ))}
      </nav>
    </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
