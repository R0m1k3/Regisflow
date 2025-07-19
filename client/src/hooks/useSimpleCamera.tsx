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
        setStream(null);
      }

      // Vérifier la disponibilité des médias
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra. Utilisez un navigateur moderne comme Chrome, Firefox ou Safari.');
      }

      // État initial
      setCurrentPhotoType(photoType);
      setIsOpen(true);

      let mediaStream: MediaStream;

      try {
        // Essayer d'abord avec des contraintes simples
        console.log('Trying basic video constraints...');
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        });
        console.log('Basic video constraints successful');
      } catch (basicError) {
        console.warn('Basic constraints failed, trying minimal video:', basicError);
        
        try {
          // Fallback ultra-simple
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          console.log('Minimal video constraints successful');
        } catch (minimalError) {
          console.error('All camera access failed:', minimalError);
          
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

      console.log('Media stream obtained successfully:', mediaStream.getVideoTracks().length, 'video tracks');
      setStream(mediaStream);

      // Attendre que la modal soit rendue avant d'assigner le stream
      setTimeout(() => {
        if (videoRef.current && mediaStream && mediaStream.active) {
          const video = videoRef.current;
          console.log('Assigning stream to video element');
          
          video.srcObject = mediaStream;
          
          // Forcer le play avec gestion d'erreur
          video.play().then(() => {
            console.log('Video playing successfully');
          }).catch(playError => {
            console.error('Video play failed:', playError);
            // Réessayer après un délai
            setTimeout(() => {
              video.play().catch(e => console.error('Retry video play failed:', e));
            }, 200);
          });
        } else {
          console.error('Video element not ready or stream inactive');
        }
      }, 200);

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