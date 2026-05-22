import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProfileCompletionBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [completion, setCompletion] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const score = data.profileCompletion || data.profileCompleteness || 0;
            
            setCompletion((prevScore) => {
              // Celebrate if moving past 80%
              if (prevScore !== null && prevScore < 80 && score >= 80) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 5000);
              }
              return score;
            });
          } else {
            setCompletion(0);
          }
          setUserLoaded(true);
        }, (err) => {
          console.warn("Banner listener blocked or missing profile doc:", err);
          setCompletion(0);
          setUserLoaded(true);
        });
      } else {
        setCompletion(null);
        setUserLoaded(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsub();
    };
  }, []);

  // Hide on onboarding, login, signup pages
  const isExcludedPage = ['/onboarding', '/login', '/signup'].includes(location.pathname);
  if (isExcludedPage || completion === null || !userLoaded) return null;

  // Render celebration banner
  if (showCelebration) {
    return (
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-6 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md relative z-40 overflow-hidden"
      >
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>{t('marketplace_unlocked_celebration') || 'Marketplace ochildi! Tabriklaymiz! 🎉'}</span>
      </motion.div>
    );
  }

  // 100% complete means nothing to show
  if (completion >= 100) return null;

  const remaining = 80 - completion;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="w-full bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-fuchsia-600/90 backdrop-blur-md text-white py-3 px-6 shadow-lg border-b border-white/10 relative z-30 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px] pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="p-1.5 rounded-lg bg-white/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-[11px] md:text-xs font-black uppercase tracking-wider">
              {completion >= 80 
                ? (t('profile_complete_nice') || 'Ajoyib! Profilingiz 80% dan yuqori to\'ldirilgan')
                : `${t('profile_at') || 'Profilingiz'} ${completion}% ${t('filled') || 'to\'ldirilgan'} — ${t('remaining_is') || 'yana'} ${remaining}% ${t('needed_for_marketplace') || 'kerak (80% gacha)'}`
              }
            </p>
            
            {/* Interactive Progress Bar */}
            <div className="w-48 h-1.5 bg-white/20 rounded-full mt-1.5 overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-yellow-300 to-green-400 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(completion, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto justify-end">
          <Button
            size="sm"
            onClick={() => navigate('/onboarding')}
            className="bg-white text-purple-700 hover:bg-white/90 text-[10px] font-black uppercase tracking-widest gap-1.5 h-8 px-4 rounded-lg shadow-sm cursor-pointer"
          >
            {t('continue_setup') || 'Davom etish'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
