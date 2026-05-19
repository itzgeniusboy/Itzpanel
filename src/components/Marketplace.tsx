import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, getDoc, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Check, 
  Send, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  Cpu,
  Clock,
  LayoutGrid,
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  Loader2,
  Database,
  Wallet,
  ArrowRightLeft
} from 'lucide-react';
import { SubscriptionPlan, SystemConfig, Transaction } from '../types';

const INITIAL_BOOTSTRAP_PLANS: Partial<SubscriptionPlan>[] = [
  {
    name: 'Ghost Protocol',
    description: 'Perfect for small-scale operations and testing.',
    price: 999,
    duration: 30,
    durationUnit: 'days',
    buildLimit: 100,
    features: ['100 Secure Builds', 'Anti-Dump Protection', 'Basic Device Binding', 'Email Support'],
    isPopular: false
  },
  {
    name: 'Phantom Elite',
    description: 'Our most popular choice for growing distribution networks.',
    price: 2499,
    duration: 30,
    durationUnit: 'days',
    buildLimit: 1000,
    features: ['1000 Secure Builds', 'Advanced Obfuscation', 'Strict Device Binding', 'Metadata Customization', 'Priority TG Support'],
    isPopular: true
  },
  {
    name: 'Omega Infinity',
    description: 'Unrestricted power for professional scaling.',
    price: 4999,
    duration: 999,
    durationUnit: 'lifetime',
    buildLimit: 99999,
    features: ['Unlimited Builds', 'Custom SDK Branding', 'HWID Reset Protocol', 'Full Database Access', 'Dedicated Admin Support'],
    isPopular: false
  }
];

