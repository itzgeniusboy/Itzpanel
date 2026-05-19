import React from 'react';
import { useAuth } from '../lib/auth';
import { motion } from 'motion/react';
import { LogIn, ShieldAlert, Zap, Globe, Lock } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const Login = () => {
  const { user, profile, login, loading, isLoggingIn } = useAuth();

  if (loading) return null;
  // If user is already fully authenticated with a profile, redirect home
  if (user && profile) return <Navigate to="/" replace />;
  // If user is logged into Firebase but NO profile yet, App.tsx will handle redirect to /register
  // But if they are already on Login page, we should let them know they need to register or it will redirect them via App.tsx logic soon.

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 font-sans text-white overflow-hidden relative">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-center bg-cover bg-no-repeat"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop')`,
          filter: 'hue-rotate(270deg) brightness(0.6)'
        }}
      />

      {/* Background FX Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[5%] h-[30%] w-[30%] rounded-full bg-purple-900/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl relative">
            <Zap className="h-10 w-10 text-blue-500" fill="currentColor" />
            <div className="absolute -inset-2 rounded-2xl border border-blue-500/10 animate-pulse" />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-2 italic">ONECore<span className="text-blue-500 text-5xl">.</span></h1>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">Advanced Licensing Infrastructure</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-10 backdrop-blur-2xl shadow-2xl relative">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-white">Terminal Access</h2>
              <p className="text-sm text-zinc-400">Initialize secure session via authorized provider.</p>
            </div>

            {user && !profile && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 text-xs text-blue-400"
              >
                <Lock size={18} className="shrink-0" />
                <p>Authentication recognized. Please proceed to registration protocol.</p>
              </motion.div>
            )}

            <button
              onClick={login}
              disabled={isLoggingIn}
              className="group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-xl bg-white py-4 font-bold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn && <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500" />}
              {!isLoggingIn && (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {isLoggingIn ? 'Establishing Security...' : 'Sign in with Security Protocol'}
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-8 text-zinc-600 grayscale opacity-40">
          <div className="flex items-center gap-2">
            <Globe size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Distributed Node</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Vault</span>
          </div>
        </div>

        <p className="mt-12 text-center text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-800">
          Internal management system // Authorized personnel only
        </p>
      </motion.div>
    </div>
  );
};
