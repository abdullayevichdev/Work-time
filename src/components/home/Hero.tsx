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
  const y = useTransform(scrollYProgress, [0, 1], ["0%", isMobile ? "0%" : "50%"]); // Disable parallax on mobile
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], [1, 1]); // Disable scale-down on mobile

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } // Quicker animations
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Dynamic Background Elements - Liquid Glass Effect */}
      <motion.div 
        style={!shouldReduceMotion ? { y, opacity, scale } : {}} 
        className="absolute inset-0 z-0 will-change-transform"
      >
        {/* Organic Light Sources - Simplified for performance */}
        <div className="absolute top-1/4 -left-20 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-primary/10 rounded-full blur-[60px] md:blur-[100px] opacity-40 select-none pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-[500px] md:w-[700px] h-[500px] md:h-[700px] bg-cyan-500/10 rounded-full blur-[80px] md:blur-[120px] opacity-30 select-none pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[600px] md:h-[900px] bg-indigo-500/5 rounded-full blur-[100px] md:blur-[140px] opacity-20 select-none pointer-events-none" />

        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isMobile ? 'w-[300px] h-[300px] blur-[60px]' : 'w-[800px] h-[800px] blur-[120px]'} bg-primary/5 rounded-full animate-pulse will-change-[opacity]`} />
        {!isMobile && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] delay-700 animate-pulse will-change-[opacity]" />
        )}
        
        {/* Animated Background Beams - Simplified for mobile */}
        <div className="absolute inset-0 mask-radial">
          {[...Array(isMobile ? 3 : 6)].map((_, i) => (
            <div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-1/2 -translate-y-1/2" />
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
          <motion.div 
            variants={itemVariants} 
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full liquid-glass border-white/20 text-primary text-[10px] md:text-xs font-black tracking-[0.3em] uppercase mb-12 md:mb-16 relative group cursor-default"
          >
            <div className="specular-glow opacity-50" />
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-sharp brightness-150">{t('tagline')}</span>
            
            {/* Liquid Shine Effect */}
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" 
            />
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-8xl lg:text-[11.5rem] font-display font-bold tracking-tighter mb-8 md:mb-12 leading-tight md:leading-[0.8] text-indigo-900 flex flex-col items-center select-none perspective-1000"
          >
            <motion.span 
              className="text-gradient inline-block relative z-30 drop-shadow-[0_15px_30px_rgba(139,92,246,0.1)] will-change-transform"
            >
              {t("hero_title_1")}
            </motion.span>
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 mt-2 md:mt-4 group cursor-default select-none -skew-x-6"
            >
              {/* Liquid Volumetric Highlight */}
              <span className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-cyan-300 via-primary/20 to-indigo-400/20 pointer-events-none transition-all duration-[2s] group-hover:opacity-50 group-hover:scale-125">
                {t("hero_title_2")}
              </span>
              
              <span className="relative inline-block text-liquid text-sharp">
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
            className="text-[15px] md:text-2xl text-indigo-950/40 max-w-2xl mx-auto mb-10 md:mb-16 leading-relaxed font-light tracking-wide px-4 text-sharp"
          >
            {t("hero_desc")}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mt-12 md:mt-16">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <Button
                size="lg"
                className="relative h-14 md:h-18 px-10 md:px-14 text-base md:text-xl bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 text-sharp font-black uppercase tracking-widest"
                nativeButton={false}
                render={
                  <Link to="/signup" className="flex items-center gap-3">
                    {t("get_started")}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                }
              />
            </div>
            
            <Button
              size="lg"
              variant="outline"
              className="h-14 md:h-18 px-10 md:px-14 text-base md:text-xl liquid-glass border-white/10 hover:bg-white/5 rounded-2xl transition-all duration-300 hover:border-white/20 text-sharp uppercase tracking-widest flex items-center justify-center"
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
              <div className="text-indigo-900/20 text-[9px] uppercase tracking-[0.6em] font-medium mix-blend-multiply">{t("scroll_explore")}</div>
              <div className="relative w-6 h-10 p-1 rounded-full border border-indigo-900/10 flex justify-center">
                <motion.div 
                  animate={{ y: [0, 16, 0], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="w-1.5 h-2 bg-primary/40 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.2)]" 
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
