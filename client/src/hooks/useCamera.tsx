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
    console.log('Starting camera for photoType:', photoType);
    
    // Vérifications de base
    if (!navigator.mediaDevices) {
      throw new Error('Votre navigateur ne supporte pas l\'accès aux médias. Utilisez Chrome, Firefox ou Safari récent.');
    }

    if (!navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia n\'est pas supporté par votre navigateur.');
    }

    try {
      console.log('Testing basic camera access...');
      
      // Test simple d'abord - juste video: true
      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Basic camera access successful');
      } catch (basicError) {
        console.error('Basic camera access failed:', basicError);
        
        // Vérifier le type d'erreur
        if (basicError instanceof Error) {
          if (basicError.name === 'NotAllowedError') {
            throw new Error('Permission d\'accès à la caméra refusée. Autorisez l\'accès dans votre navigateur.');
          } else if (basicError.name === 'NotFoundError') {
            throw new Error('Aucune caméra trouvée sur cet appareil.');
          } else if (basicError.name === 'NotReadableError') {
            throw new Error('Caméra déjà utilisée par une autre application.');
          } else if (basicError.name === 'OverconstrainedError') {
            throw new Error('Contraintes de caméra non supportées.');
          }
        }
        
        throw new Error(`Erreur d'accès à la caméra: ${basicError}`);
      }
      
      streamRef.current = stream;
      setCurrentPhotoType(photoType);
      setIsOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Video stream attached to video element');
        
        // Attendre que la vidéo soit prête
        return new Promise<boolean>((resolve, reject) => {
          const video = videoRef.current!;
          
          const handleLoadedMetadata = () => {
            console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            resolve(true);
          };
          
          const handleError = (error: Event) => {
            console.error('Video error:', error);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            reject(new Error('Erreur lors du chargement de la vidéo'));
          };
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('error', handleError);
          
          // Timeout de sécurité
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            resolve(true); // Continuer même si metadata pas encore chargé
          }, 5000);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Camera start error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur inconnue lors de l\'accès à la caméra');
    }
  }, []);

  const capturePhoto = useCallback((): Promise<string> => {
    return new Promise(async (resolve, reject) => {
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

      console.log('Starting photo capture, current dimensions:', video.videoWidth, 'x', video.videoHeight);

      // Attendre que la vidéo ait des dimensions valides
      let attempts = 0;
      const maxAttempts = 50; // 5 secondes max
      
      const waitForDimensions = () => {
        return new Promise<void>((resolveWait) => {
          const checkDimensions = () => {
            attempts++;
            console.log(`Checking video dimensions, attempt ${attempts}: ${video.videoWidth}x${video.videoHeight}`);
            
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              console.log('Video dimensions are valid:', video.videoWidth, 'x', video.videoHeight);
              resolveWait();
            } else if (attempts >= maxAttempts) {
              setIsCapturing(false);
              reject(new Error('Timeout: video dimensions not available after 5 seconds'));
            } else {
              setTimeout(checkDimensions, 100);
            }
          };
          checkDimensions();
        });
      };

      try {
        await waitForDimensions();
      } catch (error) {
        return; // Error already handled in waitForDimensions
      }
      
      console.log('Proceeding with capture, video dimensions:', video.videoWidth, 'x', video.videoHeight);

      // Définir les dimensions du canvas en s'assurant qu'elles sont valides
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);
      
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
