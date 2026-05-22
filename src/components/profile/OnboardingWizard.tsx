import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { calculateProfileCompletion } from '@/lib/profile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, Sparkles, Upload, Tag, MapPin, Briefcase, Phone, Check, 
  ArrowRight, ArrowLeft, Loader2, Star, ShieldCheck, Heart, Award
} from 'lucide-react';
import { toast } from 'sonner';

const SKILLS_POOL = [
  // Frontend
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'TailwindCSS', 'Vue.js', 'Angular',
  'HTML/CSS', 'Framer Motion', 'Frontend Junior', 'Frontend Developer',
  // Backend & Fullstack
  'Node.js', 'Python', 'Fullstack Developer', 'Express.js', 'Django', 'FastAPI',
  'GraphQL', 'REST API', 'PostgreSQL', 'MongoDB', 'Firebase', 'Supabase',
  // Design
  'UI/UX Design', 'Figma', 'Web Designer', 'Graphic Design', 'Product Design',
  'Adobe XD', 'Illustrator', 'Photoshop', 'Motion Design',
  // AI & Tech
  'AI Agent', 'Machine Learning', 'ChatGPT API', 'LangChain', 'Prompt Engineering',
  'Data Science', 'Computer Vision', 'NLP',
  // Mobile
  'Flutter', 'iOS', 'Android', 'React Native', 'SwiftUI', 'Kotlin',
  // Bots & Automation
  'Telegram Bot Maker', 'Discord Bot', 'Web Scraping', 'Automation',
  // Other Tech
  'Solidity', 'Web3', 'Blockchain', 'Smart Contracts', 'Hardware',
  'Robotics', 'IoT', 'Drones', 'C++', 'Rust', 'Go',
  // Freelance roles
  'Copywriting', 'SEO', 'Content Creation', 'Video Editing', 'Marketing',
  'Project Management', 'Business Analysis', 'QA Testing', 'DevOps', 'Docker'
];

