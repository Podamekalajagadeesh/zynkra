import { useState, useRef, useEffect } from 'react';
import { X, Sliders, Image as ImageIcon, Scissors, Sparkles, Download, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface PhotoEditorProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (editedImageUrl: string, filter: string) => void;
}

// CSS filter presets for color grading and effects
const FILTER_PRESETS: Record<string, string> = {
  none: 'none',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(80%)',
  vintage: 'contrast(90%) brightness(110%) saturate(85%) sepia(20%)',
  cool: 'contrast(110%) saturate(80%) hue-rotate(20deg)',
  warm: 'contrast(105%) saturate(120%) sepia(15%)',
  dramatic: 'contrast(130%) saturate(110%) brightness(95%)',
  fade: 'contrast(95%) brightness(105%) saturate(85%)',
  noir: 'grayscale(100%) contrast(150%) brightness(90%)',
  summer: 'saturate(140%) contrast(110%) brightness(105%)',
  winter: 'saturate(70%) contrast(95%) brightness(110%) hue-rotate(-15deg)',
};

export function PhotoEditor({ imageUrl, onClose, onSave }: PhotoEditorProps) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);
  const [blur, setBlur] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Generate current CSS filter string from manual adjustments + preset
  const getCurrentFilter = () => {
    const presetFilter = FILTER_PRESETS[selectedFilter] || '';
    const manualFilters = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) blur(${blur}px)`;
    return selectedFilter === 'none' ? manualFilters : `${presetFilter} ${manualFilters}`;
  };

  // Reset all adjustments
  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHueRotate(0);
    setBlur(0);
    setSelectedFilter('none');
    setRemoveBackground(false);
  };

  // Apply background removal simulation (in real app, this would use an API)
  const applyBackgroundRemoval = async () => {
    if (!canvasRef.current || !imageRef.current) return;
    setIsProcessing(true);
    
    // Simulate processing time for AI background removal
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    
    // In a real implementation, we would call an API like Remove.bg or use a ML model
    // This is a simulation that creates a transparent background effect
    setIsProcessing(false);
  };

  // Save the edited image
  const handleSave = async () => {
    if (!canvasRef.current || !imageRef.current) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    canvas.width = img.width;
    canvas.height = img.height;
    
    // Apply all filters to canvas
    if (ctx) {
      ctx.filter = getCurrentFilter();
      ctx.drawImage(img, 0, 0);
    }

    // Convert canvas to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const editedUrl = URL.createObjectURL(blob);
        onSave(editedUrl, selectedFilter);
        setIsProcessing(false);
      }
    }, 'image/png');
  };

  // Load image into canvas when component mounts
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      }
      if (imageRef.current) {
        imageRef.current.src = imageUrl;
      }
    };
  }, [imageUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-700">
          <h2 className="text-2xl font-bold">Photo Editor</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetAdjustments} ariaLabel="Reset edits">
              <RotateCcw className="h-5 w-5 mr-1" /> Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} ariaLabel="Close editor">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor canvas/image */}
          <div className="flex-1 p-4 flex items-center justify-center bg-gray-900 overflow-auto">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ filter: getCurrentFilter() }}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Tools sidebar */}
          <div className="w-80 bg-gray-50 dark:bg-dark-900 p-4 overflow-y-auto border-l dark:border-dark-700">
            {/* Tools tabs */}
            <div className="space-y-6">
              {/* Filters section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2" /> Filters
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(FILTER_PRESETS).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setSelectedFilter(filterKey)}
                      className={`p-2 text-xs rounded-lg border transition-all ${
                        selectedFilter === filterKey
                          ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
                      }`}
                    >
                      {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual adjustments */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Sliders className="h-5 w-5 mr-2" /> Adjustments
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Brightness: {brightness}%</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Contrast: {contrast}%</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Saturation: {saturation}%</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Hue Rotate: {hueRotate}°</label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={hueRotate}
                      onChange={(e) => setHueRotate(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Blur: {blur}px</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={blur}
                      onChange={(e) => setBlur(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* AI Tools */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" /> AI Tools
                </h3>
                <div className="space-y-2">
                  <Button
                    variant={removeBackground ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => {
                      setRemoveBackground(true);
                      applyBackgroundRemoval();
                    }}
                    disabled={isProcessing}
                  >
                    <Scissors className="h-4 w-4 mr-2" />
                    {isProcessing && removeBackground ? 'Processing...' : 'Remove Background'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with save button */}
        <div className="p-4 border-t dark:border-dark-700 flex justify-end">
          <Button onClick={handleSave} disabled={isProcessing} className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Save Edited Image'}
          </Button>
        </div>
      </div>
    </div>
  );
}