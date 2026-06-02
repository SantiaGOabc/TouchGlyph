import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../constants/routes';
import './SessionExpiredModal.css';

const SESSION_EXPIRED_EVENT = 'session:expired';

export function dispatchSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

const SessionExpiredModal = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const handler = () => {
      if (location.pathname !== ROUTES.LOGIN) {
        setVisible(true);
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, [location.pathname]);

  const handleGoToLogin = () => {
    setVisible(false);
    navigate(ROUTES.LOGIN);
  };

  if (!visible) return null;

  return (
    <div className="session-expired-overlay" role="dialog" aria-modal="true" aria-labelledby="session-title">
      <div className="session-expired-modal">
        <div className="session-expired-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 id="session-title">{t('auth.sessionExpired')}</h2>
        <p>{t('auth.sessionExpiredDesc')}</p>
        <button className="btn btn-primary" onClick={handleGoToLogin} autoFocus>
          {t('auth.goToLogin')}
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
