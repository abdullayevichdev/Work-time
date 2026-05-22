import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RequireCompleteProfileProps {
  children: React.ReactNode;
}

export function RequireCompleteProfile({ children }: RequireCompleteProfileProps) {
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsub = () => {};
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCompletion(data.profileCompletion || data.profileCompleteness || 0);
          } else {
            setCompletion(0);
          }
          setLoading(false);
        }, (err) => {
          console.warn("RequireCompleteProfile blocked or snapshot error:", err);
          setCompletion(0);
          setLoading(false);
        });
      } else {
        setCompletion(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsub();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // If user is not logged in, let the regular page auth handler redirect them to login
  if (!auth.currentUser) {
    return <>{children}</>;
  }

  // Allow access to the onboarding and registration screens directly
  const isSetupPage = ['/onboarding', '/login', '/signup', '/'].includes(location.pathname);
  if (isSetupPage) {
    return <>{children}</>;
  }

  // Redirect if under 80% completion score
  if (completion !== null && completion < 80) {
    return (
      <div className="pt-32 pb-20 container mx-auto px-6 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="w-full max-w-md rounded-[2.5rem] glass border-white/10 p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-10 -mt-10" />
          
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
            <Lock className="w-8 h-8 text-primary animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-indigo-950">🔒 Marketplace Qulflangan</h2>
            <p className="text-xs text-indigo-950/60 max-w-xs mx-auto">
              Ish e'lonlarini va mutaxassislar profilini ko'rish uchun profilingizni kamida 80% to'ldirishingiz shart.
            </p>
          </div>

          <div className="p-5 bg-white/40 rounded-[1.5rem] border border-white/60">
            <span className="text-[10px] font-black uppercase text-indigo-950/40">Hozirgi holat:</span>
            <div className="text-2xl font-mono font-black text-primary my-1">{completion}%</div>
            <div className="w-full h-2 bg-indigo-950/5 rounded-full overflow-hidden border border-indigo-900/5 relative my-2">
              <div 
                className="h-full bg-gradient-to-r from-primary to-fuchsia-500 rounded-full" 
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-[10px] text-primary font-bold">yana {80 - completion}% to\'ldirishingiz kerak</span>
          </div>

          <Button
            onClick={() => navigate('/onboarding')}
            className="w-full bg-primary hover:bg-primary/95 text-white font-black text-xs uppercase tracking-widest gap-2 h-12 rounded-xl shadow-lg shadow-primary/20 cursor-pointer"
          >
            Profilingizni to\'ldiring
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
