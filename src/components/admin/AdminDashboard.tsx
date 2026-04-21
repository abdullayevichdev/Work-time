import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Check, X, ExternalLink, Users, Briefcase, CreditCard, FileText, Maximize2, User } from 'lucide-react';
import { ADMIN_USERS } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [premiumRequests, setPremiumRequests] = useState<any[]>([]);
  const [standardUsers, setStandardUsers] = useState<any[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, jobs: 0, premium: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubRequests: () => void = () => {};
    let unsubUsers: () => void = () => {};
    let unsubJobs: () => void = () => {};

    // 0. Permission check
    const checkAdmin = onAuthStateChanged(auth, (u) => {
      console.log('Auth state in AdminDashboard:', u?.email);
      const userAllowed = u?.email && ADMIN_USERS[u.email.toLowerCase()];
      if (!u || !userAllowed) {
        if (!u) {
          console.log('No user found yet, waiting...');
          return; // Wait for initial load
        }
        console.log('Admin check failed for:', u?.email);
        toast.error(t('access_denied'));
        navigate('/');
        return;
      }
      console.log(`Admin check passed for: ${ADMIN_USERS[u.email.toLowerCase()]}`);
      setLoading(true);

      // 1. Real-time Premium Requests
      const qRequests = query(collection(db, 'premium_requests'), orderBy('created_at', 'desc'));
      unsubRequests = onSnapshot(qRequests, (snap) => {
        setPremiumRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, (err) => {
        console.error("Premium requests listener error:", err);
        setLoading(false);
      });

      // 2. Real-time Users Stat & Standard Users List
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const usersData = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const premiumCount = usersData.filter(u => u.is_premium).length;
        setStats(prev => ({
          ...prev,
          users: snap.size,
          premium: premiumCount
        }));
        
        // Filter standard users
        const registeredStandardUsers = usersData.filter(u => !u.is_premium).sort((a: any, b: any) => {
           const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
           const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
           return timeB - timeA;
        });
        setStandardUsers(registeredStandardUsers);
        
        // Filter premium users
        const registeredPremiumUsers = usersData.filter(u => u.is_premium).sort((a: any, b: any) => {
           const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
           const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
           return timeB - timeA;
        });
        setPremiumUsers(registeredPremiumUsers);
      }, (err) => {
        console.error("Users listener error:", err);
      });

      // 3. Real-time Jobs Stat
      unsubJobs = onSnapshot(collection(db, 'jobs'), (snap) => {
        setStats(prev => ({
          ...prev,
          jobs: snap.size
        }));
      }, (err) => {
        console.error("Jobs listener error:", err);
      });
    });

    return () => {
      checkAdmin();
      unsubRequests();
      unsubUsers();
      unsubJobs();
    };
  }, [navigate]);

  const handleApprovePremium = async (request: any) => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'premium_requests', request.id), { status: 'approved' });
      
      // 2. Update user profile
      await updateDoc(doc(db, 'users', request.user_id), { 
        is_premium: true, 
        premium_since: new Date().toISOString(),
        premium_status: null 
      });
      
      toast.success(`${t('approved_premium')} ${request.user_name}`);
    } catch (error) {
      toast.error(t('failed_to_approve'));
    }
  };

  const handleRejectPremium = async (request: any) => {
    try {
      await updateDoc(doc(db, 'premium_requests', request.id), { status: 'rejected' });
      await updateDoc(doc(db, 'users', request.user_id), { premium_status: 'rejected' });
      toast.success(t('request_rejected'));
    } catch (error) {
      toast.error(t('failed_to_reject'));
    }
  };

  if (loading) return <div className="p-10 text-center">{t('loading_admin')}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-medium tracking-tight mb-2">
          {auth.currentUser?.email && ADMIN_USERS[auth.currentUser.email.toLowerCase()] 
            ? `${ADMIN_USERS[auth.currentUser.email.toLowerCase()]} ${t('admin_overview')}` 
            : t('admin_overview')}
        </h1>
        <p className="text-indigo-950/60 font-medium">{t('platform_stats_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-indigo-950/40 font-medium">{t('total_users_count')}</p>
              <h3 className="text-2xl font-bold text-indigo-950">{stats.users}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-indigo-950/40 font-medium">{t('total_jobs_count')}</p>
              <h3 className="text-2xl font-bold text-indigo-950">{stats.jobs}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-indigo-950/40 font-medium">{t('premium_users_count')}</p>
              <h3 className="text-2xl font-bold text-indigo-950">{stats.premium}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          {t('premium_requests_title')}
        </h2>
        
        <div className="space-y-4">
          {premiumRequests.map((req) => (
            <Card key={req.id} className="glass border-white/10">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold">{req.user_name}</h4>
                    <Badge variant="outline" className="text-[10px] border-white/10">{req.user_email}</Badge>
                  </div>
                  <p className="text-xs text-indigo-950/40">{t('requested_at')} {new Date(req.created_at).toLocaleString()}</p>
                  <div className="mt-3 flex items-center gap-3">
                    {req.receipt_url ? (
                      <Dialog>
                        <DialogTrigger className="bg-transparent border-none p-0 outline-none">
                          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer shadow-sm border border-primary/20 px-3 py-1">
                            <FileText className="w-3.5 h-3.5 mr-1.5" /> {t('view_receipt')} {req.receipt_name} <Maximize2 className="w-3 h-3 ml-2 opacity-50"/>
                          </Badge>
                        </DialogTrigger>
                        <DialogContent className="max-w-[90vw] md:max-w-4xl w-full p-0 overflow-hidden bg-transparent border-0 shadow-2xl rounded-2xl">
                          <div className="relative group">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10" />
                            <img src={req.receipt_url} alt="Receipt Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl" />
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] bg-white/20">
                        <FileText className="w-3 h-3 mr-1" /> {req.receipt_name}
                      </Badge>
                    )}
                    <span className="text-[10px] text-indigo-900/40 italic">{t('file_verified')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge 
                    className={`capitalize ${
                      req.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      req.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {req.status}
                  </Badge>
                  
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-400 hover:bg-red-400/10"
                        onClick={() => handleRejectPremium(req)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-500"
                        onClick={() => handleApprovePremium(req)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {premiumRequests.length === 0 && (
            <div className="text-center py-12 glass border-indigo-900/5 rounded-2xl text-indigo-900/40">
              {t('no_pending_requests')}
            </div>
          )}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-yellow-500" />
          {t('premium_users_title')}
        </h2>
        
        <div className="space-y-4">
          {premiumUsers.map((u) => (
            <Card key={u.id} className="glass border-yellow-500/20 hover:border-yellow-500/40 transition-all cursor-pointer" onClick={() => navigate(`/profile/${u.id}`)}>
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold relative z-10 text-sharp">{u.full_name || t('no_name_provided')}</h4>
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 text-[10px] tracking-widest font-black uppercase text-sharp">{u.role}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-indigo-950/60 font-medium">
                    <span>{u.email}</span>
                  </div>
                  <div className="text-xs text-indigo-900/40">
                    {t('premium_since')} {u.premium_since ? new Date(u.premium_since).toLocaleDateString() : t('unknown_date')}
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 px-4 shadow-sm border border-yellow-500/20 py-2 bg-yellow-500/5 rounded-2xl text-xs font-bold text-yellow-600 uppercase tracking-widest">
                  {t('premium_active')}
                </div>
              </CardContent>
            </Card>
          ))}
          {premiumUsers.length === 0 && (
            <div className="text-center py-12 glass border-indigo-900/5 rounded-2xl text-indigo-900/40">
              {t('no_premium_users')}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          {t('standard_users_title')}
        </h2>
        
        <div className="space-y-4">
          {standardUsers.map((u) => (
            <Card key={u.id} className="glass border-white/10 hover:border-primary/20 transition-all cursor-pointer" onClick={() => navigate(`/profile/${u.id}`)}>
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold relative z-10 text-sharp">{u.full_name || t('no_name_provided')}</h4>
                    <Badge variant="secondary" className="bg-white/40 text-black text-[10px] tracking-widest font-black uppercase text-sharp">{u.role}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-indigo-950/60 font-medium">
                    <span>{u.email}</span>
                  </div>
                  <div className="text-xs text-indigo-900/40">
                    {t('joined_at')} {u.created_at ? new Date(u.created_at).toLocaleDateString() : t('unknown_date')}
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 px-4 shadow-sm border border-indigo-900/5 py-2 glass rounded-2xl text-xs font-bold text-indigo-900/40 uppercase tracking-widest">
                  {t('not_premium')}
                </div>
              </CardContent>
            </Card>
          ))}
          {standardUsers.length === 0 && (
            <div className="text-center py-12 glass border-indigo-900/5 rounded-2xl text-indigo-900/40">
              {t('no_standard_users')}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
