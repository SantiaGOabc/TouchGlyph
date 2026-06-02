import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './FaceRegistration.css';

interface Props {
  userId: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

const FaceRegistration = ({ userId, onSuccess, onClose }: Props) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [captureReady, setCaptureReady] = useState(false);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject = null;
    }
    setCaptureReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setCaptureReady(true);
      speak(t('auth.faceCameraReadyPrompt'));
    } catch {
      setError(t('auth.cameraAccessError'));
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  const captureImage = useCallback((): string | null => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  const handleCapture = useCallback(async () => {
    if (!captureReady || loading) return;
    setLoading(true);
    setError('');
    try {
      const imageBase64 = captureImage();
      if (!imageBase64) throw new Error(t('auth.imageCaptureError'));
      const base64Data = imageBase64.split(',')[1];
      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
      if (sizeInBytes > 5 * 1024 * 1024) {
        throw new Error(t('auth.imageTooLarge'));
      }
      await api.post('/face/register', {
        user_id: userId,
        image_base64: base64Data,
      });
      setMessage(t('auth.faceRegistered'));
      speak(t('auth.faceRegisteredPrompt'));
      stopCamera();
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.faceRegisterError'));
      speak(t('auth.faceRegisterRetry'));
    } finally {
      setLoading(false);
    }
  }, [captureReady, loading, captureImage, userId, stopCamera, onSuccess]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && captureReady && !loading) {
        e.preventDefault();
        handleCapture();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [captureReady, loading, handleCapture]);

  return (
    <div className="face-registration">
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline className="camera-video" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {captureReady && !loading && (
          <div className="camera-overlay">
            <div className="camera-guide"></div>
            <div className="camera-instructions">{t('auth.faceCapturePrompt')}</div>
          </div>
        )}
        {loading && <div className="camera-instructions">{t('auth.faceProcessing')}</div>}
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="button-group">
        <button onClick={handleCapture} disabled={!captureReady || loading} className="btn-primary">
          {loading ? t('auth.faceRegistering') : t('auth.captureFace')}
        </button>
        <button onClick={handleClose} className="btn-secondary">{t('common.close')}</button>
      </div>
    </div>
  );
};

export default FaceRegistration;
