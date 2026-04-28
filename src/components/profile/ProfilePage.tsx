import * as React from 'react';
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
import { doc, getDoc, setDoc, getDocFromServer, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { ADMIN_USERS } from '@/constants';
import { calculateProfileCompletion } from '@/lib/profile';
import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [editedPhone, setEditedPhone] = useState('');
  const [editedRole, setEditedRole] = useState<'freelancer' | 'client' | 'admin'>('freelancer');
  const [editedExperience, setEditedExperience] = useState<any[]>([]);
  const [editedRating, setEditedRating] = useState('4.9');
  const [editedJobs, setEditedJobs] = useState('12');
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequestSent, setHasRequestSent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visitorProfile, setVisitorProfile] = useState<any>(null);
  
  const isOwnProfile = !id || (user && user.uid === id);
  const isProfileChecked = useRef(false);

  useEffect(() => {
    if (user && id && user.uid !== id) {
      const fetchVisitorProfile = async () => {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          setVisitorProfile(docSnap.data());
        }
      };
      fetchVisitorProfile();
    }
  }, [id, user]);

  const visitorCompletion = calculateProfileCompletion(visitorProfile);
  const isVisitorComplete = visitorCompletion >= 80;

  useEffect(() => {
    let unsubscribe = () => {};
    
    // Abstract the fetch logic
    const fetchProfile = async (targetId: string, currentUser: any) => {
      try {
        const docRef = doc(db, 'users', targetId);
        let docSnap;
        try {
          docSnap = await getDocFromServer(docRef);
        } catch (e) {
          console.warn('Initial server fetch failed, retrying with default getDoc', e);
          try {
            docSnap = await getDoc(docRef);
          } catch (e2) {
            handleFirestoreError(e2, OperationType.GET, `users/${targetId}`);
          }
        }
        
        if (docSnap?.exists()) {
          const data = docSnap.data();
          setProfile({ id: targetId, ...data });
          
          if (currentUser && currentUser.uid === targetId) {
            // Initialize edit states only if own profile
            setEditedName(data.full_name || currentUser.displayName || '');
            setEditedTitle(data.title || t('prof_creator'));
            setEditedBio(data.bio || '');
            setEditedSkills(data.skills?.join(', ') || '');
            setEditedRate(data.hourly_rate || '');
            setEditedLocation(data.location || t('uzbekistan'));
            setEditedGithub(data.socials?.github || '');
            setEditedTwitter(data.socials?.twitter || '');
            setEditedLinkedin(data.socials?.linkedin || '');
            setEditedPhone(data.phone || '');
            setEditedRole(data.role || 'freelancer');
            setEditedExperience(data.experience || [
              { company: 'Company Name', role: 'Role Name', period: '2022 - Present', desc: 'Description here...' }
            ]);
            setEditedRating(data.stats?.rating?.toString() || '4.9');
            setEditedJobs(data.stats?.completed_jobs?.toString() || '12');
          }

          // Check if request already sent
          if (currentUser && currentUser.uid !== targetId) {
            const reqRef = doc(db, 'work_requests', `${currentUser.uid}_${targetId}`);
            const reqSnap = await getDoc(reqRef);
            if (reqSnap.exists()) {
              setHasRequestSent(true);
            }
          }
        } else {
          setProfile(null);
        }
      } catch (error: any) {
        console.error('Error fetching profile detail:', error);
      } finally {
        setLoading(false);
      }
    };

    // Auto-fetch logic based on auth
    unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      const targetProfileId = id || currentUser?.uid;
      
      if (targetProfileId) {
        setProfile(null);
        setLoading(true);
        fetchProfile(targetProfileId, currentUser);
      } else {
        setProfile(null);
        setLoading(false); // Not logged in and no ID specified
      }
    });

    return () => unsubscribe();
  }, [id, navigate, t]);

  const handleSave = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const skillsArray = editedSkills.split(',').map(s => s.trim()).filter(s => s !== '');
      
      const updatedData = {
        full_name: editedName,
        email: user.email || '', // Required for validation
        title: editedTitle,
        bio: editedBio,
        skills: skillsArray,
        hourly_rate: editedRate,
        location: editedLocation,
        role: editedRole,
        experience: editedExperience,
        stats: {
          ...(profile?.stats || {}),
          rating: parseFloat(editedRating) || 5.0,
          completed_jobs: parseInt(editedJobs) || 0
        },
        socials: {
          github: editedGithub || '',
          twitter: editedTwitter || '',
          linkedin: editedLinkedin || ''
        },
        phone: editedPhone,
        photo_url: profile?.photo_url || user.photoURL || '',
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
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSendRequest = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      // We need the SENDER'S profile info (current user)
      const ownProfileSnap = await getDoc(doc(db, 'users', user.uid));
      const ownData = ownProfileSnap.exists() ? ownProfileSnap.data() : {};
      
      const requestId = `${user.uid}_${profile.id}`;
      const senderName = ownData.full_name || user?.displayName || 'User';
      const senderPhoto = ownData.photo_url || user?.photoURL || '';
      
      await setDoc(doc(db, 'work_requests', requestId), {
        senderId: user.uid,
        senderName: senderName,
        senderPhoto: senderPhoto,
        receiverId: profile.id,
        receiverName: profile.full_name || 'User',
        receiverPhoto: profile.photo_url || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      // Also add a notification for the receiver
      const notifId = `notif_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        userId: profile.id,
        fromUserId: user.uid,
        fromUserName: senderName,
        fromUserPhoto: senderPhoto,
        type: 'work_request',
        content: t('new_work_request', { name: senderName }),
        read: false,
        createdAt: new Date().toISOString()
      });

      setHasRequestSent(true);
      toast.success(t('request_sent'));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'work_requests');
    } finally {
      setIsRequesting(false);
    }
  };

  const addExperience = () => {
    setEditedExperience([...editedExperience, { company: '', role: '', period: '', desc: '' }]);
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...editedExperience];
    updated[index] = { ...updated[index], [field]: value };
    setEditedExperience(updated);
  };

  const removeExperience = (index: number) => {
    setEditedExperience(editedExperience.filter((_, i) => i !== index));
  };

  const formatPhone = (val: string) => {
    // Basic digits cleanup
    const digits = val.replace(/\D/g, '');
    
    // Formatting logic (+998 90 123 45 67)
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `+${digits}`;
    if (digits.length <= 5) return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
    if (digits.length <= 10) return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedPhone(formatPhone(e.target.value));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('error_only_image'));
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('error_image_size'));
      return;
    }

    setUploading(true);
    const toastId = toast.loading(t('uploading_image'));

    try {
      // Client-side image optimization (Resize to 256x256 and compress)
      const reader = new FileReader();
      
      const optimizePromise = new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 256;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Convert to highly optimized JPEG
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const optimizedImage = await optimizePromise;
      
      // Update Firestore
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        photo_url: optimizedImage,
        last_updated: new Date().toISOString()
      });

      // Update local state
      setProfile((prev: any) => ({ ...prev, photo_url: optimizedImage }));
      
      toast.dismiss(toastId);
      toast.success(t('image_updated'));
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.dismiss(toastId);
      toast.error(t('error_upload_image'));
    } finally {
      setUploading(false);
    }
  };

  if (!isOwnProfile && !isVisitorComplete && !loading && user) {
    return (
      <div className="pt-24 min-h-[70vh] flex items-center justify-center container mx-auto px-6">
        <Card className="glass max-w-md w-full p-8 text-center border-white/10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-4 text-indigo-950">{t('complete_profile_first')}</h2>
          <p className="text-indigo-950/60 mb-8 leading-relaxed font-bold text-sharp uppercase tracking-tight text-xs">{t('complete_profile_desc')}</p>
          <Button 
            onClick={() => navigate('/profile')} 
            className="w-full bg-primary hover:bg-primary/80 h-12 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            {t('complete_profile')}
          </Button>
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost"
            className="w-full mt-4 text-indigo-950/40 hover:text-indigo-950 font-bold uppercase tracking-widest text-[10px]"
          >
            {t('go_back')}
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      {/* Hero Section / Cover - High end Mesh Gradient */}
      <div className="h-64 md:h-80 relative overflow-hidden">
        {/* Animated Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-blue-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        {/* Architectural Grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Volumetric Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full h-full bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-24 md:-mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Brief Info */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 sm:p-8 rounded-[2.5rem] border-white/10 text-center relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-5">
                {(profile?.email && ADMIN_USERS[profile.email.toLowerCase()]) ? (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none font-black text-[10px] tracking-widest shadow-lg shadow-yellow-500/20">OWNER</Badge>
                ) : (profile?.is_premium) ? (
                  <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-none font-black text-[10px] tracking-widest px-3 uppercase">PREMIUM</Badge>
                ) : (
                  <Badge variant="outline" className="border-indigo-900/10 text-indigo-900/40 font-bold text-[10px] tracking-widest">{t('free_plan').toUpperCase()}</Badge>
                )}
              </div>

              <div className="relative mb-8 inline-block">
                {/* Decorative rings */}
                <div className="absolute inset-0 -m-3 rounded-full border border-primary/20 animate-pulse" />
                <div className="absolute inset-0 -m-6 rounded-full border border-primary/5 scale-90" />
                
                <Avatar className="w-32 h-32 border-[6px] border-white p-1.5 bg-gradient-to-br from-primary via-blue-500 to-cyan-400 shadow-2xl relative z-10 overflow-hidden">
                  <AvatarImage src={profile?.photo_url || (isOwnProfile ? user?.photoURL : undefined)} className="rounded-full object-cover" />
                  <AvatarFallback className="bg-white text-primary text-4xl font-bold">
                    {profile?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                  {uploading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  )}
                </Avatar>
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {isOwnProfile && (
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-primary flex items-center justify-center border-4 border-white shadow-xl z-20 hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </motion.button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Input 
                    value={editedName} 
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder={t('full_name')}
                    className="bg-white/40 border-indigo-900/10 text-center text-xl font-bold text-indigo-950"
                  />
                  <Input 
                    value={editedTitle} 
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Professional Title"
                    className="bg-white/40 border-indigo-900/10 text-center text-sm text-indigo-900/60"
                  />
                  <div className="flex justify-center gap-2 mt-2 flex-wrap px-2">
                    <button
                      onClick={() => setEditedRole('freelancer')}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${editedRole === 'freelancer' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-indigo-900/10 text-indigo-900/60 hover:bg-indigo-900/20'}`}
                    >
                      {t('freelancer_role').toUpperCase()}
                    </button>
                    <button
                      onClick={() => setEditedRole('client')}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${editedRole === 'client' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-indigo-900/10 text-indigo-900/60 hover:bg-indigo-900/20'}`}
                    >
                      {t('hire_role').toUpperCase()}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-full px-2">
                  <h2 className="text-xl md:text-2xl font-bold mb-2 text-indigo-950 text-sharp truncate w-full" title={profile?.full_name || t('no_name')}>
                    {profile?.full_name || t('no_name')}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">
                      {profile?.role === 'client' ? t('hire_role') : t('freelancer_role')}
                    </Badge>
                    <span className="text-indigo-950/40 text-xs md:text-sm font-bold text-sharp uppercase tracking-tight text-center">{profile?.title || t('prof_creator')}</span>
                  </div>
                </div>
              )}

              <div className={`grid ${(!isEditing && !profile?.hourly_rate) ? 'grid-cols-2' : 'grid-cols-3'} gap-2 sm:gap-4 py-4 sm:py-6 border-y border-indigo-900/5 my-6 leading-none`}>
                <div>
                  {isEditing ? (
                    <Input 
                      value={editedRating} 
                      onChange={(e) => setEditedRating(e.target.value)}
                      className="bg-transparent border-none p-0 w-16 mx-auto h-auto font-bold text-center text-lg sm:text-xl text-indigo-950"
                    />
                  ) : (
                    <p className="text-lg sm:text-xl font-bold text-indigo-950 text-sharp">{profile?.stats?.rating || '4.9'}</p>
                  )}
                  <p className="text-[9px] sm:text-[10px] text-indigo-900/40 uppercase tracking-tighter text-sharp">{t('rating')}</p>
                </div>
                <div>
                  {isEditing ? (
                    <Input 
                      value={editedJobs} 
                      onChange={(e) => setEditedJobs(e.target.value)}
                      className="bg-transparent border-none p-0 w-16 mx-auto h-auto font-bold text-center text-lg sm:text-xl text-indigo-950"
                    />
                  ) : (
                    <p className="text-lg sm:text-xl font-bold text-indigo-950 text-sharp">{profile?.stats?.completed_jobs || '12'}</p>
                  )}
                  <p className="text-[9px] sm:text-[10px] text-indigo-900/40 uppercase tracking-tighter text-sharp">{t('profile_jobs')}</p>
                </div>
                {(isEditing || profile?.hourly_rate) && (
                  <div>
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs sm:text-sm text-indigo-900/40">$</span>
                        <Input 
                          value={editedRate} 
                          onChange={(e) => setEditedRate(e.target.value)}
                          className="bg-transparent border-none p-0 w-8 h-auto font-bold text-center text-lg sm:text-xl text-indigo-950"
                        />
                      </div>
                    ) : (
                      <p className="text-lg sm:text-xl font-bold text-indigo-950 text-sharp">${profile?.hourly_rate}</p>
                    )}
                    <p className="text-[9px] sm:text-[10px] text-indigo-900/40 uppercase tracking-tighter text-sharp">{t('rate_h')}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!isOwnProfile ? (
                  <Button 
                    onClick={handleSendRequest}
                    disabled={isRequesting || hasRequestSent}
                    className="flex-1 bg-primary text-white hover:bg-primary/90 h-11 md:h-12 rounded-xl font-bold text-sharp"
                  >
                    {hasRequestSent ? (
                      <><Check className="w-4 h-4 mr-2" /> {t('request_sent')}</>
                    ) : (
                      <><Edit3 className="w-4 h-4 mr-2" /> {t('send_request')}</>
                    )}
                  </Button>
                ) : isEditing ? (
                  <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/80 h-11 md:h-12 rounded-xl">
                    <Check className="w-4 h-4 mr-2" /> {t('save_changes')}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="outline"
                    className="flex-1 border-indigo-900/10 hover:bg-white/40 text-indigo-950 h-11 md:h-12 rounded-xl font-bold text-sharp"
                  >
                    <Edit3 className="w-4 h-4 mr-2 text-primary" /> {t('edit_profile')}
                  </Button>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-[32px] border-white/10 shadow-xl"
            >
              <h3 className="font-bold mb-6 flex items-center text-indigo-950 text-sharp uppercase tracking-widest text-sm">
                <Globe className="w-4 h-4 mr-2 text-primary" /> {t('details')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-900/5 flex items-center justify-center border border-indigo-900/5 group-hover:border-primary/50 transition-colors shrink-0">
                    <Mail className="w-3.5 h-3.5 text-indigo-900/60 group-hover:text-primary" />
                  </div>
                  <span className="text-sm text-indigo-950/60 font-bold truncate text-sharp overflow-hidden">{profile?.email || user?.email}</span>
                </div>
                
                  <div className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-indigo-900/5 flex items-center justify-center border border-indigo-900/5 group-hover:border-primary/50 transition-colors">
                      <Globe className="w-3.5 h-3.5 text-indigo-900/60 group-hover:text-primary" />
                    </div>
                    {isEditing ? (
                      <Input 
                        value={editedPhone} 
                        onChange={handlePhoneChange}
                        placeholder="+998 90 123 45 67"
                        className="bg-white/40 border-indigo-900/10 p-2 h-8 text-sm text-indigo-950 font-bold rounded-lg"
                      />
                    ) : (
                      <span className="text-sm text-indigo-950/60 font-bold text-sharp">{profile?.phone || t('no_phone')}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-indigo-900/5 flex items-center justify-center border border-indigo-900/5 group-hover:border-primary/50 transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-indigo-900/60 group-hover:text-primary" />
                    </div>
                  {isEditing ? (
                    <Input 
                      value={editedLocation} 
                      onChange={(e) => setEditedLocation(e.target.value)}
                      className="bg-white/40 border-indigo-900/10 p-2 h-8 text-sm text-indigo-950 font-bold rounded-lg"
                    />
                  ) : (
                    <span className="text-sm text-indigo-950/60 font-bold text-sharp">{profile?.location || t('uzbekistan')}</span>
                  )}
                </div>

                <div className="pt-6 border-t border-indigo-900/5 flex justify-center gap-6">
                  {isEditing ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center gap-3">
                        <Github className="w-4 h-4 text-indigo-900/40" />
                        <Input value={editedGithub} onChange={(e) => setEditedGithub(e.target.value)} placeholder="Github URL" className="bg-white/5 h-8 text-xs text-indigo-950" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Twitter className="w-4 h-4 text-indigo-900/40" />
                        <Input value={editedTwitter} onChange={(e) => setEditedTwitter(e.target.value)} placeholder="Twitter URL" className="bg-white/5 h-8 text-xs text-indigo-950" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Linkedin className="w-4 h-4 text-indigo-900/40" />
                        <Input value={editedLinkedin} onChange={(e) => setEditedLinkedin(e.target.value)} placeholder="LinkedIn URL" className="bg-white/5 h-8 text-xs text-indigo-950" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <motion.a whileHover={{ y: -3 }} href={profile?.socials?.github || '#'} className="text-indigo-900/30 hover:text-primary"><Github className="w-5 h-5" /></motion.a>
                      <motion.a whileHover={{ y: -3 }} href={profile?.socials?.twitter || '#'} className="text-indigo-900/30 hover:text-primary"><Twitter className="w-5 h-5" /></motion.a>
                      <motion.a whileHover={{ y: -3 }} href={profile?.socials?.linkedin || '#'} className="text-indigo-900/30 hover:text-primary"><Linkedin className="w-5 h-5" /></motion.a>
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
              className="glass-dark p-8 md:p-12 rounded-[3.5rem] border-white/5 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent" />
              
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-3xl font-display font-bold tracking-tight">{t('about_me')}</h3>
                  <div className="h-1 w-12 bg-primary rounded-full" />
                </div>
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
                  <p className="text-indigo-950/60 text-lg leading-relaxed whitespace-pre-wrap text-sharp font-normal">
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
                <h3 className="text-2xl font-bold text-indigo-950 text-sharp">{t('skills_expertise')}</h3>
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
                    className="bg-white/40 border-indigo-900/10 h-14 text-lg rounded-xl text-indigo-950 font-bold"
                  />
                  <p className="text-xs text-indigo-900/40 font-bold uppercase tracking-tight text-sharp">Skills should be separated by commas.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {profile?.skills?.map((skill: string) => (
                    <motion.div 
                      key={skill}
                      whileHover={{ scale: 1.05 }}
                      className="px-6 py-3 rounded-2xl bg-indigo-900/10 border border-indigo-900/10 text-indigo-950 font-black hover:border-primary/50 transition-all cursor-default text-sharp shadow-sm"
                    >
                      {skill}
                    </motion.div>
                  )) || <p className="text-indigo-950/20 font-black">{t('no_skills')}</p>}
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
                <h3 className="text-2xl font-bold text-indigo-950 text-sharp">{t('prof_history')}</h3>
                <div className="flex gap-2">
                  {isEditing && (
                    <Button onClick={addExperience} size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-full bg-primary/10 text-primary">
                      <Plus className="w-5 h-5" />
                    </Button>
                  )}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {(isEditing ? editedExperience : profile?.experience || []).map((exp: any, i: number) => (
                  <div key={i} className="flex gap-6 group relative">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-900/5 flex items-center justify-center border border-indigo-900/5 group-hover:border-primary/50 transition-all z-10 relative">
                        <Award className="w-6 h-6 text-indigo-900/50 group-hover:text-primary" />
                      </div>
                      {i < (isEditing ? editedExperience : profile?.experience || []).length - 1 && (
                        <div className="absolute top-12 bottom-[-32px] left-1/2 -translate-x-1/2 w-px bg-indigo-900/5" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl relative">
                          <button 
                            onClick={() => removeExperience(i)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <Input 
                            value={exp.role} 
                            onChange={(e) => updateExperience(i, 'role', e.target.value)} 
                            placeholder="Role (e.g. Senior Product Designer)" 
                            className="bg-transparent border-indigo-900/10 text-indigo-950 font-bold"
                          />
                          <Input 
                            value={exp.company} 
                            onChange={(e) => updateExperience(i, 'company', e.target.value)} 
                            placeholder="Company (e.g. Meta Platforms)" 
                            className="bg-transparent border-indigo-900/10 text-indigo-950 font-bold"
                          />
                          <Input 
                            value={exp.period} 
                            onChange={(e) => updateExperience(i, 'period', e.target.value)} 
                            placeholder="Period (e.g. 2022 - Present)" 
                            className="bg-transparent border-indigo-900/10 text-indigo-950 font-bold"
                          />
                          <Textarea 
                            value={exp.desc} 
                            onChange={(e) => updateExperience(i, 'desc', e.target.value)} 
                            placeholder="Description of your achievements..." 
                            className="bg-transparent border-indigo-900/10 text-indigo-950 md:col-span-2"
                          />
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-lg text-indigo-950 text-sharp break-words">{exp.role}</h4>
                          <p className="text-primary text-sm font-black uppercase tracking-widest shadow-sm break-words">{exp.company} • {exp.period}</p>
                          <p className="text-indigo-950/60 text-sm max-w-xl font-bold text-sharp whitespace-pre-wrap">{exp.desc}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {(!isEditing && (!profile?.experience || profile.experience.length === 0)) && (
                  <div className="text-center py-6 opacity-30">
                    <p className="text-sm font-bold uppercase tracking-widest">{t('no_activity')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
