import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserCircle, Image, Upload, Share2, Globe, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AssetType } from '../../types/digital-assets';

interface DigitalAsset {
  id: string;
  name: string;
  description?: string;
  type: AssetType;
  cid: string;
  metadataCid: string;
  metadata: Record<string, any>;
  compatiblePlatforms: string[];
  blockchainTokenId?: string;
  isTransferable: boolean;
  createdAt: string;
  tags?: string[];
}

const DigitalAssetsGallery: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAsset, setSyncingAsset] = useState<string | null>(null);
  const [verifyingAsset, setVerifyingAsset] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assetForm, setAssetForm] = useState({
    name: '',
    description: '',
    type: AssetType.VIRTUAL_POSSESSION,
    isTransferable: true,
    tags: ''
  });

  useEffect(() => {
    fetchUserAssets();
  }, []);

  const fetchUserAssets = async () => {
    try {
      const response = await fetch('/api/digital-assets/my-assets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
      });
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Failed to fetch digital assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncAssetToPlatform = async (assetId: string, platformDomain: string) => {
    setSyncingAsset(assetId);
    try {
      await fetch(`/api/digital-assets/${assetId}/sync-to-instance/${platformDomain}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json',
        },
      });
      alert(`Asset synced to ${platformDomain} successfully!`);
    } catch (error) {
      console.error('Failed to sync asset:', error);
      alert('Failed to sync asset to remote platform');
    } finally {
      setSyncingAsset(null);
    }
  };

  const verifyAssetInteroperability = async (assetId: string, platform: string) => {
    setVerifyingAsset(assetId);
    try {
      const response = await fetch(`/api/digital-assets/${assetId}/verify-interoperability/${platform}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
      });
      const result = await response.json();
      setVerificationResults(prev => ({ ...prev, [assetId]: result }));
    } catch (error) {
      console.error('Failed to verify interoperability:', error);
    } finally {
      setVerifyingAsset(null);
    }
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case AssetType.AVATAR:
        return <UserCircle className="h-8 w-8" />;
      case AssetType.VIRTUAL_POSSESSION:
        return <Image className="h-8 w-8" />;
      case AssetType.CREATION:
        return <Upload className="h-8 w-8" />;
      case AssetType.NFT:
        return <Globe className="h-8 w-8" />;
      default:
        return <Image className="h-8 w-8" />;
    }
  };

  const getAssetUrl = (cid: string) => {
    return `https://ipfs.io/ipfs/${cid}`;
  };

  const uploadAsset = async () => {
    if (!selectedFile || !assetForm.name) {
      toast({
        title: 'Missing information',
        description: 'Please provide a name and select a file to upload',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', assetForm.name);
      formData.append('description', assetForm.description);
      formData.append('type', assetForm.type);
      formData.append('isTransferable', assetForm.isTransferable.toString());
      formData.append('tags', assetForm.tags);

      const response = await fetch('/api/digital-assets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload asset');
      }

      const newAsset = await response.json();
      setAssets(prev => [newAsset, ...prev]);
      setUploadModalOpen(false);
      resetForm();
      toast({
        title: 'Asset uploaded successfully',
        description: 'Your digital asset is now available across all compatible platforms'
      });
    } catch (error) {
      console.error('Failed to upload asset:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your asset. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setAssetForm({
      name: '',
      description: '',
      type: AssetType.VIRTUAL_POSSESSION,
      isTransferable: true,
      tags: ''
    });
    setSelectedFile(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Interoperable Digital Assets</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your avatars, virtual possessions, and creations work seamlessly across all platforms
        </p>
      </div>

      <div className="mb-8">
        <Button 
          className="flex items-center gap-2"
          onClick={() => setUploadModalOpen(true)}
        >
          <Upload className="h-4 w-4" />
          Upload New Asset
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-8">
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="avatars">Avatars</TabsTrigger>
          <TabsTrigger value="possessions">Virtual Possessions</TabsTrigger>
          <TabsTrigger value="creations">Creations</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map(asset => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                  <img 
                    src={getAssetUrl(asset.cid)} 
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if IPFS gateway is unreachable
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-3 left-3 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full">
                    {getAssetIcon(asset.type)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{asset.name}</h3>
                  {asset.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {asset.description}
                    </p>
                  )}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Works on:</p>
                    <div className="flex flex-wrap gap-2">
                      {asset.compatiblePlatforms.map(platform => (
                        <span key={platform} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => syncAssetToPlatform(asset.id, 'another-platform.com')}
                      disabled={syncingAsset === asset.id}
                      className="flex items-center gap-1"
                    >
                      <Share2 className="h-3 w-3" />
                      {syncingAsset === asset.id ? 'Syncing...' : 'Sync to Platform'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => verifyAssetInteroperability(asset.id, 'zynkra')}
                      disabled={verifyingAsset === asset.id}
                    >
                      {verifyingAsset === asset.id ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                  {verificationResults[asset.id] && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {verificationResults[asset.id].compatible ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">Compatible</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">Not Fully Compatible</span>
                          </>
                        )}
                      </div>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {verificationResults[asset.id].reasons.map((reason: string, i: number) => (
                          <li key={i}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
          
          {assets.length === 0 && (
            <div className="text-center py-16">
              <Globe className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No digital assets yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Upload your first avatar, virtual possession, or creation to start using it across platforms</p>
              <Button onClick={() => setUploadModalOpen(true)}>Upload Your First Asset</Button>
            </div>
          )}
        </TabsContent>

        {/* Similar tab content for other categories would go here */}
        <TabsContent value="avatars">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.filter(a => a.type === AssetType.AVATAR).map(asset => (
              <Card key={asset.id} className="overflow-hidden">
                {/* Same card content as above */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <UserCircle className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{asset.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Interoperable avatar that works across all connected platforms</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="possessions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.filter(a => a.type === AssetType.VIRTUAL_POSSESSION).map(asset => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{asset.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Virtual possession that travels with you across metaverse spaces</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="creations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.filter(a => a.type === AssetType.CREATION).map(asset => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Upload className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{asset.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your original creation accessible everywhere you go</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nfts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.filter(a => a.type === AssetType.NFT).map(asset => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Globe className="h-16 w-16 text-gray-400" />
                  </div>
                  {asset.blockchainTokenId && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                      <span className="text-xs text-purple-800 dark:text-purple-300">NFT #{asset.blockchainTokenId.slice(0, 6)}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{asset.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Blockchain-verified digital asset with cross-platform compatibility</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload New Digital Asset</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Asset Name</Label>
              <Input
                id="name"
                value={assetForm.name}
                onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Awesome Avatar"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={assetForm.description}
                onChange={(e) => setAssetForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your digital asset..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Asset Type</Label>
              <Select
                value={assetForm.type}
                onValueChange={(value) => setAssetForm(prev => ({ ...prev, type: value as AssetType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AssetType.AVATAR}>Avatar</SelectItem>
                  <SelectItem value={AssetType.VIRTUAL_POSSESSION}>Virtual Possession</SelectItem>
                  <SelectItem value={AssetType.CREATION}>Creation</SelectItem>
                  <SelectItem value={AssetType.NFT}>NFT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file">Asset File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept="image/*,video/*,model/*,.glb,.gltf,.obj,.fbx"
              />
              {selectedFile && (
                <p className="text-sm text-gray-500">Selected: {selectedFile.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={assetForm.tags}
                onChange={(e) => setAssetForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="avatar, virtual, metaverse"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => {
              setUploadModalOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={uploadAsset} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalAssetsGallery;