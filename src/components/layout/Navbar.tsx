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
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.6)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <span className="text-2xl font-display font-medium italic text-white">W</span>
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
              <div className="flex items-center gap-6">
                <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">{t("login")}</Link>
                <Link to="/signup" className="px-6 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all">
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 glass-dark border-t border-white/10 p-6 flex flex-col gap-6"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-white/70 hover:text-white flex items-center gap-3"
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            ))}
            <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-white/70">{t('language')}</span>
                <div className="flex gap-4">
                  <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'text-primary' : 'text-white/70'}>EN</button>
                  <button onClick={() => changeLanguage('uz')} className={i18n.language === 'uz' ? 'text-primary' : 'text-white/70'}>UZ</button>
                </div>
              </div>
              {!user && (
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="ghost"
                    render={<Link to="/login">{t("login")}</Link>}
                    nativeButton={false}
                    className="text-white border border-white/10"
                  />
                  <Button
                    className="bg-primary"
                    render={<Link to="/signup">{t("signup")}</Link>}
                    nativeButton={false}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
