import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useSpeech } from '../../../../hooks/useSpeech';
import { useFaceAuth } from '../../../../hooks/useFaceAuth';
import './FaceLogin.css';

interface Props {
  onSuccess: (user: any) => void;
  onCancel: () => void;
}

const FaceLogin = ({ onSuccess, onCancel }: Props) => {
  const { loginWithFace } = useAuth();
  const { speak } = useSpeech();
  const { t } = useTranslation();
  const { videoRef, canvasRef, captureReady, startCamera, stopCamera, captureImage } = useFaceAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCapture = useCallback(async () => {
    setLoading(true);
    setError('');
    speak('Analizando rostro...');
    try {
      const imageBase64 = captureImage();
      if (!imageBase64) throw new Error(t('auth.imageCaptureError'));
      const base64Data = imageBase64.split(',')[1];
      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
      if (sizeInBytes > 5 * 1024 * 1024) {
        throw new Error(t('auth.imageTooLarge'));
      }
      const { user } = await loginWithFace(base64Data);
      speak(`${t('auth.welcome')} ${user.full_name}!`);
      stopCamera();
      onSuccess(user);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      setError(msg);
      speak(msg);
    } finally {
      setLoading(false);
    }
  }, [captureImage, loginWithFace, stopCamera, onSuccess, speak, t]);

  useEffect(() => {
    startCamera().catch(() => {
      setError(t('auth.cameraAccessError'));
      speak(t('auth.cameraAccessError'));
    });
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (captureReady) speak(`${t('auth.cameraActive')}. Presiona Enter para escanear.`);
  }, [captureReady, t]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && captureReady && !loading) {
        e.preventDefault();
        handleCapture();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [captureReady, loading, handleCapture]);

  return (
    <div className="face-login-container">
      <div className="face-login-header">
        <h3>{t('auth.faceLogin')}</h3>
        <p>Coloca tu rostro frente a la cámara</p>
      </div>
      <div className="camera-view">
        <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="face-overlay">
          <div className="face-guide-circle"></div>
          <div className="face-instructions">
            {!captureReady ? 'Iniciando cámara...' : loading ? 'Analizando...' : 'Presiona ENTER'}
          </div>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="camera-controls">
        <button onClick={handleCapture} disabled={!captureReady || loading} className="capture-face-button">
          {loading ? 'Reconociendo...' : `${t('auth.faceLogin')} (ENTER)`}
        </button>
        <button onClick={onCancel} disabled={loading} className="secondary-button">
          {t('common.back')}
        </button>
      </div>
    </div>
  );
};

export default FaceLogin;
