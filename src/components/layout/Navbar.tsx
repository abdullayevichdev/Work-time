import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, User, LogOut, MessageSquare, 
  Bell, Briefcase, LayoutDashboard, Globe, ChevronDown,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const navLinks = [
    { name: t('jobs'), href: '/jobs', icon: Briefcase },
    { name: t('messages'), href: '/messages', icon: MessageSquare },
    { name: t('talents'), href: '/talents', icon: Users },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled ? 'py-2 md:py-4 translate-y-2' : 'py-6 md:py-8'}`}>
      <div className={`container mx-auto px-4 md:px-6 transition-all duration-700 ${isScrolled ? 'max-w-[95%] md:max-w-4xl' : 'max-w-7xl'}`}>
        <div className={`flex items-center justify-between transition-all duration-700 ${isScrolled ? 'glass-dark rounded-2xl md:rounded-full px-6 md:px-8 py-3' : 'bg-transparent'}`}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.6)] group-hover:scale-110 transition-all duration-500">
              <span className="text-2xl font-display font-bold text-white">W</span>
            </div>
            {!isScrolled && (
              <span className="text-2xl font-display font-medium tracking-tighter text-white">WorkTime</span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.href}
                className="text-xs font-bold tracking-widest uppercase text-white/50 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex gap-4">
               <button onClick={() => changeLanguage('en')} className={`text-[10px] font-bold ${i18n.language === 'en' ? 'text-primary' : 'text-white/20'}`}>EN</button>
               <button onClick={() => changeLanguage('uz')} className={`text-[10px] font-bold ${i18n.language === 'uz' ? 'text-primary' : 'text-white/20'}`}>UZ</button>
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="w-10 h-10 rounded-full glass border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <User className="w-5 h-5" />
                    </button>
                  }
                />
                <DropdownMenuContent className="glass-dark border-white/10 w-48" align="end">
                  <DropdownMenuItem render={<Link to="/profile" className="text-white hover:bg-white/10 cursor-pointer flex items-center gap-2 p-3"><User className="w-4 h-4" /> {t("profile")}</Link>} />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-400/10 cursor-pointer flex items-center gap-2 p-3"><LogOut className="w-4 h-4" /> {t("logout")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-8">
                <Link 
                  to="/login" 
                  className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all duration-300"
                >
                  {t("login")}
                </Link>
                <Link 
                  to="/signup" 
                  className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  {t("signup")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-50 glass-dark bg-[#030014]/90 backdrop-blur-2xl p-8 flex flex-col justify-between"
          >
            <div className="space-y-12">
              <div className="flex items-center justify-between">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                    <span className="text-2xl font-display font-medium text-white">W</span>
                  </div>
                  <span className="text-2xl font-display font-medium tracking-tighter text-white">WorkTime</span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-full glass border-white/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link 
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-xl font-display font-medium text-white/50 hover:text-white flex items-center gap-6 group transition-all"
                    >
                      <span className="text-xs font-mono text-primary/40 group-hover:text-primary transition-colors">0{i + 1}</span>
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-6 py-4 rounded-2xl glass border-white/10">
                <div className="flex items-center gap-2 text-white/40">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('language')}</span>
                </div>
                <div className="flex gap-5">
                  <button onClick={() => changeLanguage('en')} className={`text-xs font-bold tracking-tight ${i18n.language === 'en' ? 'text-primary' : 'text-white/30'}`}>EN</button>
                  <button onClick={() => changeLanguage('uz')} className={`text-xs font-bold tracking-tight ${i18n.language === 'uz' ? 'text-primary' : 'text-white/30'}`}>UZ</button>
                </div>
              </div>

              {!user ? (
                <div className="flex flex-col gap-3">
                  <Link 
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="h-12 flex items-center justify-center text-xs font-bold uppercase tracking-widest border border-white/10 rounded-xl text-white/60 hover:bg-white/5 transition-colors"
                  >
                    {t("login")}
                  </Link>
                  <Link 
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="h-12 flex items-center justify-center text-xs font-bold uppercase tracking-widest bg-white text-black rounded-xl hover:bg-white/90 transition-all shadow-lg"
                  >
                    {t("signup")}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                    className="h-12 glass border-white/10 text-white gap-2 text-xs rounded-xl"
                  >
                    <User className="w-3.5 h-3.5" /> {t("profile")}
                  </Button>
                  <Button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="h-12 bg-red-500/10 text-red-400 hover:bg-red-500/20 gap-2 text-xs rounded-xl"
                  >
                    <LogOut className="w-3.5 h-3.5" /> {t("logout")}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
