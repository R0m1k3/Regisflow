import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import { PhotoType } from '@/types/sale';

interface CameraModalProps {
  isOpen: boolean;
  photoType: PhotoType | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  onClose: () => void;
  onCapture: () => void;
}

export default function CameraModal({
  isOpen,
  photoType,
  videoRef,
  canvasRef,
  isCapturing,
  onClose,
  onCapture
}: CameraModalProps) {
  useEffect(() => {
    if (isOpen && videoRef.current) {
      const video = videoRef.current;
      console.log('CameraModal useEffect - video element ready');
      
      const handleLoadedMetadata = () => {
        console.log('CameraModal: Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
      };
      
      const handleCanPlay = () => {
        console.log('CameraModal: Video can play, readyState:', video.readyState);
      };
      
      const handleError = (error: Event) => {
        console.error('CameraModal: Video error event:', error);
      };
      
      const handlePlay = () => {
        console.log('CameraModal: Video started playing');
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('play', handlePlay);
      
      // Forcer le play avec gestion d'erreur
      const startPlayback = async () => {
        try {
          await video.play();
          console.log('CameraModal: Video play() successful');
        } catch (playError) {
          console.error('CameraModal: Video play() failed:', playError);
        }
      };
      
      startPlayback();
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('play', handlePlay);
      };
    }
  }, [isOpen, videoRef]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Capturer photo {photoType}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover bg-black rounded"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={onCapture}
              disabled={isCapturing}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              {isCapturing ? 'Capture...' : 'Prendre la photo'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}