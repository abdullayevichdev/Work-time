import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Briefcase, DollarSign, Tag, AlignLeft, Layers, Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PostJobModal({ isOpen, onClose, onSuccess }: PostJobModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    budget_type: 'fixed' as 'fixed' | 'hourly',
    category: 'Development',
    experience_level: 'intermediate' as 'entry' | 'intermediate' | 'expert',
    skills_required: [] as string[]
  });

  const addSkill = () => {
    if (skillInput && !formData.skills_required.includes(skillInput)) {
      setFormData({
        ...formData,
        skills_required: [...formData.skills_required, skillInput]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills_required: formData.skills_required.filter(s => s !== skill)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'jobs'), {
        ...formData,
        budget: Number(formData.budget),
        client_id: auth.currentUser.uid,
        status: 'open',
        created_at: new Date().toISOString()
      });

      toast.success(t('job_posted_success'));
      onSuccess();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'jobs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-3xl glass p-8 rounded-[40px] border-white/10 relative z-10 my-10"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-display font-bold">{t("post_new_job_1")} <span className="text-primary">{t("post_new_job_2")}</span></h2>
                <p className="text-white/40 text-sm">{t("fill_details_talent")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-white/50">{t("project_title")}</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                    <Input
                      placeholder={t("proj_title_placeholder")}
                      className="pl-12 bg-white/5 border-white/10 focus:border-primary h-14 rounded-2xl"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-white/50">{t("category")}</Label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                    <select
                      className="w-full h-14 pl-12 bg-white/5 border border-white/10 rounded-2xl focus:border-primary outline-none appearance-none"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Development">{t("cat_dev")}</option>
                      <option value="Design">{t("cat_design")}</option>
                      <option value="Marketing">{t("cat_marketing")}</option>
                      <option value="Writing">{t("cat_writing")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Budget & Level */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 rounded-3xl bg-white/5 border border-white/5">
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-white/50">{t("budget_type")}</Label>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant={formData.budget_type === 'fixed' ? 'default' : 'ghost'}
                      className={`flex-1 rounded-xl ${formData.budget_type === 'fixed' ? 'bg-primary' : 'glass border-white/10'}`}
                      onClick={() => setFormData({ ...formData, budget_type: 'fixed' })}
                    >
                      {t("fixed")}
                    </Button>
                    <Button 
                      type="button"
                      variant={formData.budget_type === 'hourly' ? 'default' : 'ghost'}
                      className={`flex-1 rounded-xl ${formData.budget_type === 'hourly' ? 'bg-primary' : 'glass border-white/10'}`}
                      onClick={() => setFormData({ ...formData, budget_type: 'hourly' })}
                    >
                      {t("hourly")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-white/50">{t("budget_amount")}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                    <Input
                      type="number"
                      placeholder="500"
                      className="pl-12 bg-white/5 border-white/10 focus:border-primary h-14 rounded-xl"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-white/50">{t("exp_level")}</Label>
                  <select
                    className="w-full h-14 px-4 bg-white/5 border border-white/10 rounded-xl focus:border-primary outline-none appearance-none"
                    value={formData.experience_level}
                    onChange={(e: any) => setFormData({ ...formData, experience_level: e.target.value })}
                  >
                    <option value="entry">{t("entry_level")}</option>
                    <option value="intermediate">{t("intermediate")}</option>
                    <option value="expert">{t("expert")}</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-widest text-white/50">{t("proj_desc")}</Label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-primary/50" />
                  <Textarea
                    placeholder={t("proj_desc_placeholder")}
                    className="pl-12 bg-white/5 border-white/10 focus:border-primary min-h-[160px] rounded-3xl"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-widest text-white/50">{t("req_skills")}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("add_skill_placeholder")}
                    className="bg-white/5 border-white/10 h-14 rounded-2xl"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} className="h-14 w-14 rounded-2xl bg-primary">
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills_required.map(skill => (
                    <Badge 
                      key={skill} 
                      className="bg-primary/10 border-primary/20 text-primary py-2 px-4 rounded-xl cursor-not-allowed group"
                    >
                      {skill}
                      <X className="ml-2 w-3 h-3 cursor-pointer hover:text-white" onClick={() => removeSkill(skill)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl glass border-white/10">
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20">
                  {loading ? t("publishing") : t("publish_job")}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
