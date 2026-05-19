import React, { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { License, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  Edit3, 
  Key, 
  Smartphone, 
  Calendar,
  Search,
  Clock,
  AlertTriangle,
  History,
  Timer,
  MoreVertical,
  X,
  Wallet,
  Zap,
  Info,
  ChevronRight,
  ShieldCheck,
  LifeBuoy,
  Globe
} from 'lucide-react';
import { useAuth } from '../lib/auth';

export const LicenseManager = () => {
  const { profile, isAdmin, isReseller } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // New License State
  const [newKey, setNewKey] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newDurationUnit, setNewDurationUnit] = useState<'days' | 'hours' | 'minutes'>('days');
  const [newMaxUsage, setNewMaxUsage] = useState(1);
  const [newBuildLimit, setNewBuildLimit] = useState(10);
  const [newNote, setNewNote] = useState('');
  const [asReferral, setAsReferral] = useState(false);

  // UI Interaction State
  const [licenseToDelete, setLicenseToDelete] = useState<string | null>(null);
  const [extendingLicense, setExtendingLicense] = useState<License | null>(null);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [editStatus, setEditStatus] = useState<License['status']>('active');
  const [editMaxUsage, setEditMaxUsage] = useState(1);
  const [editBuildLimit, setEditBuildLimit] = useState(10);
  const [editNote, setEditNote] = useState('');
  const [editAppName, setEditAppName] = useState('');
  
  const [extensionValue, setExtensionValue] = useState(7);
  const [extensionUnit, setExtensionUnit] = useState<'days' | 'hours' | 'minutes'>('days');

  useEffect(() => {
    if (!profile || profile.role === 'user') return;

    const q = isAdmin 
      ? query(collection(db, 'licenses'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'licenses'), where('resellerId', '==', profile.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as License));
      setLicenses(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'licenses');
    });
    return () => unsubscribe();
  }, [isAdmin, profile]);

  const addLicense = async () => {
    const key = newKey.trim() || Math.random().toString(36).substring(2, 10).toUpperCase();
    
    let durationMs = newDuration * 60 * 60 * 1000;
    if (newDurationUnit === 'days') durationMs *= 24;
    if (newDurationUnit === 'minutes') durationMs = newDuration * 60 * 1000;

    const expiresAt = Date.now() + durationMs;
    
    try {
      // 1. Create License
      await setDoc(doc(db, 'licenses', key), {
        key: key,
        resellerId: profile?.uid,
        resellerEmail: profile?.email,
        deviceId: null,
        status: 'active',
        expiresAt: expiresAt,
        maxUsage: newMaxUsage,
        currentUsage: 0,
        buildCount: 0,
        buildLimit: newBuildLimit,
        createdAt: Date.now(),
        note: newNote,
        appName: newAppName || 'Default SDK'
      });

      // 2. If Referral enabled, create Invite Code
      if (asReferral && isAdmin) {
        await setDoc(doc(db, 'inviteCodes', key), {
          id: key,
          createdBy: profile?.uid || 'admin',
          isUsed: false,
          createdAt: Date.now(),
          expiresAt: expiresAt, // Link expiry to license expiry
          status: 'active'
        });
      }

      setNewKey('');
      setNewAppName('');
      setNewNote('');
      setAsReferral(false);
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      alert('Generation Error: Protocol Breach detected.');
    }
  };

  const handleExtension = async () => {
    if (!extendingLicense || !profile) return;
    
    let extendMs = extensionValue * 60 * 60 * 1000;
    if (extensionUnit === 'days') extendMs *= 24;
    if (extensionUnit === 'minutes') extendMs = extensionValue * 60 * 1000;

    const newExpiry = Math.max(Date.now(), extendingLicense.expiresAt) + extendMs;
    
    try {
      await updateDoc(doc(db, 'licenses', extendingLicense.id), { 
        expiresAt: newExpiry,
        status: 'active'
      });

      setExtendingLicense(null);
    } catch (e) { console.error(e); }
  };

  const saveEdit = async () => {
    if (!editingLicense) return;
    try {
      await updateDoc(doc(db, 'licenses', editingLicense.id), {
        status: editStatus,
        maxUsage: editMaxUsage,
        buildLimit: editBuildLimit,
        note: editNote,
        appName: editAppName
      });
      setEditingLicense(null);
    } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!licenseToDelete) return;
    try {
      await deleteDoc(doc(db, 'licenses', licenseToDelete));
      setLicenseToDelete(null);
    } catch (e) { 
      console.error(e);
      setLicenseToDelete(null);
    }
  };

  const resetDevice = async (id: string) => {
    if (!window.confirm('Wipe Bound Hardware Identity? This allows the key to be used on another device/app.')) return;
    try {
      await updateDoc(doc(db, 'licenses', id), { deviceId: null });
    } catch (e) { console.error(e); }
  };

  const getRemainingTime = (expiry: number) => {
    const diff = expiry - Date.now();
    if (diff <= 0) return 'EXPIRED';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    
    if (days > 0) return `${days}D ${hours}H REMAINING`;
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}H ${minutes}M REMAINING`;
  };

  const filtered = licenses.filter(l => 
    l.key.toLowerCase().includes(search.toLowerCase()) || 
    (l.deviceId?.toLowerCase().includes(search.toLowerCase())) ||
    (l.note?.toLowerCase().includes(search.toLowerCase())) ||
    (l.appName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white flex items-center gap-3 italic">
            <Key className="text-blue-500" /> Key Vault
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Initialize and monitor encrypted access protocols</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95"
        >
          <Plus size={18} />
          Initialize New Matrix
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input
          type="text"
          placeholder="Scan vault for identity, app, HWID, or metadata..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-zinc-900 bg-zinc-900/30 py-4 pl-12 pr-4 text-sm text-white outline-none transition-all focus:border-blue-500/50 backdrop-blur-sm"
        />
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -20 }}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none hidden md:block">
              <Zap size={120} />
            </div>

            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                <ShieldCheck className="text-blue-500" />
                Initialize Protocol
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-zinc-600 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="grid gap-6 md:gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">App Title (Target SDK)</label>
                  <input
                    type="text"
                    placeholder="e.g. My Racing App"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-900 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-bold tracking-tight"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Protocol Identity (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-provisioned if null"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full rounded-xl border border-zinc-900 bg-black/50 px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Uptime Duration</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={newDuration}
                      onChange={(e) => setNewDuration(parseInt(e.target.value) || 0)}
                      className="w-24 rounded-xl border border-zinc-900 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 font-mono text-center"
                    />
                    <select 
                      value={newDurationUnit}
                      onChange={(e: any) => setNewDurationUnit(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-900 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
                    >
                      <option value="days">Earth Days</option>
                      <option value="hours">Core Hours</option>
                      <option value="minutes">Micro Cycles</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Hardware Limit</label>
                  <input
                    type="number"
                    value={newMaxUsage}
                    onChange={(e) => setNewMaxUsage(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-zinc-900 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Build Auth Limit</label>
                  <input
                    type="number"
                    value={newBuildLimit}
                    onChange={(e) => setNewBuildLimit(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-zinc-900 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Internal Metadata / Note</label>
                  <textarea
                    placeholder="Reseller notes, telegram handle..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={1}
                    className="w-full rounded-xl border border-zinc-900 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-all resize-none"
                  />
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 active:scale-95 transition-all cursor-pointer select-none" onClick={() => setAsReferral(!asReferral)}>
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${asReferral ? 'bg-blue-600 border-blue-500' : 'bg-black border-zinc-700'}`}>
                      {asReferral && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider">Enable as Reseller Referral</p>
                      <p className="text-[9px] text-zinc-500 uppercase font-mono">This SDK key will also act as an invite packet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 flex flex-col-reverse md:flex-row justify-end gap-3 md:gap-4 pt-8 border-t border-zinc-800/50">
              <button
                onClick={() => setIsAdding(false)}
                className="rounded-xl px-8 py-4 md:py-3 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
              >
                Abort Protocol
              </button>
              <button
                onClick={addLicense}
                className="rounded-xl bg-white px-10 py-4 md:py-3 text-sm font-bold text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/10"
              >
                Execute Generation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-Friendly List */}
      <div className="grid gap-4 md:hidden">
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-zinc-700 italic">No nodes active</div>
        ) : filtered.map(license => (
          <motion.div 
            layout
            key={license.id} 
            className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono">{license.key}</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                  <Globe size={12} className="text-blue-500" /> {license.appName || 'Default SDK'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                license.status === 'active' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' :
                license.status === 'suspended' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' :
                'bg-red-500/5 text-red-500 border-red-500/20'
              }`}>
                {license.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-600 uppercase mb-1">Time Status</p>
                <p className={`text-xs font-bold ${license.expiresAt < Date.now() ? 'text-red-500' : 'text-zinc-300'}`}>
                  {getRemainingTime(license.expiresAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-600 uppercase mb-1">Builds Used</p>
                <p className="text-xs font-mono font-bold text-zinc-400">
                  {license.buildCount || 0} / {license.buildLimit || 10}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-600 uppercase mb-1">Hardware Link</p>
                <p className="text-xs font-mono font-bold text-zinc-400">
                  {license.deviceId ? `${license.deviceId.slice(0, 8)}...` : 'UNLINKED'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-zinc-800/50 pt-4">
              <button 
                onClick={() => setExtendingLicense(license)}
                className="flex-1 rounded-xl bg-zinc-800 py-3 text-xs font-bold text-white flex items-center justify-center gap-2"
              >
                <Calendar size={14} /> Extend
              </button>
              <button 
                onClick={() => updateDoc(doc(db, 'licenses', license.id), { 
                  status: license.status === 'active' ? 'suspended' : 'active' 
                })}
                className={`flex-1 rounded-xl py-3 text-xs font-bold text-white flex items-center justify-center gap-2 ${
                  license.status === 'active' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                }`}
              >
                {license.status === 'active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />} 
                {license.status === 'active' ? 'Pause' : 'Start'}
              </button>
              <button 
                onClick={() => {
                  setEditingLicense(license);
                  setEditStatus(license.status);
                  setEditMaxUsage(license.maxUsage || 10);
                  setEditNote(license.note || '');
                  setEditAppName(license.appName || '');
                }}
                className="rounded-xl bg-zinc-800 p-3 text-white"
              >
                <Edit3 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-zinc-900 bg-black/40 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-900/30 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 border-b border-zinc-900">
            <tr>
              <th className="px-8 py-6">Identity & App</th>
              <th className="px-8 py-6">Protocol Status</th>
              <th className="px-8 py-6">Utilization</th>
              <th className="px-8 py-6">Hardware Link</th>
              <th className="px-8 py-6">Terminal Time</th>
              <th className="px-8 py-6 text-right">Interactions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
                  <p className="mt-4 text-xs font-mono uppercase tracking-widest text-zinc-700">Syncing with Mainframe...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-32 text-center text-zinc-700 italic">
                  <div className="flex flex-col items-center gap-4">
                    <LifeBuoy size={48} strokeWidth={1} />
                    <span>No data points found in current segment</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((license) => (
                <tr key={license.id} className="group hover:bg-white/[0.02] transition-colors duration-300">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3 font-mono font-bold text-white tracking-widest uppercase">
                        <Key size={14} className="text-zinc-600" />
                        {license.key}
                      </div>
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-[10px] uppercase font-bold text-blue-500/80 flex items-center gap-1.5 ">
                          <Globe size={11} /> {license.appName || 'UNNAMED APK'}
                        </span>
                        {license.note && (
                          <span className="text-[10px] uppercase font-bold text-zinc-600 flex items-center gap-1.5">
                            <Info size={10} className="text-zinc-700" /> {license.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                      license.status === 'active' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' :
                      license.status === 'suspended' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' :
                      'bg-red-500/5 text-red-500 border-red-500/20'
                    }`}>
                      <div className={`h-1 w-1 rounded-full ${license.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
                      {license.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2 w-36">
                      <div className="flex items-center justify-between text-[10px] font-bold font-mono tracking-tighter uppercase text-zinc-600">
                        <span>HW Utilization</span>
                        <span className="text-zinc-400">{license.currentUsage} / {license.maxUsage}</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (license.currentUsage / license.maxUsage) * 100)}%` }}
                          className={`h-full transition-all duration-1000 ${
                            (license.currentUsage / license.maxUsage >= 1) ? 'bg-red-500' : 
                            (license.currentUsage / license.maxUsage > 0.8) ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold font-mono tracking-tighter uppercase text-zinc-700 mt-1">
                        <span>Build Tokens</span>
                        <span>{license.buildCount || 0} / {license.buildLimit || 10}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3 text-zinc-500 group/hwid">
                      <Smartphone size={16} className={license.deviceId ? 'text-blue-500' : 'text-zinc-800'} />
                      {license.deviceId ? (
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-400">{license.deviceId.slice(0, 12)}...</span>
                          <button 
                            onClick={() => resetDevice(license.id)}
                            title="Release HWID"
                            className="p-1.5 rounded-lg bg-zinc-900 text-[10px] font-bold uppercase text-zinc-600 hover:text-red-500 transition-colors border border-zinc-800"
                          >
                            Wipe
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-800 font-bold text-[10px] tracking-widest uppercase italic">Node Unlinked</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                        (license.expiresAt - Date.now() < 86400000) ? 'text-red-500' : 'text-zinc-300'
                      }`}>
                        <Timer size={14} />
                        {getRemainingTime(license.expiresAt)}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-700 tracking-tighter">
                        TERMINATES @ {new Date(license.expiresAt).toLocaleString().toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 w-fit ml-auto">
                      <button
                        onClick={() => setExtendingLicense(license)}
                        title="Add Energy"
                        className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-blue-600/10 hover:text-blue-500"
                      >
                        <Calendar size={18} />
                      </button>
                      <button
                        onClick={() => updateDoc(doc(db, 'licenses', license.id), { 
                          status: license.status === 'active' ? 'suspended' : 'active' 
                        })}
                        title={license.status === 'active' ? 'Sleep Mode' : 'Wake Protocol'}
                        className={`rounded-lg p-2 transition-all ${
                          license.status === 'active' ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                      >
                        {license.status === 'active' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingLicense(license);
                          setEditStatus(license.status);
                          setEditMaxUsage(license.maxUsage);
                          setEditBuildLimit(license.buildLimit || 10);
                          setEditNote(license.note || '');
                          setEditAppName(license.appName || '');
                        }}
                        className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-white/10 hover:text-white"
                      >
                        <Edit3 size={18} />
                      </button>
                      {(isAdmin || (isReseller && license.resellerId === profile?.uid)) && (
                        <button
                          onClick={() => setLicenseToDelete(license.id)}
                          className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {/* Modals */}
        {extendingLicense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExtendingLicense(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl">
              <h3 className="text-xl font-display font-bold text-white mb-6">Inject Energy Cell</h3>
              <p className="text-xs text-zinc-500 mb-6 font-mono uppercase tracking-widest">Target: {extendingLicense.key}</p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <input type="number" value={extensionValue} onChange={(e) => setExtensionValue(parseInt(e.target.value) || 0)} className="w-1/3 rounded-xl border border-zinc-800 bg-black/50 px-4 py-3 text-white font-mono" />
                  <select value={extensionUnit} onChange={(e: any) => setExtensionUnit(e.target.value)} className="flex-1 rounded-xl border border-zinc-800 bg-black/50 px-4 py-3 text-white">
                    <option value="days">Days</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>
              <div className="mt-10 flex gap-4">
                <button onClick={handleExtension} className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-zinc-200 uppercase tracking-widest">Execute</button>
                <button onClick={() => setExtendingLicense(null)} className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-bold text-zinc-400 hover:text-white uppercase tracking-widest">Abort</button>
              </div>
            </motion.div>
          </div>
        )}

        {editingLicense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingLicense(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl">
              <h3 className="text-xl font-display font-bold text-white mb-6">Modify Protocol Parameters</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Application Target</label>
                  <input type="text" value={editAppName} onChange={(e) => setEditAppName(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-black/50 px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Link Status</label>
                  <select value={editStatus} onChange={(e: any) => setEditStatus(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-black/50 px-4 py-3 text-white">
                    <option value="active">Operational</option>
                    <option value="suspended">Locked / Frozen</option>
                    <option value="expired">Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Max Capacity (Hardware)</label>
                  <input type="number" value={editMaxUsage} onChange={(e) => setEditMaxUsage(parseInt(e.target.value) || 0)} className="w-full rounded-xl border border-zinc-800 bg-black/50 px-4 py-3 text-white font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Build Auth Limit</label>
                  <input type="number" value={editBuildLimit} onChange={(e) => setEditBuildLimit(parseInt(e.target.value) || 0)} className="w-full rounded-xl border border-zinc-800 bg-black/50 px-4 py-3 text-white font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Metadata Override</label>
                  <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-black/50 px-4 py-3 text-white resize-none" rows={2} />
                </div>
              </div>
              <div className="mt-10 flex gap-4">
                <button onClick={saveEdit} className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-black uppercase tracking-widest">Apply Patch</button>
              </div>
            </motion.div>
          </div>
        )}

        {licenseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLicenseToDelete(null)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm rounded-[2rem] border border-red-500/30 bg-black p-10 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                <AlertTriangle size={40} className="animate-pulse" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white tracking-tight">Critical Confirmation</h3>
              <p className="mt-4 text-sm text-zinc-500 leading-relaxed font-mono uppercase tracking-tighter">
                Initiating license purge for <span className="text-red-500 font-bold">{licenseToDelete}</span>. This will terminate all connection handles immediately.
              </p>
              <div className="mt-10 flex flex-col gap-3">
                <button onClick={confirmDelete} className="w-full rounded-2xl bg-red-600 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all">TERMINATE ACCESS</button>
                <button onClick={() => setLicenseToDelete(null)} className="w-full py-4 text-sm font-bold text-zinc-600 hover:text-zinc-400 transition-colors">ABORT PURGE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden opacity-20">
        <div className="absolute top-[20%] right-[10%] w-[1px] h-[60%] bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
        <div className="absolute top-[40%] left-[20%] w-[1px] h-[40%] bg-gradient-to-b from-transparent via-purple-500 to-transparent" />
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
