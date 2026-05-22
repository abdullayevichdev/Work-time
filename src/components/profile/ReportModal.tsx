import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, AlertTriangle, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: any;
}

export function ReportModal({ isOpen, onClose, targetUser }: ReportModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<'spam' | 'inappropriate' | 'scam' | 'harassment' | 'other'>('spam');
  const [details, setDetails] = useState('');

  const targetName = targetUser?.full_name || targetUser?.displayName || '';

  const handleSubmit = async () => {
    if (!auth.currentUser || !targetUser) return;

    if (details.trim().length < 10) {
      toast.error(t('report_validation'));
      return;
    }

    setLoading(true);
    try {
      const reporterId = auth.currentUser.uid;
      const reportedUserId = targetUser.id || targetUser.uid;

      await addDoc(collection(db, 'reports'), {
        reporterId,
        reportedUserId,
        reason,
        details: details.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      toast.success(t('report_success'));
      onClose();
    } catch (err: any) {
      console.error('Report submit failed:', err);
      const code = err?.code || '';
      if (code === 'permission-denied') {
        toast.error(t('access_denied'), { description: t('access_denied_desc') });
      } else {
        toast.error(t('report_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectCls = "w-full h-11 px-3 bg-white border border-gray-200 text-gray-900 text-sm rounded-xl font-semibold focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 cursor-pointer";
  const labelCls = "text-[10px] font-black uppercase text-gray-600 ml-1";

  return (
    <motion.div className="fixed inset-0 pointer-events-auto z-50 overflow-hidden flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-white border border-gray-100 p-8 shadow-2xl relative text-left"
      >
        <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors">
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          {t('report_title')}
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          {t('report_subtitle', { name: targetName })}
        </p>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>{t('report_reason')}</label>
            <select
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value as typeof reason)}
              className={selectCls}
            >
              <option value="spam">{t('report_reason_spam')}</option>
              <option value="scam">{t('report_reason_scam')}</option>
              <option value="inappropriate">{t('report_reason_inappropriate')}</option>
              <option value="harassment">{t('report_reason_harassment')}</option>
              <option value="other">{t('report_reason_other')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelCls}>{t('report_details')}</label>
            <Textarea
              placeholder={t('report_details_placeholder')}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl min-h-[120px] text-sm font-medium focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all resize-none"
            />
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-xl text-sm font-bold h-11 px-5 text-gray-600 hover:bg-gray-100">
              {t('send_request_cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || details.trim().length < 10}
              className="bg-red-500 hover:bg-red-600 text-white font-black text-sm uppercase tracking-wider gap-2 h-11 px-6 rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('report_sending')}
                </>
              ) : (
                <>
                  {t('report_submit')}
                  <Check className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
