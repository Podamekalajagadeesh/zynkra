import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Upload,
  Cube,
  Share2,
  Image as ImageIcon,
  Grid,
  Plus,
  Search,
  Heart,
  Eye,
  Download,
  X,
  Save,
  Loader2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ThreeDModel {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  thumbnailUrl: string;
  format: 'glb' | 'gltf' | 'obj' | 'fbx';
  category: string;
  tags: string[];
  creator: string;
  creatorId: string;
  createdAt: Date;
  likes: number;
  views: number;
  downloads: number;
  isARCompatible: boolean;
  price: number | null;
}

const Object3DUploader: React.FC = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [newModel, setNewModel] = useState({
    title: '',
    description: '',
    category: 'furniture',
    tags: '',
    isARCompatible: true,
    price: ''
  });

  // Mock user's 3D models
  const [userModels, setUserModels] = useState<ThreeDModel[]>([
    {
      id: '1',
      title: 'Modern Sofa',
      description: 'A stylish modern sofa perfect for virtual living rooms',
      fileUrl: '/models/sofa.glb',
      thumbnailUrl: 'https://example.com/sofa-thumb.jpg',
      format: 'glb',
      category: 'furniture',
      tags: ['furniture', 'livingroom', 'modern'],
      creator: user?.username || 'current_user',
      creatorId: user?.id || '1',
      createdAt: new Date(Date.now() - 86400000),
      likes: 42,
      views: 128,
      downloads: 15,
      isARCompatible: true,
      price: null
    },
    {
      id: '2',
      title: 'Sci-fi Hoverboard',
      description: 'Futuristic hoverboard for metaverse adventures',
      fileUrl: '/models/hoverboard.glb',
      thumbnailUrl: 'https://example.com/hoverboard-thumb.jpg',
      format: 'glb',
      category: 'vehicles',
      tags: ['vehicle', 'sci-fi', 'futuristic'],
      creator: user?.username || 'current_user',
      creatorId: user?.id || '1',
      createdAt: new Date(Date.now() - 172800000),
      likes: 89,
      views: 342,
      downloads: 67,
      isARCompatible: true,
      price: 4.99
    }
  ]);

  // Explore gallery models
  const galleryModels: ThreeDModel[] = [
    {
      id: '3',
      title: 'Ancient Tree',
      description: 'Detailed ancient tree with procedural animation',
      fileUrl: '/models/tree.glb',
      thumbnailUrl: 'https://example.com/tree-thumb.jpg',
      format: 'glb',
      category: 'nature',
      tags: ['nature', 'tree', 'environment'],
      creator: 'nature_creator',
      creatorId: '2',
      createdAt: new Date(Date.now() - 259200000),
      likes: 256,
      views: 1024,
      downloads: 189,
      isARCompatible: true,
      price: null
    },
    {
      id: '4',
      title: 'Cyberpunk Street Light',
      description: 'Neon-lit street light perfect for cyberpunk cityscapes',
      fileUrl: '/models/streetlight.glb',
      thumbnailUrl: 'https://example.com/light-thumb.jpg',
      format: 'glb',
      category: 'architecture',
      tags: ['cyberpunk', 'city', 'neon'],
      creator: 'digital_architect',
      creatorId: '3',
      createdAt: new Date(Date.now() - 345600000),
      likes: 178,
      views: 756,
      downloads: 134,
      isARCompatible: true,
      price: 2.99
    }
  ];

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'nature', name: 'Nature' },
    { id: 'architecture', name: 'Architecture' },
    { id: 'vehicles', name: 'Vehicles' },
    { id: 'characters', name: 'Characters' },
    { id: 'props', name: 'Props' },
    { id: 'other', name: 'Other' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Simulate upload progress
      simulateUpload();
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedThumbnail(file);
    }
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleSubmitModel = () => {
    if (!selectedFile || !newModel.title) return;
    
    const model: ThreeDModel = {
      id: Date.now().toString(),
      title: newModel.title,
      description: newModel.description,
      fileUrl: URL.createObjectURL(selectedFile),
      thumbnailUrl: selectedThumbnail ? URL.createObjectURL(selectedThumbnail) : '',
      format: selectedFile.name.split('.').pop() as 'glb' | 'gltf' | 'obj' | 'fbx',
      category: newModel.category,
      tags: newModel.tags.split(',').map(t => t.trim()).filter(Boolean),
      creator: user?.username || 'anonymous',
      creatorId: user?.id || '0',
      createdAt: new Date(),
      likes: 0,
      views: 0,
      downloads: 0,
      isARCompatible: newModel.isARCompatible,
      price: newModel.price ? parseFloat(newModel.price) : null
    };

    setUserModels([model, ...userModels]);
    setIsCreateDialogOpen(false);
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setNewModel({
      title: '',
      description: '',
      category: 'furniture',
      tags: '',
      isARCompatible: true,
      price: ''
    });
  };

  const handleDeleteModel = (modelId: string) => {
    setUserModels(userModels.filter(m => m.id !== modelId));
  };

  const ModelCard: React.FC<{ model: ThreeDModel; isOwner?: boolean }> = ({ model, isOwner = false }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
        {model.thumbnailUrl ? (
          <img 
            src={model.thumbnailUrl} 
            alt={model.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Cube className="h-16 w-16 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button size="sm" variant="secondary" className="mr-2">
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          {model.isARCompatible && (
            <Button size="sm">
              <Cube className="h-4 w-4 mr-1" /> View in AR
            </Button>
          )}
        </div>
        {model.price && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
            ${model.price}
          </div>
        )}
        {model.isARCompatible && (
          <Badge className="absolute top-2 left-2" variant="secondary">AR Ready</Badge>
        )}
        {isOwner && (
          <button 
            onClick={() => handleDeleteModel(model.id)}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1">{model.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{model.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>by {model.creator}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {model.likes}</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {model.views}</span>
            <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {model.downloads}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold">3D Content Studio</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload 3D Model
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload New 3D Model</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model-file">3D Model File</Label>
                    <Input
                      id="model-file"
                      type="file"
                      ref={fileInputRef}
                      accept=".glb,.gltf,.obj,.fbx"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                    {selectedFile && <p className="text-xs text-green-600 mt-1">Selected: {selectedFile.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="thumbnail">Thumbnail Image</Label>
                    <Input
                      id="thumbnail"
                      type="file"
                      ref={thumbnailInputRef}
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                      className="mt-1"
                    />
                    {selectedThumbnail && <p className="text-xs text-green-600 mt-1">Selected: {selectedThumbnail.name}</p>}
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newModel.title}
                    onChange={(e) => setNewModel({...newModel, title: e.target.value})}
                    placeholder="Enter model title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newModel.description}
                    onChange={(e) => setNewModel({...newModel, description: e.target.value})}
                    placeholder="Describe your 3D model"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={newModel.category}
                      onChange={(e) => setNewModel({...newModel, category: e.target.value})}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                    >
                      {categories.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price (USD, leave empty for free)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newModel.price}
                      onChange={(e) => setNewModel({...newModel, price: e.target.value})}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={newModel.tags}
                    onChange={(e) => setNewModel({...newModel, tags: e.target.value})}
                    placeholder="furniture, modern, living-room"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ar-compatible"
                    checked={newModel.isARCompatible}
                    onChange={(e) => setNewModel({...newModel, isARCompatible: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="ar-compatible">Enable AR compatibility (can be viewed in real-world space)</Label>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSubmitModel}
                  disabled={!selectedFile || !newModel.title || isUploading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Publish Model
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Create, share, and discover 3D models and AR objects for the metaverse</p>
      </div>

      <Tabs defaultValue="my-models" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
          <TabsTrigger value="my-models" className="flex items-center gap-2">
            <Cube className="h-4 w-4" />
            My Creations
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Explore
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-models" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input placeholder="Search your models..." className="pl-10" />
            </div>
          </div>

          {userModels.length === 0 ? (
            <Card className="p-12 text-center">
              <Cube className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No 3D models yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Upload your first 3D model and start sharing with the community</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Your First Model
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userModels.map(model => (
                <ModelCard key={model.id} model={model} isOwner={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gallery">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {categories.map(cat => (
              <Badge key={cat.id} variant="secondary" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                {cat.name}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryModels.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <Card className="p-8 max-w-2xl mx-auto">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center">
              <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload your 3D model</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Supports GLB, glTF, OBJ, and FBX formats. Max file size: 100MB
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".glb,.gltf,.obj,.fbx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                Select File to Upload
              </Button>
              {selectedFile && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-green-700 dark:text-green-400">Selected: {selectedFile.name}</p>
                  <Button className="mt-3" onClick={() => setIsCreateDialogOpen(true)}>
                    Continue to Publish
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <Cube className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-semibold mb-1">Metaverse Ready</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">All models optimized for virtual worlds</p>
              </div>
              <div className="p-4">
                <Share2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-semibold mb-1">Share Easily</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Share your creations with the community</p>
              </div>
              <div className="p-4">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h4 className="font-semibold mb-1">AR Compatible</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">View models in the real world with AR</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Object3DUploader;