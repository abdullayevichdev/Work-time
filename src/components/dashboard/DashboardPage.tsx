import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Briefcase, MessageSquare, 
  TrendingUp, Users, DollarSign, Clock, ArrowUpRight, Star, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { PostJobModal } from '@/components/jobs/PostJobModal';
import { MarketPulse } from '@/components/home/MarketPulse';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { ApplicationsList } from '@/components/jobs/ApplicationsList';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

import { WorkRequestsList } from '@/components/dashboard/WorkRequestsList';
import { ActiveJobsList } from '@/components/dashboard/ActiveJobsList';

import { useNavigate } from 'react-router-dom';
import { ADMIN_USERS } from '@/constants';
import { calculateProfileCompletion } from '@/lib/profile';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [statsData, setStatsData] = useState({
    activeJobs: 0,
    money: 0,
    notifications: 0,
    apps: 0,
    jobSeekersCount: 0,
    employersCount: 0,
    activeRequestsCount: 0
  });
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Real-time Profile Listener
      const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setStatsData(prev => ({
            ...prev,
            notifications: data.unread_messages || 0
          }));
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        setLoading(false);
      });

      // Fetch user counts
      const usersRef = collection(db, 'users');
      const unsubUsers = onSnapshot(usersRef, (snap) => {
        const seekers = snap.docs.filter(d => d.data().role === 'freelancer' || d.data().role === 'job_seeker').length;
        const employers = snap.docs.filter(d => d.data().role === 'client' || d.data().role === 'employer').length;
        setStatsData(prev => ({
          ...prev,
          jobSeekersCount: seekers,
          employersCount: employers
        }));
      });

      // Fetch active requests count for the current user
      const reqRef = collection(db, 'work_requests');
      const isHireRole = profile?.role === 'client' || profile?.role === 'employer';
      const field = isHireRole ? 'senderId' : 'receiverId';
      const qReq = query(reqRef, where(field, '==', currentUser.uid));
      const unsubReqs = onSnapshot(qReq, (snap) => {
        setStatsData(prev => ({
          ...prev,
          activeRequestsCount: snap.size
        }));
      });

      return () => {
        unsubProfile();
        unsubUsers();
        unsubReqs();
      };
    });

    return () => unsubscribeAuth();
  }, [profile?.role]);

  const calculateCompletion = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.full_name) score += 15;
    if (profile.title && profile.title !== t('prof_creator')) score += 10;
    if (profile.bio) score += 15;
    if (profile.photo_url || user?.photoURL) score += 20;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.location && profile.location !== t('uzbekistan')) score += 10;
    if (profile.experience && profile.experience.length > 0) score += 10;
    if (profile.phone) score += 5;
    return score;
  };

  const completionPercent = calculateProfileCompletion(profile);
  const strokeDashoffset = 364 * (1 - completionPercent / 100);

  const isHireRole = profile?.role === 'client' || profile?.role === 'employer';

  const stats = isHireRole ? [
    { label: t('job_seekers'), value: statsData.jobSeekersCount.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: t('total_spent'), value: `$${(statsData.money || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: t('active_requests'), value: statsData.activeRequestsCount.toString(), icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: t('active_projects'), value: '0', icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ] : [
    { label: t('employers'), value: statsData.employersCount.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: t('total_earnings'), value: `$${(statsData.money || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: t('messages_title'), value: (statsData.notifications || 0).toString(), icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: t('profile_views'), value: (profile?.views || 0).toString(), icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ];

  if (loading) return (
    <div className="pt-32 container mx-auto px-6 h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <PostJobModal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
        onSuccess={() => {}}
      />

      
      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8 mb-12 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10 w-full lg:w-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-500" />
            <Avatar className="w-24 h-24 border-2 border-white/60 p-1 bg-white relative z-10 shadow-lg">
              <AvatarImage src={profile?.photo_url || user?.photoURL || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-display font-bold">
                {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white z-20 shadow-sm" />
          </div>
          <div className="text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight text-indigo-950 text-sharp">
                {t('welcome_back')} <span className="text-primary font-bold">{profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}</span>!
              </h1>
              <div className="flex gap-2">
                {(user?.email && ADMIN_USERS[user.email.toLowerCase()]) ? (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none font-black text-[10px] tracking-widest px-3">OWNER</Badge>
                ) : (profile?.is_premium) && (
                  <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-none font-black text-[10px] tracking-widest px-3 uppercase">PREMIUM</Badge>
                )}
                {profile?.is_admin && (
                  <Badge className="bg-red-500 text-white border-none font-black text-[10px] tracking-widest px-3">ADMIN</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-indigo-950/40 text-sm font-medium">
              <Badge variant="outline" className="border-indigo-900/10 text-indigo-900/60 bg-white/40 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase truncate max-w-[150px]">
                {isHireRole ? t('hire_role') : t('freelancer_role')}
              </Badge>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> {t('last_active')} {t('just_now')}
              </span>
            </div>
          </div>
        </div>
        
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {isHireRole ? (
              <Button 
                onClick={() => navigate('/talents')}
                className="h-11 md:h-14 px-6 md:px-8 bg-primary hover:bg-primary/80 shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-2xl font-bold flex-1 sm:flex-none"
              >
                {t('explore_talents')}
              </Button>
            ) : (
            <Button 
              onClick={() => navigate('/jobs')}
              className="h-11 md:h-14 px-6 md:px-8 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-2xl font-bold flex-1 sm:flex-none border-none text-white transition-all"
            >
              {t('explore_jobs')}
            </Button>
          )}
        </div>
      </div>

      {profile?.is_admin ? (
        <AdminDashboard />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="will-change-transform"
              >
                <Card className="glass border-indigo-900/5 hover:border-primary/20 transition-all group will-change-transform">
                  <CardContent className="p-5 sm:p-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-sm text-indigo-950/40 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                      <h3 className="text-xl sm:text-3xl font-display font-bold text-indigo-900">{stat.value}</h3>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-primary" />
                  {t('work_requests')}
                </h2>
                <WorkRequestsList role={profile?.role || 'freelancer'} />
              </section>

              <section>
                <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  {t('active_jobs_title')}
                </h2>
                <ActiveJobsList />
              </section>
            </div>

            {/* Quick Actions / Profile Completion */}
            <div className="space-y-6">
              <section className="animate-in fade-in slide-in-from-right-4 duration-700">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-950/40 mb-4 px-2">{t("live_marketplace_data")}</h3>
                <MarketPulse isPremium={true} />
              </section>

              <Card className="glass border-white/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16" />
                <CardHeader>
                  <CardTitle className="text-lg">{t('profile_completion')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-indigo-900/5"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364}
                        strokeDashoffset={strokeDashoffset}
                        className="text-primary transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-indigo-950 text-sharp">{completionPercent}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-indigo-900/40 text-center mb-6 font-bold text-sharp uppercase tracking-tight">{t('portfolio_cta')}</p>
                  <Button variant="outline" className="w-full border-indigo-900/10 hover:bg-white/40 text-indigo-900 font-bold">{t('complete_profile')}</Button>
                </CardContent>
              </Card>

              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">{t('quick_links')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: t('my_applications'), icon: Briefcase },
                    { label: t('payment_settings'), icon: DollarSign },
                    { label: t('community_forum'), icon: Users },
                  ].map(link => (
                    <Button key={link.label} variant="ghost" className="w-full justify-between hover:bg-white/40 text-indigo-950/60 hover:text-primary">
                      <div className="flex items-center gap-3">
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </div>
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
