import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, where, orderBy, limit } from 'firebase/firestore';
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
  const [workRequests, setWorkRequests] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, jobs: 0, premium: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUsers: () => void = () => {};
    let unsubJobs: () => void = () => {};
    let unsubRequests: () => void = () => {};
    let unsubPremium: () => void = () => {};
    let unsubMessages: () => void = () => {};

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

      // 1. Real-time Users Stat & Standard Users List
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const usersData = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        // Premium check based on admin emails
        const adminEmails = ['abdulxayavazxanov2012@gmail.com', 'unknownprogrammerdev@gmail.com', 'tuyginovsardor4@gmail.com'];
        const premiumCount = usersData.filter(u => u.is_premium || adminEmails.includes(u.email)).length;
        
        setStats(prev => ({
          ...prev,
          users: snap.size,
          premium: premiumCount
        }));
        
        // Filter standard users
        const registeredStandardUsers = usersData.filter(u => !u.is_premium && !adminEmails.includes(u.email)).sort((a: any, b: any) => {
           const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
           const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
           return timeB - timeA;
        });
        setStandardUsers(registeredStandardUsers);
        
        // Filter premium users
        const registeredPremiumUsers = usersData.filter(u => u.is_premium || adminEmails.includes(u.email)).sort((a: any, b: any) => {
           const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
           const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
           return timeB - timeA;
        });
        setPremiumUsers(registeredPremiumUsers);
        setLoading(false);
      }, (err) => {
        console.error("Users listener error:", err);
        setLoading(false);
      });

      // 2. Real-time Jobs Stat
      unsubJobs = onSnapshot(collection(db, 'jobs'), (snap) => {
        setStats(prev => ({
          ...prev,
          jobs: snap.size
        }));
      }, (err) => {
        console.error("Jobs listener error:", err);
      });

      // 3. Real-time Work Requests Log
      unsubRequests = onSnapshot(query(collection(db, 'work_requests'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
        setWorkRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Requests listener error:", err);
      });

      // 4. Real-time Premium Requests
      unsubPremium = onSnapshot(query(collection(db, 'premium_requests'), orderBy('created_at', 'desc')), (snap) => {
        setPremiumRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Premium listener error:", err);
      });

      // 5. Real-time Recent Support Messages
      unsubMessages = onSnapshot(query(collection(db, 'messages'), where('participants', 'array-contains', 'platform_support'), orderBy('created_at', 'desc'), limit(50)), (snap) => {
        setRecentMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((m: any) => m.sender_id !== 'platform_support'));
      }, (err) => {
        console.error("Messages listener error:", err);
      });
    });

    return () => {
      checkAdmin();
      unsubUsers();
      unsubJobs();
      unsubRequests();
      unsubPremium();
      unsubMessages();
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          {t('admin_activity')}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass border-white/10 overflow-hidden">
            <CardHeader className="border-b border-white/5 py-4 px-6 md:px-8 bg-white/5">
              <CardTitle className="text-sm font-bold text-indigo-950/40 uppercase tracking-widest text-sharp">
                {t('admin_activity_desc')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto divide-y divide-indigo-900/5">
                {workRequests.map((req) => (
                  <div key={req.id} className="p-4 md:p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group">
                    <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                      req.status === 'accepted' ? 'bg-green-500 shadow-sm shadow-green-500/20' : 
                      req.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-indigo-950 font-bold mb-1 text-sharp">
                        {req.status === 'accepted' ? (
                          t('request_accepted_by', { sender: req.senderName, receiver: req.receiverName })
                        ) : (
                          t('request_sent_by', { sender: req.senderName, receiver: req.receiverName })
                        )}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-indigo-900/40 font-bold uppercase tracking-tighter">
                          {new Date(req.createdAt).toLocaleString()}
                        </span>
                        <Badge variant="secondary" className={`text-[8px] font-black uppercase tracking-widest px-2 py-0 ${
                          req.status === 'accepted' ? 'bg-green-500/10 text-green-600' : 
                          req.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 
                          'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {req.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => navigate(`/profile/${req.senderId}`)}
                        title="View Sender"
                      >
                        <User className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => navigate(`/profile/${req.receiverId}`)}
                        title="View Receiver"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {workRequests.length === 0 && (
                  <div className="p-12 text-center text-indigo-900/20 font-bold uppercase tracking-widest text-xs">
                    {t('no_activity')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 overflow-hidden">
            <CardHeader className="border-b border-white/5 py-4 px-6 md:px-8 bg-white/5">
              <CardTitle className="text-sm font-bold text-indigo-950/40 uppercase tracking-widest text-sharp flex items-center justify-between">
                Recent Support Messages
                <Button variant="link" onClick={() => navigate('/messages?userId=platform_support')} className="text-[10px] text-primary p-0 h-auto">View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto divide-y divide-indigo-900/5">
                {recentMessages.map((msg) => (
                  <div key={msg.id} className="p-4 md:p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => navigate(`/messages?userId=support_${msg.sender_id}`)}>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/20 shrink-0">
                      <img src={msg.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-indigo-950 font-bold mb-1 text-sharp truncate">
                        {msg.sender_name}
                      </p>
                      <p className="text-xs text-indigo-950/60 line-clamp-2">
                        {msg.text}
                      </p>
                      <div className="text-[10px] text-indigo-900/40 font-bold uppercase tracking-tighter mt-2">
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {recentMessages.length === 0 && (
                  <div className="p-12 text-center text-indigo-900/20 font-bold uppercase tracking-widest text-xs">
                    No recent messages
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
