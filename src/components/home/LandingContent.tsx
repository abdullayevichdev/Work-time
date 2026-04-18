import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Users, Briefcase, DollarSign, Star, CheckCircle2, Trophy, Globe, Heart, Zap, Shield, Sparkles } from 'lucide-react';

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

  return (
    <div className="space-y-40 pb-40">
      {/* Features Bento Grid */}
      <section className="container mx-auto px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {/* Main Large Card */}
          <motion.div variants={fadeInUp} className="md:col-span-4 lg:col-span-4 glass-card p-6 md:p-10 flex flex-col justify-between min-h-[300px] md:min-h-[400px]">
            <div>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 md:mb-8">
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-primary" />
              </div>
              <h3 className="text-3xl md:text-5xl font-display font-medium mb-4 md:mb-6">{t("feat_main_title")} <br/><span className="italic">{t("feat_main_italic")}</span></h3>
              <p className="text-white/40 text-base md:text-lg max-w-md leading-relaxed">{t("feat_main_desc")}</p>
            </div>
            <div className="flex gap-3 md:gap-4 mt-6 md:mt-8">
              <div className="px-4 md:px-5 py-1.5 md:py-2 rounded-full glass border-white/5 text-[10px] md:text-xs text-white/50">{t("feat_ui")}</div>
              <div className="px-4 md:px-5 py-1.5 md:py-2 rounded-full glass border-white/5 text-[10px] md:text-xs text-white/50">{t("feat_latency")}</div>
            </div>
          </motion.div>

          {/* Secure Card */}
          <motion.div variants={fadeInUp} className="md:col-span-2 lg:col-span-2 glass-card p-6 md:p-10 bg-gradient-to-br from-primary/10 to-transparent">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-primary mb-6 md:mb-8" />
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{t("feat_secure_title")}</h3>
            <p className="text-sm md:text-base text-white/40 leading-relaxed">{t("feat_secure_desc")}</p>
          </motion.div>

          {/* Realtime Card */}
          <motion.div variants={fadeInUp} className="md:col-span-3 lg:col-span-2 glass-card p-6 md:p-10">
            <Zap className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 mb-6 md:mb-8" />
            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{t("feat_pulse_title")}</h3>
            <p className="text-sm md:text-base text-white/40 leading-relaxed">{t("feat_pulse_desc")}</p>
          </motion.div>

          {/* Global Card */}
          <motion.div variants={fadeInUp} className="md:col-span-3 lg:col-span-4 glass-card p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-10">
             <div className="flex-1">
                <Globe className="w-8 h-8 md:w-10 md:h-10 text-blue-400 mb-6 md:mb-8" />
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{t("feat_global_title")}</h3>
                <p className="text-sm md:text-base text-white/40 leading-relaxed">{t("feat_global_desc")}</p>
             </div>
             <div className="w-full md:w-1/2 h-full min-h-[150px] md:min-h-[200px] rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-mesh opacity-50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
             </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: t("stat_talent"), value: "50K+", icon: Users, color: "text-blue-400" },
            { label: t("stat_volume"), value: "120K+", icon: Briefcase, color: "text-purple-400" },
            { label: t("stat_funds"), value: "$30M+", icon: DollarSign, color: "text-green-400" },
            { label: t("stat_success"), value: "99.8%", icon: Star, color: "text-yellow-400" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center p-6 md:p-12 glass border-white/5 rounded-2xl md:rounded-[3rem] hover:border-primary/20 transition-all duration-500"
            >
              <stat.icon className={`w-8 h-8 md:w-10 md:h-10 mx-auto mb-4 md:mb-6 ${stat.color} opacity-80`} />
              <h3 className="text-2xl md:text-4xl font-display font-medium mb-1 md:mb-2 tracking-tight">{stat.value}</h3>
              <p className="text-[8px] md:text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works / Timeline */}
      <section className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center">
          <div className="w-full md:w-1/3 text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-display font-medium mb-6 md:mb-8 leading-tight">{t("flow_title")} <br/><span className="text-primary italic">{t("flow_italic")}</span></h2>
            <p className="text-white/40 text-base md:text-lg leading-relaxed">{t("flow_desc")}</p>
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
                <div className="text-3xl md:text-4xl font-display font-light text-white/10 group-hover:text-primary transition-colors duration-500">{item.step}</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{item.title}</h3>
                  <p className="text-sm md:text-base text-white/40 leading-relaxed max-w-md">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Infinite Marquee */}
      <section className="overflow-hidden py-12 md:py-20 bg-white/[0.02] border-y border-white/5">
        <div className="flex flex-nowrap gap-6 md:gap-12 animate-scroll whitespace-nowrap px-6">
          {[
            { name: "Alex Rivera", role: t("role_designer"), text: t("test_1") },
            { name: "Sarah Chen", role: t("role_cto"), text: t("test_2") },
            { name: "Mike Johnson", role: t("role_architect"), text: t("test_3") },
            { name: "Alex Rivera", role: t("role_designer"), text: t("test_1") },
            { name: "Sarah Chen", role: t("role_cto"), text: t("test_2") },
          ].map((t, i) => (
            <div key={i} className="inline-block glass-dark p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] min-w-[300px] md:min-w-[450px]">
              <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary to-blue-500" />
                <div className="text-left">
                  <h4 className="font-bold text-base md:text-lg">{t.name}</h4>
                  <p className="text-[10px] text-white/30 tracking-widest uppercase font-bold">{t.role}</p>
                </div>
              </div>
              <p className="text-white/60 text-base md:text-lg italic whitespace-normal leading-relaxed">"{t.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6">
        <div className="p-8 md:p-20 glass-card bg-mesh relative overflow-hidden group text-center rounded-3xl md:rounded-[4rem]">
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-3xl md:text-7xl font-display font-medium mb-6 md:mb-8">{t("cta_title")} <span className="italic">{t("cta_italic")}</span></h2>
            <p className="text-white/50 text-base md:text-xl max-w-xl mx-auto mb-8 md:mb-12">{t("cta_desc")}</p>
            <button className="h-16 md:h-20 px-8 md:px-12 bg-white text-black font-bold rounded-xl md:rounded-2xl text-lg md:text-xl hover:scale-105 active:scale-95 transition-all duration-300">
              {t("cta_button")}
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
