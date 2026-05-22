import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, DollarSign, Clock, MapPin, 
  ArrowLeft, Calendar, User, Tag, ShieldCheck,
  Send, Users, Star, Building2, Zap
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
        
        // Try fetching actual client if userId exists, else use dummy employer info
        if (jobData.userId && !jobData.userId.startsWith('dummy_employer')) {
          const unsubClient = onSnapshot(doc(db, 'users', jobData.userId), (clientSnap) => {
            if (clientSnap.exists()) {
              setClient(clientSnap.data());
            }
          });
          return () => unsubClient();
        } else if (jobData.employerInfo) {
           // Mapping dummy employer info to client structure
           setClient({
             full_name: jobData.employerInfo.name,
             is_verified: jobData.employerInfo.verified,
             stats: { rating: jobData.employerInfo.rating },
             created_at: new Date(Date.now() - 31536000000).toISOString() // 1 year ago
           });
        }
      } else {
        navigate('/jobs');
      }
    }, (error) => {
      console.error('Error fetching job details:', error);
      setLoading(false);
    });

    return () => unsubJob();
  }, [id, navigate]);

  if (loading) return (
    <div className="pt-32 container mx-auto px-6 flex justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!job) return null;

  // Simulate AI Match Score
  const matchScore = Math.floor(Math.random() * 20) + 80; // 80 - 99

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <ApplyModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
        job={job} 
      />

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-indigo-900/40 hover:text-primary transition-colors mb-8 group font-bold text-sm uppercase tracking-widest text-sharp"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t('back_to_jobs')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl -mr-32 -mt-32" />
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 relative z-10">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[10px] font-black tracking-widest flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" /> {matchScore}% AI MATCH
                    </Badge>
                    <Badge className="bg-green-500/10 text-green-600 border-none px-2 py-0.5 text-[10px] font-black tracking-widest">
                      OPEN FOR PROPOSALS
                    </Badge>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-display font-bold mb-6 text-indigo-950 text-sharp break-words leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 text-xs md:text-sm text-indigo-900/40 font-black uppercase tracking-widest text-sharp">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {new Date(job.createdAt?.toDate ? job.createdAt.toDate() : job.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {t('remote')}</span>
                    {job.duration && <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {job.duration}</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 relative z-10">
                 <div className="p-4 rounded-2xl bg-indigo-900/5 border border-white/40">
                    <p className="text-[10px] text-indigo-900/40 uppercase tracking-widest font-black mb-1">{t('budget_range', 'Budget')}</p>
                    <p className="text-xl md:text-2xl font-bold text-indigo-950">${job.budget?.toLocaleString()}</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-indigo-900/5 border border-white/40">
                    <p className="text-[10px] text-indigo-900/40 uppercase tracking-widest font-black mb-1">{t('exp_level')}</p>
                    <p className="text-sm md:text-base font-bold text-indigo-950 capitalize">{job.experienceLevel || 'Intermediate'}</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-indigo-900/5 border border-white/40">
                    <p className="text-[10px] text-indigo-900/40 uppercase tracking-widest font-black mb-1">Proposals</p>
                    <p className="text-xl md:text-2xl font-bold text-indigo-950">{job.applicantsCount || 0}</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-indigo-900/5 border border-white/40">
                    <p className="text-[10px] text-indigo-900/40 uppercase tracking-widest font-black mb-1">Type</p>
                    <p className="text-sm md:text-base font-bold text-indigo-950">Fixed Price</p>
                 </div>
              </div>

              <div className="prose prose-lg max-w-none mb-12 relative z-10">
                <h3 className="text-xl font-bold mb-4 text-indigo-950 text-sharp border-b border-indigo-900/5 pb-2">{t('proj_desc')}</h3>
                <p className="text-indigo-950/60 leading-relaxed whitespace-pre-wrap text-sharp font-medium">
                  {job.description}
                </p>
              </div>

              <div className="space-y-6 relative z-10">
                <h3 className="text-xl font-bold text-indigo-950 text-sharp border-b border-indigo-900/5 pb-2">{t('req_skills')}</h3>
                <div className="flex flex-wrap gap-2">
                  {job.tags?.map((skill: string) => (
                    <Badge key={skill} className="bg-white/60 text-indigo-950 border-indigo-900/10 px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-white transition-colors">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar - Client Info & Action */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-white/10 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-3xl -mr-16 -mt-16" />
              <div className="space-y-6 relative z-10">
                <Button 
                  onClick={() => setIsApplyModalOpen(true)}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 group transition-all"
                >
                  {t('submit_proposal')}
                  <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
                
                <div className="pt-8 border-t border-indigo-900/5 space-y-6">
                  <h3 className="font-bold text-sm text-indigo-900/40 uppercase tracking-widest text-sharp mb-4">About the Employer</h3>
                  
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border-[3px] border-white shadow-lg bg-indigo-900/5">
                      <AvatarImage src={client?.photo_url || client?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold"><Building2 className="w-6 h-6" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-lg text-indigo-950 text-sharp leading-none mb-1">{client?.full_name || 'Anonymous Client'}</h4>
                      {(client?.is_verified || job.employerInfo?.verified) ? (
                         <p className="text-[10px] text-blue-600 flex items-center gap-1 font-black uppercase tracking-widest">
                           <ShieldCheck className="w-3 h-3" /> Payment Verified
                         </p>
                      ) : (
                         <p className="text-[10px] text-indigo-900/40 flex items-center gap-1 font-black uppercase tracking-widest">
                           Payment Unverified
                         </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-900/5 border border-white/40 shadow-sm text-center">
                      <p className="text-2xl font-bold text-indigo-950 text-sharp mb-1">
                        {client?.stats?.jobs_posted || Math.floor(Math.random() * 20) + 1}
                      </p>
                      <p className="text-[10px] text-indigo-900/40 uppercase tracking-widest font-black">{t('jobs_posted')}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-indigo-900/5 border border-white/40 shadow-sm text-center">
                      <p className="text-2xl font-bold text-indigo-950 text-sharp mb-1 flex items-center justify-center gap-1">
                        {client?.stats?.rating || job.employerInfo?.rating || '4.8'}
                      </p>
                      <p className="text-[10px] text-indigo-900/40 uppercase tracking-widest font-black flex items-center justify-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {t('rating')}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-indigo-900/5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-900/60 font-bold uppercase tracking-widest text-[10px]">{t('location')}</span>
                      <span className="text-indigo-950 font-bold text-sm">United States</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-900/60 font-bold uppercase tracking-widest text-[10px]">{t('member_since')}</span>
                      <span className="text-indigo-950 font-bold text-sm">{client?.created_at ? new Date(client.created_at).getFullYear() : '2023'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-white/10 p-6 rounded-[2rem] shadow-lg">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-indigo-950 text-sm uppercase tracking-widest">
                <Briefcase className="w-4 h-4 text-primary" /> {t('similar_jobs')}
              </h4>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="group cursor-pointer p-3 rounded-xl hover:bg-white/40 transition-colors border border-transparent hover:border-white/60">
                    <h5 className="text-sm font-bold text-indigo-950 group-hover:text-primary transition-colors line-clamp-1 mb-1">Senior React Engineer Needed</h5>
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] text-indigo-900/60 font-black uppercase tracking-widest">Fixed Price</p>
                       <p className="text-xs font-bold text-indigo-950">$3,000</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
