import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Zap, Shield, Cpu, Globe, ArrowRight, Server, Boxes, ShieldAlert } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 -mr-40 -mt-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <Zap size={22} fill="currentColor" />
          </div>
          <span className="text-xl font-display font-bold tracking-widest uppercase">OneCore</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Protocols</a>
          <a href="#tech" className="hover:text-white transition-colors">Tech Stack</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </div>
        <Link 
          to="/login"
          className="px-6 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
        >
          Access Portal
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-8">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Core Status: Operational
          </div>
          <h1 className="text-5xl md:text-8xl font-display font-bold tracking-tighter mb-8 leading-tight italic">
            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Stealth</span> <br />
            AAR Virtualization.
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium">
            Deploy elite bytecode protection and dynamic AAR injection protocols. 
            The industry standard for undetectable SDK integration.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register"
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-blue-600 text-sm font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_40px_rgba(59,130,246,0.3)] group flex items-center justify-center gap-2"
            >
              Start Deployment <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features"
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center"
            >
              View Specs
            </a>
          </div>
        </motion.div>
      </section>

      {/* Grid Features */}
      <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Anti-Dump Protocol",
              desc: "Memory protection layers preventing runtime extraction and reverse engineering.",
              color: "text-blue-500"
            },
            {
              icon: Cpu,
              title: "ASM Virtualization",
              desc: "Obfuscate direct logic through our custom AAR virtualization matrix.",
              color: "text-emerald-500"
            },
            {
              icon: Globe,
              title: "Edge Delivery",
              desc: "Millisecond delivery of encrypted nodes via our global stealth network.",
              color: "text-purple-500"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-10 rounded-[3rem] border border-zinc-900 bg-zinc-950/40 backdrop-blur-xl hover:border-zinc-800 transition-all"
            >
              <div className={`mb-6 p-4 rounded-2xl bg-zinc-900 w-fit ${feature.color}`}>
                <feature.icon size={32} />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-6 border-t border-zinc-900 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-blue-500" />
            <span className="text-sm font-bold uppercase tracking-[0.3em] font-display">OneCore Protocols</span>
          </div>
          <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-[0.2em]">
            &copy; 2026 Stealth Systems Nexus. All rights reserved.
          </p>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
