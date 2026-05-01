import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, MessageSquare, Loader2, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { sendNotification } from '@/lib/notifications';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ActiveJobsList() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingJob, setReviewingJob] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'jobs'),
      where('client_id', '==', auth.currentUser.uid),
      where('status', 'in', ['closed', 'completed'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobs(jobsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCompleteJob = async (job: any) => {
    if (!job.hired_freelancer_id) {
        toast.error(t('no_freelancer_hired'));
        return;
    }
    setReviewingJob(job);
  };

  const submitReview = async () => {
    if (!auth.currentUser || !reviewingJob) return;
    setSubmitting(true);
    try {
      // 1. Create the review
      await addDoc(collection(db, 'reviews'), {
        job_id: reviewingJob.id,
        job_title: reviewingJob.title,
        from_user_id: auth.currentUser.uid,
        from_user_name: auth.currentUser.displayName || 'Client',
        from_user_avatar: auth.currentUser.photoURL || '',
        to_user_id: reviewingJob.hired_freelancer_id,
        rating,
        comment,
        created_at: new Date().toISOString()
      });

      // 2. Update job status to 'completed'
      await updateDoc(doc(db, 'jobs', reviewingJob.id), {
        status: 'completed'
      });

      // 3. Notify the freelancer
      await sendNotification(
        reviewingJob.hired_freelancer_id,
        t('job_completed_title'),
        t('job_completed_desc', { job: reviewingJob.title }),
        'job_update'
      );

      toast.success(t('review_submitted_success'));
      setReviewingJob(null);
      setComment('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-indigo-950/20">{t('loading')}</div>;

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="glass border-white/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-indigo-950">{job.title}</h4>
                  <Badge className={job.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
                    {job.status === 'completed' ? t('completed') : t('in_progress')}
                  </Badge>
                </div>
                <p className="text-sm text-indigo-950/60 font-bold uppercase tracking-tight">
                    {t('freelancer')}: <span className="text-primary">{job.hired_freelancer_name || t('unknown')}</span>
                </p>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                {job.status !== 'completed' && (
                  <Button 
                    onClick={() => handleCompleteJob(job)}
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> {t('complete_job')}
                  </Button>
                )}
                <Button 
                  variant="outline"
                  className="flex-1 md:flex-none border-indigo-900/10 hover:bg-white/40 text-indigo-950 font-bold rounded-xl"
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> {t('messages')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {jobs.length === 0 && (
        <div className="text-center py-12 glass rounded-3xl border-white/5 opacity-40">
           <Briefcase className="w-12 h-12 mx-auto mb-4" />
           <p className="font-bold uppercase tracking-widest text-xs">{t('no_active_jobs')}</p>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewingJob} onOpenChange={() => setReviewingJob(null)}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{t('rate_freelancer')}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-10 h-10 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-indigo-950/10'}`} 
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-indigo-950/40">{t('your_comment')}</label>
              <Textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('comment_placeholder')}
                className="bg-white/40 border-indigo-900/10 min-h-[100px] rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setReviewingJob(null)}
              className="font-bold text-indigo-950/40"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={submitReview}
              disabled={submitting}
              className="bg-primary hover:bg-primary/80 text-white font-bold rounded-xl px-8"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('submit_review')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
