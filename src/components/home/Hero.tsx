import { motion, useScroll, useTransform } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Shield, Zap, MousePointer2 } from 'lucide-react';
import { useRef } from 'react';

export function Hero() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Dynamic Background Elements */}
      <motion.div style={{ y, opacity, scale }} className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] delay-700 animate-pulse" />
        
        {/* Animated Background Beams */}
        <div className="absolute inset-0 mask-radial">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ rotate: i * 60, opacity: 0 }}
              animate={{ opacity: [0, 0.2, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 10, repeat: Infinity, delay: i * 2 }}
              className="absolute top-1/2 left-1/2 w-[200%] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-1/2 -translate-y-1/2"
            />
          ))}
        </div>
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-primary text-xs font-bold tracking-widest uppercase mb-12">
            <Sparkles className="w-4 h-4" />
            {t('tagline')}
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-9xl lg:text-[13rem] font-display font-medium tracking-tighter mb-8 md:mb-12 leading-[0.75] text-white flex flex-col items-center select-none"
          >
            <motion.span 
              animate={{ 
                textShadow: ["0 0 20px rgba(139,92,246,0)", "0 0 60px rgba(139,92,246,0.6)", "0 0 20px rgba(139,92,246,0)"],
                y: [0, -8, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="text-gradient inline-block relative z-30 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]"
            >
              {t("hero_title_1")}
            </motion.span>
            <motion.span 
              initial={{ rotate: -4, y: 40, opacity: 0 }}
              animate={{ rotate: -2, y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 2, ease: [0.16, 1, 0.3, 1] }}
              className="italic font-extralight text-white/95 drop-shadow-[0_30px_60px_rgba(0,0,0,1)] -mt-2 md:-mt-8 lg:-mt-12 brightness-150 selection:text-primary relative z-10 bg-white/5 backdrop-blur-[2px] px-6 md:px-8 py-1.5 md:py-2 rounded-full border border-white/5"
            >
              {t("hero_title_2")}
            </motion.span>
          </motion.h1>
          
          <div className="relative mb-12 md:mb-16">
            <motion.div 
              variants={itemVariants}
              className="w-32 md:w-48 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto blur-[1px]"
              animate={{ scaleX: [0.5, 1.5, 0.5], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              animate={{ x: [-60, 60, -60] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-1/2 w-4 h-[1px] bg-white rounded-full blur-[4px] -translate-x-1/2"
            />
          </div>

          <motion.p 
            variants={itemVariants}
            className="text-base md:text-2xl text-white/30 max-w-2xl mx-auto mb-12 md:mb-20 leading-relaxed font-light tracking-wide px-4"
          >
            {t("hero_desc")}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button
              size="lg"
              className="h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)] group transition-all duration-500 hover:scale-105 active:scale-95"
              nativeButton={false}
              render={
                <Link to="/signup" className="flex items-center gap-2">
                  {t("get_started")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              className="h-16 px-10 text-lg glass border-white/10 hover:bg-white/5 rounded-2xl transition-all duration-500 hover:border-white/20"
              nativeButton={false}
              render={<Link to="/jobs">{t("explore_jobs")}</Link>}
            />
          </motion.div>

          {/* Floating Indicators */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6"
          >
            <div className="text-white/30 text-[9px] uppercase tracking-[0.6em] font-medium mix-blend-overlay">{t("scroll_explore")}</div>
            <div className="relative w-6 h-10 p-1 rounded-full border border-white/10 flex justify-center">
              <motion.div 
                animate={{ y: [0, 16, 0], opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-1.5 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Perspective Elements */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
      >
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -rotate-12" />
      </motion.div>
    </div>
  );
}
