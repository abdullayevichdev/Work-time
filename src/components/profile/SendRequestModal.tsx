import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { 
  collection, query, where, getDocs, doc, 
  getDoc, addDoc, updateDoc, serverTimestamp, Timestamp 
} from 'firebase/firestore';
import { PAYMENT_PERIODS, PaymentPeriod } from '@/constants';
import { 
  X, Send, DollarSign, Clock, Paperclip, 
  AlertTriangle, Loader2, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface SendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: any;
}

export function SendRequestModal({ isOpen, onClose, targetUser }: SendRequestModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canSend, setCanSend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetType, setBudgetType] = useState<PaymentPeriod>('permanent');
  const [duration, setDuration] = useState('1-2 weeks');
  const [attachmentBase64, setAttachmentBase64] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!isOpen || !auth.currentUser || !targetUser) return;
    
    // Perform all strict anti-spam, limit, cooldown and validation checks
    const runChecks = async () => {
      setChecking(true);
      setErrorMsg('');
      
      const senderUid = auth.currentUser.uid;
      const targetUid = targetUser.id || targetUser.uid;

      if (senderUid === targetUid) {
        setErrorMsg(t('send_request_self_error'));
        setCanSend(false);
        setChecking(false);
        return;
      }

      try {
        // Fetch sender's current profile values
        const senderSnap = await getDoc(doc(db, 'users', senderUid));
        if (!senderSnap.exists()) {
          setErrorMsg(t('send_request_profile_not_found'));
          setCanSend(false);
          setChecking(false);
          return;
        }

        const senderData = senderSnap.data();
        const completion = Math.max(
          senderData.profileCompletion ?? 0,
          senderData.profileCompleteness ?? 0
        );
        
        // 1. Profile completion gate (80%)
        if (completion < 80) {
          setErrorMsg(t('send_request_profile_incomplete'));
          setCanSend(false);
          setChecking(false);
          return;
        }

        // 2. Block check
        const blockedBySender = senderData.blockedUsers || [];
        const targetSnap = await getDoc(doc(db, 'users', targetUid));
        const targetData = targetSnap.exists() ? targetSnap.data() : {};
        const blockedByTarget = targetData.blockedUsers || [];

        if (blockedBySender.includes(targetUid) || blockedByTarget.includes(senderUid)) {
          setErrorMsg(t('send_request_blocked_user'));
          setCanSend(false);
          setChecking(false);
          return;
        }

        // 3. Daily request limit for non-premium standard users
        const isPremium = senderData.membership === 'premium' || senderData.is_premium;
        const requestsSentToday = senderData.dailyRequestsSent || 0;
        if (!isPremium && requestsSentToday >= 10) {
          setErrorMsg(t('send_request_daily_limit'));
          setCanSend(false);
          setChecking(false);
          return;
        }

        // 4. Anti-spam delay (1 minute)
        if (senderData.lastRequestSentAt) {
          const lastSentTime = senderData.lastRequestSentAt.toDate ? senderData.lastRequestSentAt.toDate().getTime() : new Date(senderData.lastRequestSentAt).getTime();
          const timeDiffSec = (Date.now() - lastSentTime) / 1000;
          if (timeDiffSec < 60) {
            setErrorMsg(t('send_request_antispam', { seconds: Math.ceil(60 - timeDiffSec) }));
            setCanSend(false);
            setChecking(false);
            return;
          }
        }

        // 5. 30 days Resubmission Cooldown Check (gracefully skip if index missing)
        try {
          const qCooldown = query(
            collection(db, 'peerRequests'),
            where('fromUserId', '==', senderUid),
            where('toUserId', '==', targetUid),
            where('status', '==', 'declined')
          );
          const cooldownSnap = await getDocs(qCooldown);
          let hasActiveCooldown = false;
          
          cooldownSnap.docs.forEach((docSnap) => {
            const reqData = docSnap.data();
            if (reqData.respondedAt) {
              const respTime = reqData.respondedAt.toDate ? reqData.respondedAt.toDate().getTime() : new Date(reqData.respondedAt).getTime();
              const daysDiff = (Date.now() - respTime) / (1000 * 60 * 60 * 24);
              if (daysDiff < 30) {
                hasActiveCooldown = true;
              }
            }
          });

          if (hasActiveCooldown) {
            setErrorMsg(t('send_request_cooldown'));
            setCanSend(false);
            setChecking(false);
            return;
          }
        } catch (cooldownErr) {
          // Index not yet created — skip cooldown check, allow send
          console.warn('Cooldown index missing, skipping check:', cooldownErr);
        }

        setCanSend(true);
      } catch (err) {
        console.error("Pre-checks query failed", err);
        setErrorMsg(t('send_request_system_error'));
      } finally {
        setChecking(false);
      }
    };

    runChecks();
  }, [isOpen, targetUser, t]);

  // Canvas / File base64 attachment compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('send_request_file_too_large'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && dataUrl.length > 900000) {
        toast.error(t('send_request_attachment_too_large_db'));
        return;
      }
      setAttachmentBase64(dataUrl);
      setFileName(file.name);
      toast.success(t('send_request_file_attached'));
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!auth.currentUser || !targetUser || !canSend) return;
    
    if (subject.trim() === '' || message.trim().length < 30) {
      toast.error(t('send_request_validation'));
      return;
    }

    setLoading(true);
    try {
      const senderUid = auth.currentUser.uid;
      const targetUid = targetUser.id || targetUser.uid;

      // 1. Fetch sender snapshots
      const senderSnap = await getDoc(doc(db, 'users', senderUid));
      const senderData = senderSnap.exists() ? senderSnap.data() : {};

      const payload: any = {
        fromUserId: senderUid,
        fromUserSnapshot: {
          displayName: senderData.full_name || senderData.displayName || 'Freelancer',
          avatar: senderData.photo_url || senderData.photoURL || '',
          title: senderData.title || 'Professional',
          profileCompletion: senderData.profileCompletion || senderData.profileCompleteness || 80,
          rating: senderData.stats?.rating || 5.0
        },
        toUserId: targetUid,
        subject: subject.trim(),
        message: message.trim(),
        budgetType,
        estimatedDuration: duration,
        status: 'pending',
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only add optional fields if they have values (Firestore rejects undefined)
      if (budget) payload.proposedBudget = parseFloat(budget);
      if (attachmentBase64) payload.attachmentUrl = attachmentBase64;

      // 2. Save peerRequest document
      await addDoc(collection(db, 'peerRequests'), payload);

      // 3. Increment dailyRequestSent counter & timestamp of sender
      try {
        await updateDoc(doc(db, 'users', senderUid), {
          dailyRequestsSent: (senderData.dailyRequestsSent || 0) + 1,
          lastRequestSentAt: serverTimestamp()
        });
      } catch (counterErr) {
        console.warn('Could not update request counter:', counterErr);
      }

      // 4. Send notification (non-blocking — request already saved)
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: targetUid,
          type: 'request_received',
          title: t('notif_new_request_title'),
          message: t('notif_new_request_body', { name: senderData.full_name || 'Freelancer', subject: subject.trim() }),
          body: t('notif_new_request_body', { name: senderData.full_name || 'Freelancer', subject: subject.trim() }),
          actorId: senderUid,
          actorName: senderData.full_name || 'Freelancer',
          actorAvatar: senderData.photo_url || senderData.photoURL || '',
          link: '/requests',
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (notifErr) {
        console.warn('Notification failed:', notifErr);
      }

      toast.success(t('send_request_success'));
      onClose();
    } catch (err: any) {
      console.error('Send request failed:', err);
      const code = err?.code || '';
      if (code === 'permission-denied') {
        toast.error(t('access_denied'), { description: t('access_denied_desc') });
      } else {
        toast.error(t('send_request_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium";
  const selectCls = "h-11 px-3 bg-white border border-gray-200 text-gray-900 text-sm rounded-xl font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer";
  const labelCls = "text-[11px] font-black uppercase tracking-widest text-gray-500 ml-1";

  return (
    <div className="fixed inset-0 pointer-events-auto z-50 overflow-hidden flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg rounded-3xl bg-white border border-gray-100 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider">{t('send_request_title')}</h3>
              <p className="text-xs text-gray-400 font-medium">
                {t('send_request_subtitle', { name: targetUser?.full_name || targetUser?.displayName })}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {checking ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
              <p className="text-sm font-bold text-gray-500">{t('send_request_checking')}</p>
            </div>
          ) : !canSend ? (
            <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 my-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-red-600 uppercase tracking-wide mb-1">{t('send_request_blocked_title')}</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className={labelCls}>{t('send_request_subject')}</label>
                <Input 
                  placeholder={t('send_request_subject_placeholder')}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className={labelCls}>{t('send_request_message')}</label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${message.length < 30 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {t('send_request_message_counter', { count: message.length })}
                  </span>
                </div>
                <Textarea 
                  placeholder={t('send_request_message_placeholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  className="bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl min-h-[110px] text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Budget & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls}>{t('send_request_budget')}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        placeholder="150"
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className={`${inputCls} pl-9 text-sm`}
                      />
                    </div>
                    <select
                      value={budgetType}
                      onChange={(e) => setBudgetType(e.target.value as PaymentPeriod)}
                      className={`${selectCls} min-w-[7.5rem]`}
                      title={t('payment_period_label')}
                    >
                      {PAYMENT_PERIODS.map((period) => (
                        <option key={period.value} value={period.value}>
                          {t(period.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelCls}>{t('send_request_duration')}</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className={`w-full ${selectCls}`}
                  >
                    <option value="1-2 weeks">{t('send_request_duration_1_2_weeks')}</option>
                    <option value="2-4 weeks">{t('send_request_duration_2_4_weeks')}</option>
                    <option value="1-3 months">{t('send_request_duration_1_3_months')}</option>
                    <option value="3+ months">{t('send_request_duration_3_plus')}</option>
                  </select>
                </div>
              </div>

              {/* Attachment */}
              <div className="space-y-1.5">
                <label className={labelCls}>{t('send_request_attachment')} <span className="normal-case text-gray-400 font-medium">{t('send_request_attachment_hint')}</span></label>
                <div className="flex items-center gap-3">
                  <label className="h-11 px-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center gap-2 text-gray-500 bg-gray-50 cursor-pointer text-sm font-semibold hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all flex-1">
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="truncate">{fileName || t('send_request_select_file')}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                  </label>
                  {fileName && (
                    <button 
                      onClick={() => { setFileName(''); setAttachmentBase64(''); }}
                      className="h-11 w-11 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center cursor-pointer transition-colors font-black text-lg"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-sm font-bold h-11 px-5 text-gray-600 hover:bg-gray-100"
          >
            {t('send_request_cancel')}
          </Button>
          {canSend && (
            <Button
              onClick={handleSend}
              disabled={loading || subject.trim() === '' || message.length < 30}
              className="bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-wider gap-2 h-11 px-7 rounded-xl shadow-lg shadow-primary/25 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('send_request_sending')}
                </>
              ) : (
                <>
                  {t('send_request_send')}
                  <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
