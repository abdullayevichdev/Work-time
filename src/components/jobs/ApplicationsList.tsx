import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock, Check, X, MessageSquare } from 'lucide-react';

export function ApplicationsList() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'applications'),
        where('client_id', '==', auth.currentUser.uid),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status });
      setApplications(applications.map(app => 
        app.id === appId ? { ...app, status } : app
      ));
      toast.success(`Application ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 text-center text-white/40">Loading applications...</div>;

  if (applications.length === 0) {
    return (
      <div className="p-12 text-center glass border-white/10 rounded-3xl">
        <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No applications yet</h3>
        <p className="text-white/40">When freelancers apply to your jobs, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <Card key={app.id} className="glass border-white/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="w-16 h-16 border border-white/10">
                <AvatarImage src={app.freelancer_avatar} />
                <AvatarFallback>{app.freelancer_name[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-xl font-bold">{app.freelancer_name}</h4>
                    <p className="text-primary text-sm font-medium">Applied for: {app.job_title}</p>
                  </div>
                  <Badge 
                    className={`capitalize ${
                      app.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                      app.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                    }`}
                  >
                    {app.status}
                  </Badge>
                </div>
                
                <p className="text-white/60 text-sm leading-relaxed mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                  "{app.message}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(app.created_at).toLocaleDateString()}
                  </div>
                  
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-400 hover:bg-red-400/10 hover:text-red-400"
                        onClick={() => handleStatusUpdate(app.id, 'rejected')}
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-500"
                        onClick={() => handleStatusUpdate(app.id, 'accepted')}
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                    </div>
                  )}

                  {app.status === 'accepted' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => toast.info('Messaging feature coming soon!')}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" /> Message Freelancer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
