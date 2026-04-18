import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  User, Mail, MapPin, Globe, Github, 
  Twitter, Linkedin, Edit3, Plus, Star,
  Award, Briefcase, Camera, X, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

export function ProfilePage() {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Editable fields state
  const [editedName, setEditedName] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedSkills, setEditedSkills] = useState('');
  const [editedRate, setEditedRate] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedGithub, setEditedGithub] = useState('');
  const [editedTwitter, setEditedTwitter] = useState('');
  const [editedLinkedin, setEditedLinkedin] = useState('');
  const [editedRole, setEditedRole] = useState<'freelancer' | 'client'>('freelancer');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          let docSnap;
          try {
            // Using getDocFromServer to avoid initial "missing permissions" due to stale cache
            docSnap = await getDocFromServer(docRef);
          } catch (e) {
            console.warn('Initial server fetch failed, retrying with default getDoc', e);
            try {
              docSnap = await getDoc(docRef);
            } catch (e2) {
              handleFirestoreError(e2, OperationType.GET, `users/${user.uid}`);
            }
          }
          
          if (docSnap?.exists()) {
            const data = docSnap.data();
            setProfile(data);
            
            // Initialize edit states
            setEditedName(data.full_name || user.displayName || '');
            setEditedTitle(data.title || 'Professional Creator');
            setEditedBio(data.bio || '');
            setEditedSkills(data.skills?.join(', ') || '');
            setEditedRate(data.hourly_rate || '45');
            setEditedLocation(data.location || 'Tashkent, Uzbekistan');
            setEditedGithub(data.socials?.github || '');
            setEditedTwitter(data.socials?.twitter || '');
            setEditedLinkedin(data.socials?.linkedin || '');
            setEditedRole(data.role || 'freelancer');
          }
        } catch (error: any) {
          console.error('Error fetching profile detail:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const skillsArray = editedSkills.split(',').map(s => s.trim()).filter(s => s !== '');
      
      const updatedData = {
        full_name: editedName,
        email: user.email, // Required by Firestore rules
        title: editedTitle,
        bio: editedBio,
        skills: skillsArray,
        hourly_rate: editedRate,
        location: editedLocation,
        role: editedRole,
        socials: {
          github: editedGithub || '',
          twitter: editedTwitter || '',
          linkedin: editedLinkedin || ''
        },
        is_new_user: false,
        last_updated: new Date().toISOString()
      };
      
      // Use setDoc with merge: true to avoid "document not found" errors
      await setDoc(docRef, updatedData, { merge: true });
      setProfile((prev: any) => ({ ...prev, ...updatedData }));
      setIsEditing(false);
      toast.success(t('profile_saved'));
    } catch (error: any) {
      console.error('Profile Save Error:', error);
      toast.error(t('profile_save_error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      {/* Hero Section / Cover */}
      <div className="h-64 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-900/40 to-purple-900/20" />
        <div className="absolute inset-0 backdrop-blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <div className="container mx-auto px-6 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Brief Info */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[32px] border-white/10 text-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4">
                {profile?.is_premium ? (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none font-bold shadow-lg shadow-yellow-500/20">PREMIUM</Badge>
                ) : (
                  <Badge variant="outline" className="border-white/10 text-white/40">{t('free_plan')}</Badge>
                )}
              </div>

              <div className="relative mb-6 inline-block">
                <Avatar className="w-32 h-32 border-4 border-[#0a0a1a] p-1.5 bg-gradient-to-br from-primary to-blue-600">
                  <AvatarImage src={user?.photoURL || ''} className="rounded-full object-cover" />
                  <AvatarFallback className="bg-[#0f172a] text-primary text-4xl font-bold">
                    {profile?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-primary flex items-center justify-center border-4 border-[#0a0a1a] shadow-xl"
                >
                  <Camera className="w-4 h-4 text-white" />
                </motion.button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Input 
                    value={editedName} 
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder={t('full_name')}
                    className="bg-white/5 border-white/10 text-center text-xl font-bold"
                  />
                  <Input 
                    value={editedTitle} 
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Professional Title"
                    className="bg-white/5 border-white/10 text-center text-sm"
                  />
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      onClick={() => setEditedRole('freelancer')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${editedRole === 'freelancer' ? 'bg-primary text-white' : 'bg-white/5 text-white/30'}`}
                    >
                      {t('freelancer_role').toUpperCase()}
                    </button>
                    <button
                      onClick={() => setEditedRole('client')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${editedRole === 'client' ? 'bg-primary text-white' : 'bg-white/5 text-white/30'}`}
                    >
                      {t('hire_role').toUpperCase()}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-1">{profile?.full_name || t('no_name')}</h2>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[10px] uppercase font-bold tracking-widest">{profile?.role === 'client' ? t('hire_role') : t('freelancer_role')}</Badge>
                    <p className="text-white/50 text-sm">{profile?.title || t('prof_creator')}</p>
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/5 my-6">
                <div>
                  <p className="text-xl font-bold">4.9</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-tighter">{t('rating')}</p>
                </div>
                <div>
                  <p className="text-xl font-bold">12</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-tighter">{t('profile_jobs')}</p>
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm text-white/40">$</span>
                      <Input 
                        value={editedRate} 
                        onChange={(e) => setEditedRate(e.target.value)}
                        className="bg-transparent border-none p-0 w-8 h-auto font-bold text-center"
                      />
                    </div>
                  ) : (
                    <p className="text-xl font-bold">${profile?.hourly_rate || '45'}</p>
                  )}
                  <p className="text-[10px] text-white/30 uppercase tracking-tighter">{t('rate_h')}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {isEditing ? (
                  <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/80 h-12 rounded-xl">
                    <Check className="w-4 h-4 mr-2" /> {t('save_changes')}
                  </Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="flex-1 glass border-white/10 hover:bg-white/10 h-12 rounded-xl">
                    <Edit3 className="w-4 h-4 mr-2" /> {t('edit_profile')}
                  </Button>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-[32px] border-white/10"
            >
              <h3 className="font-bold mb-6 flex items-center">
                <Globe className="w-4 h-4 mr-2 text-primary" /> {t('details')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-white/40 group-hover:text-primary" />
                  </div>
                  <span className="text-sm text-white/60 truncate">{user?.email}</span>
                </div>
                
                <div className="flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                    <MapPin className="w-3.5 h-3.5 text-white/40 group-hover:text-primary" />
                  </div>
                  {isEditing ? (
                    <Input 
                      value={editedLocation} 
                      onChange={(e) => setEditedLocation(e.target.value)}
                      className="bg-transparent border-none p-0 h-auto text-sm"
                    />
                  ) : (
                    <span className="text-sm text-white/60">{profile?.location || t('uzbekistan')}</span>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-center gap-6">
                  {isEditing ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center gap-3">
                        <Github className="w-4 h-4" />
                        <Input value={editedGithub} onChange={(e) => setEditedGithub(e.target.value)} placeholder="Github URL" className="bg-white/5 h-8 text-xs" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Twitter className="w-4 h-4" />
                        <Input value={editedTwitter} onChange={(e) => setEditedTwitter(e.target.value)} placeholder="Twitter URL" className="bg-white/5 h-8 text-xs" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Linkedin className="w-4 h-4" />
                        <Input value={editedLinkedin} onChange={(e) => setEditedLinkedin(e.target.value)} placeholder="LinkedIn URL" className="bg-white/5 h-8 text-xs" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <motion.a whileHover={{ y: -3 }} href={profile?.socials?.github} className="text-white/30 hover:text-white"><Github className="w-5 h-5" /></motion.a>
                      <motion.a whileHover={{ y: -3 }} href={profile?.socials?.twitter} className="text-white/30 hover:text-white"><Twitter className="w-5 h-5" /></motion.a>
                      <motion.a whileHover={{ y: -3 }} href={profile?.socials?.linkedin} className="text-white/30 hover:text-white"><Linkedin className="w-5 h-5" /></motion.a>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Detailed Info */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-10 rounded-[40px] border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">{t('about_me')}</h3>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              </div>

              {isEditing ? (
                <Textarea 
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder={t('bio_placeholder')}
                  className="bg-white/5 border-white/10 min-h-[200px] text-lg leading-relaxed rounded-2xl"
                />
              ) : (
                <p className="text-white/60 text-lg leading-relaxed whitespace-pre-wrap">
                  {profile?.bio || t('no_bio')}
                </p>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-10 rounded-[40px] border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">{t('skills_expertise')}</h3>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Input 
                    value={editedSkills}
                    onChange={(e) => setEditedSkills(e.target.value)}
                    placeholder={t('skills_placeholder')}
                    className="bg-white/5 border-white/10 h-14 text-lg rounded-xl"
                  />
                  <p className="text-xs text-white/30">Skills should be separated by commas.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {profile?.skills?.map((skill: string) => (
                    <motion.div 
                      key={skill}
                      whileHover={{ scale: 1.05 }}
                      className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-medium hover:border-primary/50 transition-all cursor-default"
                    >
                      {skill}
                    </motion.div>
                  )) || <p className="text-white/20 italic">{t('no_skills')}</p>}
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-10 rounded-[40px] border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">{t('prof_history')}</h3>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="space-y-8">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-all z-10 relative">
                        <Award className="w-6 h-6 text-white/40 group-hover:text-primary" />
                      </div>
                      {i === 1 && <div className="absolute top-12 bottom-[-32px] left-1/2 -translate-x-1/2 w-px bg-white/5" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-lg">Senior Product Designer</h4>
                      <p className="text-primary text-sm font-medium">Meta Platforms • 2022 - Present</p>
                      <p className="text-white/40 text-sm max-w-xl">Led the redesign of the main interface, increasing user engagement by 45%. Collaborated with global teams.</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
