import React, { useState } from 'react';
import {
  Sprout,
  TrendingUp,
  Warehouse,
  Calculator,
  Info,
  Menu,
  X,
  LayoutDashboard,
  MapPin,
  Globe,
  Navigation,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Language } from '../context/translations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'en', label: 'English' },
];

export const Navbar: React.FC<NavbarProps> = React.memo(({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t, userLocation, requestLocation } = useApp();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'market', label: t('nav.market'), icon: TrendingUp },
    { id: 'storage', label: t('nav.storage'), icon: Warehouse },
    { id: 'calculator', label: t('nav.calculator'), icon: Calculator },
    { id: 'about', label: t('nav.about'), icon: Info },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#E9EEE8]/95 border-b border-[#d8e0d6] px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0 text-left bg-transparent border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52785B] rounded-2xl"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#E9EEE8] neo-card flex items-center justify-center text-[#52785B] group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#26352B]">
                {t('app_name')}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#52785B]/15 text-[#304C38] font-bold border border-[#52785B]/30">
                SevaSathi
              </span>
            </div>
            <p className="text-[11px] text-[#59665C] font-medium hidden md:block">
              {t('app_subtitle')}
            </p>
          </div>
        </button>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#E9EEE8] p-1.5 rounded-full neo-inset">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'neo-btn-primary shadow-sm'
                    : 'text-[#26352B] hover:text-[#52785B] hover:bg-black/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Language Switcher & Detected Location Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector (Marathi by default, Hindi, English) */}
          <div className="flex items-center p-1 rounded-full neo-inset bg-[#E9EEE8]">
            <Globe className="w-3.5 h-3.5 text-[#52785B] ml-1 mr-0.5 hidden sm:inline" />
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  language === l.code
                    ? 'bg-[#52785B] text-[#F6F4EC] shadow-sm'
                    : 'text-[#26352B] hover:text-[#52785B]'
                }`}
                title={`Switch to ${l.label}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Dynamic Detected User Location Badge */}
          <button
            onClick={requestLocation}
            title={t('location_use_gps')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E9EEE8] neo-card-sm text-xs font-medium text-[#304C38] hover:bg-[#e2ebe0] transition-colors border border-white/60 max-w-[210px]"
          >
            {userLocation.status === 'detecting' ? (
              <div className="w-3.5 h-3.5 border-2 border-[#52785B] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-[#52785B] flex-shrink-0 animate-bounce" />
            )}
            <span className="truncate text-[11px] font-bold">
              {userLocation.displayName}
            </span>
            <Navigation className="w-3 h-3 text-[#59665C] flex-shrink-0 ml-0.5" />
          </button>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-xl neo-btn flex items-center justify-center text-[#26352B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52785B]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="lg:hidden mt-3 pt-3 pb-2 border-t border-[#d8e0d6] space-y-1.5 animate-fade-in">
          {/* Mobile Detected Location Display */}
          <div
            onClick={requestLocation}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#52785B]/10 border border-[#52785B]/20 text-xs font-semibold text-[#304C38] cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-[#52785B] flex-shrink-0" />
              <span className="truncate">{userLocation.displayName}</span>
            </div>
            <span className="text-[10px] bg-[#52785B] text-white px-2 py-0.5 rounded-full flex-shrink-0">
              {t('location_use_gps')}
            </span>
          </div>

          {/* Nav links */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#52785B] text-[#F6F4EC]'
                    : 'text-[#26352B] hover:bg-black/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
});
