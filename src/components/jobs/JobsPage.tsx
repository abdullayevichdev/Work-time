import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Briefcase, Clock, Star, Building2, 
  Users, ShieldCheck, ArrowRight, CheckCircle2, MapPin 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { isAdminEmail } from '@/constants';
import { FuturisticEmptyState } from '@/components/ui/FuturisticEmptyState';
import { useJobs } from '@/hooks/useJobs';
import { useTalents } from '@/hooks/useTalents';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function JobsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'talents'>('jobs');

  const { jobs: filteredJobs, loading: loadingJobs } = useJobs(searchQuery);
  
  // Real-time talents listener with automatically checked 80%+ profiles
  const { talents, loading: loadingTalents } = useTalents(
    searchQuery,
    1000, // maxRate
    [],   // selectedLevels
    '',   // selectedLocation
    []    // selectedSkills
  );

  const timeAgo = (date: any) => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - (date?.toDate ? date.toDate().getTime() : new Date(date).getTime())) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return t('time_years_ago', { count: Math.floor(interval) });
    interval = seconds / 2592000;
    if (interval > 1) return t('time_months_ago', { count: Math.floor(interval) });
    interval = seconds / 86400;
    if (interval > 1) return t('time_days_ago', { count: Math.floor(interval) });
    interval = seconds / 3600;
    if (interval > 1) return t('time_hours_ago', { count: Math.floor(interval) });
    interval = seconds / 60;
    if (interval > 1) return t('time_minutes_ago', { count: Math.floor(interval) });
    return t('time_seconds_ago', { count: Math.floor(seconds) });
  };

  const getJoinedAt = (u: any) => {
    const raw = u.createdAt ?? u.created_at;
    if (!raw) return 0;
    if (raw?.toDate) return raw.toDate().getTime();
    return new Date(raw).getTime();
  };

  const isNewMember = (u: any) => {
    const joined = getJoinedAt(u);
    if (!joined) return false;
    return Date.now() - joined < 7 * 24 * 60 * 60 * 1000;
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await deleteDoc(doc(db, 'jobs', jobId));
        toast.success(t('deleted_success'));
      } catch (error) {
        console.error('Error deleting job:', error);
        toast.error(t('error_sync_failed'));
      }
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-24 md:pt-32 pb-20 container mx-auto px-4 md:px-6 max-w-4xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 relative z-10 text-left animate-fade-in"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-indigo-950 text-sharp">
          {activeTab === 'jobs' ? t('explore_jobs') : (t('talents_title_2') || 'Mutaxassislar')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            {activeTab === 'jobs' ? 'Marketplace' : 'Ishlar Bo‘limi'}
          </span>
        </h1>
        <p className="text-indigo-900/40 text-sm md:text-base text-sharp max-w-xl font-medium">
          {activeTab === 'jobs' 
            ? t('jobs_find_desc') 
            : (t('talents_desc') || "Platformadagi eng malakali freelancer va hamkorlar bilan bog'laning.")}
        </p>
      </motion.div>

      {/* Futuristic Segmented Tab Control */}
      <div className="flex bg-white/45 p-1.5 rounded-[2rem] border border-white/60 shadow-xl backdrop-blur-md max-w-md mb-10 relative z-10 mx-auto sm:mx-0">
        <button
          onClick={() => {
            setActiveTab('jobs');
            setSearchQuery('');
          }}
          className={`flex-1 py-3 px-6 rounded-3xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'jobs' 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
              : 'text-indigo-950/60 hover:text-indigo-950 hover:bg-white/20'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          {t('explore_jobs') || 'Ishlar'}
        </button>
        <button
          onClick={() => {
            setActiveTab('talents');
            setSearchQuery('');
          }}
          className={`flex-1 py-3 px-6 rounded-3xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'talents' 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
              : 'text-indigo-950/60 hover:text-indigo-950 hover:bg-white/20'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('talents_title_2') || 'Mutaxassislar'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row w-full gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative flex-1 group"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-900/40 group-hover:text-primary transition-colors z-10" />
            <Input 
              placeholder={activeTab === 'jobs' 
                ? t('search_jobs') 
                : (t('search_talents_placeholder') || "Mutaxassislarni ismi yoki ko'nikmalari bo'yicha qidiring...")} 
              className="pl-12 h-14 glass border-white/10 focus:border-primary rounded-2xl text-lg font-medium shadow-lg relative z-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
          {activeTab === 'jobs' && (
            <Button variant="outline" className="h-14 px-8 glass border-white/10 hover:bg-white/40 text-indigo-950 font-bold rounded-2xl md:hidden shadow-lg">
              <Filter className="w-4 h-4 mr-2" />
              {t('filter')}
            </Button>
          )}
        </div>

        {activeTab === 'jobs' ? (
          loadingJobs ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="glass border-white/10 p-6 rounded-[2rem] animate-pulse">
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-2xl bg-white/5" />
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-6 w-2/3 bg-white/5 rounded-lg" />
                    <Skeleton className="h-4 w-full bg-white/5 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 bg-white/5 rounded-lg" />
                  </div>
                </div>
              </Card>
            ))
          ) : filteredJobs.length > 0 ? (
            <AnimatePresence>
              {filteredJobs.map((job, index) => {
                const employer = (job as any).employerInfo;

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                    className="group"
                  >
                    <Card className="glass border-white/10 hover:border-primary/30 transition-all duration-500 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-primary/5 relative text-left">
                       <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <CardHeader className="flex flex-col sm:flex-row items-start justify-between space-y-4 sm:space-y-0 pb-4 relative z-10">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-900/5 flex items-center justify-center border-2 border-white shadow-xl group-hover:border-primary/50 transition-colors shrink-0">
                            <Briefcase className="w-8 h-8 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <CardTitle className="text-xl md:text-2xl font-bold text-indigo-950 group-hover:text-primary transition-colors text-sharp line-clamp-1">
                                {job.title}
                              </CardTitle>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-900/60 font-black uppercase tracking-widest text-sharp">
                              <span className="flex items-center gap-1.5 bg-indigo-900/5 px-2 py-1 rounded-md">
                                <Clock className="w-3.5 h-3.5 text-primary" /> {timeAgo(job.createdAt || (job as any).created_at)}
                              </span>
                              {(job as any).duration && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" /> {(job as any).duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-2 relative z-10">
                        <p className="text-indigo-950/60 line-clamp-2 mb-6 leading-relaxed text-sharp text-sm font-medium">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {job.tags?.map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="bg-white/60 border-indigo-900/5 text-indigo-900/60 text-[10px] font-bold uppercase tracking-wider hover:bg-white transition-colors shadow-sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        {employer && (
                          <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-900/5 border border-white/40">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <Building2 className="w-4 h-4 text-indigo-900/40" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                                  {employer.name}
                                  {employer.verified && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                                </p>
                                <p className="text-[10px] text-indigo-900/40 flex items-center gap-1 font-black uppercase tracking-widest">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {employer.rating} {t('rating_label')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-indigo-900/40 font-black uppercase tracking-widest flex items-center justify-end gap-1">
                                <Users className="w-3 h-3" /> {(job as any).applicantsCount || 0}
                              </p>
                              <p className="text-[10px] text-indigo-900/40 font-bold uppercase">{t('proposals_label')}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t border-indigo-900/5 pt-6 relative z-10 gap-4">
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <span className="text-2xl md:text-3xl font-black text-indigo-950 text-sharp">${job.budget.toLocaleString()}</span>
                          <span className="text-xs font-black uppercase tracking-widest text-indigo-900/40">{t('fixed_price')}</span>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                          {user && (user.uid === job.userId || isAdminEmail(user.email)) && (
                            <Button 
                              variant="destructive" 
                              className="h-11 md:h-12 px-6 font-bold rounded-xl flex-1 sm:flex-none cursor-pointer"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              {t('delete')}
                            </Button>
                          )}
                          <Button 
                            variant="default" 
                            className="bg-primary hover:bg-primary/90 text-white h-11 md:h-12 px-8 font-bold rounded-xl shadow-lg shadow-primary/20 flex-1 sm:flex-none cursor-pointer"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            {t('view_details')}
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <FuturisticEmptyState 
              icon={Briefcase}
              title={t('no_jobs_found')}
              description={t('adjust_search')}
              action={
                <Button onClick={() => setSearchQuery('')} variant="outline" className="glass border-white/10 h-12 px-8 rounded-xl font-bold text-indigo-950 cursor-pointer">
                  {t('clear_filters')}
                </Button>
              }
            />
          )
        ) : (
          /* Specialists rendering section */
          loadingTalents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="h-80 glass rounded-[2.5rem] animate-pulse border-white/10" />
              ))}
            </div>
          ) : talents.length > 0 ? (
            <AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {talents.map((talent, i) => {
                  const level = talent.experience_level || 'intermediate';
                  const completion = talent.profileCompletion || talent.profileCompleteness || 0;
                  
                  // Compute dynamic online state: if lastSeen is within 5 minutes, user is active!
                  let isOnline = false;
                  if (talent.lastSeen) {
                    const diffMs = Date.now() - (talent.lastSeen?.toDate ? talent.lastSeen.toDate().getTime() : new Date(talent.lastSeen).getTime());
                    isOnline = diffMs < 5 * 60 * 1000;
                  }

                  return (
                    <motion.div
                      key={talent.id}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                      className="group text-left"
                    >
                      <Card className="glass border-white/10 hover:border-primary/30 transition-all duration-500 h-full flex flex-col rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-primary/5 relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <CardContent className="p-8 flex flex-col h-full relative z-10">
                          <div className="flex items-start justify-between mb-6">
                            <div className="relative">
                              <Avatar className="w-16 h-16 border-[3px] border-white shadow-xl relative z-10 bg-indigo-900/5">
                                <AvatarImage src={talent.photo_url || talent.photoURL || undefined} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                  {talent.full_name?.[0] || talent.displayName?.[0] || 'T'}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute bottom-0 right-0 w-4.5 h-4.5 border-2 border-white rounded-full z-20 shadow-sm ${
                                isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                              }`} title={isOnline ? 'Online' : 'Offline'} />
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              {isNewMember(talent) && (
                                <Badge className="bg-emerald-500 text-white border-none px-2 py-0.5 text-[9px] font-black tracking-widest shadow-sm">
                                  {t('new_member_badge') || 'YANGI'}
                                </Badge>
                              )}
                              {talent.membership === 'premium' && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none px-2 py-0.5 text-[9px] font-black tracking-widest flex items-center gap-1 shadow-sm">
                                  ⭐ PREMIUM
                                </Badge>
                              )}
                              <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[9px] font-black tracking-widest flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {completion}% COMPLETE
                              </Badge>
                            </div>
                          </div>

                          <div className="mb-6 flex-1">
                            <Link to={`/profile/${talent.id}`}>
                              <h3 className="text-xl font-bold mb-1 text-indigo-950 group-hover:text-primary transition-colors text-sharp whitespace-normal break-all line-clamp-1">
                                {talent.full_name || talent.displayName || talent.email}
                              </h3>
                            </Link>
                            <p className="text-[10px] text-indigo-900/60 font-black uppercase tracking-widest mb-4 flex items-center gap-1 text-sharp truncate">
                              {talent.title || 'Professional'}
                            </p>
                            <p className="text-xs text-indigo-950/60 line-clamp-3 mb-6 text-sharp font-medium leading-relaxed min-h-[50px]">
                              {talent.bio}
                            </p>
                            
                            <div className="flex flex-wrap gap-1.5">
                              {talent.skills?.slice(0, 3).map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="bg-white/60 border-indigo-900/5 text-indigo-900/60 text-[9px] uppercase tracking-wider text-sharp font-bold shadow-sm">
                                  {skill}
                                </Badge>
                              ))}
                              {talent.skills?.length > 3 && (
                                <Badge variant="secondary" className="bg-indigo-900/5 border-none text-indigo-900/40 text-[9px] font-bold">
                                  +{talent.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-indigo-900/5 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="text-[9px] text-indigo-900/40 uppercase tracking-widest font-black mb-0.5 text-sharp">{t("hourly_rate")}</p>
                                <p className="text-lg font-bold text-indigo-950">${talent.hourly_rate || 20}<span className="text-[10px] font-medium text-indigo-900/40 text-sharp">/{t("per_hr")}</span></p>
                              </div>
                              <div className="w-px h-8 bg-indigo-900/5" />
                              <div>
                                <p className="text-[9px] text-indigo-900/40 uppercase tracking-widest font-black mb-0.5 text-sharp">Javob vaqti</p>
                                <p className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-indigo-950/40" />
                                  ~{talent.responseTimeHours || 2}s
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="default" 
                              size="icon" 
                              asChild
                              className="rounded-xl w-10 h-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group-hover:scale-105 transition-all cursor-pointer" 
                            >
                              <Link to={`/profile/${talent.id}`}>
                                <ArrowRight className="w-4 h-4 text-white" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          ) : (
            <FuturisticEmptyState 
              icon={Users}
              title={t("no_talents_found") || "Qidiruvga mos mutaxassis topilmadi"}
              description={t("adjust_search") || "Filtrlarni yoki qidiruv so'zini o'zgartirib qayta tekshirib ko'ring."}
              action={
                <Button 
                  onClick={() => setSearchQuery('')} 
                  variant="outline" 
                  className="glass border-white/10 h-12 px-8 rounded-xl font-bold text-indigo-950 cursor-pointer"
                >
                  Filtrlarni Tozalash
                </Button>
              }
            />
          )
        )}
      </div>
    </motion.div>
  );
}
