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
      // Ensure video starts playing when modal opens
      videoRef.current.play().catch(console.error);
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
              className="w-full max-w-full h-auto camera-preview rounded-lg border"
              style={{ 
                aspectRatio: '16/9',
                objectFit: 'cover',
                maxHeight: '400px'
              }}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay pour aider à cadrer la pièce d'identité */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
              <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                Cadrez la pièce d'identité dans le rectangle
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
              className="bg-primary hover:bg-primary/90 flex-1"
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
