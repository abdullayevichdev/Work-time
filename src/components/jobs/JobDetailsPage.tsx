import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Briefcase, DollarSign, Clock, MapPin, 
  ArrowLeft, Calendar, User, Tag, ShieldCheck,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ApplyModal } from './ApplyModal';
import { useTranslation } from 'react-i18next';

export function JobDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    // Real-time Job Listener
    const unsubJob = onSnapshot(doc(db, 'jobs', id), (jobSnap) => {
      if (jobSnap.exists()) {
        const jobData = { id: jobSnap.id, ...jobSnap.data() } as any;
        setJob(jobData);
        setLoading(false);
        
        // Fetch client info once we have jobData
        const unsubClient = onSnapshot(doc(db, 'users', jobData.client_id), (clientSnap) => {
          if (clientSnap.exists()) {
            setClient(clientSnap.data());
          }
        });
        
        return () => unsubClient();
      } else {
        navigate('/jobs');
      }
    }, (error) => {
      console.error('Error fetching job details:', error);
      setLoading(false);
    });

    return () => unsubJob();
  }, [id, navigate]);

  if (loading) return <div className="pt-32 container mx-auto px-6">{t('loading_job_details')}</div>;
  if (!job) return null;

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <ApplyModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
        job={job} 
      />

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-indigo-900/40 hover:text-primary transition-colors mb-8 group font-medium text-sharp"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t('back_to_jobs')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass border-white/10 p-8 pt-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl -mr-32 -mt-32" />
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="min-w-0">
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 text-indigo-950 text-sharp break-words">{job.title}</h1>
                <div className="flex flex-wrap gap-4 text-xs md:text-sm text-indigo-900/40 font-bold tracking-tight text-sharp">
                  <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {job.category}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {t('posted_date')} {new Date(job.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {t('remote')}</span>
                </div>
              </div>
              <div className="md:text-right flex flex-col md:items-end">
                <p className="text-3xl font-bold text-primary text-sharp">${job.budget}</p>
                <p className="text-sm text-indigo-900/40 font-bold text-sharp whitespace-nowrap">{job.budget_type === 'hourly' ? t('estimated_hr') : t('fixed_price')}</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none mb-12">
              <h3 className="text-xl font-bold mb-4 text-indigo-950 text-sharp">{t('proj_desc')}</h3>
              <p className="text-indigo-950/60 leading-relaxed whitespace-pre-wrap text-sharp font-normal">
                {job.description}
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-indigo-950 text-sharp">{t('req_skills')}</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills_required?.map((skill: string) => (
                  <Badge key={skill} className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Client Info & Action */}
        <div className="space-y-8">
          <Card className="glass border-white/10 p-8">
            <div className="space-y-6">
              <Button 
                onClick={() => setIsApplyModalOpen(true)}
                className="w-full h-11 md:h-14 bg-primary hover:bg-primary/80 text-sm md:text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                {t('submit_proposal')}
                <Send className="ml-2 w-4 md:w-5 h-4 md:h-5" />
              </Button>
              
              <div className="pt-6 border-t border-indigo-900/5 space-y-6">
                <h3 className="font-bold text-lg text-indigo-950 text-sharp">{t('about_client')}</h3>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border border-indigo-900/10">
                    <AvatarImage src={client?.photo_url || client?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">{client?.full_name?.[0] || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold truncate max-w-[150px] text-indigo-950 text-sharp">{client?.full_name || 'Anonymous Client'}</h4>
                    <p className="text-xs text-indigo-900/40 flex items-center gap-1 font-bold text-sharp">
                      <ShieldCheck className="w-3 h-3 text-green-500" /> {t('payment_verified')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-indigo-900/5 border border-indigo-900/5 shadow-sm">
                    <p className="text-xl font-bold text-indigo-950 text-sharp">12</p>
                    <p className="text-[10px] text-indigo-900/40 uppercase tracking-widest font-bold text-sharp">{t('jobs_posted')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-900/5 border border-indigo-900/5 shadow-sm">
                    <p className="text-xl font-bold text-indigo-950 text-sharp">4.8</p>
                    <p className="text-[10px] text-indigo-900/40 uppercase tracking-widest font-bold text-sharp">{t('rating')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-indigo-900/40 text-sharp">{t('location')}</span>
                    <span className="text-indigo-950 text-sharp">{t('verified_status')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-indigo-900/40 text-sharp">{t('member_since')}</span>
                    <span className="text-indigo-950 text-sharp">{client?.created_at ? new Date(client.created_at).getFullYear() : '2024'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass border-white/10 p-6 bg-primary/5">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> {t('similar_jobs')}
            </h4>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="group cursor-pointer">
                  <h5 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">Expert Web App Developer Needed</h5>
                  <p className="text-xs text-white/40">$2,500 • Fixed</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
