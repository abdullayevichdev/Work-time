import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, setDoc, serverTimestamp, addDoc 
} from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, Inbox, Check, X, Eye, Clock, DollarSign, 
  Briefcase, Heart, MessageSquare, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { sendNotification } from '@/lib/notifications';

export function RequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    // Real-time peerRequests subscriber sorted by creation time
    const q = query(
      collection(db, 'peerRequests'),
      where(activeTab === 'inbox' ? 'toUserId' : 'fromUserId', '==', auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      rows.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.created_at || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      });
      setRequests(rows);
      setLoading(false);
    }, (err) => {
      console.error("Requests listener failed", err);
      setLoading(false);
    });

    return () => unsub();
  }, [activeTab]);

  const handleAccept = async (req: any) => {
    if (!auth.currentUser) return;
    try {
      const reqRef = doc(db, 'peerRequests', req.id);
      
      // 1. Transition request status
      await updateDoc(reqRef, {
        status: 'accepted',
        respondedAt: serverTimestamp()
      });

      // 2. Initialize real-time chat between participants
      const chatId = [req.fromUserId, req.toUserId].sort().join('_');
      const chatRef = doc(db, 'conversations', chatId);
      
      const otherName = req.fromUserSnapshot?.displayName || 'User';
      const otherAvatar = req.fromUserSnapshot?.avatar || '';

      await setDoc(chatRef, {
        id: chatId,
        participants: [req.fromUserId, req.toUserId],
        initiatedFromRequestId: req.id,
        lastMessage: 'Suhbat boshlandi! Ish taklifi qabul qilindi. 🎉',
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [req.fromUserId]: 0,
          [req.toUserId]: 0
        },
        participantsSnapshot: {
          [req.fromUserId]: {
            displayName: req.fromUserSnapshot?.displayName || 'Freelancer',
            avatar: req.fromUserSnapshot?.avatar || ''
          },
          [req.toUserId]: {
            displayName: auth.currentUser.displayName || 'Employer',
            avatar: auth.currentUser.photoURL || ''
          }
        }
      }, { merge: true });

      // 3. Add initial welcome message in the messages subcollection
      const msgRef = collection(db, 'conversations', chatId, 'messages');
      await addDoc(msgRef, {
        senderId: auth.currentUser.uid,
        sender_id: auth.currentUser.uid,
        text: 'Loyiha taklifingizni qabul qildim! Keling, tafsilotlarni gaplashib olamiz.',
        content: 'Loyiha taklifingizni qabul qildim! Keling, tafsilotlarni gaplashib olamiz.',
        createdAt: serverTimestamp(),
        created_at: new Date().toISOString(),
        is_read: false
      });

      // 4. Trigger pushing standard notification for sender
      await addDoc(collection(db, 'notifications'), {
        userId: req.fromUserId,
        type: 'request_accepted',
        title: '🎉 Loyiha taklifingiz qabul qilindi!',
        message: `${auth.currentUser.displayName || 'Hamkor'} sizning taklifingizni qabul qildi. Chat ochildi!`,
        body: `${auth.currentUser.displayName || 'Hamkor'} sizning taklifingizni qabul qildi. Chat ochildi!`,
        actorId: auth.currentUser.uid,
        actorName: auth.currentUser.displayName || 'Hamkor',
        actorAvatar: auth.currentUser.photoURL || '',
        link: `/messages?userId=${auth.currentUser.uid}`,
        read: false,
        createdAt: serverTimestamp(),
        created_at: new Date().toISOString()
      });

      toast.success(`✅ Taklif qabul qilindi! ${otherName} bilan chat ochildi.`);
      navigate(`/messages?userId=${req.fromUserId}`);
    } catch (err) {
      console.error(err);
      toast.error('Taklifni qabul qilishda xatolik.');
    }
  };

  const handleDecline = async (req: any) => {
    if (!auth.currentUser) return;
    try {
      const reqRef = doc(db, 'peerRequests', req.id);
      
      // 1. Transition status
      await updateDoc(reqRef, {
        status: 'declined',
        respondedAt: serverTimestamp()
      });

      // 2. Select beautiful encouraging supportive rejection variants
      const declineMessages = [
        `${auth.currentUser.displayName || 'Mutaxassis'} sizning hamkorlik so'rovingizni ko'rib chiqdi va hozircha mos kelmasligini bildirdi. Lekin xavotirlanmang — platformada yana ko'plab ajoyib mutaxassislar bor! Yangi imkoniyatlar oldinda! 🚀`,
        `${auth.currentUser.displayName || 'Mutaxassis'} hozirda yangi loyihalar qabul qila olmayapti, lekin sizning profilingiz ajoyib! Boshqa talantlarni ko'rishni davom eting va albatta mos hamkor topasiz. ⭐`,
        `Bu safar mos kelmadi, lekin har bir "yo'q" sizni keyingi ajoyib "ha" ga yaqinlashtiradi! Boshqa mutaxassislarni ko'rishni davom eting. Davom eting! 💪`
      ];
      
      const randomMsg = declineMessages[Math.floor(Math.random() * declineMessages.length)];

      // 3. Trigger pushing notification with the random supportive text
      await addDoc(collection(db, 'notifications'), {
        userId: req.fromUserId,
        type: 'request_declined',
        title: 'Loyiha taklifi bo\'yicha yangilanish',
        message: randomMsg,
        body: randomMsg,
        actorId: auth.currentUser.uid,
        actorName: auth.currentUser.displayName || 'Hamkor',
        actorAvatar: auth.currentUser.photoURL || '',
        link: `/talents`,
        read: false,
        createdAt: serverTimestamp(),
        created_at: new Date().toISOString()
      });

      toast.info('Taklif rad etildi va foydalanuvchiga rag\'batlantiruvchi bildirishnoma yuborildi.');
    } catch (err) {
      console.error(err);
      toast.error('Taklifni rad etishda xatolik.');
    }
  };

  return (
    <div className="pt-32 pb-20 container mx-auto px-6 max-w-4xl min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-indigo-950 uppercase tracking-widest">{t('requests_inbox') || 'Ish So\'rovnomalari'}</h1>
          <p className="text-xs text-indigo-950/50">{t('requests_subtitle') || 'To\'g\'ridan-to\'g\'ri peer-to-peer ish takliflari va loyiha kelishuvlari.'}</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-white/40 p-1 rounded-xl border border-white/60 shadow-sm">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'inbox' 
                ? 'bg-primary text-white shadow-sm shadow-primary/20' 
                : 'text-indigo-950/60 hover:text-indigo-950'
            }`}
          >
            <Inbox className="w-4 h-4" />
            {t('received') || 'Kelganlar'}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sent' 
                ? 'bg-primary text-white shadow-sm shadow-primary/20' 
                : 'text-indigo-950/60 hover:text-indigo-950'
            }`}
          >
            <Send className="w-4 h-4" />
            {t('sent') || 'Yuborilganlar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-3xl bg-white/30 border border-white/50 animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center p-16 rounded-[2rem] glass border-white/10 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-indigo-950">{activeTab === 'inbox' ? 'Hozircha hech qanday ish so\'rovi yo\'q' : 'Siz hali hech qanday ish so\'rovi yubormadingiz'}</h3>
          <p className="text-xs text-indigo-950/50 max-w-sm mx-auto">
            {activeTab === 'inbox' 
              ? 'Profilingizni faol va jozibador saqlang, boshqa foydalanuvchilar sizga loyiha taklif qilganlarida bu yerda paydo bo\'ladi.' 
              : 'Talents sahifasiga o\'tib, mutaxassislarni ko\'ring va ularga birinchi ish taklifini yuboring!'}
          </p>
          {activeTab === 'sent' && (
            <Button onClick={() => navigate('/talents')} className="bg-primary text-white font-bold h-10 px-6 rounded-xl">
              Mutaxassislarni topish
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isPending = req.status === 'pending';
            const isAccepted = req.status === 'accepted';
            const isDeclined = req.status === 'declined';
            const isExpired = req.status === 'expired';
            
            const isInbox = activeTab === 'inbox';
            
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl glass border-white/10 p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between"
              >
                <div className="flex gap-4 items-start flex-1 min-w-0">
                  <Avatar className="w-12 h-12 border border-white/20 shadow-md">
                    <AvatarImage src={req.fromUserSnapshot?.avatar || undefined} />
                    <AvatarFallback><Heart className="w-5 h-5 text-indigo-950/30" /></AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2 flex-1 min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-indigo-950 text-sharp text-sm">
                        {isInbox ? req.fromUserSnapshot?.displayName : t('to_user') || 'Mutaxassisga'}
                      </h4>
                      <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border shadow-sm ${
                        isAccepted ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        isDeclined ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        isExpired ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {req.status}
                      </Badge>
                    </div>

                    <p className="font-bold text-xs text-indigo-950">{req.subject}</p>
                    <p className="text-xs text-indigo-950/65 line-clamp-3">{req.message}</p>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-indigo-950/5 text-[10px] font-bold text-indigo-950/40">
                      {req.proposedBudget && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-primary" />
                          <span>${req.proposedBudget.toLocaleString()} ({t(`payment_period_${req.budgetType}`, { defaultValue: String(req.budgetType) })})</span>
                        </div>
                      )}
                      {req.estimatedDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-950/40" />
                          <span>{req.estimatedDuration}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-950/40" />
                        <span>
                          {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action controls for Inbox Pending Requests */}
                {isInbox && isPending && (
                  <div className="flex md:flex-col justify-end gap-2 shrink-0 my-auto">
                    <Button 
                      size="sm" 
                      onClick={() => handleAccept(req)}
                      className="bg-primary hover:bg-primary/95 text-white font-bold h-9 px-4 rounded-xl shadow-md shadow-primary/10 gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Qabul qilish
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDecline(req)}
                      className="border-red-500/20 text-red-500 hover:bg-red-500/5 font-bold h-9 px-4 rounded-xl gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Rad etish
                    </Button>
                  </div>
                )}

                {/* Message redirection button for accepted threads */}
                {isAccepted && (
                  <div className="flex items-center shrink-0 justify-end my-auto">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/messages?userId=${isInbox ? req.fromUserId : req.toUserId}`)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-9 px-4 rounded-xl gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat ochish
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
