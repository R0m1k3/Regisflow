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
      <DialogContent className="max-w-md">
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
              className="w-full camera-preview"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
            <Button 
              onClick={onCapture} 
              disabled={isCapturing}
              className="bg-primary hover:bg-primary/90"
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
