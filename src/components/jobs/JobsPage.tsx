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
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>('freelancer');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        unsubProfile = onSnapshot(doc(db, 'users', u.uid), (snap) => {
          if (snap.exists()) setProfile(snap.data());
        });
      } else {
        setProfile(null);
      }
    });

    setLoading(true);
    // Fetch all users to show in the "Jobs/Opportunities" section
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('created_at', 'desc'));
    
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsersList(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Firebase snapshot error:', error);
      toast.error(t('error_sync_failed'));
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const filteredUsers = usersList.filter(u => 
    (selectedRole === null || u.role === selectedRole) &&
    ((u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))))
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
              <CardTitle className="text-lg">{t('categories')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: t('job_seekers'), id: 'freelancer' },
                { label: t('employers'), id: 'client' }
              ].map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => setSelectedRole(selectedRole === cat.id ? null : cat.id)}
                  className={`flex items-center justify-between p-2 rounded-lg hover:bg-white/40 cursor-pointer transition-colors group ${selectedRole === cat.id ? 'bg-primary/10' : ''}`}
                >
                  <span className={`font-medium text-sharp ${selectedRole === cat.id ? 'text-primary' : 'text-indigo-900/60 group-hover:text-primary'}`}>{cat.label}</span>
                  <Badge variant="outline" className={`${selectedRole === cat.id ? 'border-primary/30 text-primary bg-primary/5' : 'border-indigo-900/10 text-indigo-900/40'}`}>
                    {usersList.filter(u => u.role === cat.id).length}
                  </Badge>
                </div>
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
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u) => {
              const completion = calculateProfileCompletion(profile);
              const isComplete = completion >= 80;

              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group will-change-transform"
                >
                  <Card className={`glass-card border-white/10 will-change-transform hover:border-primary/30 transition-all ${(u.email && ADMIN_USERS[u.email.toLowerCase()]) ? 'border-primary/30 bg-primary/5' : ''}`}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                          <img 
                            src={u.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} 
                            alt={u.full_name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl text-indigo-950 group-hover:text-primary transition-colors text-sharp truncate">
                              {u.full_name || 'User'}
                            </CardTitle>
                            {u.email && ADMIN_USERS[u.email.toLowerCase()] ? (
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none font-black text-[8px] tracking-widest px-2 py-0">OWNER</Badge>
                            ) : u.is_premium && (
                              <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-none font-black text-[8px] tracking-widest px-2 py-0 uppercase">PREMIUM</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-indigo-900/40 font-bold uppercase tracking-widest text-sharp">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary" /> {u.location || t('uzbekistan')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-primary" /> {u.role === 'client' ? t('employers') : t('job_seekers')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <h4 className="text-sm font-bold text-indigo-950 mb-2 truncate">{u.title}</h4>
                      <p className="text-indigo-950/60 line-clamp-2 mb-6 leading-relaxed text-sharp text-sm">
                        {u.bio || t('no_bio')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {u.skills?.slice(0, 5).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-white/40 border-indigo-900/10 text-indigo-900/60 text-[10px] font-bold uppercase tracking-tighter">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className={`flex items-center ${u.hourly_rate ? 'justify-between' : 'justify-end'} border-t border-indigo-900/5 pt-6`}>
                      {u.hourly_rate && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl md:text-2xl font-bold text-indigo-950 text-sharp">${u.hourly_rate}</span>
                          <span className="text-indigo-900/40 text-xs md:text-sm font-medium text-sharp">/ {t('hr')}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          className="glass border-white/10 hover:bg-white/5 h-9 md:h-10 px-6 font-bold"
                          onClick={() => {
                            if (isComplete) {
                              navigate(`/profile/${u.id}`);
                            } else {
                              toast.error(t('complete_profile_first'), {
                                description: t('portfolio_cta'),
                                action: {
                                  label: t('complete_profile'),
                                  onClick: () => navigate('/profile')
                                }
                              });
                            }
                          }}
                        >
                          {t('view_details')}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-20 glass rounded-3xl border-white/10">
              <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{t('no_talents_found')}</h3>
              <p className="text-white/40">{t('adjust_search')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
