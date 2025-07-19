import { useState, useRef, useCallback } from 'react';
import { PhotoType } from '@/types/sale';
import { getCameraCapabilities, logCameraCapabilities } from '@/utils/cameraDebug';

export function useSimpleCamera() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async (photoType: PhotoType): Promise<void> => {
    console.log('=== SIMPLE CAMERA START ===');
    
    // Diagnostic complet des capacités caméra
    const capabilities = await getCameraCapabilities();
    logCameraCapabilities(capabilities);
    
    try {
      // Nettoyer le stream précédent s'il existe
      if (stream) {
        console.log('Cleaning up previous stream...');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Vérifier la disponibilité des médias
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra. Utilisez un navigateur moderne comme Chrome, Firefox ou Safari.');
      }

      // HTTPS check for production
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.warn('Camera access may be restricted on non-HTTPS connections');
      }

      // État initial
      setCurrentPhotoType(photoType);
      setIsOpen(true);

      let mediaStream: MediaStream;

      try {
        // Essayer d'abord avec des contraintes optimisées pour production
        console.log('Trying production-optimized video constraints...');
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640, max: 1920 },
            height: { ideal: 720, min: 480, max: 1080 },
            facingMode: 'environment' // Préférer la caméra arrière
          }
        });
        console.log('Production video constraints successful');
      } catch (basicError) {
        console.warn('Production constraints failed, trying user-facing camera:', basicError);
        
        try {
          // Fallback avec caméra avant
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              facingMode: 'user'
            }
          });
          console.log('User-facing camera successful');
        } catch (userError) {
          console.warn('User-facing camera failed, trying basic constraints:', userError);
          
          try {
            // Fallback ultra-simple
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true
            });
            console.log('Basic video constraints successful');
          } catch (minimalError) {
            console.error('All camera access attempts failed:', minimalError);
            
            // Fermer la modal en cas d'erreur
            setIsOpen(false);
            setCurrentPhotoType(null);
            
            // Gestion des erreurs spécifiques
            if (minimalError instanceof Error) {
              if (minimalError.name === 'NotAllowedError') {
                throw new Error('Permission d\'accès à la caméra refusée. Veuillez autoriser l\'accès dans votre navigateur et actualiser la page.');
              } else if (minimalError.name === 'NotFoundError') {
                throw new Error('Aucune caméra trouvée sur cet appareil. Veuillez connecter une caméra ou utiliser l\'option d\'importation de fichier.');
              } else if (minimalError.name === 'NotReadableError') {
                throw new Error('Caméra déjà utilisée par une autre application. Fermez les autres applications utilisant la caméra.');
              } else if (minimalError.name === 'OverconstrainedError') {
                throw new Error('Contraintes de caméra non supportées par votre appareil.');
              }
            }
            
            throw new Error('Erreur d\'accès à la caméra. Utilisez l\'option d\'importation de fichier comme alternative.');
          }
        }
      }

      console.log('Media stream obtained successfully:', mediaStream.getVideoTracks().length, 'video tracks');
      setStream(mediaStream);

      // Attendre que la modal soit rendue avant d'assigner le stream
      await new Promise((resolve) => {
        setTimeout(() => {
          if (videoRef.current && mediaStream && mediaStream.active) {
            const video = videoRef.current;
            console.log('Assigning stream to video element, tracks:', mediaStream.getVideoTracks().length);
            
            video.srcObject = mediaStream;
            
            // Configuration vidéo pour production
            video.setAttribute('autoplay', 'true');
            video.setAttribute('playsinline', 'true');
            video.setAttribute('muted', 'true');
            
            // Événements de diagnostic
            video.onloadedmetadata = () => {
              console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
              resolve(void 0);
            };
            
            video.onerror = (e) => {
              console.error('Video element error:', e);
              resolve(void 0);
            };
            
            // Forcer le play avec gestion d'erreur robuste
            video.play().then(() => {
              console.log('Video playing successfully');
              resolve(void 0);
            }).catch(playError => {
              console.error('Video play failed:', playError);
              // Réessayer après un délai
              setTimeout(() => {
                video.play().catch(e => {
                  console.error('Retry video play failed:', e);
                  resolve(void 0);
                });
              }, 500);
            });
          } else {
            console.error('Video element not ready or stream inactive');
            resolve(void 0);
          }
        }, 300);
      });

    } catch (error) {
      console.error('Camera start failed:', error);
      // Nettoyer l'état en cas d'erreur
      setIsOpen(false);
      setCurrentPhotoType(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
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