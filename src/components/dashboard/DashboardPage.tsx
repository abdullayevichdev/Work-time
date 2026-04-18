import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Briefcase, MessageSquare, 
  TrendingUp, Users, DollarSign, Clock, ArrowUpRight, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { PostJobModal } from '@/components/jobs/PostJobModal';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { ApplicationsList } from '@/components/jobs/ApplicationsList';
import { PremiumModal } from '@/components/premium/PremiumModal';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export function DashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [statsData, setStatsData] = useState({
    activeJobs: 0,
    money: 0,
    notifications: 0,
    apps: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

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

      return () => unsubProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  // Separate effect for role-based listeners to be more stable
  useEffect(() => {
    if (!user || !profile?.role) return;

    const roleQueryField = profile.role === 'client' ? 'client_id' : 'freelancer_id';
    
    const appsQuery = query(
      collection(db, 'applications'),
      where(roleQueryField, '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    const unsubActivity = onSnapshot(appsQuery, (snap) => {
      const apps = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'application'
      }));
      setActivities(apps);
      
      const accepted = apps.filter((a: any) => a.status === 'accepted').length;
      setStatsData(prev => ({
        ...prev,
        activeJobs: accepted,
        apps: snap.size
      }));
    });

    return () => unsubActivity();
  }, [user?.uid, profile?.role]);

  const stats = profile?.role === 'client' ? [
    { label: t('posted_jobs'), value: statsData.apps.toString(), icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: t('total_spent'), value: `$${(statsData.money || 8500).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: t('applications'), value: statsData.apps.toString(), icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: t('active_projects'), value: statsData.activeJobs.toString(), icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ] : [
    { label: t('active_jobs'), value: (statsData.activeJobs || 12).toString(), icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: t('total_earnings'), value: `$${(statsData.money || 14250).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: t('messages_title'), value: (statsData.notifications || 8).toString(), icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: t('profile_views'), value: (profile?.views || 245).toString(), icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-400/10' },
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
        onSuccess={() => {
          // Refresh stats if needed
        }}
      />

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
      
      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-8 mb-12 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10 w-full lg:w-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-500" />
            <Avatar className="w-24 h-24 border-2 border-white/10 p-1 bg-[#030014] relative z-10">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-display font-bold">
                {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-4 border-[#030014] z-20" />
          </div>
          <div className="text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight text-white">
                {t('welcome_back')} <span className="text-primary font-bold">{profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}</span>!
              </h1>
              <div className="flex gap-2">
                {profile?.is_premium && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none font-black text-[10px] tracking-widest px-3">PREMIUM</Badge>
                )}
                {profile?.is_admin && (
                  <Badge className="bg-red-500 text-white border-none font-black text-[10px] tracking-widest px-3">ADMIN</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-white/40 text-sm">
              <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">{profile?.role === 'client' ? t('hire_role') : t('freelancer_role')}</Badge>
              <span className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-primary" /> {t('last_active')} {t('just_now')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {!profile?.is_premium && !profile?.is_admin && (
            <Button 
              onClick={() => setIsPremiumModalOpen(true)}
              variant="outline"
              className="h-14 px-8 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 rounded-2xl font-bold flex-1 sm:flex-none"
            >
              {t('upgrade_premium')}
            </Button>
          )}
          {profile?.role === 'client' && (
            <Button 
              onClick={() => setIsPostModalOpen(true)}
              className="h-14 px-8 bg-primary hover:bg-primary/80 shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-2xl font-bold flex-1 sm:flex-none"
            >
              {t('post_new_job')}
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
                <Card className="glass border-white/10 hover:border-white/20 transition-all group will-change-transform">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/40 mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-bold">{stat.value}</h3>
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
              {profile?.role === 'client' ? (
                <section>
                  <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    {t('freelancer_apps')}
                  </h2>
                  <ApplicationsList />
                </section>
              ) : (
                <Card className="glass border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      {t('recent_activity')}
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">{t('view_all')}</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activities.length > 0 ? activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                            {activity.type === 'application' ? <Briefcase className="w-5 h-5 text-blue-400" /> : 
                             activity.type === 'message' ? <MessageSquare className="w-5 h-5 text-purple-400" /> : 
                             <Star className="w-5 h-5 text-yellow-400" />}
                          </div>
                          <div>
                            <h4 className="font-medium group-hover:text-primary transition-colors">
                              {profile?.role === 'client' ? `Application for ${activity.job_title}` : `Applied to ${activity.job_title}`}
                            </h4>
                            <p className="text-sm text-white/40">{new Date(activity.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`capitalize border-white/10 ${
                          activity.status === 'accepted' ? 'text-green-400 bg-green-400/10' :
                          activity.status === 'rejected' ? 'text-red-400 bg-red-400/10' :
                          'text-white/40'
                        }`}>
                          {activity.status}
                        </Badge>
                      </div>
                    )) : (
                      <div className="py-12 text-center">
                        <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-white/60 mb-1">{t('no_activity')}</h4>
                        <p className="text-sm text-white/30">{t('no_activity_desc')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions / Profile Completion */}
            <div className="space-y-6">
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
                        className="text-white/5"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364}
                        strokeDashoffset={364 * (1 - 0.85)}
                        className="text-primary"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">85%</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/50 text-center mb-6">{t('portfolio_cta')}</p>
                  <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">{t('complete_profile')}</Button>
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
                    <Button key={link.label} variant="ghost" className="w-full justify-between hover:bg-white/5 text-white/70 hover:text-white">
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
