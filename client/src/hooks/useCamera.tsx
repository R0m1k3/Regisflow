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
        const video = videoRef.current;
        video.srcObject = stream;
        console.log('Video stream attached to video element');
        
        // Forcer le démarrage de la vidéo
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        
        // Forcer le play immédiatement
        try {
          await video.play();
          console.log('Video play() successful');
        } catch (playError) {
          console.warn('Video play() failed:', playError);
        }
        
        // Attendre que la vidéo soit prête
        return new Promise<boolean>((resolve, reject) => {
          const handleLoadedMetadata = () => {
            console.log('Video metadata loaded successfully');
            console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            console.log('Video readyState:', video.readyState);
            console.log('Video paused:', video.paused);
            console.log('Video ended:', video.ended);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            video.removeEventListener('canplay', handleCanPlay);
            resolve(true);
          };
          
          const handleCanPlay = () => {
            console.log('Video can play event fired');
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              handleLoadedMetadata();
            }
          };
          
          const handleError = (error: Event) => {
            console.error('Video error event:', error);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            video.removeEventListener('canplay', handleCanPlay);
            reject(new Error('Erreur lors du chargement de la vidéo'));
          };
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('canplay', handleCanPlay);
          video.addEventListener('error', handleError);
          
          // Si les métadonnées sont déjà chargées
          if (video.readyState >= 1 && video.videoWidth > 0) {
            console.log('Video metadata already available');
            handleLoadedMetadata();
          }
          
          // Timeout de sécurité avec état détaillé
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            video.removeEventListener('canplay', handleCanPlay);
            console.log('Video load timeout - final state:', {
              readyState: video.readyState,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              paused: video.paused,
              currentTime: video.currentTime,
              duration: video.duration,
              srcObject: !!video.srcObject
            });
            
            // Vérifier si le stream est actif
            if (video.srcObject) {
              const stream = video.srcObject as MediaStream;
              const tracks = stream.getTracks();
              console.log('Stream tracks status:', tracks.map(t => ({
                kind: t.kind,
                enabled: t.enabled,
                readyState: t.readyState,
                label: t.label
              })));
            }
            
            resolve(true);
          }, 3000);
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

      // Attendre que la vidéo ait des dimensions valides avec diagnostic détaillé
      let attempts = 0;
      const maxAttempts = 100; // 10 secondes max
      
      const waitForDimensions = () => {
        return new Promise<void>((resolveWait) => {
          const checkDimensions = () => {
            attempts++;
            
            // Diagnostic détaillé à chaque tentative
            const diagnosticInfo = {
              attempt: attempts,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
              paused: video.paused,
              currentTime: video.currentTime,
              duration: video.duration,
              networkState: video.networkState,
              srcObject: !!video.srcObject
            };
            
            console.log(`Capture attempt ${attempts}/100:`, diagnosticInfo);
            
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              console.log('✅ Video dimensions are valid:', video.videoWidth, 'x', video.videoHeight);
              resolveWait();
            } else if (attempts >= maxAttempts) {
              console.error('❌ Timeout: video dimensions not available after 10 seconds');
              console.error('Final video state:', diagnosticInfo);
              
              // Vérifier l'état du stream
              if (video.srcObject) {
                const stream = video.srcObject as MediaStream;
                const tracks = stream.getTracks();
                console.error('Stream tracks final state:', tracks.map(t => ({
                  kind: t.kind,
                  enabled: t.enabled,
                  readyState: t.readyState,
                  label: t.label
                })));
              }
              
              setIsCapturing(false);
              reject(new Error('Timeout: video dimensions not available after 10 seconds'));
            } else {
              // Diagnostic périodique plus détaillé
              if (attempts % 10 === 0) {
                console.warn(`Still waiting for video dimensions after ${attempts} attempts...`);
                console.warn('Current video state:', diagnosticInfo);
              }
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
