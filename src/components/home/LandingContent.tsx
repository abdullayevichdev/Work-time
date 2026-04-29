import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, Briefcase, DollarSign, Star, 
  CheckCircle2, Trophy, Globe, Heart, 
  Zap, Shield, Sparkles, TrendingUp, 
  ShieldCheck, Clock 
} from 'lucide-react';

import { MarketPulse } from './MarketPulse';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { ADMIN_USERS } from '@/constants';
import React from 'react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export function LandingContent() {
  const { t } = useTranslation();
  const [isPremium, setIsPremium] = React.useState(false);
  const [liveMessages, setLiveMessages] = React.useState<any[]>([]);

  React.useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('created_at', 'desc'),
      limit(15)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLiveMessages(msgs);
    });

    return () => unsubscribe();
  }, []);


  React.useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const isAdmin = user.email && ADMIN_USERS[user.email.toLowerCase()];
        setIsPremium(!!isAdmin);
      } else {
        setIsPremium(false);
      }
    });
    return () => unsubAuth();
  }, []);

  return (
    <div className="space-y-40 pb-40">
      {/* Features Bento Grid */}
      <section className="container mx-auto px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }} // More aggressive margin
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 will-change-transform"
        >
          {/* Main Large Card */}
          <div className="md:col-span-4 lg:col-span-4 liquid-card p-6 md:p-12 flex flex-col justify-between min-h-[300px] md:min-h-[450px]">
            <div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 md:mb-10 shadow-inner">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <h3 className="text-3xl md:text-6xl font-display font-bold mb-4 md:mb-6 tracking-tight text-sharp">{t("feat_main_title")} <br/><span className="text-primary">{t("feat_main_italic")}</span></h3>
              <p className="text-indigo-950/60 text-base md:text-xl max-w-lg leading-relaxed text-sharp mb-8">{t("feat_main_desc")}</p>
              
              {/* Professional Tool Interface Mockup */}
              <div className="hidden lg:block w-full max-w-2xl mt-12">
                <MarketPulse isPremium={isPremium} />
              </div>
            </div>
            <div className="flex gap-3 md:gap-4 mt-8 md:mt-10">
              <div className="px-5 md:px-6 py-2 md:py-3 rounded-full liquid-glass border-indigo-900/10 text-[10px] md:text-xs font-bold tracking-widest uppercase text-indigo-950/40 text-sharp">{t("feat_ui")}</div>
              <div className="px-5 md:px-6 py-2 md:py-3 rounded-full liquid-glass border-indigo-900/10 text-[10px] md:text-xs font-bold tracking-widest uppercase text-indigo-950/40 text-sharp">{t("feat_latency")}</div>
            </div>
          </div>

          {/* Secure Card */}
          <div className="md:col-span-2 lg:col-span-2 liquid-card p-6 md:p-12 flex flex-col justify-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
              <Shield className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-5 text-sharp">{t("feat_secure_title")}</h3>
            <p className="text-sm md:text-lg text-indigo-950/60 leading-relaxed text-sharp">{t("feat_secure_desc")}</p>
          </div>

          {/* Realtime Card */}
          <div className="md:col-span-3 lg:col-span-2 liquid-card p-6 md:p-12 flex flex-col justify-center">
            <div className="w-14 h-14 rounded-2xl bg-yellow-400/20 flex items-center justify-center mb-8">
              <Zap className="w-7 h-7 md:w-8 md:h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-5 text-sharp">{t("feat_pulse_title")}</h3>
            <p className="text-sm md:text-lg text-indigo-950/60 leading-relaxed text-sharp">{t("feat_pulse_desc")}</p>
          </div>

          {/* Global Card */}
          <div className="md:col-span-3 lg:col-span-4 liquid-card p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 md:gap-14">
             <div className="flex-1">
                <div className="w-14 h-14 rounded-2xl bg-blue-400/20 flex items-center justify-center mb-8">
                  <Globe className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
                </div>
                <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-5 text-sharp">{t("feat_global_title")}</h3>
                <p className="text-sm md:text-lg text-indigo-950/60 leading-relaxed text-sharp">{t("feat_global_desc")}</p>
             </div>
             <div className="w-full md:w-1/2 h-64 rounded-3xl liquid-glass border-indigo-900/10 bg-white/40 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
             </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: t("stat_talent"), value: "50K+", icon: Users, color: "text-blue-600" },
            { label: t("stat_volume"), value: "120K+", icon: Briefcase, color: "text-primary" },
            { label: t("stat_funds"), value: "$30M+", icon: DollarSign, color: "text-emerald-600" },
            { label: t("stat_success"), value: "99.8%", icon: Star, color: "text-amber-500" },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center p-4 md:p-12 liquid-glass border-white/60 bg-white/40 hover:border-primary transition-all duration-300 shadow-xl"
            >
              <stat.icon className={`w-6 h-6 md:w-12 md:h-12 mx-auto mb-4 md:mb-8 ${stat.color}`} />
              <h3 className="text-xl md:text-5xl font-display font-bold mb-1 md:mb-3 tracking-tighter text-sharp">{stat.value}</h3>
              <p className="text-[8px] md:text-xs text-indigo-900/40 uppercase tracking-[0.2em] font-bold text-sharp">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works / Timeline */}
      <section className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center">
          <div className="w-full md:w-1/3 text-center md:text-left">
            <h2 className="text-3xl md:text-6xl font-display font-medium mb-6 md:mb-8 leading-tight text-sharp">{t("flow_title")} <br/><span className="text-primary font-bold uppercase tracking-widest text-xl md:text-4xl">{t("flow_italic")}</span></h2>
            <p className="text-indigo-900/40 text-base md:text-lg leading-relaxed text-sharp">{t("flow_desc")}</p>
          </div>
          
          <div className="flex-1 space-y-6 md:space-y-8 w-full">
            {[
              { step: "01", title: t("flow_step1_title"), desc: t("flow_step1_desc") },
              { step: "02", title: t("flow_step2_title"), desc: t("flow_step2_desc") },
              { step: "03", title: t("flow_step3_title"), desc: t("flow_step3_desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex gap-6 md:gap-8 group"
              >
                <div className="text-3xl md:text-4xl font-display font-light text-indigo-900/10 group-hover:text-primary transition-colors duration-500 text-sharp">{item.step}</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-sharp">{item.title}</h3>
                  <p className="text-sm md:text-base text-indigo-900/40 leading-relaxed max-w-md text-sharp">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Infinite Marquee */}
      <section className="overflow-hidden py-12 md:py-20 bg-primary/5 border-y border-indigo-900/5">
        <div className="flex flex-nowrap gap-6 md:gap-12 animate-scroll whitespace-nowrap px-6">
          {(liveMessages.length > 0 ? (liveMessages.length < 5 ? [...liveMessages, ...liveMessages, ...liveMessages] : [...liveMessages, ...liveMessages]) : [
            { sender_name: "Alex Rivera", text: t("test_1"), sender_avatar: "" },
            { sender_name: "Sarah Chen", text: t("test_2"), sender_avatar: "" },
            { sender_name: "Mike Johnson", text: t("test_3"), sender_avatar: "" }
          ]).map((m: any, i) => (
            <div key={i} className="inline-block liquid-glass border-white/60 bg-white/40 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] min-w-[300px] md:min-w-[450px]">
              <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                {m.sender_avatar ? (
                  <img src={m.sender_avatar} alt={m.sender_name} className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-primary/20" />
                ) : (
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                    {m.sender_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="text-left">
                  <h4 className="font-bold text-base md:text-lg text-indigo-950 text-sharp">{m.sender_name}</h4>
                  <p className="text-[10px] text-indigo-900/30 tracking-widest uppercase font-bold text-sharp">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString() : t("role_member")}
                  </p>
                </div>
              </div>
              <p className="text-indigo-950/60 text-base md:text-lg font-medium whitespace-normal leading-relaxed text-sharp">"{m.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6">
        <div className="p-8 md:p-24 liquid-card bg-primary/5 relative overflow-hidden group text-center rounded-[3rem] md:rounded-[5rem] contain-paint">
          {/* Static Aura */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[80px] opacity-20" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-4xl md:text-8xl font-display font-bold mb-8 md:mb-12 tracking-tighter text-sharp leading-[0.9]">{t("cta_title")} <br/><span className="text-primary">{t("cta_italic")}</span></h2>
            <p className="text-indigo-900/60 text-base md:text-2xl max-w-2xl mx-auto mb-10 md:mb-16 leading-relaxed font-light text-sharp">{t("cta_desc")}</p>
            <Link to="/signup" className="inline-flex items-center justify-center h-11 md:h-16 px-10 md:px-14 bg-primary text-white font-black uppercase tracking-widest rounded-2xl md:rounded-3xl text-sm md:text-base hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl">
              {t("cta_button")}
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
