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
      // Vérification des permissions avant d'essayer
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        throw new Error('Aucune caméra détectée sur cet appareil');
      }

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
        console.log('Back camera started successfully');
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
          console.log('Front camera started successfully');
        } catch (frontCameraError) {
          console.warn('Caméra avant non disponible, essai basique:', frontCameraError);
          
          // Fallback minimal pour compatibilité maximale
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          console.log('Basic camera started successfully');
        }
      }
      
      streamRef.current = stream;
      setCurrentPhotoType(photoType);
      setIsOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Attendre que la vidéo soit prête
        await new Promise<void>((resolve) => {
          videoRef.current!.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            resolve();
          };
        });
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
        setIsCapturing(false);
        reject(new Error('Canvas context not available'));
        return;
      }

      // Vérifier que la vidéo a des dimensions valides
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        setIsCapturing(false);
        reject(new Error('Video not ready - no dimensions'));
        return;
      }
      
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);

      // Définir les dimensions du canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dessiner l'image de la vidéo sur le canvas
      try {
        // Effacer le canvas avant de dessiner
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log('Image drawn on canvas successfully');
      } catch (error) {
        console.error('Failed to draw image on canvas:', error);
        setIsCapturing(false);
        reject(new Error('Failed to draw image on canvas'));
        return;
      }
      
      // Méthode alternative plus robuste - utiliser toDataURL directement
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Canvas dataURL generated, length:', dataURL.length);
        
        if (!dataURL || dataURL === 'data:,') {
          setIsCapturing(false);
          reject(new Error('Failed to create image data'));
          return;
        }
        
        setIsCapturing(false);
        resolve(dataURL);
      } catch (error) {
        console.error('Canvas toDataURL error:', error);
        
        // Fallback avec toBlob si toDataURL échoue
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setIsCapturing(false);
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
      }
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
