import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MapPin, Navigation, Clock, Users, Car as CarIcon, Star, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useToast } from '../../hooks/useToast';

interface RideOption {
  id: string;
  name: string;
  description: string;
  price: number;
  eta: number; // minutes
  capacity: number;
  image: string;
}

interface SavedAddress {
  id: string;
  type: 'home' | 'work' | 'favorite';
  address: string;
  label: string;
}

interface ActiveRide {
  id: string;
  driverName: string;
  driverRating: number;
  vehicleModel: string;
  licensePlate: string;
  driverAvatar: string;
  currentEta: number;
  status: 'searching' | 'driver-assigned' | 'arriving' | 'in-progress' | 'completed';
  pickup: string;
  dropoff: string;
  price: number;
}

export function RideHailing() {
  const { addToast } = useToast();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [rideHistory, setRideHistory] = useState([
    {
      id: '1',
      date: new Date(Date.now() - 86400000 * 7),
      pickup: '123 Main St, New York, NY',
      dropoff: '456 Park Ave, New York, NY',
      price: 24.50,
      driver: 'Sarah Johnson',
      rating: 4.9
    }
  ]);

  const savedAddresses: SavedAddress[] = [
    { id: '1', type: 'home', address: '123 Main St, New York, NY', label: 'Home' },
    { id: '2', type: 'work', address: '789 Business Blvd, New York, NY', label: 'Work' }
  ];

  const rideOptions: RideOption[] = [
    {
      id: 'economy',
      name: 'Economy',
      description: 'Affordable daily rides',
      price: 15.99,
      eta: 5,
      capacity: 4,
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=200&h=120'
    },
    {
      id: 'comfort',
      name: 'Comfort',
      description: 'Newer cars with extra legroom',
      price: 22.99,
      eta: 3,
      capacity: 4,
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=200&h=120'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Luxury cars for special occasions',
      price: 39.99,
      eta: 8,
      capacity: 4,
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=200&h=120'
    },
    {
      id: 'suv',
      name: 'SUV',
      description: 'Spacious rides for groups',
      price: 32.99,
      eta: 6,
      capacity: 6,
      image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=200&h=120'
    }
  ];

  const handleQuickFill = (address: string, field: 'pickup' | 'dropoff') => {
    if (field === 'pickup') {
      setPickup(address);
    } else {
      setDropoff(address);
    }
  };

  const handleBookRide = async () => {
    if (!pickup || !dropoff || !selectedRide) {
      addToast('Please fill in all fields and select a ride option', 'error');
      return;
    }

    const ride = rideOptions.find(r => r.id === selectedRide);
    if (!ride) return;

    setIsBooking(true);
    
    // Simulate finding a driver
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newActiveRide: ActiveRide = {
      id: Date.now().toString(),
      driverName: 'Michael Chen',
      driverRating: 4.8,
      vehicleModel: 'Toyota Camry',
      licensePlate: 'ABC1234',
      driverAvatar: 'https://i.pravatar.cc/150?u=mchen',
      currentEta: 8,
      status: 'driver-assigned',
      pickup,
      dropoff,
      price: ride.price
    };

    setActiveRide(newActiveRide);
    setIsBooking(false);
    addToast('Driver found! They will arrive in 8 minutes.', 'success');
  };

  const cancelRide = async () => {
    if (!activeRide) return;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setActiveRide(null);
    addToast('Ride cancelled successfully', 'info');
  };

  if (activeRide) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Your ride is on the way!</h3>
            <Button variant="secondary" size="sm" onClick={cancelRide}>Cancel Ride</Button>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={activeRide.driverAvatar}
                alt={activeRide.driverName}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-lg">{activeRide.driverName}</p>
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span>{activeRide.driverRating}</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-green-600">{activeRide.currentEta}</p>
                <p className="text-xs text-gray-500">min away</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="font-medium">{activeRide.vehicleModel}</p>
              <p className="text-sm text-gray-500">License plate: {activeRide.licensePlate}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="text-green-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="text-sm">{activeRide.pickup}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="text-red-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Dropoff</p>
                <p className="text-sm">{activeRide.dropoff}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total fare</p>
              <p className="text-xl font-bold">${activeRide.price.toFixed(2)}</p>
            </div>
            <Button icon={<CreditCard size={18} />}>Payment Method</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Book a Ride</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Pickup Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                className="pl-10"
                placeholder="Enter pickup location"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Dropoff Location</label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                className="pl-10"
                placeholder="Enter destination"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Saved Places</p>
            <div className="flex gap-2">
              {savedAddresses.map(addr => (
                <Button
                  key={addr.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickFill(addr.address, 'dropoff')}
                >
                  {addr.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {pickup && dropoff && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Select Ride Option</h3>
          <div className="space-y-4">
            {rideOptions.map(ride => (
              <button
                key={ride.id}
                onClick={() => setSelectedRide(ride.id)}
                className={`w-full p-4 border rounded-lg text-left transition-all ${
                  selectedRide === ride.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={ride.image}
                    alt={ride.name}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{ride.name}</p>
                      <p className="font-bold">${ride.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {ride.eta} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {ride.capacity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{ride.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button
            className="w-full mt-6"
            size="lg"
            onClick={handleBookRide}
            disabled={isBooking || !selectedRide}
            icon={<CarIcon size={18} />}
          >
            {isBooking ? 'Finding your driver...' : 'Confirm Ride'}
          </Button>
        </Card>
      )}

      {rideHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Rides</h3>
          <div className="space-y-4">
            {rideHistory.map(ride => (
              <div key={ride.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{ride.date.toLocaleDateString()}</p>
                  <p className="font-semibold">${ride.price.toFixed(2)}</p>
                </div>
                <div className="text-sm text-gray-500">
                  <p>{ride.pickup} → {ride.dropoff}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}