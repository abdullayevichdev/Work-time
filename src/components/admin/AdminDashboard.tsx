import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Check, X, ExternalLink, Users, Briefcase, CreditCard } from 'lucide-react';

export function AdminDashboard() {
  const [premiumRequests, setPremiumRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, jobs: 0, premium: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch Premium Requests
      const q = query(collection(db, 'premium_requests'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      setPremiumRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch Stats (Simplified for now)
      const usersSnap = await getDocs(collection(db, 'users'));
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      const premiumUsers = usersSnap.docs.filter(d => d.data().is_premium).length;

      setStats({
        users: usersSnap.size,
        jobs: jobsSnap.size,
        premium: premiumUsers
      });
    } catch (error) {
      console.error('Admin fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePremium = async (request: any) => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'premium_requests', request.id), { status: 'approved' });
      
      // 2. Update user profile
      await updateDoc(doc(db, 'users', request.user_id), { is_premium: true });
      
      toast.success(`Approved premium for ${request.user_name}`);
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleRejectPremium = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'premium_requests', requestId), { status: 'rejected' });
      toast.success('Request rejected');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white/40">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.users}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-white/40">Total Jobs</p>
              <h3 className="text-2xl font-bold">{stats.jobs}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-white/40">Premium Users</p>
              <h3 className="text-2xl font-bold">{stats.premium}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Premium Upgrade Requests
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
                  <p className="text-xs text-white/40">Requested: {new Date(req.created_at).toLocaleString()}</p>
                  <a 
                    href={req.proof_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View Proof of Payment <ExternalLink className="w-3 h-3" />
                  </a>
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
                        onClick={() => handleRejectPremium(req.id)}
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
            <div className="text-center py-12 glass border-white/10 rounded-2xl text-white/40">
              No pending requests.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
