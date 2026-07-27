import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ShoppingCart, Users, Monitor, Settings, X, Tag, Clock, Play, Pause, Circle } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import LiveStreamChat from '../components/LiveStreamChat';
import { LiveShoppingProductPanel } from '../components/liveshopping/LiveShoppingProductPanel';
import { Room, LocalVideoTrack, VideoPresets } from 'livekit-client';
import { io } from 'socket.io-client';
import { api } from '../lib/api';

// Types
interface LiveShoppingProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  variants: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number;
    stock: number;
  }[];
  isFlashSale?: boolean;
  flashSaleEndsAt?: Date;
  exclusiveDiscount?: number;
}

interface LiveShoppingEvent {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  isLive: boolean;
  startsAt: Date;
  products: LiveShoppingProduct[];
  viewerCount: number;
}

// Socket connection
const socket = io('http://localhost:3001');

export const LiveShoppingPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<LiveShoppingEvent | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [featuredProductId, setFeaturedProductId] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<LiveShoppingProduct[]>([]);
  const [newProductSearch, setNewProductSearch] = useState('');
  
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const isHost = event?.hostId === currentUser?.id;

  // Fetch event data and available products
  useEffect(() => {
    if (id) {
      // Fetch live shopping event details
      api.get(`/live-shopping/events/${id}`).then(response => {
        setEvent(response.data);
        if (response.data.products.length > 0) {
          setFeaturedProductId(response.data.products[0].id);
        }
      });

      // Fetch host's products that can be added to the stream
      api.get('/products').then(response => {
        const formattedProducts = response.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrls?.[0],
          variants: p.variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            stock: v.stock
          }))
        }));
        setAvailableProducts(formattedProducts);
      });
    }

    // Socket listeners for live shopping events
    socket.on('product-featured', ({ productId }) => {
      setFeaturedProductId(productId);
      addToast('Host is featuring a new product!', 'info');
    });

    socket.on('flash-sale-started', ({ productId, duration, discount }) => {
      addToast(`Flash sale started! ${discount}% off for ${duration} minutes`, 'success');
    });

    socket.on('viewer-count-updated', ({ count }) => {
      setEvent(prev => prev ? { ...prev, viewerCount: count } : null);
    });

    return () => {
      socket.off('product-featured');
      socket.off('flash-sale-started');
      socket.off('viewer-count-updated');
      if (room) {
        room.disconnect();
      }
    };
  }, [id]);

  // Host: Start live shopping stream
  const handleStartStream = async () => {
    if (!currentUser?.id) {
      addToast('You must be logged in to stream', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      // Connect to LiveKit
      const newRoom = new Room();
      await newRoom.connect(process.env.LIVEKIT_URL || 'wss://your-livekit-instance.com', 'stream-token');
      setRoom(newRoom);

      setIsStreaming(true);
      socket.emit('live-shopping-start', { eventId: id });
      addToast('Live shopping stream started!', 'success');
    } catch (error) {
      console.error('Failed to start stream:', error);
      addToast('Failed to start stream', 'error');
    }
  };

  // Host: Stop stream
  const handleStopStream = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
    }
    setIsStreaming(false);
    socket.emit('live-shopping-end', { eventId: id });
    addToast('Live shopping stream ended', 'info');
  };

  // Host: Feature a product during the stream
  const handleFeatureProduct = (productId: string) => {
    setFeaturedProductId(productId);
    socket.emit('feature-product', { eventId: id, productId });
    addToast('Product featured to all viewers', 'success');
  };

  // Host: Start flash sale on a product
  const handleStartFlashSale = (productId: string, duration: number, discount: number) => {
    socket.emit('start-flash-sale', { 
      eventId: id, 
      productId, 
      durationMinutes: duration,
      discountPercentage: discount 
    });
    addToast(`Flash sale started! ${discount}% off for ${duration} minutes`, 'success');
  };

  // Host: Add exclusive discount to a product
  const handleAddExclusiveDiscount = (productId: string, discount: number) => {
    socket.emit('add-exclusive-discount', { eventId: id, productId, discount });
    addToast(`${discount}% exclusive discount added to product`, 'success');
  };

  // Host: Add product to the live stream
  const handleAddProductToStream = (product: LiveShoppingProduct) => {
    if (event) {
      const updatedProducts = [...event.products, product];
      setEvent({ ...event, products: updatedProducts });
      socket.emit('add-product-to-stream', { eventId: id, product });
      setShowAddProductModal(false);
      addToast('Product added to live stream', 'success');
    }
  };

  if (!event) {
    return <PageShell><div className="flex items-center justify-center h-96">Loading live shopping event...</div></PageShell>;
  }

  return (
    <PageShell>
      <div className="flex h-[calc(100vh-80px)]">
        {/* Main stream area */}
        <div className="flex-1 flex flex-col">
          {/* Event header */}
          <div className="bg-dark-900 p-4 border-b border-dark-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    <Circle className="w-2 h-2 fill-current" />
                    LIVE
                  </span>
                  <h1 className="text-2xl font-bold text-white">{event.title}</h1>
                </div>
                <p className="text-gray-400 mt-1">{event.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{event.viewerCount} watching</span>
                  </div>
                  <img 
                    src={event.hostAvatar} 
                    alt={event.hostName}
                    className="w-6 h-6 rounded-full inline-block"
                  />
                  <span className="text-gray-400">Hosted by {event.hostName}</span>
                </div>
              </div>

              {/* Host controls */}
              {isHost && (
                <div className="flex gap-2">
                  {!isStreaming ? (
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleStartStream}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Go Live
                    </Button>
                  ) : (
                    <Button 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleStopStream}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      End Stream
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Video stream */}
          <div className="flex-1 bg-black relative">
            <video 
              ref={userVideo}
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-contain"
            />
            {screenVideoRef.current && (
              <video
                ref={screenVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute bottom-4 right-4 w-80 h-48 object-cover rounded-lg border-2 border-dark-700"
              />
            )}

            {/* Overlay when not streaming */}
            {!isStreaming && !isHost && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white">Stream hasn't started yet</h2>
                  <p className="text-gray-400 mt-2">Check back later for the live shopping event!</p>
                </div>
              </div>
            )}
          </div>

          {/* Live chat */}
          <div className="h-64 border-t border-dark-700">
            <LiveStreamChat streamId={`live-shopping-${id}`} userId={currentUser?.id ?? ''} />
          </div>
        </div>

        {/* Live shopping product panel */}
        <LiveShoppingProductPanel 
          products={event.products}
          host={isHost}
          featuredProductId={featuredProductId || undefined}
          onAddProduct={() => setShowAddProductModal(true)}
        />
      </div>

      {/* Add Product Modal (host only) */}
      {showAddProductModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-dark-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add Product to Stream</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <Input
                placeholder="Search your products..."
                value={newProductSearch}
                onChange={(e) => setNewProductSearch(e.target.value)}
                className="mb-4"
              />
              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {availableProducts
                  .filter(p => p.name.toLowerCase().includes(newProductSearch.toLowerCase()))
                  .map(product => (
                    <div key={product.id} className="bg-dark-800 rounded-lg p-3 border border-dark-700">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                      <h4 className="font-medium text-white">{product.name}</h4>
                      <p className="text-sm text-gray-400">${product.variants[0]?.price}</p>
                      <Button 
                        className="w-full mt-2"
                        onClick={() => handleAddProductToStream(product)}
                      >
                        Add to Stream
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};