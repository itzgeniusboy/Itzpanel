import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Shield, 
  Globe, 
  Send, 
  Save, 
  Layout, 
  Bot, 
  Lock,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { SystemConfig } from '../types';

export const Settings = () => {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<SystemConfig>({
    telegramId: '@admin',
    siteName: 'ONECore SDK'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'system', 'config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as SystemConfig);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const saveConfig = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'config'), config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system/config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Accessing Control Plane...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-display font-bold text-white italic">Control Center</h1>
        <p className="text-zinc-500 text-sm mt-1">Configure your personal node and system protocols</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Settings (Universal) */}
        <div className="rounded-[2rem] border border-zinc-900 bg-zinc-900/10 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white italic">Nexus Security</h3>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Your encryption identity</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Protocol Type</label>
              <div className="rounded-xl bg-black/40 border border-zinc-900 p-4 text-zinc-400 font-mono text-sm">
                AES-256 Cloud Infrastructure
              </div>
            </div>
            <div className="flex flex-col gap-2 opacity-50">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Session Keys</label>
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-700 italic">
                Dynamic Rotation Enabled
              </div>
            </div>
          </div>
        </div>

        {/* Admin Configuration */}
        {isAdmin && (
          <div className="rounded-[2rem] border border-blue-500/10 bg-blue-500/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-blue-600/5 blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-blue-500/10 pb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] text-white">
                  <Layout size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white italic">Master Override</h3>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">System Architecture Settings</p>
                </div>
              </div>
              <button 
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-black hover:bg-zinc-200 transition-all font-display italic disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : success ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Save size={14} />}
                {success ? 'PROTOCOL SYNCED' : 'COMMIT CHANGES'}
              </button>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Send size={10} /> Telegram Frequency ID
                </label>
                <input 
                  type="text" 
                  value={config.telegramId}
                  onChange={(e) => setConfig({...config, telegramId: e.target.value})}
                  className="w-full rounded-xl border border-zinc-900 bg-black/60 px-4 py-4 text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-all"
                  placeholder="@your_id"
                />
                <p className="text-[9px] text-zinc-600 italic">Used for reseller purchase redirects</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={10} /> Grid Domain Signature
                </label>
                <input 
                  type="text" 
                  value={config.siteName}
                  onChange={(e) => setConfig({...config, siteName: e.target.value})}
                  className="w-full rounded-xl border border-zinc-900 bg-black/60 px-4 py-4 text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-all"
                  placeholder="ONECore SDK"
                />
                <p className="text-[9px] text-zinc-600 italic">Global UI branding element</p>
              </div>

              <div className="sm:col-span-2 rounded-2xl bg-black/40 border border-zinc-800/50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                      <Bot size={14} className="text-blue-500" /> Automated Guards
                    </h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Experimental AI defense protocols</p>
                  </div>
                  <div className="h-6 w-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center px-1">
                    <div className="h-4 w-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                      <Lock size={14} className="text-amber-500" /> Deep HWID Scoping
                    </h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Multi-layer hardware verification</p>
                  </div>
                  <div className="h-6 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center px-1">
                    <div className="h-4 w-4 rounded-full bg-zinc-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-8 border border-red-500/10 bg-red-500/5 rounded-[2rem] opacity-40">
           <p className="text-center text-[10px] font-bold text-red-500/50 uppercase tracking-[0.3em]">Critical Core Access Only</p>
        </div>
      </div>
    </div>
  );
};
