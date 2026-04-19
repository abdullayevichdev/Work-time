import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Search, Filter, Briefcase, DollarSign, Clock, Star, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Job } from '@/types';
import { toast } from 'sonner';
import { ApplyModal } from './ApplyModal';

export function JobsPage() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    setLoading(true);
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, orderBy('created_at', 'desc'));
    
    const unsubscribeJobs = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        console.warn('Firebase empty (falling back to mock data)');
        const mockJobs: Job[] = [
          {
            id: '1',
            title: 'Senior React Developer for Fintech App',
            description: 'We are looking for an expert React developer to build a high-performance dashboard with real-time charts and glassmorphism UI.',
            budget: 5000,
            budget_type: 'fixed',
            category: 'Development',
            experience_level: 'expert',
            skills_required: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
            client_id: 'c1',
            client_name: 'Nexus Labs',
            status: 'open',
            created_at: new Date().toISOString(),
            is_featured: true
          },
          {
            id: '2',
            title: 'Futuristic UI/UX Designer',
            description: 'Need a designer who specializes in Apple-style glassmorphism and liquid glass aesthetics for a new SaaS platform.',
            budget: 3500,
            budget_type: 'fixed',
            category: 'Design',
            experience_level: 'intermediate',
            skills_required: ['Figma', 'UI/UX', 'Interaction Design'],
            client_id: 'c2',
            client_name: 'Glassy Inc',
            status: 'open',
            created_at: new Date().toISOString(),
            is_featured: false
          }
        ];
        setJobs(mockJobs);
      } else {
        const jobsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];
        setJobs(jobsData);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase snapshot error:', error);
      toast.error('Real-time sync failed. Please refresh.');
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeJobs();
    };
  }, []);

  const handleApply = (job: Job) => {
    if (!user) {
      toast.error(t('login_to_apply'));
      return;
    }
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-24 md:pt-32 pb-20 container mx-auto px-4 md:px-6">
      <ApplyModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
        job={selectedJob} 
      />
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="text-left w-full md:w-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-indigo-950 text-sharp">{t('browse_jobs')}</h1>
          <p className="text-indigo-900/40 text-sm md:text-base text-sharp">{t('jobs_find_desc')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 md:gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input 
              placeholder={t('search_jobs')} 
              className="pl-10 h-11 md:h-10 glass border-white/10 focus:border-primary w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="h-11 md:h-10 glass border-white/10 w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            {t('filter')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block space-y-8">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">{t('categories')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: t('cat_dev'), id: 'Development' },
                { label: t('cat_design'), id: 'Design' },
                { label: t('cat_marketing'), id: 'Marketing' },
                { label: t('cat_writing'), id: 'Writing' },
                { label: t('cat_video'), id: 'Video' }
              ].map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/40 cursor-pointer transition-colors group">
                  <span className="text-indigo-900/60 group-hover:text-primary font-medium text-sharp">{cat.label}</span>
                  <Badge variant="outline" className="border-indigo-900/10 text-indigo-900/40">12</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass border-white/10 bg-gradient-to-br from-primary/20 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-bold">{t('premium_benefits')}</span>
              </div>
              <p className="text-sm text-white/60 mb-6">{t('premium_desc')}</p>
              <Button className="w-full bg-primary hover:bg-primary/80">{t('upgrade')}</Button>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="glass border-white/10 p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-2/3 bg-white/5" />
                    <Skeleton className="h-4 w-full bg-white/5" />
                    <Skeleton className="h-4 w-1/2 bg-white/5" />
                  </div>
                </div>
              </Card>
            ))
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={typeof window !== 'undefined' && window.innerWidth > 1024 ? { scale: 1.01 } : {}}
                className="group will-change-transform"
              >
                <Card className={`glass-card border-white/10 will-change-transform ${job.is_featured ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Briefcase className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1 text-indigo-950 group-hover:text-primary transition-colors text-sharp">{job.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-indigo-900/40 font-medium text-sharp">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {t('remote')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 2h ago
                          </span>
                        </div>
                      </div>
                    </div>
                    {job.is_featured && (
                      <Badge className="bg-primary/20 text-primary border-primary/20">{t('featured')}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-indigo-950/60 line-clamp-2 mb-6 leading-relaxed text-sharp">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-white/40 border-indigo-900/10 text-indigo-900/60 text-sharp">{t(`cat_${job.category?.toLowerCase() || 'dev'}`)}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t border-indigo-900/5 pt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-indigo-950 text-sharp">${job.budget}</span>
                      <span className="text-indigo-900/40 text-sm font-medium text-sharp">/ {job.budget_type === 'hourly' ? t('hr') : t('project')}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/jobs/${job.id}`}>
                        <Button variant="ghost" className="glass border-white/10 hover:bg-white/5">
                          {t('view_details')}
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => handleApply(job)}
                        className="bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/20"
                      >
                        {t('apply')}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 glass rounded-3xl border-white/10">
              <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{t('no_jobs_found')}</h3>
              <p className="text-white/40">{t('adjust_search')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
