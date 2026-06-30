import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { ConsciousAvatar } from './ConsciousAvatar';
import { useNeuralState } from '../../hooks/useNeuralState';
import { useWallet } from '../../hooks/useWallet';
import { Globe, Users, Calendar, Music, Building2, Gamepad2, Plus, Lock, Users2, ShieldCheck, MapPin, Crown, Edit3, Trash2, Copy, CheckCircle2 } from 'lucide-react';

interface SpatialWorld {
  id: string;
  name: string;
  description: string;
  type: 'concert' | 'conference' | 'meetup' | 'gaming' | 'social' | 'user_owned';
  imageUrl: string;
  currentUsers: number;
  maxUsers: number;
  owner: string;
  ownerId: string;
  ownerWalletAddress?: string;
  coCreators: string[];
  isPersistent: boolean;
  isVerified: boolean;
  isPublic: boolean;
  nftTokenId?: string;
  blockchainNetwork?: string;
  totalLand Parcels: number;
  createdAt: Date;
  lastModified: Date;
}

interface UserAvatar {
  id: string;
  username: string;
  avatarUrl: string;
  isOnline: boolean;
  currentWorldId?: string;
}

const VirtualWorldLobby: React.FC = () => {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { neuralState } = useNeuralState();
  const [selectedWorld, setSelectedWorld] = useState<SpatialWorld | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [friendsInWorlds, setFriendsInWorlds] = useState<UserAvatar[]>([
    { id: '1', username: 'alice_digital', avatarUrl: 'https://example.com/avatar1.png', isOnline: true, currentWorldId: 'user-world-1' },
    { id: '2', username: 'bob_vr', avatarUrl: 'https://example.com/avatar2.png', isOnline: true, currentWorldId: '4' },
  ]);

  const [newWorldForm, setNewWorldForm] = useState({
    name: '',
    description: '',
    maxUsers: 1000,
    isPublic: true,
    isPersistent: true,
    mintAsNFT: true,
  });

  // User's owned spatial web3 worlds
  const [userOwnedWorlds, setUserOwnedWorlds] = useState<SpatialWorld[]>([
    {
      id: 'user-world-1',
      name: 'My Dream Paradise',
      description: 'A tropical island paradise I created with my friends',
      type: 'user_owned',
      imageUrl: 'https://example.com/island.jpg',
      currentUsers: 5,
      maxUsers: 100,
      owner: user?.username || 'current_user',
      ownerId: user?.id || '1',
      ownerWalletAddress: wallet?.address,
      coCreators: ['alice_digital', 'carol_creative'],
      isPersistent: true,
      isVerified: false,
      isPublic: false,
      nftTokenId: '789456',
      blockchainNetwork: 'Polygon',
      totalLandParcels: 16,
      createdAt: new Date(Date.now() - 604800000),
      lastModified: new Date(Date.now() - 86400000),
    }
  ]);

  // All spatial worlds including platform and user-created ones
  const spatialWorlds: SpatialWorld[] = [
    ...userOwnedWorlds,
    {
      id: '1',
      name: 'Summer Music Festival',
      description: 'Join thousands of fans for a virtual concert experience like never before',
      type: 'concert',
      imageUrl: 'https://example.com/concert.jpg',
      currentUsers: 12453,
      maxUsers: 50000,
      owner: 'Music Festival Inc',
      ownerId: 'music-fest-inc',
      coCreators: [],
      isPersistent: false,
      isVerified: true,
      isPublic: true,
      totalLandParcels: 1000,
      createdAt: new Date(),
      lastModified: new Date(),
    },
    {
      id: '2',
      name: 'Tech Conference 2026',
      description: 'Connect with innovators and thought leaders in our virtual conference center',
      type: 'conference',
      imageUrl: 'https://example.com/conference.jpg',
      currentUsers: 3421,
      maxUsers: 10000,
      owner: 'Tech World',
      ownerId: 'tech-world-org',
      coCreators: [],
      isPersistent: false,
      isVerified: true,
      isPublic: true,
      totalLandParcels: 500,
      createdAt: new Date(),
      lastModified: new Date(),
    },
    {
      id: '3',
      name: 'Gaming Tournament Arena',
      description: 'Watch and participate in competitive gaming events in our virtual stadium',
      type: 'gaming',
      imageUrl: 'https://example.com/gaming.jpg',
      currentUsers: 8765,
      maxUsers: 20000,
      owner: 'E-Sports League',
      ownerId: 'esports-league',
      coCreators: [],
      isPersistent: true,
      isVerified: true,
      isPublic: true,
      totalLandParcels: 200,
      createdAt: new Date(Date.now() - 31536000000),
      lastModified: new Date(),
    },
    {
      id: '4',
      name: 'Social Hangout Plaza',
      description: 'Meet friends, make new connections, and explore our persistent social space',
      type: 'social',
      imageUrl: 'https://example.com/plaza.jpg',
      currentUsers: 5234,
      maxUsers: 15000,
      owner: 'Platform Team',
      ownerId: 'platform-team',
      coCreators: [],
      isPersistent: true,
      isVerified: true,
      isPublic: true,
      totalLandParcels: 800,
      createdAt: new Date(Date.now() - 31536000000),
      lastModified: new Date(),
    },
    // Example of another user-created persistent world
    {
      id: 'community-art-museum',
      name: 'Community Digital Art Museum',
      description: 'A collaborative art museum where anyone can contribute their digital creations',
      type: 'user_owned',
      imageUrl: 'https://example.com/museum.jpg',
      currentUsers: 234,
      maxUsers: 500,
      owner: 'digital_art_collective',
      ownerId: 'art-collective-123',
      coCreators: ['digital_painter', 'sculptor_master', 'vr_artist'],
      isPersistent: true,
      isVerified: true,
      isPublic: true,
      nftTokenId: '123456',
      blockchainNetwork: 'Ethereum',
      totalLandParcels: 64,
      createdAt: new Date(Date.now() - 2592000000),
      lastModified: new Date(Date.now() - 172800000),
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'concert':
        return <Music className="h-5 w-5" />;
      case 'conference':
        return <Building2 className="h-5 w-5" />;
      case 'gaming':
        return <Gamepad2 className="h-5 w-5" />;
      case 'user_owned':
        return <Crown className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const handleJoinWorld = async (world: SpatialWorld) => {
    setIsJoining(true);
    setSelectedWorld(world);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsJoining(false);
    // Update friend's current world if it's the user
    if (world.ownerId === user?.id) {
      setFriendsInWorlds(friends.map(f => 
        f.currentWorldId === world.id ? {...f, currentWorldId: world.id} : f
      ));
    }
    // In a real implementation, this would launch the VR/3D experience
    alert(`Joining ${world.name}... This would launch the spatial web3 world experience with collaborative editing capabilities.`);
  };

  const handleCreateWorld = async () => {
    if (!wallet) {
      alert('Please connect your wallet first to create a spatial web3 world');
      return;
    }

    if (!newWorldForm.name) return;

    const newWorld: SpatialWorld = {
      id: `user-world-${Date.now()}`,
      name: newWorldForm.name,
      description: newWorldForm.description,
      type: 'user_owned',
      imageUrl: 'https://example.com/default-world.jpg',
      currentUsers: 0,
      maxUsers: newWorldForm.maxUsers,
      owner: user?.username || 'current_user',
      ownerId: user?.id || '1',
      ownerWalletAddress: wallet.address,
      coCreators: [],
      isPersistent: newWorldForm.isPersistent,
      isVerified: false,
      isPublic: newWorldForm.isPublic,
      nftTokenId: newWorldForm.mintAsNFT ? Math.floor(Math.random() * 1000000).toString() : undefined,
      blockchainNetwork: newWorldForm.mintAsNFT ? 'Polygon' : undefined,
      totalLandParcels: 16,
      createdAt: new Date(),
      lastModified: new Date(),
    };

    setUserOwnedWorlds([newWorld, ...userOwnedWorlds]);
    setIsCreateDialogOpen(false);
    setNewWorldForm({
      name: '',
      description: '',
      maxUsers: 1000,
      isPublic: true,
      isPersistent: true,
      mintAsNFT: true,
    });
  };

  const handleAddCoCreator = (worldId: string, username: string) => {
    setUserOwnedWorlds(worlds => worlds.map(w => {
      if (w.id === worldId && !w.coCreators.includes(username)) {
        return {...w, coCreators: [...w.coCreators, username]};
      }
      return w;
    }));
  };

  const copyWalletAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Metaverse & Virtual Worlds</h1>
        <p className="text-gray-600 dark:text-gray-400">Explore, connect, and create in immersive virtual social spaces</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Active Virtual Spaces
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {virtualSpaces.map((space) => (
              <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200 dark:bg-gray-800">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-white mb-2">
                      {getTypeIcon(space.type)}
                      <span className="capitalize">{space.type}</span>
                      {space.isLive && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">LIVE</span>
                      )}
                    </div>
                    <h3 className="text-white font-semibold text-lg">{space.name}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{space.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{space.currentUsers.toLocaleString()} / {space.maxUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{space.isLive ? 'Now' : new Date(space.startTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleJoinSpace(space)}
                    disabled={isJoining && selectedSpace?.id === space.id}
                  >
                    {isJoining && selectedSpace?.id === space.id ? 'Joining...' : 'Enter Space'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-4 mb-6">
            <h3 className="text-xl font-semibold mb-4">Friends in Virtual Worlds</h3>
            <div className="space-y-4">
              {/* Current user's avatar */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <ConsciousAvatar 
                  username={user?.username || 'You'}
                  neuralState={neuralState}
                  size={48}
                  showStatus={true}
                  showAura={true}
                />
                <div>
                  <p className="font-medium">{user?.username || 'You'}</p>
                  <p className="text-xs text-gray-500">Your consciousness avatar is active</p>
                </div>
              </div>
              {/* Friends' avatars */}
              {friendsInWorlds.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ConsciousAvatar 
                    username={friend.username}
                    neuralState={neuralState} // In production, each friend would have their own neural state
                    size={48}
                    showStatus={true}
                    showAura={true}
                  />
                  <div>
                    <p className="font-medium">{friend.username}</p>
                    <p className="text-xs text-gray-500">In Social Hangout Plaza</p>
                  </div>
                  <Button size="sm" className="ml-auto">Join</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-xl font-semibold mb-4">Create Your Own Space</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Host your own virtual events, create persistent social spaces, and bring your community together in the metaverse.
            </p>
            <Button className="w-full" variant="secondary">Create Virtual Space</Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VirtualWorldLobby;