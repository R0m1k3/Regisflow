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
          <DialogTitle>
            Photo {photoType ? photoType.charAt(0).toUpperCase() + photoType.slice(1) : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-full h-auto camera-preview rounded-lg border bg-black"
              style={{ 
                aspectRatio: '16/9',
                objectFit: 'cover',
                maxHeight: '400px',
                minHeight: '200px'
              }}
              onLoadedMetadata={() => console.log('CameraModal: Video metadata loaded')}
              onCanPlay={() => console.log('CameraModal: Video can play')}
              onPlay={() => console.log('CameraModal: Video playing')}
              onError={(e) => console.error('CameraModal: Video error:', e)}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay pour aider à cadrer la pièce d'identité */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-70"></div>
              <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-70 px-2 py-1 rounded">
                Cadrez la pièce d'identité dans le rectangle
              </div>
              <div className="absolute top-2 right-2 text-white text-xs bg-black bg-opacity-70 px-2 py-1 rounded">
                {photoType === 'recto' ? 'RECTO' : 'VERSO'}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
            <Button 
              onClick={onCapture} 
              disabled={isCapturing}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isCapturing ? 'Capture...' : 'Prendre la photo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
