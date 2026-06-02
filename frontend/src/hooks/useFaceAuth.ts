import { useState, useRef, useCallback } from 'react';

export function useFaceAuth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captureReady, setCaptureReady] = useState(false);

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
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCaptureReady(true);
    } catch {
      setCaptureReady(false);
      throw new Error('No se pudo acceder a la cámara');
    }
  }, []);

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

  return {
    videoRef,
    canvasRef,
    stream: streamRef,
    captureReady,
    startCamera,
    stopCamera,
    captureImage,
  };
}
