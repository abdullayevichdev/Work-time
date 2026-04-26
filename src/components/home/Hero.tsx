import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'motion/react';
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
  const [textIndex, setTextIndex] = useState(0);
  const words = [t("hero_word_1", "Innovation."), t("hero_word_2", "Excellence."), t("hero_word_3", "Brilliance.")];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % words.length);
    }, 4000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(interval);
    };
  }, [words.length]);

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
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-20">
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 border border-white/40 shadow-sm backdrop-blur-md text-[10px] md:text-xs font-bold tracking-widest uppercase mb-8 md:mb-10 relative group cursor-default overflow-hidden"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span className="text-indigo-950/80">{t('new_tagline', 'THE NEXT ERA OF WORK')}</span>
            
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 4 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none" 
            />
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl sm:text-7xl md:text-[7rem] lg:text-[8rem] font-display font-black tracking-tighter mb-8 md:mb-12 leading-[1.1] text-indigo-950 flex flex-col items-center justify-center select-none perspective-1000"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 drop-shadow-sm pb-2">
              {t('hero_title_new', 'Discover')}
            </span>
            <div className="relative h-[1.2em] w-full flex items-center justify-center mt-2 md:mt-4">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={textIndex}
                  initial={{ y: 40, opacity: 0, rotateX: -90 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  exit={{ y: -40, opacity: 0, rotateX: 90 }}
                  transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                  className="absolute inset-0 flex items-center justify-center origin-center"
                >
                  <span className="absolute inset-0 blur-3xl opacity-40 bg-gradient-to-r from-primary via-purple-500 to-cyan-500 pointer-events-none transition-all duration-[2s] group-hover:opacity-60 group-hover:scale-110 whitespace-nowrap"></span>
                  <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-cyan-500 pb-2">
                    {words[textIndex]}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
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

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mt-12 md:mt-16">
                <div className="relative group w-full sm:w-auto">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary via-indigo-500 to-cyan-500 rounded-full blur-md opacity-40 group-hover:opacity-70 transition duration-500"></div>
                  <Button
                    size="lg"
                    className="relative w-full sm:w-auto h-12 md:h-16 px-8 md:px-12 text-sm md:text-lg bg-gradient-to-r from-indigo-600 via-primary to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-full shadow-[0_0_40px_rgba(139,92,246,0.3)] border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 font-bold uppercase tracking-[0.15em] overflow-hidden"
                    nativeButton={false}
                    render={
                      <Link to="/signup" className="flex items-center justify-center gap-3 w-full h-full">
                        <span className="relative z-10">{t("get_started")}</span>
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
                      </Link>
                    }
                  />
                </div>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 md:h-16 px-8 md:px-12 text-sm md:text-lg bg-white/30 backdrop-blur-xl border border-white/60 hover:bg-white/50 text-indigo-950 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-all duration-300 hover:scale-105 active:scale-95 font-bold uppercase tracking-[0.15em] flex items-center justify-center"
                  nativeButton={false}
                  render={<Link to="/jobs" className="w-full h-full flex items-center justify-center">{t("explore_jobs")}</Link>}
                />
              </div>

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
