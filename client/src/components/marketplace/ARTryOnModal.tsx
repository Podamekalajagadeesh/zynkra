import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, Check, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

interface ARTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

// Supported product categories that can be tried on
const SUPPORTED_CATEGORIES = {
  fashion: ['sunglasses', 'hats', 'shirts', 'jackets', 'dresses'],
  beauty: ['lipstick', 'eyeshadow', 'foundation', 'mascara'],
  home: ['furniture', 'decor', 'rugs', 'wall-art']
};

export function ARTryOnModal({ isOpen, onClose, product }: ARTryOnModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arMode, setArMode] = useState<'face' | 'environment'>('face');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [placementPosition, setPlacementPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const animationRef = useRef<number>();

  // Check if product is eligible for AR try-on
  const isProductSupported = useCallback(() => {
    if (!product.category) return false;
    const category = product.category.toLowerCase();
    return Object.values(SUPPORTED_CATEGORIES).some(cats => 
      cats.some(c => category.includes(c))
    );
  }, [product]);

  // Determine AR mode based on product category
  useEffect(() => {
    if (product.category) {
      const category = product.category.toLowerCase();
      if (category.includes('furniture') || category.includes('decor') || category.includes('rug') || category.includes('wall')) {
        setArMode('environment');
      } else {
        setArMode('face');
      }
    }
  }, [product]);

  // Start camera stream
  const startCamera = async () => {
    try {
      setError(null);
      const constraints = {
        video: {
          facingMode: arMode === 'face' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsCameraActive(true);
      }

      // Simulate model loading
      setTimeout(() => setIsModelLoaded(true), 1500);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions to use AR try-on.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on your device.');
      } else {
        setError('Unable to access camera. Please check your device settings.');
      }
    }
  };

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsModelLoaded(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [stream]);

  // Handle canvas interaction for placing home goods
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (arMode === 'environment') {
      setIsDragging(true);
      updatePlacement(e);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && arMode === 'environment') {
      updatePlacement(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const updatePlacement = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPlacementPosition({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
  };

  // Draw AR overlay
  const drawAROverlay = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    if (videoRef.current.videoWidth) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isModelLoaded && isProductSupported()) {
      if (arMode === 'face') {
        // Face-based AR overlay (sunglasses, hats, makeup, etc.)
        // This is a simplified version; in production, this would use MediaPipe or similar for face tracking
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.35;
        
        // Draw product overlay at face position
        ctx.save();
        ctx.globalAlpha = 0.85;
        
        // Create a temporary image for the product
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const overlayWidth = canvas.width * 0.5;
          const overlayHeight = overlayWidth / aspectRatio;
          
          ctx.drawImage(
            img,
            centerX - overlayWidth / 2,
            centerY - overlayHeight / 2,
            overlayWidth,
            overlayHeight
          );
        };
        img.src = product.imageUrls?.[0] || 'https://via.placeholder.com/200x100';
        
        ctx.restore();

        // Add face detection guide
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          canvas.width * 0.25,
          canvas.height * 0.15,
          canvas.width * 0.5,
          canvas.height * 0.5
        );
        ctx.setLineDash([]);
        
        // Instruction text
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Position your face within the green box', centerX, canvas.height * 0.7);

      } else {
        // Environment-based AR overlay (home goods, furniture)
        const canvasX = (placementPosition.x / 100) * canvas.width;
        const canvasY = (placementPosition.y / 100) * canvas.height;
        
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        // Draw 3D perspective placeholder for home goods
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const overlayWidth = canvas.width * 0.4;
          const overlayHeight = overlayWidth / aspectRatio;
          
          // Simple perspective transform simulation
          ctx.drawImage(
            img,
            canvasX - overlayWidth / 2,
            canvasY - overlayHeight / 2,
            overlayWidth,
            overlayHeight
          );
        };
        img.src = product.imageUrls?.[0] || 'https://via.placeholder.com/300x200';
        
        ctx.restore();

        // Floor guide
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.1, canvas.height * 0.8);
        ctx.lineTo(canvas.width * 0.9, canvas.height * 0.8);
        ctx.stroke();

        // Instruction text
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Drag to move the item, tap on your space to place it', canvas.width / 2, canvas.height * 0.9);
      }
    }

    animationRef.current = requestAnimationFrame(drawAROverlay);
  }, [isModelLoaded, isProductSupported, arMode, placementPosition, product]);

  // Initialize canvas drawing when camera is active
  useEffect(() => {
    if (isCameraActive && isModelLoaded) {
      drawAROverlay();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isCameraActive, isModelLoaded, drawAROverlay]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // Switch camera (front/back)
  const switchCamera = async () => {
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 500));
    setArMode(prev => prev === 'face' ? 'environment' : 'face');
  };

  if (!isProductSupported() && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AR Try-On Not Available</DialogTitle>
            <DialogDescription>
              This product category doesn't support AR try-on yet. We're working on adding support for more products!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-8">
            <Info className="w-16 h-16 text-gray-400" />
          </div>
          <Button onClick={onClose} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[90vh] max-h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
            <DialogTitle className="text-white text-lg font-semibold">
              AR Try-On: {product.name}
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Camera view */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!isCameraActive ? (
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-4">Start AR try-on to see how this looks on you!</p>
                {error && (
                  <p className="text-red-400 mb-4 max-w-md mx-auto">{error}</p>
                )}
                <Button onClick={startCamera} className="flex items-center gap-2 mx-auto">
                  <Camera className="w-4 h-4" />
                  Start Camera
                </Button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
                
                {/* Loading state */}
                {!isModelLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p>Loading AR model...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom controls */}
          {isCameraActive && (
            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 p-6 bg-gradient-to-t from-black/70 to-transparent">
              <button
                onClick={switchCamera}
                className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title="Switch Camera"
              >
                <RefreshCw className="w-6 h-6 text-white" />
              </button>
              
              <div className="px-4 py-2 bg-white/20 rounded-full">
                <p className="text-white text-sm">
                  {arMode === 'face' ? 'Face Mode' : 'Room Mode'}
                </p>
              </div>

              <button
                onClick={() => {
                  // In production, this would capture the AR screenshot and allow sharing/saving
                  alert('AR try-on captured! You can now share or purchase this item.');
                }}
                className="p-4 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
                title="Confirm and Save"
              >
                <Check className="w-6 h-6 text-white" />
              </button>
            </div>
          )}

          {/* Product info sidebar */}
          <div className="absolute top-20 right-4 z-10 w-40 bg-black/60 rounded-lg p-3">
            <img
              src={product.imageUrls?.[0] || 'https://via.placeholder.com/150'}
              alt={product.name}
              className="w-full h-24 object-cover rounded mb-2"
            />
            <p className="text-white text-xs font-medium truncate">{product.name}</p>
            <p className="text-green-400 text-sm font-bold">${product.price}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}