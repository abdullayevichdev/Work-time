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
import { collection, query, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Job } from '@/types';
import { toast } from 'sonner';
import { ApplyModal } from './ApplyModal';

import { useNavigate } from 'react-router-dom';
import { ADMIN_USERS } from '@/constants';
import { calculateProfileCompletion } from '@/lib/profile';

export function JobsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    setLoading(true);
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, orderBy('created_at', 'desc'));
    
    const unsubscribeJobs = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      setJobsList(jobsData);
      setLoading(false);
    }, (error) => {
      console.error('Firebase snapshot error:', error);
      toast.error(t('error_sync_failed'));
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeJobs();
    };
  }, []);

  const filteredJobs = jobsList.filter(job => 
    job.status === 'open' &&
    (job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
     job.skills_required?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (job.budget >= budgetRange[0] && job.budget <= budgetRange[1]) &&
    (selectedLevels.length === 0 || selectedLevels.includes(job.experience_level))
  );

  return (
    <div className="pt-24 md:pt-32 pb-20 container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="text-left w-full md:w-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-indigo-950 text-sharp">{t('explore_jobs')}</h1>
          <p className="text-indigo-900/40 text-sm md:text-base text-sharp">{t('jobs_find_desc')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 md:gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input 
              placeholder={t('search_talents_placeholder')} 
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
              <CardTitle className="text-lg">{t('budget_range', 'Budget Range')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold text-indigo-900/40 uppercase tracking-widest">
                  <span>$0</span>
                  <span>$10,000+</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="100"
                  value={budgetRange[1]}
                  onChange={(e) => setBudgetRange([budgetRange[0], parseInt(e.target.value)])}
                  className="w-full accent-primary bg-indigo-900/10 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <p className="text-sm font-bold text-indigo-950">
                  Up to ${budgetRange[1].toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">{t('exp_level')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: t('entry_level'), id: 'entry' },
                { label: t('intermediate'), id: 'intermediate' },
                { label: t('expert'), id: 'expert' }
              ].map(level => (
                <label key={level.id} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedLevels.includes(level.id)}
                    onChange={() => {
                      setSelectedLevels(prev => 
                        prev.includes(level.id) ? prev.filter(l => l !== level.id) : [...prev, level.id]
                      );
                    }}
                    className="w-4 h-4 rounded border-indigo-900/10 text-primary focus:ring-primary/20 accent-primary"
                  />
                  <span className={`text-sm font-medium transition-colors ${selectedLevels.includes(level.id) ? 'text-primary' : 'text-indigo-900/60 group-hover:text-primary'}`}>
                    {level.label}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="glass border-white/10 p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg bg-white/5" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-2/3 bg-white/5" />
                    <Skeleton className="h-4 w-full bg-white/5" />
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
                  className="group will-change-transform"
                >
                  <Card className={`glass-card border-white/10 will-change-transform hover:border-primary/30 transition-all ${job.is_featured ? 'border-primary/30 bg-primary/5' : ''}`}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                          <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl text-indigo-950 group-hover:text-primary transition-colors text-sharp truncate">
                              {job.title}
                            </CardTitle>
                            {job.is_featured && (
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none font-black text-[8px] tracking-widest px-2 py-0 uppercase">{t('featured')}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-indigo-900/40 font-bold uppercase tracking-widest text-sharp">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {job.experience_level}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-primary" /> {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-indigo-950/60 line-clamp-2 mb-6 leading-relaxed text-sharp text-sm">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {job.skills_required?.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-white/40 border-indigo-900/10 text-indigo-900/60 text-[10px] font-bold uppercase tracking-tighter">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t border-indigo-900/5 pt-6">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl md:text-2xl font-bold text-indigo-950 text-sharp">${job.budget.toLocaleString()}</span>
                        <span className="text-indigo-900/40 text-xs md:text-sm font-medium text-sharp">/ {job.budget_type === 'hourly' ? t('hr') : t('project')}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          className="glass border-white/10 hover:bg-white/5 h-9 md:h-10 px-6 font-bold"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          {t('view_details')}
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
