
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Route, Map, Search, Home, Mail, Shield, FileText, Settings, LogIn, Languages, Menu, X, Accessibility } from 'lucide-react';
import { useAuth } from '@/api/AuthContext';
import { useLanguage } from '@/utils/language';

export default function PublicLayout({ children }) {
  const { user: currentUser, isLoading } = useAuth();
  const { t, lang, toggleLang, isRTL } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Skip navigation — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-[100] focus:bg-white focus:text-[#1D4E8F] focus:px-4 focus:py-2 focus:rounded focus:font-semibold focus:shadow-lg"
      >
        דלג לתוכן הראשי
      </a>

      {/* Navigation */}
      <nav className="bg-[#0C1C2E] border-b border-white/10 sticky top-0 z-50" aria-label={t('nav.mainNavLabel') || 'ניווט ראשי'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <img src="/logo.png" alt={t('app.name')} className="w-full h-full object-cover object-center" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">{t('app.name')}</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-2">
              <Link to={createPageUrl("Home")}>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                  <Home className="w-4 h-4 mr-2" />
                  {t('nav.home')}
                </Button>
              </Link>
              <Link to={createPageUrl("Map")}>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                  <Map className="w-4 h-4 mr-2" />
                  {t('nav.map')}
                </Button>
              </Link>
              <Link to={createPageUrl("Search")}>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                  <Search className="w-4 h-4 mr-2" />
                  {t('nav.search')}
                </Button>
              </Link>
              <Link to={createPageUrl("Route")}>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                  <Route className="w-4 h-4 mr-2" />
                  {t('nav.route')}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLang}
                aria-label={lang === 'he' ? 'Switch to English' : 'עבור לעברית'}
                className="text-white/60 hover:text-white hover:bg-white/10 gap-1"
              >
                <Languages className="w-4 h-4" aria-hidden="true" />
                <span className="text-xs font-semibold" aria-hidden="true">{lang === 'he' ? 'EN' : 'עב'}</span>
              </Button>
              {!isLoading && (
                currentUser?.role === 'admin' ? (
                  <Link to={createPageUrl("AdminDashboard")}>
                    <Button variant="ghost" size="sm" className="text-white border border-white/30 hover:bg-white/20 hover:text-white">
                      <Settings className="w-4 h-4 mr-2" />
                      {t('nav.admin')}
                    </Button>
                  </Link>
                ) : !currentUser ? (
                  <Link to={createPageUrl("Login")}>
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                      <LogIn className="w-4 h-4 mr-2" />
                      {t('nav.login')}
                    </Button>
                  </Link>
                ) : null
              )}
            </div>

            {/* Mobile nav — Map + Route + Language + Hamburger */}
            <div className="flex sm:hidden items-center gap-1">
              <Link to={createPageUrl("Map")} aria-label={t('nav.map')}>
                <Button variant="ghost" size="sm" aria-label={t('nav.map')} className="text-white/60 hover:text-white hover:bg-white/10 px-3">
                  <Map className="w-5 h-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link to={createPageUrl("Route")} aria-label={t('nav.route')}>
                <Button variant="ghost" size="sm" aria-label={t('nav.route')} className="text-white/60 hover:text-white hover:bg-white/10 px-3">
                  <Route className="w-5 h-5" aria-hidden="true" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLang}
                aria-label={lang === 'he' ? 'Switch to English' : 'עבור לעברית'}
                className="text-white/60 hover:text-white hover:bg-white/10 gap-1 px-2"
              >
                <span className="text-xs font-bold" aria-hidden="true">{lang === 'he' ? 'EN' : 'עב'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(o => !o)}
                aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className="text-white/60 hover:text-white hover:bg-white/10 px-3"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown — white on dark nav for clear contrast */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="sm:hidden bg-white border-t border-white/10 px-4 py-3 space-y-1" role="menu">
            <Link to={createPageUrl("Home")} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-[#555E6D] hover:text-[#1D4E8F] hover:bg-[#F2F2F2]">
                <Home className="w-4 h-4 mr-2" />
                {t('nav.home')}
              </Button>
            </Link>
            <Link to={createPageUrl("Search")} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-[#555E6D] hover:text-[#1D4E8F] hover:bg-[#F2F2F2]">
                <Search className="w-4 h-4 mr-2" />
                {t('nav.search')}
              </Button>
            </Link>
            {!isLoading && (
              currentUser?.role === 'admin' ? (
                <Link to={createPageUrl("AdminDashboard")} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-[#1D4E8F] border border-[#1D4E8F] hover:bg-[#1D4E8F] hover:text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    {t('nav.admin')}
                  </Button>
                </Link>
              ) : !currentUser ? (
                <Link to={createPageUrl("Login")} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-[#555E6D] hover:text-[#1D4E8F] hover:bg-[#F2F2F2]">
                    <LogIn className="w-4 h-4 mr-2" />
                    {t('nav.login')}
                  </Button>
                </Link>
              ) : null
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0C1C2E] text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img src="/logo.png" alt={t('app.name')} className="w-full h-full object-cover object-center" />
                </div>
                <h3 className="text-lg font-semibold">{t('app.name')}</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{t('footer.desc')}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("Map")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  {t('footer.mapOfSites')}
                </Link>
                <Link to={createPageUrl("Route")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  {t('footer.recommendedRoute')}
                </Link>
                <Link to={createPageUrl("Search")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  {t('footer.searchLocations')}
                </Link>
                <Link to={createPageUrl("About")} className="block text-white/80 hover:text-white text-sm transition-colors">
                  {t('footer.about')}
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.contactLegal')}</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("Contact")} className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
                  <Mail className="w-4 h-4 shrink-0" />
                  {t('footer.contact')}
                </Link>
                <Link to={createPageUrl("Terms")} className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
                  <FileText className="w-4 h-4 shrink-0" />
                  {t('footer.terms')}
                </Link>
                <Link to={createPageUrl("Privacy")} className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
                  <Shield className="w-4 h-4 shrink-0" />
                  {t('footer.privacy')}
                </Link>
                <Link to={createPageUrl("AccessibilityStatement")} className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
                  <Accessibility className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {t('footer.accessibility')}
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white text-sm font-medium mb-3">
              {t('footer.memorial')}
            </p>
            <p className="text-white/50 text-xs">
              Copyright © {currentYear} Snir Yulzari. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
