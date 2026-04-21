import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Upload, CheckCircle2, ShieldCheck, FileText, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'plans' | 'payment' | 'verifying' | 'success'>('plans');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time profile listener for the modal
  React.useEffect(() => {
    if (!isOpen || !auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
    });
    return () => unsub();
  }, [isOpen]);

  const isPremium = profile?.is_premium;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('error_image_size'));
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast.error(t('login_to_apply'));
      return;
    }

    if (!selectedFile) {
      toast.error(t('select_receipt'));
      return;
    }

    setLoading(true);
    setStep('verifying');

    try {
      // Encode image to highly compressed base64
      const optimizePromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const receiptBase64 = await optimizePromise;

      // 1. Save request to Firestore
      await addDoc(collection(db, 'premium_requests'), {
        user_id: auth.currentUser.uid,
        user_name: profile?.full_name || auth.currentUser.displayName || 'User',
        user_email: auth.currentUser.email,
        receipt_name: selectedFile.name,
        receipt_url: receiptBase64,
        status: 'pending',
        created_at: new Date().toISOString(),
        is_auto_verified: false
      });

      // 2. Set user status to pending in their profile
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        premium_status: 'pending'
      });

      // 3. Simulated Verification Progress
      await new Promise(resolve => setTimeout(resolve, 4000));

      setStep('success');
      toast.success(t('payment_submitted'));
    } catch (error) {
      console.error('Error requesting premium:', error);
      toast.error(t('upgrade_error'));
      setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg liquid-glass p-6 md:p-8 rounded-[2rem] border-white/20 relative z-10 overflow-hidden shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]"
          >
            {/* Improved Fix for Close Button: Absolute positioned with high z-index and larger hit area */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>

            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] -mr-32 -mt-32" />
            
            <div className="mb-6 pr-10">
              <h2 className="text-2xl md:text-3xl font-display font-bold glow-text leading-tight">WorkTime Premium</h2>
              <p className="text-white/40 text-xs md:text-sm mt-1 font-medium tracking-tight">Unlock the full potential of your career ecosystem.</p>
            </div>

            {step === 'plans' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-6 rounded-[1.5rem] border transition-all group relative overflow-hidden ${
                    !isPremium ? 'bg-primary/5 border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/5 border-white/10 opacity-60'
                  }`}>
                    {!isPremium && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-primary/20 text-primary text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full border border-primary/20 shadow-sm animate-pulse uppercase">
                          {t('current_plan')}
                        </div>
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-4 text-white/90">{t('free_plan')}</h3>
                    <ul className="space-y-3 text-white/50 text-xs text-sharp">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500/50" /> {t('limited_postings')}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500/50" /> {t('limited_apps')}</li>
                    </ul>
                    <div className="mt-6">
                       {!isPremium ? (
                         <div className="w-full h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-white/40 font-bold uppercase tracking-widest text-[9px]">
                           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                           {t('current_plan')}
                         </div>
                       ) : (
                         <Button variant="outline" className="w-full h-10 rounded-xl border-white/10 bg-white/5 opacity-50" disabled>
                           {t('free_plan')}
                         </Button>
                       )}
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-[1.5rem] border relative overflow-hidden group transition-all duration-500 ${
                    isPremium ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/10'
                  }`}>
                    {isPremium ? (
                      <div className="absolute top-3 right-3">
                        <div className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-widest px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse uppercase">
                          {t('current_plan')}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary text-white shadow-lg animate-pulse uppercase tracking-[0.2em]">{t('best_value')}</Badge>
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-4 text-white">{t('premium_plan')}</h3>
                    <ul className="space-y-3 text-white/80 text-xs text-sharp">
                      <li className="flex items-center gap-2"><CheckCircle2 className={`w-4 h-4 ${isPremium ? 'text-emerald-400' : 'text-white'}`} /> {t('unlimited_postings')}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className={`w-4 h-4 ${isPremium ? 'text-emerald-400' : 'text-white'}`} /> {t('unlimited_apps')}</li>
                    </ul>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">$1</span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('month')}</span>
                    </div>
                    
                    <div className="mt-4">
                      {isPremium ? (
                        <motion.div 
                          whileHover={{ scale: 1.02, backgroundColor: "rgba(16,185,129,0.2)", borderColor: "rgba(16,185,129,0.5)" }}
                          className="w-full h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] text-[10px] shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] cursor-default transition-colors hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        >
                          <PartyPopper className="w-4 h-4 animate-bounce" />
                          {t('active_plan')}
                        </motion.div>
                      ) : (
                        <Button onClick={() => setStep('payment')} className="w-full h-10 bg-white text-primary hover:bg-white/90 rounded-xl font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-[11px]">
                          {t('upgrade_now')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : step === 'payment' ? (
              <form onSubmit={handleUpgrade} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  {/* Visual Payment Card */}
                  <div className="relative h-44 w-full rounded-[1.5rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-6 md:p-8 text-white shadow-2xl overflow-hidden group border border-white/20">
                    <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-[70px] -mr-22 -mt-22 group-hover:bg-white/20 transition-all duration-1000" />
                    <div className="absolute bottom-0 left-0 w-36 h-36 bg-primary/20 rounded-full blur-[70px] -ml-18 -mb-18" />
                    
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <CreditCard className="w-8 h-8 mb-2 opacity-90" />
                          <div className="text-[8px] tracking-[0.3em] font-black opacity-50 uppercase">Payment Node</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold tracking-tight opacity-80">WorkTime Ecosystem</div>
                          <div className="text-[7px] opacity-40 uppercase tracking-widest font-black">Official Merchant</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-2xl md:text-3xl font-mono tracking-[0.2em] mb-2 shadow-sm text-center md:text-left font-black">
                          8600 4904 0123 4567
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[8px] opacity-40 uppercase tracking-widest font-black mb-1 text-sharp">Account Holder</span>
                            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase truncate max-w-[180px] text-sharp">Abdulxay Avazxanov</span>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-[8px] opacity-40 uppercase tracking-widest font-black mb-1 text-sharp">Network</span>
                             <span className="text-[10px] font-black tracking-widest text-sharp">UZCARD / HUMO</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-950/20 rounded-xl border border-indigo-500/20 flex items-start gap-3">
                     <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                     </div>
                     <p className="text-[11px] text-indigo-200/60 leading-relaxed font-medium">
                       {t('payment_instr')}
                     </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">{t('proof_label')}</Label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer group rounded-[1.5rem] border-2 border-dashed transition-all p-6 flex flex-col items-center justify-center gap-3 ${
                      selectedFile ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-primary/30 hover:bg-white/5'
                    }`}
                  >
                    {previewUrl ? (
                      <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-black/40">
                         <img src={previewUrl} alt="Receipt" className="h-full w-full object-contain" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-white text-primary px-3 py-1.5 rounded-lg">Change File</span>
                         </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-center space-y-0.5">
                          <p className="text-xs font-bold text-white/80">{t('drop_receipt')}</p>
                          <p className="text-[9px] text-white/20 uppercase tracking-tighter">PNG, JPG (Max 5MB)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setStep('plans')} className="flex-1 h-11 md:h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs">
                    {t('back')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !selectedFile} 
                    className="flex-1 h-11 md:h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase tracking-[0.15em] shadow-xl shadow-primary/20 text-xs"
                  >
                    {loading ? t('processing') : t('confirm_payment')}
                  </Button>
                </div>
              </form>
            ) : step === 'verifying' ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full" />
                   <Loader2 className="w-24 h-24 text-primary animate-spin-slow relative z-10" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black uppercase tracking-[0.3em] glow-text">{t('verifying_payment')}</h3>
                  <p className="text-white/40 font-medium max-w-sm mx-auto">{t('analyzing_receipt')}</p>
                </div>
                <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: "100%" }}
                     transition={{ duration: 3.5, ease: "easeInOut" }}
                     className="h-full bg-primary"
                   />
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-500">
                <div className="relative">
                   <div className="absolute inset-0 bg-emerald-500/30 blur-[80px] rounded-full animate-pulse" />
                   <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center shadow-2xl relative z-10">
                      <PartyPopper className="w-12 h-12 text-white animate-bounce" />
                   </div>
                </div>
                <div className="space-y-3 relative z-10">
                   <h3 className="text-4xl font-black uppercase tracking-[0.2em] text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">{t('payment_sent_msg')}</h3>
                   <p className="text-white/40 font-medium">{t('payment_submitted')}</p>
                </div>
                <Button onClick={onClose} className="px-12 h-16 bg-white text-indigo-950 font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-xl hover:scale-105 transition-all">
                   Go to Dashboard
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}

