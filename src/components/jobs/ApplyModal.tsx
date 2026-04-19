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

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
}

export function ApplyModal({ isOpen, onClose, job }: ApplyModalProps) {
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

      toast.success('Your proposal has been submitted!');
      onClose();
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && job && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-xl glass p-8 rounded-[40px] border-white/10 relative z-10 my-10"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-display font-bold">Submit a <span className="text-primary">Proposal</span></h2>
                <p className="text-white/40 text-sm mt-1 truncate max-w-[300px]">{job.title}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bid">Your Bid Amount ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                    <Input
                      id="bid"
                      type="number"
                      placeholder="e.g. 500"
                      className="pl-10 bg-white/5 border-white/10 focus:border-primary h-12 rounded-xl"
                      value={formData.bid_amount}
                      onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Est. Time (Days)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                    <Input
                      id="days"
                      type="number"
                      placeholder="e.g. 7"
                      className="pl-10 bg-white/5 border-white/10 focus:border-primary h-12 rounded-xl"
                      value={formData.estimated_days}
                      onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Cover Letter</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-primary/50" />
                  <Textarea
                    id="cover"
                    placeholder="Why are you the perfect fit for this job? Highlight your relevant experience..."
                    className="pl-10 bg-white/5 border-white/10 focus:border-primary min-h-[200px] rounded-2xl"
                    value={formData.cover_letter}
                    onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl glass border-white/10">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/80">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit Proposal'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
