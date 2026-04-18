import * as React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
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
      console.error('Google Auth Full Error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error(t('popup_closed'));
      } else {
        toast.error(t('google_error') + (error.message || 'Error'));
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
    <div className="min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
      <div className="bg-blob w-[400px] h-[400px] bg-primary/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
        animate={isExiting ? { 
          opacity: 0, 
          scale: 1.2, 
          rotateX: -20, 
          filter: 'blur(20px)',
          y: -50
        } : { 
          opacity: 1, 
          scale: 1, 
          rotateX: 0,
          y: 0 
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass p-8 rounded-3xl border-white/10 relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold mb-2">
            {mode === 'login' ? t('login') : t('signup')}
          </h2>
          <p className="text-white/50">
            {mode === 'login' ? t('auth_login_subtitle') : t('auth_signup_subtitle')}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <Button 
            type="button"
            variant="ghost" 
            className="w-full glass border-white/10 hover:bg-white/10 h-14 text-lg font-medium relative group overflow-hidden"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="mr-3 w-6 h-6 relative z-10" alt="Google" />
            <span className="relative z-10">{t("auth_google")}</span>
          </Button>

          <Button 
            type="button"
            variant="ghost" 
            className="w-full glass border-white/10 hover:bg-white/10 h-14 text-lg font-medium relative group overflow-hidden"
            onClick={handleAppleSignIn}
            disabled={loading}
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <svg viewBox="0 0 384 512" className="mr-3 w-5 h-5 fill-current relative z-10">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-48.7-20.7-82.6-20.7-43.4.6-83.3 25.9-105.6 64.7-44.5 77-11.4 190.6 31.5 252.5 21 30.2 46.1 63.9 77.7 62.7 30.7-1.1 42.4-19.6 79.7-19.6 37.1 0 48.3 19.6 80.2 18.9 32.2-1.1 54.2-30.2 75-60.6 24.1-35.2 33.9-69.4 34.2-71.1-.7-.3-66.5-25.5-66.7-103.1zM285.4 92.1c16.1-20.1 27-48.1 24-76.1-23.1 1-52.1 16.1-68.7 34.1-15 16.1-28.1 44.1-25.1 72.1 26.1 2 53.7-11 69.8-30.1z"/>
            </svg>
            <span className="relative z-10">{t("auth_apple")}</span>
          </Button>
        </div>

        <div className="relative mb-8 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative px-4 bg-[#0a0a1a] text-sm text-white/30 uppercase tracking-widest font-medium">{t("auth_or_email")}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">{t("full_name")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary transition-colors"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("i_want_to")}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('freelancer')}
                    className={`p-3 rounded-xl border transition-all text-sm font-medium ${role === 'freelancer' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                  >
                    {t("freelancer_role")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`p-3 rounded-xl border transition-all text-sm font-medium ${role === 'client' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                  >
                    {t("hire_role")}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t("email_address")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/80 text-lg font-medium group" disabled={loading}>
            {loading ? t('processing') : mode === 'login' ? t('login') : t('signup')}
            {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/50">
            {mode === 'login' ? t('no_account') : t('have_account')}{' '}
            <Link to={mode === 'login' ? '/signup' : '/login'} className="text-primary hover:underline font-medium">
              {mode === 'login' ? t('signup') : t('login')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
