import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Shirt, Palette, Sparkles, RotateCcw, Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AvatarCustomization {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
  accessory: string;
  height: number;
  eyeColor: string;
}

const AvatarCustomizer: React.FC = () => {
  const { user } = useAuth();
  const [customization, setCustomization] = useState<AvatarCustomization>({
    skinTone: '#E8B88E',
    hairStyle: 'classic',
    hairColor: '#2C1810',
    outfit: 'casual',
    accessory: 'none',
    height: 1.0,
    eyeColor: '#4A3728',
  });

  const [activeTab, setActiveTab] = useState('appearance');

  const hairStyles = [
    { id: 'classic', name: 'Classic' },
    { id: 'long', name: 'Long Flowing' },
    { id: 'spiky', name: 'Spiky' },
    { id: 'curly', name: 'Curly' },
    { id: 'bald', name: 'Bald' },
  ];

  const outfits = [
    { id: 'casual', name: 'Casual Wear' },
    { id: 'formal', name: 'Formal Attire' },
    { id: 'sporty', name: 'Athletic Gear' },
    { id: 'fantasy', name: 'Fantasy Robes' },
    { id: 'futuristic', name: 'Futuristic Suit' },
  ];

  const accessories = [
    { id: 'none', name: 'None' },
    { id: 'glasses', name: 'VR Glasses' },
    { id: 'hat', name: 'Digital Hat' },
    { id: 'wings', name: 'Energy Wings' },
    { id: 'halo', name: 'Light Halo' },
  ];

  const skinTones = [
    '#F8D5C0',
    '#E8B88E',
    '#D4A574',
    '#C68642',
    '#8D5524',
    '#5C3317',
    '#F5CBA7',
    '#DEB887',
  ];

  const hairColors = [
    '#2C1810',
    '#4A3728',
    '#8B4513',
    '#CD853F',
    '#FFD700',
    '#FF69B4',
    '#00BFFF',
    '#9400D3',
  ];

  const eyeColors = [
    '#4A3728',
    '#8B4513',
    '#4169E1',
    '#228B22',
    '#9400D3',
    '#FF6347',
  ];

  const handleSkinToneChange = (color: string) => {
    setCustomization({ ...customization, skinTone: color });
  };

  const handleSaveAvatar = async () => {
    // In a real implementation, this would save to backend
    console.log('Saving avatar customization:', customization);
    alert('Avatar saved successfully! Your virtual avatar is ready to use across all metaverse spaces.');
  };

  const handleReset = () => {
    setCustomization({
      skinTone: '#E8B88E',
      hairStyle: 'classic',
      hairColor: '#2C1810',
      outfit: 'casual',
      accessory: 'none',
      height: 1.0,
      eyeColor: '#4A3728',
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Avatar Customizer</h1>
        <p className="text-gray-600 dark:text-gray-400">Create your perfect digital identity for the metaverse</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Avatar Preview */}
        <Card className="p-6 sticky top-6">
          <h3 className="text-xl font-semibold mb-4">Live Preview</h3>
          <div className="relative h-96 bg-gradient-to-b from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
            <div 
              className="relative transition-all duration-300"
              style={{ transform: `scale(${customization.height})` }}
            >
              {/* Simplified 3D avatar preview */}
              <div className="w-32 h-48 relative">
                {/* Head */}
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full"
                  style={{ backgroundColor: customization.skinTone }}
                >
                  {/* Eyes */}
                  <div className="absolute top-6 left-3 w-3 h-3 rounded-full" style={{ backgroundColor: customization.eyeColor }}></div>
                  <div className="absolute top-6 right-3 w-3 h-3 rounded-full" style={{ backgroundColor: customization.eyeColor }}></div>
                  {/* Hair (simplified) */}
                  <div 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-12 rounded-t-full"
                    style={{ backgroundColor: customization.hairColor }}
                  ></div>
                </div>
                {/* Body/outfit */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-28 rounded-b-xl bg-gray-700"></div>
                {/* Accessory */}
                {customization.accessory === 'glasses' && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-full"></div>
                )}
              </div>
            </div>
            <Sparkles className="absolute bottom-4 right-4 text-yellow-400 h-6 w-6" />
          </div>
          <div className="flex gap-3 mt-6">
            <Button className="flex-1" onClick={handleSaveAvatar}>
              <Save className="h-4 w-4 mr-2" />
              Save Avatar
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </Card>

        {/* Customization Options */}
        <div>
          <Tabs defaultValue="appearance" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="hair" className="flex items-center gap-2">
                <Haircut className="h-4 w-4" />
                <span className="hidden sm:inline">Hair</span>
              </TabsTrigger>
              <TabsTrigger value="outfit" className="flex items-center gap-2">
                <Shirt className="h-4 w-4" />
                <span className="hidden sm:inline">Outfit</span>
              </TabsTrigger>
              <TabsTrigger value="accessories" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Extras</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Skin Tone</h4>
                <div className="grid grid-cols-4 gap-3">
                  {skinTones.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleSkinToneChange(color)}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        customization.skinTone === color ? 'border-blue-500 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3">Eye Color</h4>
                <div className="grid grid-cols-3 gap-3">
                  {eyeColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCustomization({ ...customization, eyeColor: color })}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        customization.eyeColor === color ? 'border-blue-500 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3">Height: {customization.height.toFixed(2)}x</h4>
                <Slider
                  defaultValue={[1.0]}
                  min={0.8}
                  max={1.3}
                  step={0.01}
                  value={[customization.height]}
                  onValueChange={(value) => setCustomization({ ...customization, height: value[0] })}
                  className="w-full"
                />
              </Card>
            </TabsContent>

            <TabsContent value="hair" className="space-y-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Hair Style</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hairStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setCustomization({ ...customization, hairStyle: style.id })}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        customization.hairStyle === style.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-3">Hair Color</h4>
                <div className="grid grid-cols-4 gap-3">
                  {hairColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCustomization({ ...customization, hairColor: color })}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        customization.hairColor === color ? 'border-blue-500 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="outfit" className="space-y-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Choose Outfit</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {outfits.map((outfit) => (
                    <button
                      key={outfit.id}
                      onClick={() => setCustomization({ ...customization, outfit: outfit.id })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        customization.outfit === outfit.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Shirt className="h-5 w-5 mb-2 opacity-70" />
                      <p className="font-medium">{outfit.name}</p>
                    </button>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="accessories" className="space-y-6">
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Accessories</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessories.map((accessory) => (
                    <button
                      key={accessory.id}
                      onClick={() => setCustomization({ ...customization, accessory: accessory.id })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        customization.accessory === accessory.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Sparkles className="h-5 w-5 mb-2 opacity-70" />
                      <p className="font-medium">{accessory.name}</p>
                    </button>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomizer;