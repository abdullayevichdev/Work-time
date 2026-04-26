import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, setDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function WorkRequestsList({ role }: { role: 'freelancer' | 'client' | 'job_seeker' | 'employer' }) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Clients/Employers see requests they SENT
    // Freelancers/Job Seekers see requests they RECEIVED
    const isHireRole = role === 'client' || role === 'employer';
    const field = isHireRole ? 'senderId' : 'receiverId';
    
    const q = query(
      collection(db, 'work_requests'),
      where(field, '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching work requests:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected', otherPartyId: string, otherPartyName: string) => {
    try {
      await updateDoc(doc(db, 'work_requests', requestId), { status });
      
      if (status === 'accepted') {
        toast.success(t('request_accepted'));
        
        // Notify the seeker
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          userId: otherPartyId,
          type: 'request_accepted',
          fromUserId: auth.currentUser?.uid,
          fromUserName: auth.currentUser?.displayName || 'Employer',
          content: `${auth.currentUser?.displayName} sizning so'rovingizni qabul qildi!`,
          read: false,
          createdAt: new Date().toISOString()
        });
      } else {
        toast.info(t('request_rejected'));
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error(t('failed_to_update'));
    }
  };

  if (loading) return <div className="p-8 text-center opacity-50">Loading requests...</div>;

  if (requests.length === 0) {
    return (
      <div className="p-12 text-center glass rounded-3xl border-white/10">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
        <p className="text-indigo-900/40 font-bold uppercase tracking-widest text-xs">{t('no_activity')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const isMeSender = request.senderId === auth.currentUser?.uid;
        const isMeRecipient = request.receiverId === auth.currentUser?.uid;
        
        const displayPartyId = isMeSender ? request.receiverId : request.senderId;
        const displayPartyName = isMeSender ? request.receiverName : request.senderName;
        const displayPartyPhoto = isMeSender ? request.receiverPhoto : request.senderPhoto;

        return (
          <div key={request.id} className="glass p-6 rounded-3xl border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-primary/20">
                <AvatarImage src={displayPartyPhoto || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {displayPartyName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-bold text-indigo-950 text-sharp flex items-center gap-2">
                  {displayPartyName}
                  {request.status === 'pending' && <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-yellow-500/10 text-yellow-600 border-none px-2">Pending</Badge>}
                  {request.status === 'accepted' && <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-green-500/10 text-green-600 border-none px-2">Accepted</Badge>}
                  {request.status === 'rejected' && <Badge variant="secondary" className="text-[9px] uppercase font-bold bg-red-500/10 text-red-600 border-none px-2">Rejected</Badge>}
                </h4>
                <p className="text-xs text-indigo-900/40 font-medium">
                  {new Date(request.createdAt).toLocaleDateString()} • {isMeSender ? 'You sent a request' : 'Sent you a request'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="text-indigo-900/40 hover:text-primary">
                 <Link to={`/profile/${displayPartyId}`} className="flex items-center gap-2 text-xs font-bold text-sharp">
                   View Profile <ArrowRight className="w-3 h-3" />
                 </Link>
              </Button>
              
              {isMeRecipient && request.status === 'pending' && (
              <>
                <Button 
                  onClick={() => handleAction(request.id, 'rejected', request.senderId, request.senderName)}
                  variant="ghost" 
                  size="sm" 
                  className="rounded-xl h-10 w-10 p-0 text-red-500 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => handleAction(request.id, 'accepted', request.senderId, request.senderName)}
                  className="rounded-xl h-10 bg-primary hover:bg-primary/90 text-white px-6 font-bold text-xs"
                >
                  <Check className="w-4 h-4 mr-2" /> {t('accept_request')}
                </Button>
              </>
            )}
          </div>
        </div>
      );
    })}
    </div>
  );
}
