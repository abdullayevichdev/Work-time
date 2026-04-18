import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="pt-20 pb-10 border-t border-white/5 bg-[#030014]/50 backdrop-blur-xl">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-transform duration-500">
                <span className="text-2xl font-display font-bold text-white">W</span>
              </div>
              <span className="text-2xl font-display font-bold tracking-tighter text-white">WorkTime</span>
            </Link>
            <p className="text-white/40 leading-relaxed text-sm">
              {t("footer_desc")}
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6">{t("footer_platform")}</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li><Link to="/jobs" className="hover:text-primary transition-colors">{t("browse_jobs")}</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">{t("dashboard")}</Link></li>
              <li><Link to="/profile" className="hover:text-primary transition-colors">{t("talents")}</Link></li>
              <li><Link to="/signup" className="hover:text-primary transition-colors">{t("premium")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">{t("footer_support")}</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Safety Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Community Guidelines</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold mb-6">{t("footer_subscribe")}</h4>
            <p className="text-sm text-white/40">{t("footer_sub_desc")}</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder={t("footer_email_placeholder")} 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button className="p-2 rounded-xl bg-primary hover:bg-primary/80 transition-colors">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-white/30">
          <p>© 2026 {t("footer_rights")}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">{t("footer_privacy")}</a>
            <a href="#" className="hover:text-white transition-colors">{t("footer_terms")}</a>
            <a href="#" className="hover:text-white transition-colors">{t("footer_cookies")}</a>
          </div>
          <p className="flex items-center gap-1">
            {t("footer_built_with")} <Heart className="w-4 h-4 text-red-500 fill-current" /> {t("footer_for_future")}
          </p>
        </div>
      </div>
    </footer>
  );
}
