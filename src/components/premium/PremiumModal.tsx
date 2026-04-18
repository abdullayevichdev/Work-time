import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Upload, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [step, setStep] = useState<'plans' | 'payment'>('plans');

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'premium_requests'), {
        user_id: auth.currentUser.uid,
        user_name: auth.currentUser.displayName || 'User',
        user_email: auth.currentUser.email,
        proof_url: proofUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      toast.success(t('upgrade_success'));
      onClose();
    } catch (error) {
      console.error('Error requesting premium:', error);
      toast.error(t('upgrade_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl glass p-8 rounded-3xl border-white/10 relative z-10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl -mr-32 -mt-32" />
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-display font-bold glow-text">WorkTime Premium</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {step === 'plans' ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-xl font-bold mb-4">{t('free_plan')}</h3>
                    <ul className="space-y-3 text-white/60 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t('limited_postings')}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t('limited_apps')}</li>
                      <li className="flex items-center gap-2 text-white/20"><X className="w-4 h-4" /> {t('priority_visibility')}</li>
                      <li className="flex items-center gap-2 text-white/20"><X className="w-4 h-4" /> {t('premium_badge')}</li>
                    </ul>
                    <Button variant="outline" className="w-full mt-6 border-white/10" disabled>{t('current_plan')}</Button>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-primary/10 border border-primary/30 relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary text-white">{t('best_value')}</Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-4">{t('premium_plan')}</h3>
                    <ul className="space-y-3 text-white/80 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> {t('unlimited_postings')}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> {t('unlimited_apps')}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> {t('higher_visibility')}</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> {t('priority_support')}</li>
                    </ul>
                    <p className="mt-6 text-2xl font-bold">$19.99 <span className="text-sm font-normal text-white/50">{t('month')}</span></p>
                    <Button onClick={() => setStep('payment')} className="w-full mt-4 bg-primary hover:bg-primary/80">{t('upgrade_now')}</Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpgrade} className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    <h3 className="font-bold">{t('secure_payment')}</h3>
                  </div>
                  <p className="text-sm text-white/60">
                    {t('payment_instr')}
                  </p>
                  <div className="p-3 bg-black/40 rounded-lg font-mono text-xs break-all border border-white/5">
                    0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof">{t('proof_label')}</Label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="proof"
                      placeholder="https://etherscan.io/tx/..."
                      className="pl-10 bg-white/5 border-white/10 focus:border-primary"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-white/30">{t('proof_hint')}</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setStep('plans')} className="flex-1 border border-white/10">
                    {t('back')}
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/80">
                    {loading ? t('submitting') : t('confirm_payment')}
                  </Button>
                </div>
              </form>
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
