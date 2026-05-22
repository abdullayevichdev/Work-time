import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Star, MapPin, DollarSign, ArrowRight, 
  CheckCircle2, Users, Briefcase, Zap, X, Clock 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useTalents } from '@/hooks/useTalents';
import { FuturisticEmptyState } from '@/components/ui/FuturisticEmptyState';

const COMMON_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Figma', 'Solidity', 'Robotics', 'IoT', 'Python'
];

export function TalentsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [maxRate, setMaxRate] = useState<number>(300);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'rate_low' | 'rate_high'>('newest');

  // Consume real-time useTalents subscriber hook
  const { talents, loading } = useTalents(
    searchQuery,
    maxRate,
    selectedLevels,
    selectedLocation,
    selectedSkills
  );

  const toggleSkillFilter = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleLevelToggle = (levelId: string) => {
    setSelectedLevels(prev =>
      prev.includes(levelId) ? prev.filter(l => l !== levelId) : [...prev, levelId]
    );
  };

  // Client-side sorting on real-time snapshot results
  const getJoinedAt = (u: any) => {
    const raw = u.createdAt ?? u.created_at;
    if (!raw) return 0;
    if (raw?.toDate) return raw.toDate().getTime();
    return new Date(raw).getTime();
  };

  const isNewMember = (u: any) => {
    const joined = getJoinedAt(u);
    if (!joined) return false;
    return Date.now() - joined < 7 * 24 * 60 * 60 * 1000;
  };

  const sortedTalents = [...talents].sort((a: any, b: any) => {
    if (sortBy === 'newest') {
      return getJoinedAt(b) - getJoinedAt(a);
    }
    if (sortBy === 'rating') {
      return (b.stats?.rating || 5.0) - (a.stats?.rating || 5.0);
    }
    if (sortBy === 'rate_low') {
      return (a.hourly_rate || 0) - (b.hourly_rate || 0);
    }
    if (sortBy === 'rate_high') {
      return (b.hourly_rate || 0) - (a.hourly_rate || 0);
    }
    return 0;
  });

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12 relative z-10">
        <div className="text-left">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-indigo-950 text-sharp">
            {t("talents_title_1") || "Eng yaxshi"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">{t("talents_title_2") || "Mutaxassislar"}</span>
          </h1>
          <p className="text-indigo-900/40 max-w-xl text-sharp font-medium">
            {t("talents_desc") || "Platformadagi eng malakali freelancer va hamkorlar bilan bog'laning."}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        {/* Sidebar Filters panel */}
        <div className="space-y-6">
          {/* Hourly Rate filter */}
          <Card className="glass border-white/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl -mr-16 -mt-16" />
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900/40 mb-6">{t('hourly_rate') || 'Soatbay Byudjet'}</h3>
            <div className="space-y-4 relative z-10 text-left">
              <div className="flex justify-between text-[10px] font-black text-indigo-900/40 uppercase tracking-[0.2em]">
                <span>$0</span>
                <span>$300+</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="300" 
                step="5"
                value={maxRate}
                onChange={(e) => setMaxRate(parseInt(e.target.value))}
                className="w-full accent-primary bg-indigo-950/10 rounded-lg h-1.5 appearance-none cursor-pointer"
              />
              <p className="text-xs font-bold text-indigo-950">
                {t('hourly_up_to', { rate: maxRate })}
              </p>
            </div>
          </Card>

          {/* Location filter */}
          <Card className="glass border-white/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-left">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl -mr-16 -mt-16" />
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900/40 mb-4">{t('location') || 'Joylashuv'}</h3>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-950/40" />
              <Input 
                placeholder="Masalan: Tashkent"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-9 h-10 bg-white/40 border-black/5 text-xs font-bold rounded-xl"
              />
            </div>
          </Card>

          {/* Skills Tag Filters chips */}
          <Card className="glass border-white/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-left">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl -mr-16 -mt-16" />
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900/40 mb-4">{t('skills_filter')}</h3>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SKILLS.map(skill => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkillFilter(skill)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      isSelected 
                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
                        : 'bg-white/40 text-indigo-950/60 border-black/5 hover:bg-white/60'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Experience level checkboxes */}
          <Card className="glass border-white/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-left">
             <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-2xl -mr-16 -mt-16" />
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900/40 mb-6">{t('exp_level') || 'Tajriba Darajasi'}</h3>
            <div className="space-y-4 relative z-10">
              {[
                { label: t('entry_level') || 'Entry Level', id: 'entry' },
                { label: t('intermediate') || 'Intermediate', id: 'intermediate' },
                { label: t('expert') || 'Expert', id: 'expert' }
              ].map(level => (
                <label key={level.id} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedLevels.includes(level.id)}
                    onChange={() => handleLevelToggle(level.id)}
                    className="w-4 h-4 rounded border-2 border-indigo-900/10 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedLevels.includes(level.id) ? 'text-primary' : 'text-indigo-900/40 group-hover:text-primary'}`}>
                    {level.label}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Content list Grid */}
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-900/40 group-hover:text-primary transition-colors z-10" />
              <Input 
                placeholder={t("search_talents_placeholder") || "Mutaxassislarni ismi yoki ko'nikmalari bo'yicha qidiring..."} 
                className="pl-12 h-14 glass border-white/10 focus:border-primary rounded-2xl text-sm font-medium shadow-lg relative z-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Sorting menu */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-14 px-4 bg-white/60 border border-white/10 text-indigo-950 font-bold rounded-2xl shadow-lg text-xs"
            >
              <option value="newest">{t('talents_sort_newest')}</option>
              <option value="rating">{t('talents_sort_rating')}</option>
              <option value="rate_low">{t('budget_low_high')}</option>
              <option value="rate_high">{t('budget_high_low')}</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="h-80 glass rounded-[2.5rem] animate-pulse border-white/10" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedTalents.map((talent, i) => {
                  const level = talent.experience_level || 'intermediate';
                  const completion = talent.profileCompletion || talent.profileCompleteness || 0;
                  
                  // Compute dynamic online state: if lastSeen is within 5 minutes, user is active!
                  let isOnline = false;
                  if (talent.lastSeen) {
                    const diffMs = Date.now() - (talent.lastSeen?.toDate ? talent.lastSeen.toDate().getTime() : new Date(talent.lastSeen).getTime());
                    isOnline = diffMs < 5 * 60 * 1000;
                  }

                  return (
                    <motion.div
                      key={talent.id}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                      className="group text-left"
                    >
                      <Card className="glass border-white/10 hover:border-primary/30 transition-all duration-500 h-full flex flex-col rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-primary/5 relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <CardContent className="p-8 flex flex-col h-full relative z-10">
                          <div className="flex items-start justify-between mb-6">
                            <div className="relative">
                              <Avatar className="w-16 h-16 border-[3px] border-white shadow-xl relative z-10 bg-indigo-900/5">
                                <AvatarImage src={talent.photo_url || talent.photoURL || undefined} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                  {talent.full_name?.[0] || talent.displayName?.[0] || 'T'}
                                </AvatarFallback>
                              </Avatar>
                              {/* Online status indicator beacon */}
                              <div className={`absolute bottom-0 right-0 w-4.5 h-4.5 border-2 border-white rounded-full z-20 shadow-sm ${
                                isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                              }`} title={isOnline ? 'Online' : 'Offline'} />
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              {isNewMember(talent) && (
                                <Badge className="bg-emerald-500 text-white border-none px-2 py-0.5 text-[9px] font-black tracking-widest shadow-sm">
                                  {t('new_member_badge')}
                                </Badge>
                              )}
                              {talent.membership === 'premium' && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none px-2 py-0.5 text-[9px] font-black tracking-widest flex items-center gap-1 shadow-sm">
                                  ⭐ PREMIUM
                                </Badge>
                              )}
                              <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[9px] font-black tracking-widest flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {completion}% COMPLETE
                              </Badge>
                            </div>
                          </div>

                          <div className="mb-6 flex-1">
                            <Link to={`/profile/${talent.id}`}>
                              <h3 className="text-xl font-bold mb-1 text-indigo-950 group-hover:text-primary transition-colors text-sharp whitespace-normal break-all line-clamp-1">
                                {talent.full_name || talent.displayName || talent.email}
                              </h3>
                            </Link>
                            <p className="text-[10px] text-indigo-900/60 font-black uppercase tracking-widest mb-4 flex items-center gap-1 text-sharp truncate">
                              {talent.title || 'Professional'}
                            </p>
                            <p className="text-xs text-indigo-950/60 line-clamp-3 mb-6 text-sharp font-medium leading-relaxed min-h-[50px]">
                              {talent.bio}
                            </p>
                            
                            {/* Skills chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {talent.skills?.slice(0, 3).map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="bg-white/60 border-indigo-900/5 text-indigo-900/60 text-[9px] uppercase tracking-wider text-sharp font-bold shadow-sm">
                                  {skill}
                                </Badge>
                              ))}
                              {talent.skills?.length > 3 && (
                                <Badge variant="secondary" className="bg-indigo-900/5 border-none text-indigo-900/40 text-[9px] font-bold">
                                  +{talent.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-indigo-900/5 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="text-[9px] text-indigo-900/40 uppercase tracking-widest font-black mb-0.5 text-sharp">{t("hourly_rate")}</p>
                                <p className="text-lg font-bold text-indigo-950">${talent.hourly_rate || 20}<span className="text-[10px] font-medium text-indigo-900/40 text-sharp">/{t("per_hr")}</span></p>
                              </div>
                              <div className="w-px h-8 bg-indigo-900/5" />
                              <div>
                                <p className="text-[9px] text-indigo-900/40 uppercase tracking-widest font-black mb-0.5 text-sharp">Javob vaqti</p>
                                <p className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-indigo-950/40" />
                                  ~{talent.responseTimeHours || 2}s
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="default" 
                              size="icon" 
                              asChild
                              className="rounded-xl w-10 h-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group-hover:scale-105 transition-all cursor-pointer" 
                            >
                              <Link to={`/profile/${talent.id}`}>
                                <ArrowRight className="w-4 h-4 text-white" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {!loading && sortedTalents.length === 0 && (
                <div className="col-span-full">
                  <FuturisticEmptyState 
                    icon={Users}
                    title={t("no_talents_found") || "Qidiruv shartlariga mos mutaxassis topilmadi"}
                    description={t("adjust_search") || "Filtrlarni yoki qidiruv so'zini o'zgartirib qayta tekshirib ko'ring."}
                    action={
                      <Button 
                        onClick={() => { setSearchQuery(''); setSelectedLevels([]); setSelectedSkills([]); setMaxRate(300); setSelectedLocation(''); }} 
                        variant="outline" 
                        className="glass border-white/10 h-12 px-8 rounded-xl font-bold cursor-pointer"
                      >
                        Filtrlarni Tozalash
                      </Button>
                    }
                  />
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
