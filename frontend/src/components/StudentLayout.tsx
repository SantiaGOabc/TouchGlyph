import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LogOut, Volume2, VolumeX, Globe } from 'lucide-react';
import TouchGlyphLogo from './common/TouchGlyphLogo';
import { useSpeechContext } from '../context/SpeechContext';
import './StudentLayout.css';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { muted, toggleMute } = useSpeechContext();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname.startsWith('/student/session')) return t('student.practicing');
    return t('student.myLessons');
  };

  return (
    <div className="student-layout">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>

      <header className="student-header" role="banner">
        <div className="header-left">
          <div className="brand-icon" aria-hidden="true">
            <TouchGlyphLogo size={24} />
          </div>
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>
        <div className="header-actions">
          <button
            className="speech-toggle-btn"
            onClick={toggleMute}
            aria-label={muted ? t('common.unmute') : t('common.mute')}
            title={muted ? t('common.unmute') : t('common.mute')}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="locale-switcher" role="radiogroup" aria-label="Idioma">
            {[
              { code: 'es', label: 'ES' },
              { code: 'en', label: 'EN' },
              { code: 'qu', label: 'QU' },
            ].map(lang => (
              <button
                key={lang.code}
                className={`locale-btn ${i18n.language === lang.code ? 'active' : ''}`}
                onClick={() => { i18n.changeLanguage(lang.code); localStorage.setItem('i18nextLng', lang.code); }}
                role="radio"
                aria-checked={i18n.language === lang.code}
                aria-label={lang.label}
              >
                <Globe size={14} />
                {lang.label}
              </button>
            ))}
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label={`${t('auth.logout')}, usuario actual: ${user?.full_name || user?.username || ''}`}
          >
            <LogOut size={18} aria-hidden="true" />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </header>

      <main id="main-content" className="student-main" role="main">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