export const Marketplace = () => {
  const { profile, isAdmin } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin UI State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    durationUnit: 'days',
    buildLimit: 100,
    features: [''],
    isPopular: false
  });

  useEffect(() => {
    // Fetch Plans
    const q = query(collection(db, 'plans'), orderBy('price', 'asc'));
    const unsubscribePlans = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
      setPlans(plansData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'plans');
    });

    // Fetch Config
    const fetchConfig = async () => {
      const docRef = doc(db, 'system', 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSystemConfig(docSnap.data() as SystemConfig);
      }
    };
    fetchConfig();

    return () => unsubscribePlans();
  }, []);

  const bootstrapPlans = async () => {
    if (!isAdmin || plans.length > 0) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      INITIAL_BOOTSTRAP_PLANS.forEach(plan => {
        const newDoc = doc(collection(db, 'plans'));
        batch.set(newDoc, { ...plan, createdAt: Date.now() });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePlan = async () => {
    if (!newPlan.name || !newPlan.price) return;
    setIsSubmitting(true);
    try {
      const cleanFeatures = newPlan.features?.filter(f => f.trim() !== '') || [];
      if (editingPlan) {
        await updateDoc(doc(db, 'plans', editingPlan.id), {
          ...newPlan,
          features: cleanFeatures
        });
      } else {
        await addDoc(collection(db, 'plans'), {
          ...newPlan,
          features: cleanFeatures,
          createdAt: Date.now()
        });
      }
      setShowAddModal(false);
      setEditingPlan(null);
      resetForm();
    } catch (e) {
      console.error(e);
      alert('Failed to save plan. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Permanently purge this protocol plan from the matrix?')) {
      await deleteDoc(doc(db, 'plans', id));
    }
  };

  const openEdit = (plan: SubscriptionPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlan(plan);
    setNewPlan({ ...plan });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setNewPlan({
      name: '',
      description: '',
      price: 0,
      duration: 30,
      durationUnit: 'days',
      buildLimit: 100,
      features: [''],
      isPopular: false
    });
  };

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!profile) return;

    // Check if user has enough balance
    const currentBalance = profile.balance || 0;

    if (currentBalance >= plan.price) {
      if (confirm(`Authorize usage of ₹${plan.price.toLocaleString()} from your matrix balance for ${plan.name}?`)) {
        setIsSubmitting(true);
        try {
          const batch = writeBatch(db);
          
          // 1. Update User Balance and Limits
          const userRef = doc(db, 'users', profile.uid);
          batch.update(userRef, {
            balance: currentBalance - plan.price,
            totalBuildLimit: (profile.totalBuildLimit || 0) + plan.buildLimit
          });

          // 2. Record Transaction
          const txRef = doc(collection(db, 'transactions'));
          const transaction: Transaction = {
            id: txRef.id,
            userId: profile.uid,
            amount: -plan.price,
            type: 'purchase',
            description: `Purchased Protocol: ${plan.name}`,
            createdAt: Date.now()
          };
          batch.set(txRef, transaction);

          await batch.commit();
          alert(`Protocol ${plan.name} successfully integrated into your cluster.`);
        } catch (err) {
          console.error(err);
          alert('Matrix authorization failed. Check logs.');
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      // Fallback to Telegram if balance is insufficient
      const tgId = systemConfig?.telegramId || 'admin';
      const message = encodeURIComponent(
        `Hello! I want to purchase the *${plan.name}* plan.\n\n` +
        `Current Balance: ₹${currentBalance}\n` +
        `Price: ₹${plan.price}\n` +
        `Needed Top-up: ₹${plan.price - currentBalance}\n\n` +
        `My Email: ${profile?.email}\n` +
        `Please provide top-up instructions.`
      );
      window.open(`https://t.me/${tgId.replace('@', '')}?text=${message}`, '_blank');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between max-w-7xl mx-auto px-4">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
              <Sparkles size={12} /> Injection Packages
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              <Wallet size={12} /> ₹{(profile?.balance || 0).toLocaleString()}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white italic">
            Protocol <span className="text-blue-500">Shop</span>
          </h1>
          <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
            Select a protocol level to increase your SDK deployment capacity. 
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-3">
            {plans.length === 0 && (
              <button 
                onClick={bootstrapPlans}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-2xl bg-zinc-800 px-6 py-4 text-sm font-bold text-zinc-300 hover:text-white transition-all active:scale-95 border border-zinc-700"
              >
                <Database size={18} /> Bootstrap Defaults
              </button>
            )}
            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
            >
              <Plus size={18} /> Forge New Plan
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="font-display italic">Syncing Marketplace Data...</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-4">
          <AnimatePresence mode="popLayout">
            {plans.map((plan) => (
              <motion.div
                layout
                key={plan.id}
                whileHover={{ y: -5 }}
                className={`group relative flex flex-col rounded-[2.5rem] border p-8 transition-all ${
                  plan.isPopular 
                    ? 'border-blue-500/40 bg-blue-500/5 shadow-[0_0_40px_rgba(59,130,246,0.1)]' 
                    : 'border-zinc-900 bg-zinc-900/20 hover:border-zinc-800'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-[10px] font-bold text-white shadow-xl">
                    <Crown size={12} /> MOST OPTIMIZED
                  </div>
                )}

                {isAdmin && (
                  <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => openEdit(plan, e)}
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={(e) => handleDeletePlan(plan.id, e)}
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-display font-bold text-white italic mb-2">{plan.name}</h3>
                  <p className="text-zinc-500 text-xs min-h-[32px]">{plan.description}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-white italic">₹{plan.price.toLocaleString()}</span>
                  <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">/ {plan.durationUnit}</span>
                </div>

                <div className="flex-1 space-y-4 mb-10">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-zinc-800/50">
                    <LayoutGrid size={16} className="text-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Limit</span>
                      <span className="text-xs font-bold text-zinc-200">{plan.buildLimit.toLocaleString()} Builds</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-zinc-800/50">
                    <Clock size={16} className="text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Uptime</span>
                      <span className="text-xs font-bold text-zinc-200">{plan.duration} {plan.durationUnit}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    {plan.features?.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-zinc-400">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                          <Check size={10} strokeWidth={4} />
                        </div>
                        <span className="text-xs font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={isSubmitting}
                  className={`group flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                    plan.isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_10px_20px_rgba(37,99,235,0.2)]'
                      : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {(profile?.balance || 0) >= plan.price ? (
                    <>Authorize Acquisition <Check size={16} /></>
                  ) : (
                    <>Top-up Matrix <ArrowRightLeft size={16} /></>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {plans.length === 0 && !loading && (
            <div className="lg:col-span-3 p-20 text-center rounded-[3rem] border-2 border-dashed border-zinc-900 text-zinc-700 font-display italic text-2xl">
              Marketplace Offline: No Protocols available for forge
            </div>
          )}
        </div>
      )}

      {/* Admin Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setEditingPlan(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-[3rem] border border-zinc-800 bg-zinc-900 p-0 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-8 border-b border-zinc-800">
                <h2 className="text-2xl font-display font-bold text-white italic uppercase tracking-tight">
                  {editingPlan ? 'Reforge Matrix' : 'Forge New Plan'}
                </h2>
                <button onClick={() => { setShowAddModal(false); setEditingPlan(null); }} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Plan Name</label>
                    <input 
                      type="text" 
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                      className="w-full rounded-2xl bg-black px-4 py-3 text-sm text-white border border-zinc-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Price (INR)</label>
                    <input 
                      type="number" 
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({...newPlan, price: Number(e.target.value)})}
                      className="w-full rounded-2xl bg-black px-4 py-3 text-sm text-white border border-zinc-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Description</label>
                  <textarea 
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                    className="w-full rounded-2xl bg-black px-4 py-3 text-sm text-white border border-zinc-800 outline-none focus:border-blue-500 min-h-[80px]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Duration</label>
                    <input 
                      type="number" 
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan({...newPlan, duration: Number(e.target.value)})}
                      className="w-full rounded-2xl bg-black px-4 py-3 text-sm text-white border border-zinc-800 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Unit</label>
                    <select 
                      value={newPlan.durationUnit}
                      onChange={(e) => setNewPlan({...newPlan, durationUnit: e.target.value as any})}
                      className="w-full rounded-2xl bg-black px-4 py-3 text-sm text-white border border-zinc-800 outline-none focus:border-blue-500"
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Build Limit</label>
                    <input 
                      type="number" 
                      value={newPlan.buildLimit}
                      onChange={(e) => setNewPlan({...newPlan, buildLimit: Number(e.target.value)})}
                      className="w-full rounded-2xl bg-black px-4 py-3 text-sm text-white border border-zinc-800 outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Features</label>
                    <button 
                      onClick={() => setNewPlan({...newPlan, features: [...(newPlan.features || []), '']})}
                      className="text-[10px] font-bold text-blue-500 uppercase underline"
                    >
                      Add Point
                    </button>
                  </div>
                  {newPlan.features?.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        type="text" 
                        value={f}
                        onChange={(e) => {
                          const nf = [...(newPlan.features || [])];
                          nf[i] = e.target.value;
                          setNewPlan({...newPlan, features: nf});
                        }}
                        className="flex-1 rounded-xl bg-black px-4 py-2 text-xs text-white border border-zinc-800 outline-none"
                      />
                      <button 
                        onClick={() => {
                          const nf = newPlan.features?.filter((_, idx) => idx !== i);
                          setNewPlan({...newPlan, features: nf});
                        }}
                        className="p-2 text-zinc-600 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-black/40 cursor-pointer" onClick={() => setNewPlan({...newPlan, isPopular: !newPlan.isPopular})}>
                  <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${newPlan.isPopular ? 'bg-blue-600 border-blue-500' : 'bg-transparent border-zinc-700'}`}>
                    {newPlan.isPopular && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mark as Most Popular</span>
                </div>
              </div>

              <div className="p-8 border-t border-zinc-800">
                <button 
                  onClick={handleSavePlan}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Committing to Matrix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-16 rounded-[2.5rem] border border-blue-500/10 bg-blue-500/5 p-10 backdrop-blur-sm max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] text-white">
            <ShieldCheck size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-display font-bold text-white mb-2 italic">Custom Protocol Requirements?</h4>
            <p className="text-zinc-500 text-sm max-w-xl">
              If your operation requires more than what our standard packages offer, our engineers can weave a custom matrix for you. Reach out to discuss volume discounts and bespoke features.
            </p>
          </div>
          <button 
            onClick={() => window.open(`https://t.me/${systemConfig?.telegramId || 'admin'}`, '_blank')}
            className="rounded-2xl border border-blue-500/30 px-8 py-4 text-sm font-bold text-blue-500 hover:bg-blue-600/10 transition-all font-display italic"
          >
            Direct Frequency
          </button>
        </div>
      </div>
    </div>
  );
};
