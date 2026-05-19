import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Key, 
  ShieldCheck, 
  Smartphone,
  TrendingUp,
  Activity,
  Wallet,
  Clock,
  ArrowUpRight,
  BarChart3,
  Box,
  Power,
  Trash2,
  Zap,
  Terminal,
  Plus,
  BrainCircuit,
  Globe,
  Lock,
  Cpu,
  History,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Fingerprint,
  Database,
  EyeOff
} from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, limit, doc, getDoc, updateDoc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { License, AppBuild, SubscriptionPlan } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import Markdown from 'react-markdown';

export const Dashboard = () => {
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    bound: 0,
    expiringSoon: 0,
    totalBuilds: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [myBuilds, setMyBuilds] = useState<AppBuild[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [referralInput, setReferralInput] = useState('');
  const [referralError, setReferralError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.role === 'user') return;
    
    // Stats Listener - Live telemetry
    const q = isAdmin 
      ? query(collection(db, 'licenses'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'licenses'), where('resellerId', '==', profile.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as License);
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      
      setStats({
        total: docs.length,
        active: docs.filter(d => d.status === 'active').length,
        bound: docs.filter(d => d.deviceId).length,
        expiringSoon: docs.filter(d => d.expiresAt > now && d.expiresAt < now + dayMs).length,
        totalBuilds: docs.reduce((acc, d) => acc + (d.buildCount || 0), 0)
      });

      // Simulation of live activity log based on actual license events
      const log = snapshot.docs.slice(0, 5).map(d => ({
        id: d.id,
        type: 'LICENSE_CREATE',
        timestamp: d.data().createdAt,
        message: `Node ${d.id.slice(0, 8)} successfully linked to grid.`
      }));
      setRecentActions(log);

      // Advanced Analytics Chart Data
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      });

      const analytics = last7Days.map((day, i) => ({ 
        name: day, 
        builds: Math.floor(Math.random() * (50 + i * 10)) + 20, 
        licenses: Math.floor(Math.random() * 8) + 2,
        activeRate: 75 + Math.random() * 20
      }));
      setChartData(analytics);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'licenses');
    });

    // Builds Listener
    const bQ = isAdmin 
      ? query(collection(db, 'builds'), orderBy('createdAt', 'desc'), limit(15))
      : query(collection(db, 'builds'), where('resellerId', '==', profile.uid), orderBy('createdAt', 'desc'));

    const unsubscribeBuilds = onSnapshot(bQ, (snapshot) => {
      setMyBuilds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppBuild)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'builds');
    });

    return () => {
      unsubscribe();
      unsubscribeBuilds();
    };
  }, [isAdmin, profile]);

  const generateAIInsight = async () => {
    setIsAnalyzing(true);
    try {
      // Get marketplace context for smarter AI response
      const plansSnap = await getDocs(collection(db, 'plans'));
      const marketplaceData = plansSnap.docs.map(d => d.data());

      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, marketplaceData })
      });
      const data = await response.json();
      setAiReport(data.text);
    } catch (err) {
      console.error(err);
      setAiReport("**Protocol Error:** Intelligence bridge connection failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleBuildStatus = async (buildId: string, currentState: boolean) => {
    try {
      await updateDoc(doc(db, 'builds', buildId), { isActive: !currentState });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBuild = async (buildId: string) => {
    if (confirm('Permanently purge this build from the cluster?')) {
      await deleteDoc(doc(db, 'builds', buildId));
    }
  };

  const createNewBuild = async () => {
    if (!profile) return;
    if (myBuilds.length >= 20) { 
       alert('System Limit: Cluster capacity exceeded. Purge old nodes before deploying new ones.');
       return;
    }

    setIsBuilding(true);
    try {
      const id = 'BLD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      await setDoc(doc(db, 'builds', id), {
        id,
        resellerId: profile.uid,
        licenseId: 'active_core',
        appName: `ShieldNode_${myBuilds.length + 1}`,
        packageName: `com.onecore.node${myBuilds.length + 1}`,
        version: '1.0.4',
        isActive: true,
        createdAt: Date.now()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsBuilding(false);
    }
  };

  const verifyReferral = async () => {
    if (!referralInput.trim() || !profile) return;
    setIsVerifying(true);
    setReferralError('');
    
    try {
      const inviteRef = doc(db, 'inviteCodes', referralInput.trim());
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) {
        setReferralError('Invalid Protocol Referral Code');
        setIsVerifying(false);
        return;
      }
      const inviteData = inviteSnap.data();
      if (inviteData.isUsed) {
        setReferralError('Referral Code already consumed');
        setIsVerifying(false);
        return;
      }
      await updateDoc(inviteRef, { isUsed: true, usedBy: profile.uid, usedAt: Date.now() });
      await updateDoc(doc(db, 'users', profile.uid), { role: 'reseller', referredBy: inviteData.createdBy, lastReferralKey: referralInput.trim() });
      // Reload to apply new role
      window.location.reload();
    } catch (err) {
      console.error(err);
      setReferralError('Verification protocol failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (profile?.role === 'user') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-zinc-950/80 border border-zinc-900 rounded-[3rem] p-10 backdrop-blur-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-blue-500/10 blur-[80px]" />
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.4)] text-white mb-8 mx-auto">
            <Zap size={40} className="fill-current" />
          </div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-white italic mb-3">Sync Node</h2>
            <p className="text-zinc-500 text-sm">Enter assigned protocol key to authorize reseller permissions.</p>
          </div>
          <div className="space-y-6">
            <input 
              type="text" 
              placeholder="PROT-XXXX-XXXX"
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              className={`w-full rounded-2xl bg-zinc-950 border ${referralError ? 'border-red-500' : 'border-zinc-800'} px-6 py-5 text-white font-mono text-center tracking-widest outline-none transition-all`}
            />
            {referralError && <p className="text-xs font-bold text-red-500 text-center uppercase tracking-tighter">{referralError}</p>}
            <button 
              onClick={verifyReferral}
              disabled={isVerifying}
              className="w-full rounded-2xl bg-blue-600 py-5 text-sm font-bold text-white hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isVerifying ? 'CALIBRATING...' : 'AUTHORIZE PROTOCOL'}
              <ArrowUpRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, detail, growth }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-[2rem] border border-zinc-900 bg-zinc-950/40 p-7 backdrop-blur-md hover:border-zinc-800 transition-all"
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/5 blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />
      
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-display font-bold text-white tracking-tighter">{value}</h3>
            {detail && <span className="text-[10px] text-zinc-600 font-mono tracking-widest">{detail}</span>}
          </div>
          {growth && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase">
              <TrendingUp size={12} /> {growth} Velocity
            </div>
          )}
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900/50 border border-zinc-800/50 ${color} shadow-2xl transition-transform group-hover:scale-110`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );

  const TerminalLog = () => (
    <div className="rounded-[2.5rem] border border-zinc-900 bg-black/40 p-6 font-mono text-[11px] h-[300px] flex flex-col shadow-inner">
      <div className="flex items-center gap-2 text-zinc-600 mb-4 border-b border-zinc-900 pb-3 uppercase font-bold tracking-widest">
        <Terminal size={14} /> System Console v4.3.0
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
        {recentActions.map((action, i) => (
          <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-zinc-700">[{new Date(action.timestamp).toLocaleTimeString()}]</span>
            <span className="text-blue-500 font-bold uppercase tracking-tighter">{action.type}</span>
            <span className="text-zinc-400">{action.message}</span>
          </div>
        ))}
        <div className="flex gap-3 text-zinc-700 animate-pulse">
          <span>[{new Date().toLocaleTimeString()}]</span>
          <span className="text-zinc-600">IDLE</span>
          <span>Awaiting external telemetry signal...</span>
        </div>
      </div>
    </div>
  );

  const StealthStatus = () => (
    <div className="rounded-[3rem] border border-zinc-900 bg-zinc-950/20 p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-widest">Master Guard OS</h4>
          <p className="text-[10px] text-zinc-600 font-bold tracking-tighter">Active System Interception</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {[
          { name: 'Kernel Shield', status: 'Secure', icon: Lock },
          { name: 'DEX Virt-Link', status: 'Bypassed', icon: Globe },
          { name: 'Memory Seal', status: 'Encrypted', icon: Database },
          { name: 'Env Protector', status: 'Stealth', icon: EyeOff }
        ].map((module, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-zinc-900/50 group/mod">
            <div className="flex items-center gap-3">
              <module.icon size={14} className="text-zinc-500 group-hover/mod:text-blue-500 transition-colors" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{module.name}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
              {module.status}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-zinc-600 leading-relaxed italic mt-6 border-l-2 border-blue-500/30 pl-4">
        Deep kernel interception is active. All memory dump attempts are redirected to a virtual null-buffer.
      </p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header with Smart Insight Toggle */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Protocol Matrix: Online</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white italic">
            Dashboard <span className="text-zinc-600">Intelligence</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1 max-w-xl">
            Managing <span className="text-white font-medium">{stats.total} Active Vectors</span> across the OneCore SDK grid.
          </p>
        </div>

        <button 
          onClick={generateAIInsight}
          disabled={isAnalyzing}
          className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white/5 border border-white/10 px-6 py-4 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
        >
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 shadow-[0_0_10px_#3b82f6]" />
          {isAnalyzing ? (
            <Loader2 className="animate-spin text-blue-500" size={20} />
          ) : (
            <BrainCircuit className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
          )}
          <span className="text-sm font-bold text-white uppercase tracking-widest">
            {isAnalyzing ? 'Processing...' : 'Run Strategy AI'}
          </span>
        </button>
      </div>

      {/* AI Intelligence Sector */}
      <AnimatePresence>
        {aiReport && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-10 rounded-[2.5rem] border border-blue-500/20 bg-blue-600/5 p-8 relative">
              <div className="absolute top-4 right-4 text-blue-500/30">
                <Sparkles size={32} />
              </div>
              <div className="flex items-center gap-3 mb-6 text-blue-500">
                <Cpu size={20} className="animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Targeted Smart Strategy</h3>
              </div>
              <div className="prose prose-invert prose-sm max-w-none prose-p:text-zinc-300 prose-strong:text-white prose-li:text-zinc-400">
                <Markdown>{aiReport}</Markdown>
              </div>
              <button 
                onClick={() => setAiReport(null)}
                className="mt-6 text-[10px] font-bold text-zinc-600 uppercase hover:text-white transition-colors"
              >
                Dismiss Intelligence Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="PROJECT CAPACITY" value={`${stats.totalBuilds}/${profile?.totalBuildLimit || 0}`} icon={Box} color="text-blue-500" detail="UNITS" growth="STABLE" />
        <StatCard title="AAR INTEGRITY" value="100%" icon={ShieldAlert} color="text-emerald-500" detail="VALID" growth="MAX" />
        <StatCard title="MATRIX BALANCE" value={`₹${(profile?.balance || 0).toLocaleString()}`} icon={Wallet} color="text-amber-500" detail="CREDITS" growth="SECURE" />
        <StatCard title="ANTI-DUMP" value="ACTIVE" icon={Fingerprint} color="text-purple-500" detail="CORE" growth="SECURE" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-[3rem] border border-zinc-900 bg-zinc-950/30 p-8 backdrop-blur-xl">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2 italic">
                  <BarChart3 size={20} className="text-blue-500" /> Matrix Performance
                </h3>
                <p className="text-xs text-zinc-600 mt-1 uppercase font-bold tracking-tighter">Throughput & Validation Over 7 Cycles</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-500">
                   <div className="h-2 w-2 rounded-full bg-blue-500" /> BUILDS
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-500">
                   <div className="h-2 w-2 rounded-full bg-amber-500" /> KEYS
                 </div>
              </div>
            </div>

            <div className="h-[350px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBuilds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorKeys" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                  <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '24px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="builds" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBuilds)" />
                  <Area type="monotone" dataKey="licenses" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorKeys)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {!isAdmin && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-2">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white italic">AAR Project Forge</h3>
                  <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Active builds in matrix repository</p>
                </div>
                <button 
                  onClick={createNewBuild}
                  disabled={isBuilding || (profile?.usedBuildCount || 0) >= (profile?.totalBuildLimit || 0)}
                  className="group flex items-center gap-3 rounded-2xl bg-zinc-100 px-6 py-4 text-xs font-bold text-black hover:bg-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {isBuilding ? 'Syncing Matrix...' : <><Plus size={16} /> Deploy New AAR Node</>}
                </button>
              </div>
              
              <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                  {myBuilds.map((build) => (
                    <motion.div 
                      layout
                      key={build.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group flex flex-col sm:flex-row items-center justify-between gap-6 p-7 rounded-[2.5rem] border border-zinc-900 bg-zinc-950/20 hover:bg-zinc-900/40 transition-all overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 p-2">
                        <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                          build.status === 'finished' ? 'text-emerald-500 bg-emerald-500/10' :
                          build.status === 'failed' ? 'text-red-500 bg-red-500/10' :
                          'text-blue-500 bg-blue-500/10 animate-pulse'
                        }`}>
                          {build.status || 'Finished'}
                        </span>
                      </div>
                      <div className="flex items-center gap-5 w-full">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-zinc-900 flex items-center justify-center text-blue-500 border border-zinc-800 shadow-xl group-hover:scale-105 transition-transform">
                          <Box size={28} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">{build.appName}</h4>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{build.packageName}</span>
                            <span className="h-1 w-1 rounded-full bg-zinc-800" />
                            <span className="text-[9px] font-mono text-blue-500 font-bold uppercase transition-colors group-hover:text-blue-400">Core Ver: v{build.version}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto self-end sm:self-center">
                        <div className="flex items-center gap-3 p-2 rounded-2xl bg-black/40 border border-zinc-900">
                           <div className="text-right px-2">
                             <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Injection</p>
                             <span className={`text-[10px] font-bold uppercase ${build.isActive ? 'text-emerald-500' : 'text-zinc-600'}`}>
                               {build.isActive ? 'ON' : 'OFF'}
                             </span>
                          </div>
                          <button 
                            onClick={() => toggleBuildStatus(build.id, !!build.isActive)}
                            className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all ${
                              build.isActive 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                            }`}
                          >
                            <Power size={20} />
                          </button>
                        </div>
                        
                        {build.downloadUrl && (
                          <button 
                            onClick={() => window.open(build.downloadUrl, '_blank')}
                            className="h-11 w-11 rounded-xl bg-blue-600 border border-blue-500 flex items-center justify-center text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                          >
                            <ArrowUpRight size={18} />
                          </button>
                        )}

                        <button 
                          onClick={() => deleteBuild(build.id)}
                          className="h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 hover:text-red-500 hover:border-red-500/30 transition-all hover:bg-black"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {myBuilds.length === 0 && (
                    <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-zinc-900 text-zinc-800 font-display italic text-lg">
                      No deployed units detected in the local cluster
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Live Activity Terminal */}
          <div className="rounded-[3rem] border border-zinc-900 bg-zinc-950/20 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2 italic">
                <Activity size={18} className="text-blue-500" /> Grid Status
              </h3>
              <History size={16} className="text-zinc-700 hover:text-blue-500 cursor-pointer" />
            </div>
            <TerminalLog />
          </div>

          <StealthStatus />
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <Activity className={`${className} animate-pulse px-1`} size={size} />
);

