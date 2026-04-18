import * as React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface AuthPageProps {
  mode: 'login' | 'signup';
}

export function AuthPage({ mode }: AuthPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');

  const handleSuccess = (destination: string) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(destination);
    }, 600); // Duration matches animation
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Increased delay for auth state to propagate to all Firestore nodes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const user = result.user;
      console.log('User signed in:', user.uid);

      // Check if user document exists using getDocFromServer to bypass cache
      let userDoc;
      try {
        userDoc = await getDocFromServer(doc(db, 'users', user.uid));
      } catch (e) {
        console.warn('getDocFromServer failed, trying regular getDoc', e);
        try {
          userDoc = await getDoc(doc(db, 'users', user.uid));
        } catch (e2) {
          handleFirestoreError(e2, OperationType.GET, `users/${user.uid}`);
        }
      }
      
      if (!userDoc?.exists()) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            full_name: user.displayName || 'Google User',
            email: user.email,
            role: 'freelancer',
            is_premium: false,
            created_at: new Date().toISOString(),
            photo_url: user.photoURL || '',
            is_new_user: true
          }, { merge: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
        }
        toast.success(t('welcome_profile'));
        handleSuccess('/profile');
        return;
      }

      toast.success(t('google_success'));
      handleSuccess('/dashboard');
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      
      const currentDomain = window.location.hostname;
      const errorCode = error.code;
      
      if (errorCode === 'auth/popup-closed-by-user') {
        toast.error(t('popup_closed'), {
          description: t('popup_closed_desc'),
          duration: 6000,
        });
      } else if (errorCode === 'auth/unauthorized-domain') {
        toast.error(t('unauthorized_domain'), {
          description: `${t('unauthorized_domain_desc')}: ${currentDomain}`,
          duration: 10000,
        });
        console.error(`Firebase error: Add "${currentDomain}" to your Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else if (errorCode === 'auth/cancelled-popup-request') {
        // Just ignore if another popup was opened
      } else {
        toast.error(t('google_error') + (error.message || errorCode));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    toast.info('Apple sign-in is in development');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        await setDoc(doc(db, 'users', user.uid), {
          full_name: name,
          email: email,
          role: role,
          is_premium: false,
          created_at: new Date().toISOString()
        });

        toast.success(t('signup_success'));
        handleSuccess('/dashboard');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success(t('login_success'));
        handleSuccess('/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = t('error_generic');
      if (error.code === 'auth/user-not-found') message = t('error_user_not_found');
      if (error.code === 'auth/wrong-password') message = t('error_wrong_password');
      if (error.code === 'auth/email-already-in-use') {
        message = t('error_email_in_use');
        toast.error(message, {
          action: {
            label: t('login'),
            onClick: () => navigate('/login')
          }
        });
        setLoading(false);
        return;
      }
      if (error.code === 'auth/invalid-email') message = t('error_invalid_email');
      if (error.code === 'auth/weak-password') message = t('error_weak_password');
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 pt-24 md:pt-28 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Side: Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isExiting ? { 
            opacity: 0, 
            scale: 0.9,
            filter: 'blur(20px)',
            transition: { duration: 0.5 }
          } : { 
            opacity: 1, 
            x: 0 
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md mx-auto lg:mx-0"
        >
          <div className="glass p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16" />
            
            <div className="mb-8 sm:mb-10 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3 tracking-tight">
                {mode === 'login' ? t('login') : t('signup')}
              </h2>
              <p className="text-white/50 text-lg">
                {mode === 'login' ? t('auth_login_subtitle') : t('auth_signup_subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <Button 
                type="button"
                variant="ghost" 
                className="glass border-white/10 hover:bg-white/10 h-14 relative group overflow-hidden rounded-2xl"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
              </Button>

              <Button 
                type="button"
                variant="ghost" 
                className="glass border-white/10 hover:bg-white/10 h-14 relative group overflow-hidden rounded-2xl"
                onClick={handleAppleSignIn}
                disabled={loading}
              >
                <svg viewBox="0 0 384 512" className="w-5 h-5 fill-current">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-48.7-20.7-82.6-20.7-43.4.6-83.3 25.9-105.6 64.7-44.5 77-11.4 190.6 31.5 252.5 21 30.2 46.1 63.9 77.7 62.7 30.7-1.1 42.4-19.6 79.7-19.6 37.1 0 48.3 19.6 80.2 18.9 32.2-1.1 54.2-30.2 75-60.6 24.1-35.2 33.9-69.4 34.2-71.1-.7-.3-66.5-25.5-66.7-103.1zM285.4 92.1c16.1-20.1 27-48.1 24-76.1-23.1 1-52.1 16.1-68.7 34.1-15 16.1-28.1 44.1-25.1 72.1 26.1 2 53.7-11 69.8-30.1z"/>
                </svg>
              </Button>
            </div>

            <div className="relative mb-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">{t("auth_or_email")}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-white/50">{t("full_name")}</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Abdulxay Avazxanov"
                        className="pl-11 h-13 bg-white/5 border-white/10 focus:border-primary rounded-xl transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-white/50">{t("i_want_to")}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('freelancer')}
                        className={`p-4 rounded-xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2 ${role === 'freelancer' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                      >
                        <User className="w-5 h-5" />
                        {t("freelancer_role")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('client')}
                        className={`p-4 rounded-xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2 ${role === 'client' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                      >
                        <Briefcase className="w-5 h-5" />
                        {t("hire_role")}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-white/50">{t("email_address")}</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-11 h-13 bg-white/5 border-white/10 focus:border-primary rounded-xl transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-white/50">{t("password")}</Label>
                  {mode === 'login' && (
                    <button type="button" className="text-[10px] font-bold text-primary hover:underline">{t('forgot_password')}</button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-13 bg-white/5 border-white/10 focus:border-primary rounded-xl transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.5)] group" disabled={loading}>
                {loading ? t('processing') : mode === 'login' ? t('login') : t('signup')}
                {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-white/40 text-sm">
                {mode === 'login' ? t('no_account') : t('have_account')}{' '}
                <Link to={mode === 'login' ? '/signup' : '/login'} className="text-primary hover:text-primary/80 font-bold transition-colors">
                  {mode === 'login' ? t('signup') : t('login')}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Visual Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:block space-y-8"
        >
          <div className="relative aspect-square rounded-[3rem] overflow-hidden glass border-white/10 group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/60 to-transparent z-10 opacity-70" />
            <img 
              src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=1200" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]"
              alt="WorkTime Auth Visual"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 z-0" />
            
            <div className="absolute inset-x-8 bottom-12 z-20 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-black uppercase tracking-[0.2em]">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {t('future_of_work')}
              </div>
              <h1 className="text-5xl font-display font-bold text-white leading-tight drop-shadow-2xl">
                {mode === 'signup' ? t('auth_signup_cta') : t('auth_login_cta')}
              </h1>
              <p className="text-lg text-white/80 font-medium leading-relaxed max-w-sm drop-shadow-lg">
                {t('auth_description')}
              </p>
              
              <div className="flex items-center gap-10 pt-4 border-t border-white/10">
                <div className="text-center md:text-left">
                  <p className="text-2xl font-black text-white">50k+</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">{t('active_talents')}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-2xl font-black text-white">100k+</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">{t('jobs_posted')}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
