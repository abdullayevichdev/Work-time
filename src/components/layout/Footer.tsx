import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="pt-24 pb-12 border-t border-indigo-900/5 bg-white/40 backdrop-blur-3xl">
      <div className="container mx-auto px-6 text-indigo-950">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg transition-transform duration-500">
                <span className="text-2xl font-display font-black text-white text-sharp leading-none">W</span>
              </div>
              <span className="text-2xl font-display font-black tracking-tighter text-indigo-900/60 text-sharp">WorkTime</span>
            </Link>
            <p className="text-indigo-900/60 leading-relaxed text-[15px] text-sharp">
              {t("footer_desc")}
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2.5 rounded-xl liquid-glass border-indigo-900/5 text-indigo-900/40 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2.5 rounded-xl liquid-glass border-indigo-900/5 text-indigo-900/40 hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2.5 rounded-xl liquid-glass border-indigo-900/5 text-indigo-900/40 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
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
