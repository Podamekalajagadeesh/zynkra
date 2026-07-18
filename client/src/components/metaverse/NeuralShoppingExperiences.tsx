import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  ShoppingCart, 
  Eye, 
  Heart, 
  Share2, 
  Brain, 
  Play, 
  Pause,
  Check,
  RotateCcw,
  Volume2,
  Maximize2,
  Sliders,
  Sparkles,
  Package,
  Star,
  MapPin,
  Clock,
  Activity,
  Wind,
  Touchpad
} from 'lucide-react';
import { useNeuralState } from '../../hooks/useNeuralState';
import { useToast } from '../../hooks/useToast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'physical' | 'digital';
  image: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sensoryCompatible: boolean;
  estimatedDelivery?: string;
  trialDuration: number;
}

interface SensorySettings {
  visualIntensity: number;
  audioVolume: number;
  hapticStrength: number;
  olfactoryLevel: number;
  tactileReality: number;
}

interface ActiveTrial {
  product: Product | null;
  isActive: boolean;
  timeRemaining: number;
  progress: number;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Noise Canceling Headphones',
    description: 'Experience studio-quality sound with advanced neural sensory integration. Feel every note, hear every whisper with full 3D audio immersion.',
    price: 349.99,
    category: 'physical',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400&h=400',
    rating: 4.8,
    reviewCount: 2341,
    inStock: true,
    sensoryCompatible: true,
    estimatedDelivery: '2-3 business days',
    trialDuration: 120
  },
  {
    id: '2',
    name: 'Metaverse Luxury Villa - Coastal Paradise',
    description: 'Own a stunning virtual villa with panoramic ocean views. Fully furnished with smart home integration, perfect for hosting events.',
    price: 15000,
    category: 'digital',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=400&h=400',
    rating: 4.9,
    reviewCount: 89,
    inStock: true,
    sensoryCompatible: true,
    trialDuration: 300
  },
  {
    id: '3',
    name: 'Designer Leather Handbag - Artisan Collection',
    description: 'Handcrafted Italian leather handbag. Feel the premium materials, experience the weight and texture through neural sensory transfer.',
    price: 1299,
    category: 'physical',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400&h=400',
    rating: 4.7,
    reviewCount: 567,
    inStock: true,
    sensoryCompatible: true,
    estimatedDelivery: '3-5 business days',
    trialDuration: 180
  },
  {
    id: '4',
    name: 'Neural Art Collection - Digital Gallery Pass',
    description: 'Lifetime access to an exclusive collection of 500+ neural-compatible art pieces. Experience art through all senses.',
    price: 499,
    category: 'digital',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=400&h=400',
    rating: 4.6,
    reviewCount: 234,
    inStock: true,
    sensoryCompatible: true,
    trialDuration: 240
  }
];

