import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import { PhotoType } from '@/types/sale';

interface SimpleCameraModalProps {
  isOpen: boolean;
  photoType: PhotoType | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  onClose: () => void;
  onCapture: () => void;
}

export default function SimpleCameraModal({
  isOpen,
  photoType,
  videoRef,
  canvasRef,
  isCapturing,
  onClose,
  onCapture
}: SimpleCameraModalProps) {
  
  useEffect(() => {
    console.log('SimpleCameraModal - isOpen:', isOpen);
    if (isOpen && videoRef.current) {
      console.log('SimpleCameraModal - Video element available');
      const video = videoRef.current;
      
      // Événements de diagnostic
      video.onloadedmetadata = () => {
        console.log('SimpleCameraModal - Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
      };
      
      video.onplay = () => {
        console.log('SimpleCameraModal - Video started playing');
      };
      
      video.onerror = (e) => {
        console.error('SimpleCameraModal - Video error:', e);
      };
    }
  }, [isOpen, videoRef]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Capture photo {photoType ? photoType.charAt(0).toUpperCase() + photoType.slice(1) : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-96"
              style={{
                minHeight: '200px',
                objectFit: 'cover'
              }}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay pour cadrer */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-80"></div>
              <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-75 px-3 py-2 rounded">
                Cadrez votre pièce d'identité dans le rectangle
              </div>
              <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-75 px-3 py-2 rounded">
                {photoType === 'recto' ? 'RECTO' : 'VERSO'}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 max-w-32"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            
            <Button 
              onClick={onCapture} 
              disabled={isCapturing}
              className="bg-green-600 hover:bg-green-700 text-white flex-1 max-w-40"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isCapturing ? 'Capture...' : 'Capturer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}