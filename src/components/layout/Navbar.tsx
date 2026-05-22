import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, User, LogOut, MessageSquare, 
  Bell, Briefcase, LayoutDashboard, Globe, ChevronDown,
  Users, Shield, Trash2, CheckCircle, Inbox,
  Instagram, Youtube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ADMIN_USERS } from '@/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, limit } from 'firebase/firestore';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      unsubscribeAuth();
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
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('jobs'), href: '/jobs', icon: Briefcase },
    { name: t('requests') || 'Requests', href: '/requests', icon: Inbox },
    { name: t('messages'), href: '/messages', icon: MessageSquare },
    { name: t('talents'), href: '/talents', icon: Users },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled ? 'py-2 md:py-4 translate-y-2' : 'py-6 md:py-8'}`}>
      <div className={`container mx-auto px-4 md:px-6 transition-all duration-700 ${isScrolled ? 'max-w-[95%] md:max-w-6xl' : 'max-w-7xl'}`}>
        <div className={`flex items-center justify-between transition-all duration-700 ${isScrolled ? 'glass-dark rounded-2xl md:rounded-full px-6 md:px-8 py-3' : 'bg-transparent'}`}>
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img src="/WorkTime_logo_sayt2.png" alt="WorkTime Logo" className="h-10 w-auto group-hover:opacity-80 transition-opacity" />
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 shrink-0">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.href}
                className="text-[10px] lg:text-xs font-black tracking-widest uppercase text-indigo-900/40 hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 text-sharp shrink-0"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-6 shrink-0">
            <div className="flex bg-white/40 backdrop-blur-md border border-white/50 p-1 rounded-xl gap-0.5 shadow-sm">
              {['en', 'uz', 'ru'].map((lng) => (
                <button
                  key={lng}
                  onClick={() => changeLanguage(lng)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all tracking-wider cursor-pointer ${
                    i18n.language === lng
                      ? 'bg-primary text-white shadow-md'
                      : 'text-indigo-950/50 hover:text-indigo-950 hover:bg-white/30'
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger className="w-10 h-10 rounded-full liquid-glass border-white/60 flex items-center justify-center hover:bg-white/40 transition-colors shadow-sm group">
                    <User className="w-5 h-5 text-indigo-900/40 group-hover:text-primary transition-colors" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="liquid-glass border-white/60 w-48 bg-white/80 backdrop-blur-3xl px-1 py-1" align="end">
                    {user?.email && ADMIN_USERS[user.email.toLowerCase()] ? (
                      <DropdownMenuItem 
                        onClick={() => {
                          console.log('Navigating to /admin');
                          navigate('/admin');
                        }}
                        className="text-primary hover:bg-primary/5 cursor-pointer flex items-center justify-between p-3 font-bold"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" /> OWNER Panel
                        </div>
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none font-black text-[8px] tracking-widest px-2">OWNER</Badge>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem 
                      onClick={() => navigate('/dashboard')}
                      className="text-indigo-950 hover:bg-white/40 cursor-pointer flex items-center gap-2 p-3 font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4" /> {t("dashboard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate('/profile')}
                      className="text-indigo-950 hover:bg-white/40 cursor-pointer flex items-center gap-2 p-3 font-medium"
                    >
                      <User className="w-4 h-4" /> {t("profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:bg-red-50/50 cursor-pointer flex items-center gap-2 p-3 font-medium">
                      <LogOut className="w-4 h-4" /> {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <Link 
                  to="/login" 
                  className="text-xs font-black uppercase tracking-[0.2em] text-indigo-900/40 hover:text-primary transition-all duration-300 text-sharp"
                >
                  {t("login")}
                </Link>
                <Link 
                  to="/signup" 
                  className="px-8 h-11 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                >
                  {t("signup")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-indigo-950" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
            className="md:hidden fixed inset-0 z-50 liquid-glass border-none bg-white/90 backdrop-blur-2xl p-6 flex flex-col justify-between overflow-y-auto"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="space-y-12 text-indigo-950">
              <div className="flex items-center justify-between">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                  <img src="/WorkTime_logo_sayt2.png" alt="WorkTime Logo" className="h-10 w-auto" />
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-full liquid-glass border-white/60 flex items-center justify-center">
                  <X className="w-5 h-5" />
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
                      className="text-xl font-display font-medium opacity-40 hover:opacity-100 hover:text-primary flex items-center gap-6 group transition-all"
                    >
                      <span className="text-xs font-mono text-primary/40 group-hover:text-primary transition-colors">0{i + 1}</span>
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-6 py-4 rounded-2xl liquid-glass border-white/60 bg-white/40">
                <div className="flex items-center gap-2 text-indigo-900/40">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('language')}</span>
                </div>
                <div className="flex bg-white/40 backdrop-blur-md border border-white/50 p-0.5 rounded-xl gap-0.5 shadow-sm">
                  {['en', 'uz', 'ru'].map((lng) => (
                    <button
                      key={lng}
                      onClick={() => changeLanguage(lng)}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all tracking-wider cursor-pointer ${
                        i18n.language === lng
                          ? 'bg-primary text-white shadow-md'
                          : 'text-indigo-950/50 hover:text-indigo-950 hover:bg-white/30'
                      }`}
                    >
                      {lng}
                    </button>
                  ))}
                </div>
              </div>

              {!user ? (
                <div className="flex flex-col gap-3">
                  <Link 
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="h-11 flex items-center justify-center text-xs font-bold uppercase tracking-widest border border-indigo-900/10 rounded-xl text-indigo-900/60 hover:bg-white/40 transition-colors"
                  >
                    {t("login")}
                  </Link>
                  <Link 
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="h-11 flex items-center justify-center text-xs font-bold uppercase tracking-widest bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                  >
                    {t("signup")}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {user?.email && ADMIN_USERS[user.email.toLowerCase()] && (
                    <Button
                      onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                      className="h-11 bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:opacity-90 gap-2 text-xs rounded-xl font-black tracking-widest"
                    >
                      <Shield className="w-3.5 h-3.5" /> OWNER Panel
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                      className="h-11 liquid-glass border-white/60 bg-white/40 text-indigo-950 gap-2 text-xs rounded-xl"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" /> {t("dashboard")}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                      className="h-11 liquid-glass border-white/60 bg-white/40 text-indigo-950 gap-2 text-xs rounded-xl"
                    >
                      <User className="w-3.5 h-3.5" /> {t("profile")}
                    </Button>
                  </div>
                  <Button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="h-11 bg-red-500/10 text-red-500 hover:bg-red-500/20 gap-2 text-xs rounded-xl"
                  >
                    <LogOut className="w-3.5 h-3.5" /> {t("logout")}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-6 border-t border-indigo-900/5">
              {[
                { 
                  icon: Instagram, 
                  href: "https://www.instagram.com/wentriccompany/",
                  color: "text-[#E4405F]"
                },
                { 
                  icon: () => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  ), 
                  href: "https://t.me/wentricCompany",
                  color: "text-[#24A1DE]"
                },
                { 
                  icon: Youtube, 
                  href: "https://www.youtube.com/@Wentric",
                  color: "text-[#FF0000]"
                },
                { 
                  icon: () => (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                    </svg>
                  ), 
                  href: "https://x.com/WentricCompany",
                  color: "text-indigo-950"
                }
              ].map((social, i) => (
                <motion.a 
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 rounded-full liquid-glass border-white/60 bg-white/40 flex items-center justify-center ${social.color} shadow-sm transition-colors`}
                >
                  <social.icon />
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
