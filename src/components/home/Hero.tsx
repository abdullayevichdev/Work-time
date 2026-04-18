import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export function Hero() {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Use transforms sparingly on mobile or simplify them
  const y = useTransform(scrollYProgress, [0, 1], ["0%", isMobile ? "20%" : "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Dynamic Background Elements */}
      <motion.div 
        style={!shouldReduceMotion ? { y, opacity, scale } : {}} 
        className="absolute inset-0 z-0 will-change-transform"
      >
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isMobile ? 'w-[400px] h-[400px] blur-[80px]' : 'w-[800px] h-[800px] blur-[160px]'} bg-primary/20 rounded-full animate-pulse will-change-[opacity]`} />
        {!isMobile && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] delay-700 animate-pulse will-change-[opacity]" />
        )}
        
        {/* Animated Background Beams - Simplified for mobile */}
        <div className="absolute inset-0 mask-radial">
          {[...Array(isMobile ? 3 : 6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ rotate: i * (360 / (isMobile ? 3 : 6)), opacity: 0 }}
              animate={!shouldReduceMotion ? { opacity: [0, 0.15, 0], scale: [1, 1.1, 1] } : { opacity: 0.1 }}
              transition={{ duration: isMobile ? 12 : 10, repeat: Infinity, delay: i * 2.5 }}
              className="absolute top-1/2 left-1/2 w-[200%] h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-1/2 -translate-y-1/2 will-change-transform"
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
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-primary text-[10px] md:text-xs font-bold tracking-widest uppercase mb-10 md:mb-12">
            <Sparkles className="w-3.5 h-3.5" />
            {t('tagline')}
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-8xl lg:text-[11rem] font-display font-bold tracking-tighter mb-8 md:mb-12 leading-tight md:leading-[0.8] text-white flex flex-col items-center select-none"
          >
            <motion.span 
              animate={!isMobile && !shouldReduceMotion ? { 
                textShadow: ["0 0 20px rgba(139,92,246,0)", "0 0 60px rgba(139,92,246,0.6)", "0 0 20px rgba(139,92,246,0)"],
                y: [0, -5, 0]
              } : {}}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="text-gradient inline-block relative z-30 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] will-change-[text-shadow,transform]"
            >
              {t("hero_title_1")}
            </motion.span>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 mt-1 md:mt-4 group cursor-default select-none"
            >
              {/* Volumetric Glow Echo */}
              <span className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-cyan-500 via-blue-600 to-primary pointer-events-none transition-all duration-[2s] group-hover:opacity-40 group-hover:scale-110">
                {t("hero_title_2")}
              </span>
              
              <span className="relative inline-block font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-blue-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] brightness-110">
                {t("hero_title_2")}
              </span>

              {/* Decorative holographic line */}
              <motion.div 
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 2, duration: 1, ease: "circOut" }}
                className="absolute -bottom-1 md:-bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
              />
            </motion.div>
          </motion.h1>
          
          <div className="relative mb-8 md:mb-12">
            <motion.div 
              variants={itemVariants}
              className="w-24 md:w-48 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto blur-[0.5px]"
              animate={!shouldReduceMotion ? { scaleX: [0.6, 1.2, 0.6], opacity: [0.4, 0.8, 0.4] } : {}}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <motion.p 
            variants={itemVariants}
            className="text-sm md:text-2xl text-white/40 max-w-2xl mx-auto mb-10 md:mb-20 leading-relaxed font-light tracking-wide px-4"
          >
            {t("hero_desc")}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6">
            <Button
              size="lg"
              className="h-14 md:h-16 px-8 md:px-10 text-base md:text-lg bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3)] group transition-all duration-300 hover:scale-105 active:scale-95"
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
              className="h-14 md:h-16 px-8 md:px-10 text-base md:text-lg glass border-white/10 hover:bg-white/5 rounded-2xl transition-all duration-300 hover:border-white/20"
              nativeButton={false}
              render={<Link to="/jobs">{t("explore_jobs")}</Link>}
            />
          </motion.div>

          {/* Floating Indicators */}
          {!isMobile && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 1 }}
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
          )}
        </motion.div>
      </div>

      {/* Decorative Perspective Elements - Disabled for mobile */}
      {!isMobile && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
        >
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12" />
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent -rotate-12" />
        </motion.div>
      )}
    </div>
  );
}
