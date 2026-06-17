import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Play, BookOpen, Users, Target, Brain, Zap, Shield } from 'lucide-react';
import './LandingPage.css';
import InicioVideo from './video';
import IntroVideoCard from './IntroVideoCard';
import TouchGlyphLogo from '../../components/common/TouchGlyphLogo';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

interface Feature {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

const LandingPage = () => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 0.75;
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video reproduciendo correctamente');
          })
          .catch(error => {
            console.log('Error al reproducir video:', error);
            document.addEventListener('click', () => {
              video.play().catch(e => console.log('Error al reproducir:', e));
            }, { once: true });
          });
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.15, rootMargin: '50px' }
    );

    const elements = document.querySelectorAll('.scroll-animate, .feature-card');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const features: Feature[] = [
    { icon: <BookOpen size={36} />, titleKey: 'landing.featureStructured', descKey: 'landing.featureStructuredDesc' },
    { icon: <Target size={36} />, titleKey: 'landing.featureTracking', descKey: 'landing.featureTrackingDesc' },
    { icon: <Brain size={36} />, titleKey: 'landing.featureMuscleMemory', descKey: 'landing.featureMuscleMemoryDesc' },
    { icon: <Users size={36} />, titleKey: 'landing.featureMultiUser', descKey: 'landing.featureMultiUserDesc' },
    { icon: <Zap size={36} />, titleKey: 'landing.featureInstantResponse', descKey: 'landing.featureInstantResponseDesc' },
    { icon: <Shield size={36} />, titleKey: 'landing.featureAccessibility', descKey: 'landing.featureAccessibilityDesc' },
  ];

  return (
    <div className="landing-container">
      <a href="#main-content" className="skip-link">{t('nav.skipToContent')}</a>
      <LanguageSwitcher />
      <section className="hero-section" ref={heroRef}>
        <div className="video-background">
            <InicioVideo ref={videoRef} aria-label={t('landing.heroVideoAria')} />
        </div>

        <div className="hero-content">
          <div className="hero-text-container">
            <div className="hero-badge">
              <span className="badge-text">{t('landing.platformBadge')}</span>
            </div>

            <h1 className="hero-title">
              Touch<span className="gradient-text">Glyph</span>
              <TouchGlyphLogo/>
              <div className="title-subline"></div>
            </h1>

            <h2 className="hero-subtitle">
              {t('landing.heroSubtitle')} para el desarrollo de
              <span className="highlight-text"> habilidades táctiles</span>
            </h2>

            <p className="hero-description">
              {t('landing.heroDesc')}
            </p>

            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary btn-large">
                <Play size={22} />
                <span>{t('landing.login')}</span>
              </Link>
              {/* <Link to="/solicitud" className="btn btn-secondary btn-large">
                <span>{t('landing.requestAccess')}</span>
              </Link> */}
            </div>
          </div>
        </div>

        <button
          className="scroll-indicator"
          onClick={scrollToFeatures}
          aria-label={t('landing.scrollDown')}
        >
          <ChevronDown size={28} />
        </button>
      </section>

      <section id="main-content" className="intro-section scroll-animate" ref={featuresRef}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {t('landing.whatIs')} <span className="gradient-text">TouchGlyph</span>?
              <TouchGlyphLogo/>
            </h2>
            <div className="section-divider"></div>
            <p className="section-subtitle">
              {t('landing.introSubtitle')}
            </p>
          </div>

          <div className="intro-grid">
            <div className="intro-card main-card">
              <div className="card-icon-wrapper">
                <BookOpen size={44} />
              </div>
              <h3>{t('landing.introAdaptive')}</h3>
              <p>{t('landing.introAdaptiveDesc')}</p>

              <IntroVideoCard />
            </div>

            <div className="intro-grid-secondary">
              <div className="intro-card">
                <div className="card-icon-wrapper small">
                  <Target size={28} />
                </div>
                <h4>{t('landing.introClearGoals')}</h4>
                <p>{t('landing.introClearGoalsDesc')}</p>
              </div>

              <div className="intro-card">
                <div className="card-icon-wrapper small">
                  <Brain size={28} />
                </div>
                <h4>{t('landing.introTactileMemory')}</h4>
                <p>{t('landing.introTactileMemoryDesc')}</p>
              </div>

              <div className="intro-card">
                <div className="card-icon-wrapper small">
                  <Users size={28} />
                </div>
                <h4>{t('landing.introCommunity')}</h4>
                <p>{t('landing.introCommunityDesc')}</p>
              </div>

              <div className="intro-card">
                <div className="card-icon-wrapper small">
                  <Shield size={28} />
                </div>
                <h4>{t('landing.introAccessibility')}</h4>
                <p>{t('landing.introAccessibilityDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section scroll-animate">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('landing.features')}</h2>
            <div className="section-divider"></div>
            <p className="section-subtitle">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                className="feature-card scroll-animate"
                key={index}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3>{t(feature.titleKey)}</h3>
                <p>{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section scroll-animate">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2 className="cta-title">{t('landing.ctaTitle')}</h2>
              <p className="cta-description">
                {t('landing.ctaDesc')}
              </p>

              <div className="cta-buttons">
                {/* <Link to="/solicitud" className="btn btn-primary btn-xlarge">
                  {t('landing.requestAccess')}
                </Link> */}
                <Link to="/login" className="btn btn-ghost btn-xlarge">
                  {t('landing.haveAccount')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3 className="footer-title">
                Touch<span className="gradient-text">Glyph</span>
              </h3>
              <p className="footer-tagline">
                {t('landing.footer')}
              </p>
            </div>

            <div className="footer-links">
              <div className="link-group">
                <h4>{t('landing.footerPlatform')}</h4>
                <Link to="/login">{t('landing.login')}</Link>
                {/* <Link to="/solicitud">{t('landing.requestAccess')}</Link> */}
              </div>

              <div className="link-group">
                <h4>{t('landing.footerResources')}</h4>
                <a href="#documentacion">{t('landing.footerDocs')}</a>
                <a href="#guias">{t('landing.footerGuides')}</a>
              </div>

              <div className="link-group">
                <h4>{t('landing.footerContact')}</h4>
                <a href="mailto:soporte@touchglyph.com">{t('landing.footerSupport')}</a>
                <a href="#contacto">{t('landing.footerCollaborations')}</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} TouchGlyph. {t('landing.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
