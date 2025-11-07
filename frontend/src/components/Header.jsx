// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const changeLanguage = (e) => i18n.changeLanguage(e.target.value);

  // Close mobile menu on route change
  useEffect(() => setIsOpen(false), [location.pathname]);

  // Scroll behavior only on home; force scrolled on other pages
  useEffect(() => {
    if (!isHome) {
      setIsScrolled(true);
      return;
    }
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    onScroll(); // set initial on mount
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  // Effective state shared by desktop & mobile
  const effectiveScrolled = !isHome || isScrolled;
  const compact = !effectiveScrolled;

  // Shell / colors
  const headerShell = effectiveScrolled
    ? 'bg-[#253645]/95 text-white shadow-lg backdrop-blur'
    : 'bg-transparent text-slate-900';

  const linkBase = 'cursor-pointer transition font-medium';
  const linkColor = effectiveScrolled
    ? 'text-white/95 hover:text-white'
    : 'text-slate-900 hover:text-slate-700';
  const titleColor = effectiveScrolled
    ? 'text-white/95 hover:opacity-90'
    : 'text-slate-900 hover:opacity-80';

  const selectClass = effectiveScrolled
    ? 'bg-white/15 text-white border border-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 rounded text-sm backdrop-blur transition'
    : 'bg-white/90 text-slate-900 border border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 rounded text-sm transition';
  const selectPad = compact ? 'px-2 py-0.5' : 'px-2 py-1';

  const iconColor = effectiveScrolled ? 'text-white' : 'text-slate-900';

  // Mobile panel & its select mirror desktop styles
  const mobilePanel = effectiveScrolled
    ? 'bg-[#253645] text-white border border-white/10 shadow-xl'
    : 'bg-white/95 text-slate-900 border border-slate-200 shadow-xl';
  const mobileSelectClass = effectiveScrolled
    ? 'rounded px-2 py-1 text-sm border border-white/30 bg-white/15 text-white focus:outline-none focus:ring-2 focus:ring-white/50'
    : 'rounded px-2 py-1 text-sm border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300';

  // Logo swap
  const logoSrc = effectiveScrolled ? '/images/seagullwhite.png' : '/images/logo.png';

  // Preload logos
  useEffect(() => {
    new Image().src = '/images/seagullwhite.png';
    new Image().src = '/images/logo.png';
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 ${compact ? 'px-2 sm:px-3 py-1 translate-y-10 sm:translate-y-12 md:translate-y-14' : 'px-6 py-5 translate-y-0'
        } transition-all duration-300 ${headerShell}`}
    >
      <div className="relative w-full max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Hotel Name (hidden on mobile) */}
        <div className="hidden md:flex items-center">
          <span
            className={`tracking-wide ${compact ? 'text-lg' : 'text-base sm:text-lg'} ${titleColor}`}
            onClick={() => navigate('/')}
          >
            {t('hotelName')}
          </span>
        </div>

        {/* Center: Logo (slightly higher only when compact) */}
        <div className={`absolute inset-x-0 flex justify-center pointer-events-none ${compact ? 'translate-y-2 sm:translate-y-3' : ''}`}>
          <img
            key={logoSrc}
            src={logoSrc}
            alt="Hotel Logo"
            className={`${compact ? 'h-14 sm:h-16 -translate-y-1 sm:-translate-y-2' : 'h-12 sm:h-14'} w-auto transform pointer-events-auto cursor-pointer drop-shadow-md`}
            onClick={() => navigate('/')}
          />
        </div>

        {/* Right: Nav + language (Desktop) */}
        <div className={`hidden md:flex items-center ${compact ? 'gap-3' : 'gap-8'}`}>
          <nav className={`flex items-center ${compact ? 'gap-3' : 'gap-5'} ${compact ? 'text-base' : 'text-sm'}`}>
            <span className={`${linkBase} ${linkColor}`} onClick={() => navigate('/')}>{t('home')}</span>
            <span className={`${linkBase} ${linkColor}`} onClick={() => navigate('/about')}>{t('about')}</span>
            <span className={`${linkBase} ${linkColor}`} onClick={() => navigate('/contact')}>{t('contact')}</span>
          </nav>
          <select
            onChange={changeLanguage}
            value={i18n.language}
            className={`${selectClass} ${selectPad} min-w-[92px]`}
          >
            <option value="en">🇺🇸 English</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="cs">🇨🇿 Čeština</option>
            <option value="sr">🇷🇸 Srpski</option>
            <option value="pl">🇵🇱 Polski</option>
          </select>
        </div>

        {/* Mobile: hamburger */}
        <div className={`flex md:hidden ml-auto ${iconColor} ${compact ? 'translate-y-1' : ''}`}>
          <button onClick={() => setIsOpen((v) => !v)} className="focus:outline-none">
            {isOpen ? <X size={30} /> : <Menu size={30} />}
          </button>
        </div>

        {/* Mobile dropdown (mirrors desktop styles) */}
        {isOpen && (
          <div className={`absolute top-16 right-4 ${mobilePanel} rounded-lg p-6 flex flex-col gap-4 md:hidden transition-all duration-300`}>
            <span className={`${linkBase}`} onClick={() => { navigate('/'); setIsOpen(false); }}>{t('home')}</span>
            <span className={`${linkBase}`} onClick={() => { navigate('/about'); setIsOpen(false); }}>{t('about')}</span>
            <span className={`${linkBase}`} onClick={() => { navigate('/contact'); setIsOpen(false); }}>{t('contact')}</span>
            <select
              onChange={(e) => { changeLanguage(e); setIsOpen(false); }}
              value={i18n.language}
              className={`mt-2 w-full ${mobileSelectClass}`}
            >
              <option value="en" className="text-slate-900">🇺🇸 English</option>
              <option value="de" className="text-slate-900">🇩🇪 Deutsch</option>
              <option value="ru" className="text-slate-900">🇷🇺 Русский</option>
              <option value="fr" className="text-slate-900">🇫🇷 Français</option>
              <option value="cs" className="text-slate-900">🇨🇿 Čeština</option>
              <option value="sr" className="text-slate-900">🇷🇸 Srpski</option>
              <option value="pl" className="text-slate-900">🇵🇱 Polski</option>
            </select>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
