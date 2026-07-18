import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Shield, User, FileText, Gift, Clock, Edit, CheckCircle, XCircle, Plus } from 'lucide-react';
import api from '../../lib/api';

interface Inheritance {
  id: string;
  ownerId: string;
  beneficiaryId?: string;
  includedAssets: string[];
  includedMemories: string[];
  includedSocialConnections: string[];
  lastWillAndTestament?: string;
  status: 'draft' | 'active' | 'executed' | 'cancelled';
  executedAt?: Date;
  scheduledActivationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const DigitalInheritance: React.FC = () => {
  const [inheritances, setInheritances] = useState<Inheritance[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInheritance, setNewInheritance] = useState<Partial<Inheritance>>({
    includedAssets: [],
    includedMemories: [],
    includedSocialConnections: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchInheritances = async () => {
    try {
      const response = await api.get('/digital-inheritance');
      setInheritances(response.data);
    } catch (error) {
      console.error('Failed to fetch inheritances', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInheritances();
  }, []);

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/digital-inheritance/${editingId}`, newInheritance);
      } else {
        await api.post('/digital-inheritance', newInheritance);
      }
      fetchInheritances();
      setNewInheritance({
        includedAssets: [],
        includedMemories: [],
        includedSocialConnections: [],
      });
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save inheritance', error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.post(`/digital-inheritance/${id}/activate`);
      fetchInheritances();
    } catch (error) {
      console.error('Failed to activate inheritance', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.post(`/digital-inheritance/${id}/cancel`);
      fetchInheritances();
    } catch (error) {
      console.error('Failed to cancel inheritance', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'outline', color: 'bg-gray-100 text-gray-800' },
      active: { variant: 'default', color: 'bg-green-100 text-green-800' },
      executed: { variant: 'default', color: 'bg-blue-100 text-blue-800' },
      cancelled: { variant: 'outline', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-emerald-500" />
            Digital Inheritance
          </h2>
          <p className="text-gray-500 mt-2">
            Secure your digital legacy: identity, memories, assets, and social connections for future generations.
          </p>
        </div>
      </div>

      <Tabs defaultValue="my-inheritances">
        <TabsList className="mb-6">
          <TabsTrigger value="my-inheritances">My Inheritances</TabsTrigger>
          <TabsTrigger value="create-new">Create New</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
        </TabsList>

        <TabsContent value="my-inheritances">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && !inheritances.length && (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Loading digital inheritance plans...</p>
              </div>
            )}
            {!loading && !inheritances.length && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 mb-4">No digital inheritance plans yet</p>
                <Button onClick={() => setEditingId(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Plan
                </Button>
              </div>
            )}
            {inheritances.map((inheritance) => (
              <Card key={inheritance.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">
                    Inheritance Plan #{inheritance.id.slice(0, 8)}
                  </CardTitle>
                  {getStatusBadge(inheritance.status)}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Beneficiary</p>
                      <p className="font-medium flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {inheritance.beneficiaryId ? inheritance.beneficiaryId.slice(0, 8) + '...' : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(inheritance.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Gift className="h-4 w-4" />
                      Assets: {inheritance.includedAssets.length}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      Memories: {inheritance.includedMemories.length}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(inheritance.id);
                        setNewInheritance(inheritance);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {inheritance.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleActivate(inheritance.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    {inheritance.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(inheritance.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create-new">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Create Digital Inheritance Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficiary ID
                  </label>
                  <Input
                    value={newInheritance.beneficiaryId || ''}
                    onChange={(e) =>
                      setNewInheritance({
                        ...newInheritance,
                        beneficiaryId: e.target.value,
                      })
                    }
                    placeholder="Enter beneficiary's user ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Will & Testament (Digital)
                  </label>
                  <Textarea
                    value={newInheritance.lastWillAndTestament || ''}
                    onChange={(e) =>
                      setNewInheritance({
                        ...newInheritance,
                        lastWillAndTestament: e.target.value,
                      })
                    }
                    placeholder="Write your digital will and instructions for your beneficiaries..."
                    rows={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Included Digital Assets (comma separated IDs)
                  </label>
                  <Input
                    value={newInheritance.includedAssets?.join(', ') || ''}
                    onChange={(e) =>
                      setNewInheritance({
                        ...newInheritance,
                        includedAssets: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="asset-id-1, asset-id-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Included Memories (comma separated IDs)
                  </label>
                  <Input
                    value={newInheritance.includedMemories?.join(', ') || ''}
                    onChange={(e) =>
                      setNewInheritance({
                        ...newInheritance,
                        includedMemories: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="memory-id-1, memory-id-2"
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={handleSave} className="w-full md:w-auto">
                    Save Inheritance Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received">
          <Card>
            <CardHeader>
              <CardTitle>Inheritances Received</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">This section will display inheritances designated for you.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
