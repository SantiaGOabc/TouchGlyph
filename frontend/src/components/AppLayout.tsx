import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Users, GraduationCap, Monitor,
  LayoutDashboard, LogOut, User, Shield, Globe, X, Menu, Volume2, VolumeX
} from 'lucide-react';
import './AppLayout.css';
import TouchGlyphLogo from '../components/common/TouchGlyphLogo';
import { useSpeechContext } from '../context/SpeechContext';
import { ROLE_ADMIN, ROLE_TEACHER } from '../constants/roles';

interface MenuLink {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ size?: number }>;
  exact?: boolean;
}

const allMenuLinks: Record<string, MenuLink[]> = {
  admin: [
    { to: '/admin', labelKey: 'nav.dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/users', labelKey: 'nav.users', icon: Users },
    { to: '/admin/classes', labelKey: 'nav.classes', icon: GraduationCap },
    { to: '/admin/devices', labelKey: 'nav.devices', icon: Monitor },
    { to: '/admin/lessons', labelKey: 'nav.lessons', icon: BookOpen },
  ],
  teacher: [
    { to: '/teacher', labelKey: 'nav.dashboard', icon: LayoutDashboard, exact: true },
    { to: '/teacher/classes', labelKey: 'nav.myClasses', icon: GraduationCap },
    { to: '/teacher/lessons', labelKey: 'nav.lessons', icon: BookOpen },
  ],
};

const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'qu', label: 'QU' },
];

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsMobile(window.innerWidth < 768), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const role = (user?.role as string) || ROLE_TEACHER;
  const links = allMenuLinks[role] || [];

  const currentTitle = useCallback(() => {
    for (const roleLinks of Object.values(allMenuLinks)) {
      const match = roleLinks.find(link =>
        link.exact
          ? location.pathname === link.to
          : location.pathname.startsWith(link.to)
      );
      if (match) return t(match.labelKey);
    }
    return t('nav.dashboard');
  }, [location.pathname, t]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { muted, toggleMute } = useSpeechContext();

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  const roleLabel = (role === ROLE_ADMIN ? t('nav.roleAdmin') : role === ROLE_TEACHER ? t('nav.roleTeacher') : t('nav.roleStudent'));
  const RoleIcon = role === ROLE_ADMIN ? Shield : Users;

  const renderSidebar = () => (
    <aside className={`app-sidebar ${isMobile ? (mobileOpen ? 'mobile-open' : 'mobile-closed') : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <TouchGlyphLogo />
          </div>
        </div>
        {isMobile && (
          <button className="close-btn" onClick={() => setMobileOpen(false)} aria-label={t('nav.closeMenu')}>
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav" role="navigation" aria-label={t('nav.mainMenu')}>
        {links.map((link: MenuLink) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={t(link.labelKey)}
            >
              <Icon size={20} />
              <span className="nav-label">{t(link.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info-mini">
          <div className="user-avatar"><User size={20} /></div>
          <div className="user-details">
            <p className="user-name">{user?.full_name || user?.username}</p>
            <span className="user-role-badge"><RoleIcon size={12} />{roleLabel}</span>
          </div>
        </div>
        <button className="logout-btn-sidebar" onClick={handleLogout} aria-label={t('auth.logout')}>
          <LogOut size={18} />
          <span>{t('auth.logout')}</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className={`app-layout ${isMobile ? 'mobile' : ''}`}>
      <a href="#main-content" className="skip-link">{t('nav.skipToContent')}</a>
      {isMobile && mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {renderSidebar()}

      <div className="main-wrapper">
        <header className="top-header">
          <div className="header-left">
            {isMobile && (
              <button className="hamburger-btn" onClick={() => setMobileOpen(true)} aria-label={t('nav.openMenu')}>
                <Menu size={24} />
              </button>
            )}
            <h1 className="page-title">{currentTitle()}</h1>
          </div>
          <div className="header-right">
            <button
              className="speech-toggle-btn"
              onClick={toggleMute}
              aria-label={muted ? t('common.unmute') : t('common.mute')}
              title={muted ? t('common.unmute') : t('common.mute')}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="locale-switcher" role="radiogroup" aria-label="Idioma">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  className={`locale-btn ${i18n.language === lang.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                  role="radio"
                  aria-checked={i18n.language === lang.code}
                  aria-label={lang.label}
                >
                  <Globe size={14} />
                  {lang.label}
                </button>
              ))}
            </div>
            <span className="greeting">
              {t('nav.greeting')}, <strong>{user?.full_name || user?.username}</strong>
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
