import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, User, LogOut, MessageSquare, 
  Bell, Briefcase, LayoutDashboard, Globe, ChevronDown,
  Users, Shield, Trash2, CheckCircle
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

export function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Notifications Listener
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsubNotifs = onSnapshot(q, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setNotifications(docs);
          setUnreadCount(docs.filter(n => !n.read).length);
        });

        return () => unsubNotifs();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
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

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error("Error marking as read:", e);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error("Error deleting notification:", e);
    }
  };

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
    { name: t('messages'), href: '/messages', icon: MessageSquare },
    { name: t('talents'), href: '/talents', icon: Users },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isScrolled ? 'py-2 md:py-4 translate-y-2' : 'py-6 md:py-8'}`}>
      <div className={`container mx-auto px-4 md:px-6 transition-all duration-700 ${isScrolled ? 'max-w-[95%] md:max-w-4xl' : 'max-w-7xl'}`}>
        <div className={`flex items-center justify-between transition-all duration-700 ${isScrolled ? 'glass-dark rounded-2xl md:rounded-full px-6 md:px-8 py-3' : 'bg-transparent'}`}>
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-2xl font-display font-bold tracking-tighter text-indigo-950 group-hover:text-primary transition-colors text-sharp">WorkTime</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.href}
                className="text-xs font-black tracking-widest uppercase text-indigo-900/40 hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 text-sharp"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex gap-4">
               <button onClick={() => changeLanguage('en')} className={`text-[10px] font-bold ${i18n.language === 'en' ? 'text-primary' : 'text-indigo-900/20'}`}>EN</button>
               <button onClick={() => changeLanguage('uz')} className={`text-[10px] font-bold ${i18n.language === 'uz' ? 'text-primary' : 'text-indigo-900/20'}`}>UZ</button>
               <button onClick={() => changeLanguage('ru')} className={`text-[10px] font-bold ${i18n.language === 'ru' ? 'text-primary' : 'text-indigo-900/20'}`}>RU</button>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-10 h-10 rounded-full liquid-glass border-white/60 flex items-center justify-center hover:bg-white/40 transition-colors shadow-sm group relative">
                    <Bell className="w-5 h-5 text-indigo-900/40 group-hover:text-primary transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-primary/20">
                        {unreadCount}
                      </span>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="liquid-glass border-white/60 w-80 bg-white/80 backdrop-blur-3xl px-1 py-1" align="end">
                    <div className="p-3 text-[10px] font-bold text-indigo-900/40 uppercase tracking-widest border-b border-indigo-900/5 mb-1 flex justify-between items-center">
                      {t('notifications')}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <DropdownMenuItem 
                            key={notif.id}
                            onClick={() => { markAsRead(notif.id); navigate('/dashboard'); }}
                            className={`flex items-start gap-3 p-3 cursor-pointer border-b border-indigo-900/5 last:border-0 hover:bg-white/40 group ${!notif.read ? 'bg-primary/5' : ''}`}
                          >
                            <div className="relative">
                              <User className="w-8 h-8 p-1.5 rounded-full bg-indigo-900/5 text-indigo-900/40" />
                              {!notif.read && <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className={`text-xs font-bold text-indigo-950 leading-tight ${!notif.read ? 'pr-6' : ''}`}>
                                {notif.content}
                              </p>
                              <p className="text-[10px] text-indigo-900/40 font-medium">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => deleteNotification(notif.id, e)}
                                className="p-1 rounded-md text-red-400 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-10" />
                          <p className="text-indigo-900/40 text-[10px] font-bold uppercase tracking-widest">{t('no_new_notifications')}</p>
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-indigo-900/5">
                        <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest text-indigo-900/40 hover:text-primary" onClick={() => navigate('/dashboard')}>
                          {t('view_all')}
                        </Button>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

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
                  <span className="text-2xl font-display font-bold tracking-tighter text-indigo-950">WorkTime</span>
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
                <div className="flex gap-4">
                  <button onClick={() => changeLanguage('en')} className={`text-xs font-bold tracking-tight ${i18n.language === 'en' ? 'text-primary' : 'text-indigo-900/30'}`}>EN</button>
                  <button onClick={() => changeLanguage('uz')} className={`text-xs font-bold tracking-tight ${i18n.language === 'uz' ? 'text-primary' : 'text-indigo-900/30'}`}>UZ</button>
                  <button onClick={() => changeLanguage('ru')} className={`text-xs font-bold tracking-tight ${i18n.language === 'ru' ? 'text-primary' : 'text-indigo-900/30'}`}>RU</button>
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
        </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
