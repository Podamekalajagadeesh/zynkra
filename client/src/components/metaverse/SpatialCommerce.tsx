import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Store, Plus, Bot, Edit, Trash2 } from 'lucide-react';
import api from '../../lib/api';

interface Storefront {
  id: string;
  ownerId: string;
  owner?: any;
  name: string;
  description?: string;
  products: string[];
  virtualLocationX: number;
  virtualLocationY: number;
  virtualLocationZ: number;
  hasAiPersonalShopper: boolean;
  createdAt: Date;
}

export const SpatialCommerce: React.FC = () => {
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [myStorefronts, setMyStorefronts] = useState<Storefront[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStorefront, setNewStorefront] = useState<Partial<Storefront>>({
    name: '',
    description: '',
    products: [],
    virtualLocationX: 0,
    virtualLocationY: 0,
    virtualLocationZ: 0,
    hasAiPersonalShopper: true,
  });

  const fetchStorefronts = async () => {
    try {
      const [publicStorefronts, myStorefronts] = await Promise.all([
        api.get('/spatial-commerce'),
        api.get('/spatial-commerce/my'),
      ]);
      setStorefronts(publicStorefronts.data);
      setMyStorefronts(myStorefronts.data);
    } catch (error) {
      console.error('Failed to fetch storefronts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorefronts();
  }, []);

  const handleCreateOrUpdate = async () => {
    try {
      if (editingId && isEditing) {
        await api.put(`/spatial-commerce/${editingId}`, newStorefront);
      } else {
        await api.post('/spatial-commerce', newStorefront);
      }
      fetchStorefronts();
      resetForm();
    } catch (error) {
      console.error('Failed to save storefront', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/spatial-commerce/${id}`);
      fetchStorefronts();
    } catch (error) {
      console.error('Failed to delete storefront', error);
    }
  };

  const handleEdit = (storefront: Storefront) => {
    setIsEditing(true);
    setEditingId(storefront.id);
    setNewStorefront(storefront);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNewStorefront({
      name: '',
      description: '',
      products: [],
      virtualLocationX: 0,
      virtualLocationY: 0,
      virtualLocationZ: 0,
      hasAiPersonalShopper: true,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8 text-orange-500" />
            Spatial In-World Commerce
          </h2>
          <p className="text-gray-500 mt-2">
            Shop in immersive virtual storefronts with AI personal shoppers
          </p>
        </div>
      </div>

      <Tabs defaultValue="explore">
        <TabsList className="mb-6">
          <TabsTrigger value="explore">Explore Storefronts</TabsTrigger>
          <TabsTrigger value="my-storefronts">My Storefronts</TabsTrigger>
          <TabsTrigger value="create-store">Create Storefront</TabsTrigger>
        </TabsList>

        <TabsContent value="explore">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading virtual storefronts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storefronts.map((storefront) => (
                <Card key={storefront.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      {storefront.name}
                      {storefront.hasAiPersonalShopper && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Bot className="h-3 w-3 mr-1" />
                          AI Shopper
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {storefront.description && (
                      <p className="text-gray-600 text-sm">{storefront.description}</p>
                    )}
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        Products: {storefront.products.length}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        Location: ({storefront.virtualLocationX}, {storefront.virtualLocationY}, {storefront.virtualLocationZ})
                      </div>
                    </div>
                    <Button className="w-full">Visit Store</Button>
                  </CardContent>
                </Card>
              ))}
              {storefronts.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No storefronts yet</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-storefronts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myStorefronts.map((storefront) => (
              <Card key={storefront.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-bold">{storefront.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(storefront)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(storefront.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {storefront.description && (
                    <p className="text-gray-600 text-sm">{storefront.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    Products: {storefront.products.length}
                  </div>
                </CardContent>
              </Card>
            ))}
            {myStorefronts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">You don't have any storefronts yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create-store">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">
                {isEditing ? 'Edit Storefront' : 'Create Virtual Storefront'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name
                </label>
                <Input
                  value={newStorefront.name || ''}
                  onChange={(e) =>
                    setNewStorefront({ ...newStorefront, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={newStorefront.description || ''}
                  onChange={(e) =>
                    setNewStorefront({ ...newStorefront, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Products (comma separated IDs)
                </label>
                <Input
                  value={newStorefront.products?.join(', ') || ''}
                  onChange={(e) =>
                    setNewStorefront({
                      ...newStorefront,
                      products: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X Location
                  </label>
                  <Input
                    type="number"
                    value={newStorefront.virtualLocationX || 0}
                    onChange={(e) =>
                      setNewStorefront({
                        ...newStorefront,
                        virtualLocationX: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Y Location
                  </label>
                  <Input
                    type="number"
                    value={newStorefront.virtualLocationY || 0}
                    onChange={(e) =>
                      setNewStorefront({
                        ...newStorefront,
                        virtualLocationY: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Z Location
                  </label>
                  <Input
                    type="number"
                    value={newStorefront.virtualLocationZ || 0}
                    onChange={(e) =>
                      setNewStorefront({
                        ...newStorefront,
                        virtualLocationZ: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasAiShopper"
                  checked={newStorefront.hasAiPersonalShopper}
                  onChange={(e) =>
                    setNewStorefront({
                      ...newStorefront,
                      hasAiPersonalShopper: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="hasAiShopper" className="text-sm font-medium text-gray-700">
                  Enable AI Personal Shopper
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateOrUpdate} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Storefront' : 'Create Storefront'}
                </Button>
                {isEditing && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
