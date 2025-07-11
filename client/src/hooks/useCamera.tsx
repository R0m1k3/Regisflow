import { useState, useRef, useCallback } from 'react';
import { PhotoType } from '@/types/sale';

export function useCamera() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (photoType: PhotoType) => {
    try {
      // Configuration avancée pour tablettes et appareils mobiles
      const constraints = {
        video: {
          facingMode: 'environment', // Caméra arrière par défaut
          width: { ideal: 1280, max: 1920 }, // Résolution optimale
          height: { ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30 }
        }
      };

      let stream: MediaStream;
      
      try {
        // Essai avec caméra arrière
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (backCameraError) {
        console.warn('Caméra arrière non disponible, essai avec caméra avant:', backCameraError);
        
        // Fallback vers caméra avant si arrière non disponible
        const frontConstraints = {
          video: {
            facingMode: 'user',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            aspectRatio: { ideal: 16/9 },
            frameRate: { ideal: 30 }
          }
        };
        
        try {
          stream = await navigator.mediaDevices.getUserMedia(frontConstraints);
        } catch (frontCameraError) {
          console.warn('Caméra avant non disponible, essai basique:', frontCameraError);
          
          // Fallback minimal pour compatibilité maximale
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }
      
      streamRef.current = stream;
      setCurrentPhotoType(photoType);
      setIsOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      return true;
    } catch (error) {
      console.error('Camera error:', error);
      throw new Error('Impossible d\'accéder à la caméra. Vérifiez les permissions et la disponibilité des caméras.');
    }
  }, []);

  const capturePhoto = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) {
        reject(new Error('Video or canvas not available'));
        return;
      }

      setIsCapturing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        reject(new Error('Canvas context not available'));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => {
            setIsCapturing(false);
            resolve(e.target?.result as string);
          };
          reader.onerror = () => {
            setIsCapturing(false);
            reject(new Error('Failed to read image'));
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.8
      );
    });
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsOpen(false);
    setCurrentPhotoType(null);
    setIsCapturing(false);
  }, []);

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
