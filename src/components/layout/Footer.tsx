import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Mail, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="pt-24 pb-12 border-t border-indigo-900/5 bg-white/40 backdrop-blur-3xl">
      <div className="container mx-auto px-6 text-indigo-950">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-4 group">
              <img src="/WorkTime_logo_sayt2.png" alt="WorkTime Logo" className="h-12 w-auto group-hover:opacity-80 transition-opacity" />
            </Link>
            <p className="text-indigo-900/60 leading-relaxed text-[15px] text-sharp">
              {t("footer_desc")}
            </p>
            <div className="flex gap-4">
              {[
                { 
                  icon: Instagram, 
                  href: "https://www.instagram.com/wentriccompany/",
                  color: "hover:text-[#E4405F]"
                },
                { 
                  icon: () => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  ), 
                  href: "https://t.me/wentricCompany",
                  color: "hover:text-[#24A1DE]"
                },
                { 
                  icon: Youtube, 
                  href: "https://www.youtube.com/@Wentric",
                  color: "hover:text-[#FF0000]"
                },
                { 
                  icon: () => (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                    </svg>
                  ), 
                  href: "https://x.com/WentricCompany",
                  color: "hover:text-black"
                }
              ].map((social, i) => (
                <motion.a 
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -5, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2.5 rounded-xl liquid-glass border-indigo-900/5 text-indigo-900/40 ${social.color} transition-colors shadow-sm`}
                >
                  <social.icon />
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-sharp">{t("footer_platform")}</h4>
            <ul className="space-y-4 text-sm text-indigo-900/40">
              <li><Link to="/jobs" className="hover:text-primary transition-colors text-sharp">{t("browse_jobs")}</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors text-sharp">{t("dashboard")}</Link></li>
              <li><Link to="/profile" className="hover:text-primary transition-colors text-sharp">{t("talents")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-sharp">{t("footer_support")}</h4>
            <ul className="space-y-4 text-sm text-indigo-900/40">
              <li><a href="#" className="hover:text-primary transition-colors text-sharp">{t("help_center")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors text-sharp">{t("safety_center")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors text-sharp">{t("community_guidelines")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors text-sharp">{t("contact_us")}</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold mb-6 text-sharp">{t("footer_subscribe")}</h4>
            <p className="text-sm text-indigo-900/40 text-sharp">{t("footer_sub_desc")}</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder={t("footer_email_placeholder")} 
                className="flex-1 liquid-glass bg-white/40 border border-indigo-900/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-indigo-950 placeholder:text-indigo-900/20"
              />
              <button className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-md">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-indigo-900/5 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-indigo-900/40 text-sharp font-medium">
          <p>© 2026 {t("footer_rights")}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">{t("footer_privacy")}</a>
            <a href="#" className="hover:text-primary transition-colors">{t("footer_terms")}</a>
            <a href="#" className="hover:text-primary transition-colors">{t("footer_cookies")}</a>
          </div>
          <p className="flex items-center gap-1">
            {t("footer_built_with")} <Heart className="w-4 h-4 text-rose-500 fill-current" /> {t("footer_for_future")}
          </p>
        </div>
      </div>
    </footer>
  );
}
