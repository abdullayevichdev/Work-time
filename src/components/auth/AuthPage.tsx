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
  const [role, setRole] = useState<'job_seeker' | 'employer'>('job_seeker');

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
      const user = result.user;
      
      // Give Firestore a moment to establish connection with the new auth state
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('User signed in:', user.uid);

      // Robust check for user document existence with a small retry loop
      let userDoc = null;
      let checkAttempts = 0;
      const maxAttempts = 3;

      while (checkAttempts < maxAttempts && !userDoc) {
        try {
          // Priority 1: Try server fetch for latest data
          if (checkAttempts === 0) {
            userDoc = await getDocFromServer(doc(db, 'users', user.uid));
          } else {
            // Priority 2: Regular getDoc (can use cache if network is struggling)
            userDoc = await getDoc(doc(db, 'users', user.uid));
          }
        } catch (e: any) {
          console.warn(`Initial profile check attempt ${checkAttempts + 1} failed:`, e.message);
          checkAttempts++;
          if (checkAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, checkAttempts === 1 ? 1500 : 3000));
          } else {
            // Final attempt failed, handle via error logic
            handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
            return;
          }
        }
      }
      
      if (!userDoc?.exists()) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            full_name: user.displayName || 'User',
            email: user.email,
            role: 'job_seeker',
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
      
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/popup-blocked') {
        toast.error(t('popup_closed'), {
          description: t('popup_closed_desc'),
          duration: 8000,
          action: {
            label: "New Tab",
            onClick: () => window.open(window.location.href, '_blank')
          }
        });
      } else if (errorCode === 'auth/unauthorized-domain') {
        toast.error(t('unauthorized_domain'), {
          description: `${t('unauthorized_domain_desc')}: ${currentDomain}`,
          duration: 10000,
        });
        console.error(`Firebase error: Add "${currentDomain}" to your Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else if (errorCode === 'auth/cancelled-popup-request') {
        // Just ignore if another popup was opened
      } else if (errorCode === 'auth/network-request-failed') {
        toast.error(t('network_error'), {
          description: "Tarmoq xatosi yoki brauzer pop-upni blokladi. Iltimos, saytni yangi oynada ochib ko'ring (New Tab) yoki internetni tekshiring.",
          duration: 10000,
          action: {
            label: "New Tab",
            onClick: () => window.open(window.location.href, '_blank')
          }
        });
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
        handleSuccess('/profile');
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
      if (error.code === 'auth/operation-not-allowed') {
        message = "Email/Parol orqali kirish o'chirilgan. Iltimos, Firebase Console -> Authentication -> Sign-in method bo'limidan buni yoqing.";
      }
      
      toast.error(message, { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 pt-24 md:pt-28 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/10 blur-[80px] md:blur-[120px] rounded-full animate-pulse pointer-events-none" />
      
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
          <div className="liquid-glass p-5 sm:p-10 rounded-[2.5rem] border-white/10 shadow-2xl relative group">
            <div className="specular-glow opacity-30" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] -mr-24 -mt-24 pointer-events-none" />
            
            <div className="mb-8 sm:mb-12 text-center lg:text-left relative z-10">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3 tracking-tighter text-sharp">
                {mode === 'login' ? t('login') : t('signup')}
              </h2>
              <p className="text-indigo-950/40 text-lg font-light text-sharp">
                {mode === 'login' ? t('auth_login_subtitle') : t('auth_signup_subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
              <Button 
                type="button"
                variant="ghost" 
                className="liquid-glass border-white/10 hover:bg-white/10 h-11 md:h-14 relative group overflow-hidden rounded-2xl transition-all hover:scale-105 active:scale-95"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <div className="specular-glow opacity-20" />
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 md:w-6 md:h-6" alt="Google" />
              </Button>

              <Button 
                type="button"
                variant="ghost" 
                className="liquid-glass border-white/10 hover:bg-white/10 h-11 md:h-14 relative group overflow-hidden rounded-2xl transition-all hover:scale-105 active:scale-95"
                onClick={handleAppleSignIn}
                disabled={loading}
              >
                <div className="specular-glow opacity-20" />
                <svg viewBox="0 0 384 512" className="w-4 h-4 md:w-5 md:h-5 fill-current text-white">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-48.7-20.7-82.6-20.7-43.4.6-83.3 25.9-105.6 64.7-44.5 77-11.4 190.6 31.5 252.5 21 30.2 46.1 63.9 77.7 62.7 30.7-1.1 42.4-19.6 79.7-19.6 37.1 0 48.3 19.6 80.2 18.9 32.2-1.1 54.2-30.2 75-60.6 24.1-35.2 33.9-69.4 34.2-71.1-.7-.3-66.5-25.5-66.7-103.1zM285.4 92.1c16.1-20.1 27-48.1 24-76.1-23.1 1-52.1 16.1-68.7 34.1-15 16.1-28.1 44.1-25.1 72.1 26.1 2 53.7-11 69.8-30.1z"/>
                </svg>
              </Button>
            </div>

            <div className="relative mb-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-indigo-900/5" />
              <span className="text-[10px] text-indigo-900/20 uppercase tracking-[0.2em] font-bold text-sharp">{t("auth_or_email")}</span>
              <div className="flex-1 h-px bg-indigo-900/5" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-indigo-900/40 text-sharp">{t("full_name")}</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-900/30" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Abdulxay Avazxanov"
                        className="pl-11 h-13 bg-white/40 border-indigo-900/5 focus:border-primary rounded-xl transition-all text-indigo-950 placeholder:text-indigo-900/20"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-indigo-900/40 text-sharp">{t("i_want_to")}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('job_seeker')}
                        className={`p-4 rounded-xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2 ${role === 'job_seeker' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/40 border-indigo-900/5 text-indigo-900/40 hover:bg-white/60'}`}
                      >
                        <User className="w-5 h-5" />
                        {t("job_seekers")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('employer')}
                        className={`p-4 rounded-xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2 ${role === 'employer' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/40 border-indigo-900/5 text-indigo-900/40 hover:bg-white/60'}`}
                      >
                        <Briefcase className="w-5 h-5" />
                        {t("employers")}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-indigo-900/40 text-sharp">{t("email_address")}</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-900/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-11 h-13 bg-white/40 border-indigo-900/5 focus:border-primary rounded-xl transition-all text-indigo-950 placeholder:text-indigo-900/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-indigo-900/40 text-sharp">{t("password")}</Label>
                  {mode === 'login' && (
                    <button type="button" className="text-[10px] font-bold text-primary hover:underline text-sharp">{t('forgot_password')}</button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-900/30" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 h-13 bg-white/40 border-indigo-900/5 focus:border-primary rounded-xl transition-all text-indigo-950"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 md:h-14 bg-primary hover:bg-primary/90 text-sm md:text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.5)] group" disabled={loading}>
                {loading ? t('processing') : mode === 'login' ? t('login') : t('signup')}
                {!loading && <ArrowRight className="ml-2 w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-indigo-950/40 text-sm text-sharp">
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
          <div className="relative aspect-square rounded-[3rem] overflow-hidden liquid-glass border-white/10 group shadow-2xl">
            <div className="specular-glow opacity-40 z-30" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent z-10 opacity-70" />
            <img 
              src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=1200" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4000ms]"
              alt="WorkTime Auth Visual"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-x-8 bottom-12 z-20 space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full liquid-glass border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em]">
                <div className="specular-glow opacity-30" />
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-sharp">{t('future_of_work')}</span>
              </div>
              <h1 className="text-5xl font-display font-bold text-white leading-tight drop-shadow-2xl text-sharp">
                {mode === 'signup' ? t('auth_signup_cta') : t('auth_login_cta')}
              </h1>
              <p className="text-lg text-white/90 font-medium leading-relaxed max-w-sm drop-shadow-lg text-sharp">
                {t('auth_description')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
