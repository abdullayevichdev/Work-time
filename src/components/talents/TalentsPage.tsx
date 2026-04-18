import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Star, MapPin, DollarSign, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export function TalentsPage() {
  const { t } = useTranslation();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTalents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'freelancer'));
        const querySnapshot = await getDocs(q);
        const talentData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTalents(talentData);
      } catch (error) {
        console.error('Error fetching talents:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTalents();
  }, []);

  const filteredTalents = talents.filter(talent => 
    talent.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    talent.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="pt-32 pb-20 container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{t("talents_title_1")} <span className="text-primary">{t("talents_title_2")}</span></h1>
          <p className="text-white/50 max-w-xl">{t("talents_desc")}</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input 
              placeholder={t("search_talents_placeholder")} 
              className="pl-10 bg-white/5 border-white/10 focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="glass border-white/10 hover:bg-white/10">
            <Filter className="w-4 h-4 mr-2" /> {t("filter")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 glass rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTalents.map((talent, i) => (
            <motion.div
              key={talent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass border-white/10 hover:border-primary/50 transition-all group h-full flex flex-col">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <Avatar className="w-20 h-20 border-2 border-primary/20 p-1 bg-white/5">
                      <AvatarImage src={talent.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                        {talent.full_name?.[0] || talent.email?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {talent.is_verified && (
                      <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-500/10" title="Verified Professional" />
                    )}
                  </div>

                  <div className="mb-6 flex-1">
                    <h3 className="text-2xl font-bold mb-1 group-hover:text-primary transition-colors">{talent.full_name}</h3>
                    <p className="text-sm text-white/40 mb-4 flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {talent.stats?.rating || '5.0'} • {talent.stats?.completed_jobs || 0} {t("jobs_completed")}
                    </p>
                    <p className="text-sm text-white/60 line-clamp-3 mb-6">
                      {talent.bio}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {talent.skills?.slice(0, 4).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="bg-white/5 border-white/10 text-[10px] uppercase tracking-wider">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-medium mb-1">{t("hourly_rate")}</p>
                      <p className="text-xl font-bold text-primary">${talent.hourly_rate || '45'}<span className="text-sm font-normal text-white/40">{t("per_hr")}</span></p>
                    </div>
                    <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform" render={
                      <Link to={`/profile/${talent.id}`}>
                        <ArrowRight className="w-5 h-5 text-primary" />
                      </Link>
                    } />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredTalents.length === 0 && (
        <div className="text-center py-20 glass rounded-[40px] border-white/5">
          <Users className="w-16 h-16 mx-auto mb-6 text-white/10" />
          <h2 className="text-2xl font-bold mb-2">{t("no_talents_found")}</h2>
          <p className="text-white/40">{t("adjust_search")}</p>
        </div>
      )}
    </div>
  );
}
