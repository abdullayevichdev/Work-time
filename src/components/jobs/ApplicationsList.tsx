import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock, Check, X, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { sendNotification } from '@/lib/notifications';

export function ApplicationsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, 'proposals'),
      where('client_id', '==', auth.currentUser.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching proposals:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (app: any, status: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'proposals', app.id), { status });
      setApplications(applications.map(a => 
        a.id === app.id ? { ...a, status } : a
      ));
      
      // Notify the freelancer
      await sendNotification(
        app.freelancer_id,
        status === 'accepted' ? t('proposal_accepted') : t('proposal_rejected'),
        status === 'accepted' 
          ? t('proposal_accepted_desc', { job: app.job_title }) 
          : t('proposal_rejected_desc', { job: app.job_title }),
        'application'
      );

      toast.success(t('proposal_status_updated'));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('error_update_status'));
    }
  };

  if (loading) return <div className="p-8 text-center text-white/40">{t('loading_apps')}</div>;

  if (applications.length === 0) {
    return (
      <div className="p-12 text-center glass border-white/10 rounded-3xl">
        <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">{t('no_apps_yet')}</h3>
        <p className="text-white/40">{t('no_apps_desc')}</p>
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
                <AvatarImage src={app.freelancer_avatar || undefined} />
                <AvatarFallback>{app.freelancer_name[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-xl font-bold">{app.freelancer_name}</h4>
                    <p className="text-primary text-sm font-medium">{t('applied_for')} {app.job_title}</p>
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
                
                <p className="text-indigo-950/60 text-sm leading-relaxed mb-6 bg-indigo-900/5 p-4 rounded-xl border border-indigo-900/5 text-sharp">
                  "{app.cover_letter || app.message}"
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
                        onClick={() => handleStatusUpdate(app, 'rejected')}
                      >
                        <X className="w-4 h-4 mr-1" /> {t('reject')}
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-500"
                        onClick={() => handleStatusUpdate(app, 'accepted')}
                      >
                        <Check className="w-4 h-4 mr-1" /> {t('accept')}
                      </Button>
                    </div>
                  )}

                  {app.status === 'accepted' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => navigate(`/messages?userId=${app.freelancer_id}`)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" /> {t('message_freelancer')}
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