export function OnboardingWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Confetti particles for completion splash
  const [showConfetti, setShowConfetti] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState({
    company: '',
    role: '',
    period: '',
    desc: ''
  });
  const [phone, setPhone] = useState('');

  // Auto-format phone: +998 XX XXX XX XX
  const handlePhoneChange = (raw: string) => {
    // Strip everything except digits and leading +
    let digits = raw.replace(/[^\d+]/g, '');
    // Ensure starts with +
    if (digits && !digits.startsWith('+')) digits = '+' + digits;
    // Format: +998 90 123 45 67
    const cleaned = digits.replace(/\D/g, '');
    let formatted = '+';
    if (cleaned.length > 0) formatted += cleaned.slice(0, 3);       // 998
    if (cleaned.length > 3) formatted += ' ' + cleaned.slice(3, 5); // 90
    if (cleaned.length > 5) formatted += ' ' + cleaned.slice(5, 8); // 123
    if (cleaned.length > 8) formatted += ' ' + cleaned.slice(8, 10);// 45
    if (cleaned.length > 10) formatted += ' ' + cleaned.slice(10, 12);// 67
    setPhone(formatted);
  };

  // Auto-fetch existing profile to prefill
  useEffect(() => {
    const prefillData = async () => {
      if (!auth.currentUser) return;
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFullName(data.full_name || data.displayName || '');
          setTitle(data.title || '');
          setBio(data.bio || '');
          setAvatarBase64(data.photo_url || data.photoURL || '');
          setSkills(data.skills || []);
          setLocation(data.location || '');
          setPhone(data.phone || '');
          if (data.experience && data.experience.length > 0) {
            setExperience(data.experience[0]);
          }
        }
      } catch (err) {
        console.error("Prefill fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    prefillData();
  }, []);

  // Compute profileCompletion mock snapshot score
  const mockProfile = {
    full_name: fullName,
    title,
    bio,
    photo_url: avatarBase64,
    skills,
    location,
    experience: experience.company ? [experience] : [],
    phone
  };
  const completionScore = calculateProfileCompletion(mockProfile);

  // Canvas Image Compressor
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm yuklashingiz mumkin!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Highly compressed JPEG avatar format to fit directly inside Firestore doc
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setAvatarBase64(compressedBase64);
        toast.success('Rasm siqildi va yuklandi!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addSkill = (skill: string) => {
    const cleanSkill = skill.trim();
    if (!cleanSkill) return;
    if (skills.includes(cleanSkill)) return;
    setSkills([...skills, cleanSkill]);
    setSkillInput('');
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Submit profile to Firestore
  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const updatePayload = {
        full_name: fullName,
        displayName: fullName,
        title,
        bio,
        photo_url: avatarBase64,
        photoURL: avatarBase64,
        skills,
        location,
        phone,
        experience: experience.company ? [experience] : [],
        profileCompletion: completionScore,
        profileCompleteness: completionScore, // Sync both keys
        updatedAt: new Date(),
        lastSeen: new Date()
      };

      await updateDoc(userRef, updatePayload);
      toast.success('Profil muvaffaqiyatli saqlandi! 🎉');

      if (completionScore >= 80) {
        setShowConfetti(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('Profilni saqlashda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else handleSave();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Validation conditions
  const isStep1Valid = fullName.trim() !== '' && title.trim() !== '';
  const isStep2Valid = bio.trim().length >= 80 && avatarBase64 !== '';
  const isStep3Valid = skills.length >= 3;
  const isStep4Valid = location.trim() !== '' && experience.company.trim() !== '' && experience.role.trim() !== '';
  const isStep5Valid = phone.trim().length >= 7;

  const canProceed = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    if (step === 4) return isStep4Valid;
    if (step === 5) return isStep5Valid;
    return false;
  };

  return (
    <div className="pt-32 pb-20 container mx-auto px-6 max-w-xl relative min-h-screen flex flex-col justify-center">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center bg-black/40">
          <div className="text-center space-y-4 p-8 rounded-3xl glass border-white/20 scale-up">
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
            <h1 className="text-2xl font-black text-white">{t('tabriklar') || 'Tabriklaymiz! 🎉'}</h1>
            <p className="text-sm text-white/80 max-w-xs">{t('marketplace_unlocked') || 'Platforma imkoniyatlari to\'liq ochildi! Dashboard sahifasiga yo\'naltirilmoqdasiz...'}</p>
          </div>
        </div>
      )}

      <Card className="glass border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-10 -mt-10" />
        <CardContent className="p-8 space-y-8">
          
          {/* Top Progress Indicators */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-indigo-950/40">
              <span>{t('onboarding_wizard') || 'Profil Sozlash'}</span>
              <span>{completionScore}%</span>
            </div>
            
            {/* Liquid Glow Progress Bar */}
            <div className="h-2 bg-indigo-950/5 rounded-full overflow-hidden border border-indigo-900/5 relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary to-fuchsia-500 rounded-full"
                animate={{ width: `${completionScore}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-[10px] text-indigo-950/50 font-bold text-center">
              {completionScore >= 80 
                ? (t('unlocked_ready') || '🎉 Marketplace ochildi! Davom eting.')
                : `${t('locked_remaining') || 'Marketplace ochilishi uchun yana'} ${80 - completionScore}% ${t('needed') || 'to\'ldirishingiz kerak.'}`}
            </p>
          </div>

          {/* Form Wizard Step Transition Container */}
          <div className="min-h-[300px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      {t('step1_title') || 'Asosiy Ma\'lumotlar'}
                    </h2>
                    <p className="text-xs text-indigo-950/50">{t('step1_subtitle') || 'Ismingiz va asosiy mutaxassislik yo\'nalishingizni belgilang.'}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-indigo-950/40 ml-1">{t('full_name') || 'To\'liq Ism-sharif'}</label>
                      <Input 
                        placeholder="Masalan: Abdulxay Avazxanov"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-white/40 backdrop-blur-md border border-indigo-950/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/60 text-indigo-950 h-11 rounded-xl transition-all duration-300 shadow-sm placeholder:text-indigo-950/30 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-indigo-950/40 ml-1">{t('specialty_title') || 'Mutaxassislik Sarlavhasi'}</label>
                      <Input 
                        placeholder="Masalan: Senior React Developer"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-white/40 backdrop-blur-md border border-indigo-950/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/60 text-indigo-950 h-11 rounded-xl transition-all duration-300 shadow-sm placeholder:text-indigo-950/30 font-medium"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {t('step2_title') || 'Tarjimai Hol & Avatar'}
                    </h2>
                    <p className="text-xs text-indigo-950/50">{t('step2_subtitle') || 'O\'zingiz haqingizda yozing va profil rasmini yuklang.'}</p>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative group cursor-pointer">
                        <Avatar className="w-24 h-24 border-2 border-primary/20 shadow-xl group-hover:brightness-90 transition-all">
                          <AvatarImage src={avatarBase64 || undefined} />
                          <AvatarFallback><User className="w-8 h-8 text-indigo-950/40" /></AvatarFallback>
                        </Avatar>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="w-6 h-6 text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                      <p className={`text-[10px] font-black tracking-wider uppercase ${avatarBase64 ? 'text-green-500' : 'text-red-500 animate-pulse'}`}>
                        {avatarBase64 ? '✅ Rasm yuklandi!' : '* Rasm yuklash majburiy'}
                      </p>
                    </div>

                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black uppercase text-indigo-950/40">{t('bio') || 'O\'zingiz Haqizda'}</label>
                        <span className={`text-[10px] font-bold ${bio.length < 80 ? 'text-red-500' : 'text-green-500'}`}>
                          {bio.length}/80 {t('chars_min') || 'belgi minimum'}
                        </span>
                      </div>
                      <Textarea 
                        placeholder={t('bio_placeholder') || 'Tashrif buyuruvchilarda yaxshi taassurot qoldirish uchun o\'z sohangizdagi malakangiz va bajargan loyihalaringiz haqida batafsil yozing... (kamida 80 ta belgi)'}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="bg-white/40 backdrop-blur-md border border-indigo-950/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/60 text-indigo-950 rounded-2xl min-h-[100px] transition-all duration-300 shadow-sm placeholder:text-indigo-950/30 font-medium"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" />
                      {t('step3_title') || 'Ko\'nikmalar (Skills)'}
                    </h2>
                    <p className="text-xs text-indigo-950/50">{t('step3_subtitle') || 'Kamida 3 ta asosiy ko\'nikmalaringizni belgilang.'}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        placeholder={t('search_skill') || 'Ko\'nikma nomi...'}
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSkill(skillInput)}
                        className="bg-white/40 backdrop-blur-md border border-indigo-950/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/60 text-indigo-950 h-11 rounded-xl transition-all duration-300 shadow-sm placeholder:text-indigo-950/30 font-medium"
                      />
                      <Button onClick={() => addSkill(skillInput)} className="bg-primary text-white h-11">
                        {t('add') || 'Qo\'shish'}
                      </Button>
                    </div>

                    {/* Autocomplete suggestions */}
                    {skillInput.trim().length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-white/30 rounded-2xl border border-white/40">
                        {SKILLS_POOL.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s))
                          .slice(0, 5)
                          .map(s => (
                            <button 
                              key={s} 
                              onClick={() => addSkill(s)}
                              className="px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/10 hover:bg-primary/20 text-xs font-bold transition-all"
                            >
                              + {s}
                            </button>
                          ))
                        }
                      </div>
                    )}

                    {/* Active skill chips */}
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/20 rounded-2xl border border-dashed border-indigo-900/10">
                      {skills.map((skill, index) => (
                        <div key={index} className="px-3 py-1 rounded-xl bg-white text-indigo-950 border border-indigo-900/10 flex items-center gap-2 text-xs font-bold shadow-sm">
                          {skill}
                          <button onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-700 font-black">×</button>
                        </div>
                      ))}
                      {skills.length < 3 && (
                        <p className="text-[10px] text-red-500 my-auto font-bold">
                          * {t('need_more_skills') || 'Yana'} {3 - skills.length} {t('more_required') || 'ta ko\'nikma qo\'shish shart.'}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      {t('step4_title') || 'Joylashuv & Tajriba'}
                    </h2>
                    <p className="text-xs text-indigo-950/50">{t('step4_subtitle') || 'Yashash shahringiz va kamida bitta ish joyingizni kiriting.'}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-indigo-950/40 ml-1">{t('location') || 'Yashash Joyi (Shahar, Davlat)'}</label>
                      <Input 
                        placeholder="Masalan: Tashkent, Uzbekistan"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="bg-white/40 backdrop-blur-md border border-indigo-950/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/60 text-indigo-950 h-11 rounded-xl transition-all duration-300 shadow-sm placeholder:text-indigo-950/30 font-medium"
                      />
                    </div>

                    <div className="p-4 bg-white/30 rounded-2xl border border-white/50 space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950/40 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-950/40" />
                        {t('experience') || 'Ish Tajribasi'}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input 
                          placeholder="Kompaniya nomi"
                          value={experience.company}
                          onChange={(e) => setExperience({...experience, company: e.target.value})}
                          className="bg-white/40 backdrop-blur-md border border-indigo-950/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/60 text-indigo-950 h-10 rounded-xl text-xs transition-all duration-300 shadow-sm placeholder:text-indigo-950/30 font-medium"
                        />
                        <Input 
                          placeholder="Lavozim (Role)"
                          value={experience.role}
                          onChange={(e) => setExperience({...experience, role: e.target.value})}
                          className="bg-white/40 backdrop-blur-md border border-indigo-950/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/60 text-indigo-950 h-10 rounded-xl text-xs transition-all duration-300 shadow-sm placeholder:text-indigo-950/30 font-medium"
                        />
                      </div>
                      
                      <Input 
                        placeholder="Ishlagan davringiz (Masalan: 2022 - Hozirgacha)"
                        value={experience.period}
                        onChange={(e) => setExperience({...experience, period: e.target.value})}
                        className="bg-white/40 backdrop-blur-md border border-indigo-950/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/60 text-indigo-950 h-10 rounded-xl text-xs transition-all duration-300 shadow-sm placeholder:text-indigo-950/30 font-medium"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      {t('step5_title') || 'Aloqa Ma\'lumotlari'}
                    </h2>
                    <p className="text-sm text-indigo-950/50">{t('step5_subtitle') || 'Foydalanuvchilar siz bilan bog\'lanishlari uchun telefon raqamingiz.'}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-indigo-950/50 ml-1">{t('phone_number') || 'Telefon Raqami'}</label>
                      <Input 
                        placeholder="+998 90 123 45 67"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        maxLength={17}
                        className="bg-white/40 backdrop-blur-md border border-indigo-950/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white/60 text-indigo-950 h-12 rounded-xl transition-all duration-300 shadow-sm placeholder:text-indigo-950/25 font-semibold text-base tracking-widest"
                      />
                      <p className="text-[11px] text-indigo-950/35 ml-1">Format: +998 90 123 45 67</p>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-primary/5 to-indigo-50/80 rounded-2xl border border-primary/10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="text-sm font-bold text-indigo-950">{t('rules_reminder') || 'Ajoyib! Barcha qadamlar deyarli yakunlandi'}</h4>
                      <p className="text-xs text-indigo-950/60 max-w-xs mx-auto leading-relaxed">
                        {t('onboarding_final_hint') || 'Profil ma\'lumotlaringiz saqlanganidan so\'ng, platformaning real-time freelance qidiruv va ish taklifnomalaridan to\'liq foydalanishingiz mumkin.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-indigo-950/5">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1 || saving}
              className="text-xs font-bold gap-2 text-indigo-950/60 hover:bg-indigo-950/5 h-11 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back') || 'Orqaga'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || saving}
              className="bg-primary hover:bg-primary/95 text-white text-xs font-black uppercase tracking-wider gap-2 h-11 rounded-xl px-6 shadow-lg shadow-primary/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('saving') || 'Saqlanmoqda...'}
                </>
              ) : step === 5 ? (
                <>
                  {t('complete') || 'Tugatish'}
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  {t('next') || 'Keyingi'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
