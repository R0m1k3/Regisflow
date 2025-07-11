import { useState, useRef, useCallback } from 'react';
import { PhotoType } from '@/types/sale';

export function useSimpleCamera() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async (photoType: PhotoType): Promise<void> => {
    console.log('=== SIMPLE CAMERA START ===');
    
    try {
      // Nettoyer le stream précédent s'il existe
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Demander l'accès à la caméra
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });

      console.log('Media stream obtained:', mediaStream);
      setStream(mediaStream);
      setCurrentPhotoType(photoType);
      setIsOpen(true);

      // Attendre que la modal soit ouverte et l'élément vidéo soit prêt
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          const video = videoRef.current;
          console.log('Assigning stream to video element');
          
          video.srcObject = mediaStream;
          video.autoplay = true;
          video.playsInline = true;
          video.muted = true;
          
          // Forcer le play
          video.play().then(() => {
            console.log('Video playing successfully');
          }).catch(error => {
            console.error('Video play failed:', error);
          });
        }
      }, 100);

    } catch (error) {
      console.error('Camera start failed:', error);
      throw error;
    }
  }, [stream]);

  const capturePhoto = useCallback(async (): Promise<string> => {
    console.log('=== SIMPLE CAMERA CAPTURE ===');
    
    if (!videoRef.current || !canvasRef.current) {
      throw new Error('Video ou canvas non disponible');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Contexte canvas non disponible');
    }

    // Vérifier que la vidéo a des dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error('Vidéo non prête - dimensions non disponibles');
    }

    setIsCapturing(true);

    try {
      // Configurer le canvas aux dimensions de la vidéo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dessiner l'image de la vidéo sur le canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir en base64
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('Photo captured successfully, size:', photoData.length);
      return photoData;
      
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('=== SIMPLE CAMERA STOP ===');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsOpen(false);
    setCurrentPhotoType(null);
    setIsCapturing(false);
  }, [stream]);

  return {
    isOpen,
    currentPhotoType,
    isCapturing,
    videoRef,
    canvasRef,
    startCamera,
    capturePhoto,
    stopCamera
  };
}