import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { db, auth } from '@/lib/firebase';
import { 
  collection, query, where, orderBy, limit, 
  onSnapshot, doc, updateDoc, writeBatch, getDocs 
} from 'firebase/firestore';
import { Bell, ShieldCheck, Mail, Briefcase, Sparkles, Check, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Synthesize a pristine, high-end high ping glass chime using Web Audio API
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    // Chime F6 frequency (Premium high crisp tone)
    oscillator.frequency.setValueAtTime(1396.91, audioCtx.currentTime);
    
    // Decay envelope for a soft glass chime sound
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.6);
  } catch (e) {
    console.warn("Web Audio chime synthesis failed", e);
  }
}

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Track previous count to play sound only on increment
  const prevCountRef = useRef(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Real-time unread list listener (capped at latest 10)
    const qUnread = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(qUnread, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const unreadList = list.filter((n: any) => !n.read && !n.is_read);
      
      setNotifications(list);
      setUnreadCount(unreadList.length);

      // Trigger ping alert on new notifications
      if (!isFirstLoad.current && unreadList.length > prevCountRef.current) {
        playChime();
      }
      
      prevCountRef.current = unreadList.length;
      isFirstLoad.current = false;
    }, (err) => {
      console.warn("Notifications listener error", err);
    });

    return () => unsub();
  }, []);

  // Handle clicking outside to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      
      snap.docs.forEach(docSnap => {
        if (!docSnap.data().read) {
          batch.update(docSnap.ref, { read: true, is_read: true });
        }
      });
      await batch.commit();
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = async (notif: any) => {
    setOpen(false);
    try {
      const docRef = doc(db, 'notifications', notif.id);
      await updateDoc(docRef, { read: true, is_read: true });
    } catch (err) {
      console.error("Error marking read", err);
    }

    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Helper icons mapper
  const renderNotifIcon = (type: string) => {
    switch (type) {
      case 'request_received': return <Briefcase className="w-4 h-4 text-purple-500" />;
      case 'request_accepted': return <Sparkles className="w-4 h-4 text-green-500 animate-bounce" />;
      case 'request_declined': return <X className="w-4 h-4 text-red-400" />;
      case 'message': return <Mail className="w-4 h-4 text-primary" />;
      default: return <ShieldCheck className="w-4 h-4 text-indigo-900/40" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 rounded-xl bg-white/40 border border-white/60 flex items-center justify-center relative cursor-pointer hover:bg-white/50 transition-colors"
      >
        <Bell className="w-5 h-5 text-indigo-950" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown Panel overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 rounded-2xl glass border border-white/10 shadow-2xl overflow-hidden z-50 origin-top-right"
          >
            <div className="p-4 border-b border-indigo-950/5 flex justify-between items-center bg-white/30">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">{t('notifications') || 'Bildirishnomalar'}</h4>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[9px] font-black uppercase text-primary hover:brightness-90 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  {t('mark_all_read') || 'Hammasini o\'qish'}
                </button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-indigo-950/5">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-indigo-950/40">
                  {t('no_notifications') || 'Yangi bildirishnomalar yo\'q.'}
                </div>
              ) : (
                notifications.map((n) => {
                  const isUnread = !n.read && !n.is_read;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`p-3.5 flex gap-3 cursor-pointer hover:bg-white/20 transition-all text-left ${
                        isUnread ? 'bg-primary/5 border-l-2 border-primary' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.actorAvatar ? (
                          <Avatar className="w-7 h-7 border border-white/20">
                            <AvatarImage src={n.actorAvatar} />
                            <AvatarFallback>{renderNotifIcon(n.type)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-indigo-950/5 flex items-center justify-center">
                            {renderNotifIcon(n.type)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-black text-indigo-950 truncate ${isUnread ? 'text-primary' : ''}`}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-indigo-950/60 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                          {n.message || n.body || n.content}
                        </p>
                        {n.createdAt && (
                          <span className="text-[8px] text-indigo-950/30 font-bold block mt-1">
                            {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
