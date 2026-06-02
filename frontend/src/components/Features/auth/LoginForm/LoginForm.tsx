import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useSpeech } from '../../../../hooks/useSpeech';
import FaceLogin from '../FaceAuth/FaceLogin';
import TouchGlyphLogo from '../../../common/TouchGlyphLogo';
import { ArrowLeft } from 'lucide-react';
import './LoginForm.css';

interface User {
  id?: string;
  username?: string;
  full_name?: string;
  email?: string;
  role?: string;
}

interface LoginFormProps {
  onSuccess: (user: User) => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { login } = useAuth();
  const { speak } = useSpeech();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFaceLogin, setShowFaceLogin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Ingresa usuario y contraseña');
      speak('Ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    setError('');
    speak(t('auth.loggingIn'));
    try {
      const user = await login(username, password);
      speak(`${t('auth.welcome')} ${user.full_name || username}`);
      onSuccess(user);
    } catch (err: any) {
      const msg = err.response?.data?.detail || t('auth.invalidCredentials');
      setError(msg);
      speak(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLoginSuccess = (user: User) => {
    onSuccess(user);
  };

  if (showFaceLogin) {
    return <FaceLogin onSuccess={handleFaceLoginSuccess} onCancel={() => setShowFaceLogin(false)} />;
  }

  return (
    <div className="login-card">
      <div className="login-header">
        <div className="logo-container">
          <TouchGlyphLogo size={48} />
        </div>
        <h1>{t('auth.welcome')}</h1>
        <p>{t('auth.loginTitle')}</p>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username">{t('auth.username')}</label>
          <div className="input-wrapper">
            <div className="icon-container">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.username')}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">{t('auth.password')}</label>
          <div className="input-wrapper">
            <div className="icon-container">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="login-button">
          {loading ? t('auth.loggingIn') : t('auth.loginButton')}
        </button>
      </form>

      <div className="alternative-login">
        <div className="divider"><span>O</span></div>
        <button onClick={() => setShowFaceLogin(true)} className="face-login-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          {t('auth.faceLoginAlt')}
        </button>
      </div>

      <Link to="/" className="back-to-landing" aria-label={t('auth.backToLanding')}>
        <ArrowLeft size={16} aria-hidden="true" />
        <span>{t('auth.backToLanding')}</span>
      </Link>
    </div>
  );
};

export default LoginForm;
