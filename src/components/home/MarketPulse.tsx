import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { TrendingUp, ShieldCheck, Zap, Clock, Users, Briefcase, DollarSign } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface MarketPulseProps {
  isPremium?: boolean;
}

export function MarketPulse({ isPremium = false }: MarketPulseProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalUsers: 0,
    totalJobs: 0
  });

  useEffect(() => {
    // 1. Listen for real recent jobs
    const qJobs = query(
      collection(db, 'jobs'),
      orderBy('created_at', 'desc'),
    );

    const unsubJobs = onSnapshot(qJobs, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentJobs(docs.slice(0, 3));
      
      let total = 0;
      snap.forEach(doc => {
        total += (doc.data().budget || 0);
      });
      setStats(prev => ({ ...prev, totalVolume: total, totalJobs: snap.size }));
    });

    // 2. Fetch users count
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
    });

    return () => {
      unsubJobs();
      unsubUsers();
    };
  }, []);

  return (
    <div className={`w-full max-w-2xl rounded-[2rem] liquid-glass border-indigo-900/10 bg-white/20 p-8 overflow-hidden shadow-2xl relative ${!isPremium ? 'cursor-pointer' : ''}`}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] -mr-20 -mt-20" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-950 opacity-40">{t('live_pulse')}</span>
        </div>
        <div className="flex gap-3">
          <div className="px-3 py-1 rounded-lg bg-indigo-950/5 text-[9px] font-bold text-indigo-900/40 uppercase tracking-widest border border-indigo-900/5">{t('primary_node')}</div>
          <div className="w-10 h-1.5 bg-primary/20 rounded-full my-auto" />
        </div>
      </div>
      
      <div className="space-y-5 relative">
        {!isPremium && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-[1.5rem] border border-white/40 group">
             <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7 text-primary" />
             </div>
             <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-950 mb-2">{t('premium_exclusive')}</p>
             <p className="text-[10px] text-indigo-900/40 font-medium max-w-[180px] text-center">{t('premium_exclusive_desc')}</p>
          </div>
        )}

        {/* AI Match Algorithm / Recent Job */}
        <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/40 border border-white/60 hover:border-primary/30 transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/5 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-950 uppercase tracking-widest mb-1">{t('total_economy')}</div>
              <div className="text-[10px] text-indigo-900/40 font-bold uppercase tracking-tight flex items-center gap-1">
                 <Clock className="w-3 h-3" /> {t('live_calc')}
              </div>
            </div>
          </div>
          <div className="text-right relative z-10">
             <div className="text-xs font-mono font-black text-primary tracking-wider">+${stats.totalVolume.toLocaleString()}</div>
             <div className="text-[9px] font-bold text-indigo-900/20 uppercase">{t('total_liquidity')}</div>
          </div>
        </div>

        {/* Global Payout Node */}
        <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/40 border border-white/60 hover:border-primary/30 transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/5 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-950 uppercase tracking-widest mb-1">{t('registered_users')}</div>
              <div className="text-[10px] text-indigo-900/40 font-bold uppercase tracking-tight flex items-center gap-1">
                 <Clock className="w-3 h-3" /> {t('realtime_node')}
              </div>
            </div>
          </div>
          <div className="text-right relative z-10">
             <div className="text-xs font-mono font-black text-emerald-500 tracking-wider">{stats.totalUsers}</div>
             <div className="text-[9px] font-bold text-indigo-900/20 uppercase">{t('verified_accounts')}</div>
          </div>
        </div>

        {/* Asset Sync / Recent Activity */}
        <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/40 border border-white/60 hover:border-primary/30 transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/5 group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-950 uppercase tracking-widest mb-1">{t('platform_jobs')}</div>
              <div className="text-[10px] text-indigo-900/40 font-bold uppercase tracking-tight flex items-center gap-1">
                 <Clock className="w-3 h-3" /> {t('live_sync')}
              </div>
            </div>
          </div>
          <div className="text-right relative z-10">
             <div className="text-xs font-mono font-black text-amber-500 tracking-wider">{stats.totalJobs}</div>
             <div className="text-[9px] font-bold text-indigo-900/20 uppercase">{t('active_postings')}</div>
          </div>
        </div>
        
        <div className="pt-6 flex justify-center">
          <motion.button 
            onClick={() => {
              if (isPremium) {
                navigate('/jobs');
              }
            }}
            animate={isPremium ? { scale: [1, 1.05, 1], rotateZ: [0, 1, -1, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl transition-all duration-500 outline-none ${
              isPremium ? 'bg-primary text-white shadow-primary/30 cursor-pointer hover:brightness-110' : 'bg-indigo-950/20 text-indigo-950/40 border border-indigo-950/5 cursor-default'
            }`}
          >
            {isPremium ? t('opportunity_mapped') : t('signal_encrypted')}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
