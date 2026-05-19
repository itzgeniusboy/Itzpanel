import React, { useState } from 'react';
import { motion } from 'motion/react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { useNavigate, Navigate } from 'react-router-dom';
import { Ticket, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const Register = () => {
  const { user, profile, loading } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (profile) return <Navigate to="/dashboard" replace />;
  
  // Auto-redirect owner to dashboard if they land here (profile will be created by AuthProvider)
  if (user.email === 'itzraviking@gmail.com') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsRegistering(true);

    try {
      const inviteRef = doc(db, 'inviteCodes', code.trim().toUpperCase());
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        setError('Invalid invite code');
        setIsRegistering(false);
        return;
      }

      const inviteData = inviteSnap.data();
      if (inviteData.isUsed) {
        setError('This code has already been used');
        setIsRegistering(false);
        return;
      }

      if (inviteData.expiresAt && inviteData.expiresAt < Date.now()) {
        setError('This code has expired');
        setIsRegistering(false);
        return;
      }

      if (inviteData.status === 'suspended') {
        setError('This protocol access is currently suspended');
        setIsRegistering(false);
        return;
      }

      if (inviteData.status === 'expired') {
        setError('This protocol access has expired');
        setIsRegistering(false);
        return;
      }

      // 1. Mark code as used
      await updateDoc(inviteRef, {
        isUsed: true,
        usedBy: user.uid
      });

      // 2. Create reseller profile
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, {
        uid: user.uid,
        email: user.email,
        role: 'reseller',
        referredBy: inviteData.createdBy,
        createdAt: Date.now()
      });

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 font-sans text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
            <ShieldCheck className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Become a Reseller</h1>
          <p className="mt-2 text-zinc-400">Enter your invitation code to access the terminal</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-xl">
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Invitation Code
              </label>
              <div className="relative">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                  type="text"
                  required
                  placeholder="XXXX-XXXX-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black/50 py-4 pl-12 pr-4 text-center font-mono text-lg uppercase tracking-widest outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button
              disabled={isRegistering || !code}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {isRegistering ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>
                  Initialize Terminal
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          Logged in as <span className="text-zinc-300">{user.email}</span>
        </p>
      </motion.div>
    </div>
  );
};
