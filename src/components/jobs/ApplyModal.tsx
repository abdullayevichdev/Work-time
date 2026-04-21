import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
}

export function ApplyModal({ isOpen, onClose, job }: ApplyModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bid_amount: '',
    estimated_days: '',
    cover_letter: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !job) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'proposals'), {
        job_id: job.id,
        client_id: job.client_id,
        freelancer_id: auth.currentUser.uid,
        freelancer_name: auth.currentUser.displayName || 'Anonymous',
        freelancer_avatar: auth.currentUser.photoURL || '',
        job_title: job.title,
        bid_amount: Number(formData.bid_amount),
        estimated_days: Number(formData.estimated_days),
        cover_letter: formData.cover_letter,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      toast.success(t('proposal_submitted'));
      onClose();
    } catch (error) {
      console.error('Error applying:', error);
      toast.error(t('error_submit_proposal'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && job && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          {/* Backdrop with sophisticated blur and soft light tint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-indigo-950/50 backdrop-blur-[90px] overflow-hidden"
          >
            {/* Even more powerful decorative glow behind modal to wash out background text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/40 rounded-full blur-[200px] opacity-50 mix-blend-soft-light" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="w-full max-w-xl liquid-glass p-6 md:p-10 rounded-[3rem] border-white/60 relative z-10 my-10 shadow-2xl"
          >
            {/* Top corner decorative light */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl md:text-3xl font-display font-bold text-indigo-950 text-sharp leading-tight"
                >
                  {t('submit_proposal')}
                </motion.h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-indigo-950/40 text-xs md:text-sm font-bold tracking-tight uppercase truncate max-w-[280px]">{job.title}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="hover:bg-white/60 rounded-full w-10 h-10 border border-transparent hover:border-white/40 transition-all"
              >
                <X className="w-5 h-5 text-indigo-950/40" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bid" className="text-[10px] uppercase font-black tracking-widest text-indigo-900/40 ml-1">{t('bid_amount_usd')}</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center border border-indigo-900/5 group-focus-within:border-primary/30 transition-all">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <Input
                      id="bid"
                      type="number"
                      placeholder="e.g. 500"
                      className="pl-14 bg-white/40 border-indigo-900/5 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 h-11 md:h-14 rounded-2xl text-indigo-950 font-bold transition-all text-lg"
                      value={formData.bid_amount}
                      onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days" className="text-[10px] uppercase font-black tracking-widest text-indigo-900/40 ml-1">{t('estimated_days_label')}</Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center border border-indigo-900/5 group-focus-within:border-primary/30 transition-all">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <Input
                      id="days"
                      type="number"
                      placeholder="e.g. 7"
                      className="pl-14 bg-white/40 border-indigo-900/5 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 h-11 md:h-14 rounded-2xl text-indigo-950 font-bold transition-all text-lg"
                      value={formData.estimated_days}
                      onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover" className="text-[10px] uppercase font-black tracking-widest text-indigo-900/40 ml-1">{t('cover_letter')}</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-4 w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center border border-indigo-900/5 group-focus-within:border-primary/30 transition-all z-10">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <Textarea
                    id="cover"
                    placeholder="Why are you the perfect fit for this job? Highlight your relevant experience..."
                    className="pl-14 bg-white/40 border-indigo-900/5 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 min-h-[160px] md:min-h-[220px] rounded-[2rem] text-indigo-950 font-medium leading-relaxed transition-all pt-5"
                    value={formData.cover_letter}
                    onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onClose} 
                  className="flex-1 h-11 md:h-14 rounded-[1.25rem] border border-indigo-900/5 hover:bg-white/60 text-indigo-950/60 font-bold uppercase tracking-widest text-[10px] transition-all"
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 h-11 md:h-14 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 group overflow-hidden relative"
                >
                  {/* Subtle shine effect on button */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? t('submitting') : t('submit_proposal')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
