import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { UserProfile, InviteCode, License, Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Ticket, 
  Trash2, 
  Check, 
  Copy, 
  Search,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  PauseCircle,
  PlayCircle,
  Activity,
  Globe,
  Wallet,
  ArrowDownLeft
} from 'lucide-react';
import { useAuth } from '../lib/auth';

export const AdminResellers = () => {
  const { profile } = useAuth();
  const [resellers, setResellers] = useState<UserProfile[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddingInvite, setIsAddingInvite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Invite Extension Modal State
  const [extendingInvite, setExtendingInvite] = useState<InviteCode | null>(null);
  const [extensionDays, setExtensionDays] = useState(30);

  // Balance Modal
  const [toppingUpUser, setToppingUpUser] = useState<UserProfile | null>(null);
  const [topupAmount, setTopupAmount] = useState(1000);
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);

  useEffect(() => {
    const qR = query(collection(db, 'users'), where('role', '==', 'reseller'));
    const unsubscribeR = onSnapshot(qR, (snapshot) => {
      setResellers(snapshot.docs.map(doc => doc.data() as UserProfile));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const qI = query(collection(db, 'inviteCodes'));
    const unsubscribeI = onSnapshot(qI, (snapshot) => {
      setInviteCodes(snapshot.docs.map(doc => doc.data() as InviteCode));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inviteCodes');
    });

    const qL = collection(db, 'licenses');
    const unsubscribeL = onSnapshot(qL, (snapshot) => {
      setLicenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as License)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'licenses');
    });

    return () => {
      unsubscribeR();
      unsubscribeI();
      unsubscribeL();
    };
  }, []);

  const generateInviteCode = async () => {
    setIsAddingInvite(true);
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + 
                 Math.random().toString(36).substring(2, 6).toUpperCase();
    
    try {
      await setDoc(doc(db, 'inviteCodes', code), {
        id: code,
        createdBy: profile?.uid || 'admin',
        isUsed: false,
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // Default 30 days
        status: 'active'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingInvite(false);
    }
  };

  const toggleInvite = async (code: InviteCode) => {
    const newStatus = code.status === 'active' ? 'suspended' : 'active';
    await updateDoc(doc(db, 'inviteCodes', code.id), { status: newStatus });
  };

  const extendInvite = async () => {
    if (!extendingInvite) return;
    try {
      const newExpiry = Math.max(Date.now(), extendingInvite.expiresAt) + (extensionDays * 24 * 60 * 60 * 1000);
      await updateDoc(doc(db, 'inviteCodes', extendingInvite.id), {
        expiresAt: newExpiry,
        status: 'active'
      });
      setExtendingInvite(null);
    } catch (err) { console.error(err); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteInvite = async (id: string) => {
    if (confirm('Permanently redact this access protocol?')) {
      await deleteDoc(doc(db, 'inviteCodes', id));
    }
  };

  const handleTopup = async () => {
    if (!toppingUpUser || topupAmount <= 0) return;
    setIsSubmittingTopup(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', toppingUpUser.uid);
      
      // Update User balance
      batch.update(userRef, {
        balance: (toppingUpUser.balance || 0) + topupAmount
      });

      // Create Transaction record
      const txRef = doc(collection(db, 'transactions'));
      const transaction: Transaction = {
        id: txRef.id,
        userId: toppingUpUser.uid,
        amount: topupAmount,
        type: 'topup',
        description: 'Manual Top-up by Admin',
        createdAt: Date.now()
      };
      batch.set(txRef, transaction);

      await batch.commit();
      setToppingUpUser(null);
      setTopupAmount(1000);
    } catch (err) {
      console.error(err);
      alert('Credit injection failed.');
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  const getUserBuildStats = (userId: string) => {
    const userLicenses = licenses.filter(l => l.resellerId === userId);
    const totalBuilds = userLicenses.reduce((acc, l) => acc + (l.buildCount || 0), 0);
    const totalLimit = userLicenses.reduce((acc, l) => acc + (l.buildLimit || 0), 0);
    return { builds: totalBuilds, limit: totalLimit, keys: userLicenses.length };
  };

  const getAppStats = () => {
    const appMap: { [key: string]: { builds: number; keys: number } } = {};
    licenses.forEach(l => {
      const name = l.appName || 'Default SDK';
      if (!appMap[name]) appMap[name] = { builds: 0, keys: 0 };
      appMap[name].builds += (l.buildCount || 0);
      appMap[name].keys += 1;
    });
    return Object.entries(appMap).map(([name, stats]) => ({ name, ...stats }));
  };

  const filteredResellers = resellers.filter(r => 
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const appStats = getAppStats();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white italic">Protocol Nexus</h1>
          <p className="text-zinc-500 text-sm mt-1">Command center for managing distribution entities and builds</p>
        </div>
      </div>

      {/* App Analytics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {appStats.slice(0, 4).map((app, i) => (
          <div key={i} className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">{app.name}</p>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-display font-bold text-white italic">{app.keys} Keys</span>
              <span className="text-xs font-bold text-blue-500">{app.builds} Builds</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Resellers Matrix */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-zinc-300 flex items-center gap-2 font-display italic">
              <Users size={18} className="text-blue-500" /> Authorized Nodes
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
              <input 
                type="text" 
                placeholder="Scan for identity..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-900 bg-zinc-900/30 py-3 md:py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* Desktop Matrix */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-900 bg-black/40 backdrop-blur-sm shadow-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-900/20">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Node Profile</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">SDK Density</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center">Build Analytics</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Balance</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-zinc-600" /></td></tr>
                ) : filteredResellers.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-zinc-600 italic">No entities found in grid</td></tr>
                ) : filteredResellers.map((reseller) => {
                  const stats = getUserBuildStats(reseller.uid);
                  return (
                    <tr key={reseller.uid} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/5">
                            <Users size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-200">{reseller.email}</p>
                            <p className="text-[10px] text-zinc-600 font-mono">UID: {reseller.uid.slice(0, 10)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Globe size={12} className="text-zinc-700" />
                          <span className="text-white font-bold">{stats.keys}</span>
                          <span className="text-[10px] text-zinc-600 uppercase font-black tracking-tighter">SDKs</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5 min-w-[140px]">
                          <div className="flex justify-between w-full text-[10px] font-bold font-mono tracking-tighter uppercase text-zinc-500">
                            <span>Loads</span>
                            <span className="text-blue-500">{stats.builds} / {stats.limit}</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                            <div 
                              className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000"
                              style={{ width: `${Math.min(100, (stats.builds / (stats.limit || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-emerald-500 font-mono font-bold">
                          <Wallet size={14} />
                          <span>₹{(reseller.balance || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setToppingUpUser(reseller)}
                          className="px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-[10px] font-bold text-blue-500 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                        >
                          Add Credits
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Matrix */}
          <div className="grid gap-4 md:hidden">
            {filteredResellers.map((reseller) => {
              const stats = getUserBuildStats(reseller.uid);
              return (
                <div key={reseller.uid} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center text-blue-500 border border-zinc-800">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-100 text-sm">{reseller.email}</p>
                        <p className="text-[10px] text-zinc-600 font-mono uppercase">Node Enabled</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 bg-black/40 rounded-xl p-3 border border-zinc-800/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">Protocols</span>
                      <span className="text-sm font-bold text-white tracking-widest uppercase italic font-display">{stats.keys}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">Build Success</span>
                      <span className="text-sm font-bold text-blue-500 font-mono tracking-tighter">{stats.builds} / {stats.limit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite/Referral Matrix */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-zinc-300 flex items-center gap-2 font-display italic">
              <Ticket size={18} className="text-amber-500" /> Referral Matrices
            </h3>
            <button 
              onClick={generateInviteCode}
              disabled={isAddingInvite}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-500/10"
            >
              {isAddingInvite ? 'Initializing...' : <><Plus size={14} /> New Packet</>}
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {inviteCodes.sort((a, b) => b.createdAt - a.createdAt).map((code) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={code.id}
                  className={`relative flex flex-col rounded-2xl border transition-all ${
                    code.isUsed 
                      ? 'bg-zinc-900/10 border-zinc-900 opacity-60' 
                      : code.status === 'active' 
                        ? 'border-zinc-800 bg-zinc-900/30' 
                        : 'border-red-900/30 bg-red-900/5'
                  } p-4`}
                >
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-800/50 pb-3">
                    <span className={`font-mono text-sm font-bold tracking-[0.2em] uppercase ${code.isUsed ? 'text-zinc-700' : 'text-white'}`}>
                      {code.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!code.isUsed && (
                        <button 
                          onClick={() => toggleInvite(code)}
                          className={`rounded-lg p-2 transition-all ${code.status === 'active' ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                        >
                          {code.status === 'active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                        </button>
                      )}
                      <button 
                        onClick={() => copyToClipboard(code.id)}
                        className="rounded-lg p-2 text-zinc-400 hover:text-white"
                      >
                        {copiedId === code.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button 
                        onClick={() => deleteInvite(code.id)}
                        className="rounded-lg p-2 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-600">Protocol State</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${code.isUsed ? 'text-zinc-800' : code.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {code.isUsed ? 'Consumed' : code.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-zinc-600">Uptime Limit</span>
                      <button 
                        onClick={() => setExtendingInvite(code)}
                        className="text-[10px] font-bold text-zinc-400 hover:text-blue-500 flex items-center gap-1 ml-auto"
                      >
                        {new Date(code.expiresAt).toLocaleDateString()} <ArrowUpRight size={10} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {inviteCodes.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-600 italic font-mono">
                  No access packets available
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Extension Modal */}
      <AnimatePresence>
        {extendingInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExtendingInvite(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm rounded-[2rem] border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
              <h3 className="text-xl font-display font-bold text-white mb-6 italic">Modify Protocol Uptime</h3>
              
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">Additional Uptime (Days)</label>
                <input 
                  type="number" 
                  value={extensionDays} 
                  onChange={(e) => setExtensionDays(parseInt(e.target.value) || 0)} 
                  className="w-full rounded-xl border border-zinc-900 bg-black/50 px-4 py-3 text-white font-mono outline-none focus:border-blue-500" 
                />
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button onClick={extendInvite} className="w-full rounded-xl bg-white py-4 text-sm font-bold text-black hover:bg-zinc-200 transition-all font-display italic">Inject Protocol Extension</button>
                <button onClick={() => setExtendingInvite(null)} className="w-full rounded-xl bg-zinc-800 py-4 text-sm font-bold text-zinc-500 font-display">Dismiss</button>
              </div>
            </motion.div>
          </div>
        )}

        {toppingUpUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setToppingUpUser(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm rounded-[3rem] border border-zinc-800 bg-zinc-900 p-10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl mb-8">
                <ArrowDownLeft size={32} />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2 italic">Credit Injection</h3>
              <p className="text-zinc-500 text-xs mb-8">Authorizing resource allocation for <span className="text-white font-bold">{toppingUpUser.email}</span></p>
              
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block px-2">Top-up Amount (INR)</label>
                <input 
                  type="number" 
                  value={topupAmount} 
                  onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)} 
                  className="w-full rounded-2xl border border-zinc-900 bg-black/50 px-6 py-4 text-white font-mono text-xl outline-none focus:border-emerald-500 transition-all" 
                />
              </div>

              <div className="mt-10 flex flex-col gap-3">
                <button 
                  onClick={handleTopup} 
                  disabled={isSubmittingTopup}
                  className="w-full rounded-2xl bg-emerald-600 py-5 text-sm font-bold text-white hover:bg-emerald-700 transition-all font-display italic flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingTopup ? <Loader2 className="animate-spin" size={18} /> : <><ShieldAlert size={18} /> Commit Injection</>}
                </button>
                <button onClick={() => setToppingUpUser(null)} className="w-full rounded-2xl bg-zinc-800 py-4 text-sm font-bold text-zinc-500 font-display">Abort Operation</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