const NeuralShoppingExperiences: React.FC = () => {
  const { neuralState } = useNeuralState();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('browse');
  const [cart, setCart] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeTrial, setActiveTrial] = useState<ActiveTrial>({
    product: null,
    isActive: false,
    timeRemaining: 0,
    progress: 0
  });
  
  const [sensorySettings, setSensorySettings] = useState<SensorySettings>({
    visualIntensity: 85,
    audioVolume: 70,
    hapticStrength: 65,
    olfactoryLevel: 50,
    tactileReality: 90
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const startTrial = (product: Product) => {
    setSelectedProduct(product);
    setActiveTrial({
      product,
      isActive: true,
      timeRemaining: product.trialDuration,
      progress: 0
    });
    showToast({
      title: 'Sensory Trial Started',
      description: `You're now experiencing ${product.name} through your neural interface`,
      type: 'success'
    });
  };

  const pauseTrial = () => {
    setActiveTrial(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  const endTrial = () => {
    setActiveTrial({
      product: null,
      isActive: false,
      timeRemaining: 0,
      progress: 0
    });
    setSelectedProduct(null);
  };

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
    showToast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your shopping cart`,
      type: 'success'
    });
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const purchase = (product: Product) => {
    showToast({
      title: 'Purchase Successful!',
      description: product.category === 'physical' 
        ? `${product.name} will be delivered ${product.estimatedDelivery}`
        : `${product.name} has been added to your digital wallet`,
      type: 'success'
    });
  };

  // Timer for active trial
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeTrial.isActive && activeTrial.timeRemaining > 0 && activeTrial.product) {
      interval = setInterval(() => {
        setActiveTrial(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          const totalDuration = prev.product!.trialDuration;
          const newProgress = ((totalDuration - newTimeRemaining) / totalDuration) * 100;
          
          return {
            ...prev,
            timeRemaining: newTimeRemaining,
            progress: newProgress
          };
        });
      }, 1000);
    } else if (activeTrial.timeRemaining === 0 && activeTrial.isActive) {
      // End trial when time runs out
      endTrial();
      showToast({
        title: 'Trial Completed',
        description: 'Your sensory trial has ended. Would you like to purchase the product?',
        type: 'info'
      });
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTrial.isActive, activeTrial.timeRemaining]);

  const updateSensorySetting = (key: keyof SensorySettings, value: number) => {
    setSensorySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const SensorySlider: React.FC<{
    label: string;
    value: number;
    onChange: (value: number) => void;
    icon: React.ReactNode;
  }> = ({ label, value, onChange, icon }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{label}</span>
        </div>
        <span className="text-sm text-gray-500">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge variant={product.category === 'digital' ? 'secondary' : 'default'}>
            {product.category}
          </Badge>
          {product.sensoryCompatible && (
            <Badge className="bg-purple-500">
              <Brain className="w-3 h-3 mr-1" />
              Neural Ready
            </Badge>
          )}
        </div>
        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-2 left-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
        >
          <Heart 
            className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm ml-1">{product.rating}</span>
          </div>
          <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">${product.price.toLocaleString()}</span>
        </div>
        
        <div className="flex gap-2 mt-4">
          {product.sensoryCompatible && (
            <Button
              onClick={() => startTrial(product)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Trial
            </Button>
          )}
          <Button
            onClick={() => addToCart(product)}
            className="flex-1"
            disabled={!product.inStock}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );

  const ActiveTrialView: React.FC = () => {
    if (!activeTrial.product) return null;
    
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
        {/* Trial Header */}
        <div className="bg-gray-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Neural Sensory Trial</h2>
              <p className="text-gray-400">{activeTrial.product.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Time Remaining</p>
              <p className="text-lg font-mono text-white">
                {Math.floor(activeTrial.timeRemaining / 60)}:{(activeTrial.timeRemaining % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <Progress value={activeTrial.progress} className="w-32 h-2" />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={pauseTrial} variant="secondary">
              {activeTrial.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button onClick={endTrial} variant="destructive">
              End Trial
            </Button>
          </div>
        </div>
        
        {/* Main Trial View */}
        <div className="flex-1 flex">
          {/* Product Preview Area */}
          <div className="flex-1 relative">
            <img
              src={activeTrial.product.image}
              alt={activeTrial.product.name}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Badge className="text-lg py-2 px-4 bg-purple-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Full Sensory Active - Visual, Audio, Haptic, Olfactory, Tactile
              </Badge>
            </div>
          </div>
          
          {/* Side Panel - Settings & Actions */}
          <div className="w-80 bg-gray-900 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-6">Sensory Settings</h3>
            
            <div className="space-y-6">
              <SensorySlider
                label="Visual Intensity"
                value={sensorySettings.visualIntensity}
                onChange={(v) => updateSensorySetting('visualIntensity', v)}
                icon={<Maximize2 className="w-4 h-4 text-blue-400" />}
              />
              <SensorySlider
                label="Audio Volume"
                value={sensorySettings.audioVolume}
                onChange={(v) => updateSensorySetting('audioVolume', v)}
                icon={<Volume2 className="w-4 h-4 text-green-400" />}
              />
              <SensorySlider
                label="Haptic Strength"
                value={sensorySettings.hapticStrength}
                onChange={(v) => updateSensorySetting('hapticStrength', v)}
                icon={<Activity className="w-4 h-4 text-orange-400" />}
              />
              <SensorySlider
                label="Olfactory Level"
                value={sensorySettings.olfactoryLevel}
                onChange={(v) => updateSensorySetting('olfactoryLevel', v)}
                icon={<Wind className="w-4 h-4 text-teal-400" />}
              />
              <SensorySlider
                label="Tactile Reality"
                value={sensorySettings.tactileReality}
                onChange={(v) => updateSensorySetting('tactileReality', v)}
                icon={<Touchpad className="w-4 h-4 text-pink-400" />}
              />
            </div>
            
            <div className="mt-8 space-y-4">
              <Button
                onClick={() => purchase(activeTrial.product!)}
                className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
              >
                <Check className="w-5 h-5 mr-2" />
                Purchase - ${activeTrial.product.price.toLocaleString()}
              </Button>
              <Button onClick={() => addToCart(activeTrial.product!)} className="w-full" variant="secondary">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
            
            {/* Neural State Feedback */}
            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-white mb-3">Your Neural Response</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Interest Level</span>
                    <span className="text-green-400">{Math.round(neuralState.focus.attention)}%</span>
                  </div>
                  <Progress value={neuralState.focus.attention} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Satisfaction</span>
                    <span className="text-green-400">{Math.round(neuralState.emotions.happiness)}%</span>
                  </div>
                  <Progress value={neuralState.emotions.happiness} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {activeTrial.isActive && <ActiveTrialView />}
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Brain className="w-10 h-10 text-purple-500" />
              Neural Shopping Experiences
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Test, experience, and purchase physical/digital products directly through your neural interface with full sensory trials
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="relative">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Cart ({cart.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Your Shopping Cart</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                      <p className="text-gray-500">Start adding products to your cart to purchase them</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="flex items-center gap-4 p-4 border rounded-lg">
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-gray-500">${item.price.toLocaleString()}</p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setCart(prev => prev.filter((_, i) => i !== index))}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-4 border-t mt-4">
                        <span className="text-xl font-bold">Total: ${cart.reduce((sum, item) => sum + item.price, 0).toLocaleString()}</span>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            cart.forEach(item => purchase(item));
                            setCart([]);
                          }}
                        >
                          Checkout All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <Sliders className="w-5 h-5 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neural Shopping Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <p className="text-sm text-gray-500">Configure your default sensory settings for all product trials</p>
                  <SensorySlider
                    label="Visual Intensity"
                    value={sensorySettings.visualIntensity}
                    onChange={(v) => updateSensorySetting('visualIntensity', v)}
                    icon={<Maximize2 className="w-4 h-4 text-blue-400" />}
                  />
                  <SensorySlider
                    label="Audio Volume"
                    value={sensorySettings.audioVolume}
                    onChange={(v) => updateSensorySetting('audioVolume', v)}
                    icon={<Volume2 className="w-4 h-4 text-green-400" />}
                  />
                  <SensorySlider
                    label="Haptic Strength"
                    value={sensorySettings.hapticStrength}
                    onChange={(v) => updateSensorySetting('hapticStrength', v)}
                    icon={<Activity className="w-4 h-4 text-orange-400" />}
                  />
                  <SensorySlider
                    label="Olfactory Level"
                    value={sensorySettings.olfactoryLevel}
                    onChange={(v) => updateSensorySetting('olfactoryLevel', v)}
                    icon={<Wind className="w-4 h-4 text-teal-400" />}
                  />
                  <SensorySlider
                    label="Tactile Reality"
                    value={sensorySettings.tactileReality}
                    onChange={(v) => updateSensorySetting('tactileReality', v)}
                    icon={<Touchpad className="w-4 h-4 text-pink-400" />}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Browse Products
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Wishlist ({wishlist.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Order History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wishlist">
          {wishlist.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
              <p className="text-gray-500">Start adding products you love to your wishlist</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockProducts
                .filter(p => wishlist.includes(p.id))
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders">
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-gray-500">Your order history will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Highlights */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6">
          <Brain className="w-12 h-12 text-purple-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Full Sensory Trials</h3>
          <p className="text-gray-600">Experience products through all five senses directly through your neural interface before purchasing</p>
        </Card>
        <Card className="p-6">
          <Package className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Physical & Digital</h3>
          <p className="text-gray-600">Seamlessly shop for both physical products that ship to your door and digital assets for the metaverse</p>
        </Card>
        <Card className="p-6">
          <Sparkles className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI-Powered Recommendations</h3>
          <p className="text-gray-600">Our neural network analyzes your preferences to suggest products you'll absolutely love</p>
        </Card>
      </div>
    </div>
  );
};

export default NeuralShoppingExperiences;