import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import api from '../../lib/api';

const KeyStatus = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
};

interface QuantumKey {
  id: string;
  keyId: string;
  status: string;
  keyAlgorithms?: string[];
  createdAt: string;
  expiresAt?: string;
}

interface EncryptedRecord {
  id: string;
  encryptedData: string;
  encryptionAlgorithm: string;
  dataHash: string;
  createdAt: string;
  quantumKey?: QuantumKey;
}

interface EncryptionStats {
  totalKeys: number;
  activeKeys: number;
  totalRecords: number;
}

export const QuantumEncryption: React.FC = () => {
  const [keys, setKeys] = useState<QuantumKey[]>([]);
  const [records, setRecords] = useState<EncryptedRecord[]>([]);
  const [stats, setStats] = useState<EncryptionStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [keysRes, recRes, statsRes] = await Promise.all([
        api.get('/quantum-encryption/keys'),
        api.get('/quantum-encryption/records'),
        api.get('/quantum-encryption/stats'),
      ]);
      setKeys(keysRes.data);
      setRecords(recRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateNewKey = async () => {
    try {
      await api.post('/quantum-encryption/keys');
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const revokeKey = async (id: string) => {
    try {
      await api.patch(`/quantum-encryption/keys/${id}/revoke`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const encryptData = async () => {
    const dataInput = document.getElementById('encrypt-input') as HTMLTextAreaElement;
    if (!dataInput.value) return;
    try {
      await api.post('/quantum-encryption/encrypt', { data: dataInput.value });
      dataInput.value = '';
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const decryptRecord = async (id: string) => {
    try {
      const res = await api.get(`/quantum-encryption/records/${id}/decrypt`);
      alert(`Decrypted Data:\n${res.data.decryptedData}\nIntegrity Verified: ${res.data.integrityVerified}`);
    } catch (err) {
      console.error(err);
    }
  };

  const getKeyStatusBadge = (status: string) => {
    const classes = {
      [KeyStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [KeyStatus.REVOKED]: 'bg-red-100 text-red-800',
      [KeyStatus.EXPIRED]: 'bg-gray-100 text-gray-800',
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading encryption data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Quantum Encryption for Neural Data</h2>
        <p className="text-gray-500 mt-2">
          Unhackable encryption protecting your brain data from interception or manipulation
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalKeys}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.activeKeys}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Encrypted Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-cyan-600">{stats.totalRecords}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="keys">
        <TabsList className="mb-6">
          <TabsTrigger value="keys">Quantum Keys</TabsTrigger>
          <TabsTrigger value="encrypt">Encrypt Data</TabsTrigger>
          <TabsTrigger value="records">Encrypted Records</TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <div className="space-y-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <Button onClick={generateNewKey}>Generate New Quantum Key</Button>
              </CardContent>
            </Card>
            {keys.map((key) => (
              <Card key={key.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{key.keyId}</CardTitle>
                      <p className="text-sm text-gray-500">Created: {new Date(key.createdAt).toLocaleString()}</p>
                    </div>
                    <Badge className={getKeyStatusBadge(key.status)}>{key.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {key.keyAlgorithms && (
                    <div className="flex gap-2">
                      {key.keyAlgorithms.map((alg, i) => (
                        <Badge key={i} className="bg-gray-100 text-gray-800">{alg}</Badge>
                      ))}
                    </div>
                  )}
                  {key.expiresAt && (
                    <p className="text-sm text-gray-500">
                      Expires: {new Date(key.expiresAt).toLocaleString()}
                    </p>
                  )}
                  {key.status === KeyStatus.ACTIVE && (
                    <Button
                      variant="destructive"
                      onClick={() => revokeKey(key.id)}
                      size="sm"
                    >
                      Revoke Key
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {keys.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No quantum keys yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="encrypt">
          <Card>
            <CardHeader>
              <CardTitle>Encrypt Neural Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Data to Encrypt</Label>
                <Textarea id="encrypt-input" placeholder="Enter neural data to encrypt here..." />
              </div>
              <Button onClick={encryptData}>Encrypt with Quantum Security</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <div className="grid gap-4">
            {records.map((rec) => (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{rec.encryptionAlgorithm}</CardTitle>
                      <p className="text-sm text-gray-500">{new Date(rec.createdAt).toLocaleString()}</p>
                    </div>
                    <Button onClick={() => decryptRecord(rec.id)}>Decrypt</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 truncate">Hash: {rec.dataHash}</p>
                </CardContent>
              </Card>
            ))}
            {records.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No encrypted records yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
