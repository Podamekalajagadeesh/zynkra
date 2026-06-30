import { useState, useEffect } from 'react';
import { PageShell } from '../PageShell';
import { contentOwnershipService, UserDigitalIdentity, OwnershipProof, IdentityClaim } from '../../services/contentOwnership';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Shield, Copy, Download, Upload, Link, FileText, User, CheckCircle, XCircle, Wallet, Lock, Unlock } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { walletService } from '../../services/wallet';

export function BlockchainIdentityDashboard() {
  const [identity, setIdentity] = useState<UserDigitalIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadIdentity();
  }, []);

  const loadIdentity = async () => {
    try {
      const userIdentity = await contentOwnershipService.getUserIdentity();
      setIdentity(userIdentity);
    } catch (error) {
      console.error('Failed to load identity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyWalletAddress = () => {
    if (identity?.walletAddress) {
      navigator.clipboard.writeText(identity.walletAddress);
      setCopiedAddress(true);
      addToast('Wallet address copied!', 'success');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const exportUserData = async () => {
    const blob = await contentOwnershipService.exportAllUserData();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-digital-identity-${Date.now()}.json`;
    a.click();
    addToast('Identity data exported!', 'success');
  };

  const createNewClaim = async () => {
    try {
      await contentOwnershipService.createIdentityClaim('profile', {
        verified: true,
        timestamp: Date.now()
      });
      loadIdentity();
      addToast('Identity claim created!', 'success');
    } catch (error) {
      addToast('Failed to create claim', 'error');
    }
  };

  if (isLoading) {
    return (
      <PageShell eyebrow="Blockchain Identity" title="Loading..." description="">
        <div className="animate-pulse">Loading your decentralized identity...</div>
      </PageShell>
    );
  }

  const wallet = walletService.getConnectedWallet();
  if (!wallet) {
    return (
      <PageShell eyebrow="Blockchain Identity" title="Connect Your Wallet" description="Connect your crypto wallet to access blockchain identity features">
        <Card className="p-8 text-center">
          <Wallet className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-4">Connect your wallet first to manage your blockchain identity and content ownership.</p>
          <Button onClick={() => window.location.href = '/wallet'}>Go to Wallet</Button>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell 
      eyebrow="Blockchain 4.0 Identity" 
      title="Your Self-Sovereign Digital Identity" 
      description="Full control over your digital identity, data, and content with immutable on-chain proof of ownership"
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User size={16} /> Overview
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText size={16} /> Owned Content
          </TabsTrigger>
          <TabsTrigger value="claims" className="flex items-center gap-2">
            <Shield size={16} /> Identity Claims
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Lock size={16} /> Data Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Wallet & Identity</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1 truncate">
                      {identity?.walletAddress}
                    </code>
                    <button onClick={copyWalletAddress} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                      {copiedAddress ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-2xl font-bold">{identity?.ownedContent.length || 0}</p>
                    <p className="text-sm text-gray-500">Owned Content Items</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-2xl font-bold">{identity?.reputationScore || 0}</p>
                    <p className="text-sm text-gray-500">Reputation Score</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Identity Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    On-chain identity active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Content ownership verifiable
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Data fully user-controlled
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Immutable ownership proofs
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">How Blockchain 4.0 Identity Works</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                    <span className="font-bold">1</span>
                  </div>
                  <p className="font-medium">Register Content On-Chain</p>
                  <p className="text-gray-500">Every piece of content you create gets hashed and registered on the blockchain, creating an immutable record of your ownership.</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                    <span className="font-bold">2</span>
                  </div>
                  <p className="font-medium">Own Your Identity</p>
                  <p className="text-gray-500">Your digital identity lives in your crypto wallet. No central authority can suspend, ban, or take control of your identity.</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                    <span className="font-bold">3</span>
                  </div>
                  <p className="font-medium">Portable Across Platforms</p>
                  <p className="text-gray-500">Bring your identity and content anywhere. Export all your data and move to any platform that supports open standards.</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-0">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Your On-Chain Content</h3>
              <Button onClick={loadIdentity} variant="secondary" size="sm">Refresh</Button>
            </div>
            {identity?.ownedContent && identity.ownedContent.length > 0 ? (
              <div className="space-y-4">
                {identity.ownedContent.map((item: OwnershipProof) => (
                  <div key={item.tokenId} className="border dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm mb-1">Token ID: {item.tokenId}</p>
                        <p className="text-sm text-gray-500">Created: {new Date(item.timestamp).toLocaleDateString()}</p>
                        <p className="text-xs font-mono text-gray-400 mt-2">TX: {item.transactionHash}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={`https://etherscan.io/tx/${item.transactionHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <Link className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">You haven't registered any content on-chain yet.</p>
                <p className="text-sm text-gray-400">All new posts, reels, and stories you create will automatically have their ownership registered on the blockchain.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="mt-0">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Identity Claims</h3>
              <Button onClick={createNewClaim} size="sm">Create New Claim</Button>
            </div>
            {identity?.claims && identity.claims.length > 0 ? (
              <div className="space-y-4">
                {identity.claims.map((claim: IdentityClaim) => (
                  <div key={claim.id} className="border dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold capitalize mb-1">{claim.claimType}</p>
                        <p className="text-sm text-gray-500">Issued: {new Date(claim.timestamp).toLocaleDateString()}</p>
                        <p className="text-xs font-mono text-gray-400 mt-2">Issuer: {claim.issuer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {contentOwnershipService.verifyIdentityClaim(claim) ? (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-red-600">
                            <XCircle className="h-4 w-4" /> Invalid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No identity claims created yet.</p>
                <p className="text-sm text-gray-400">Create verifiable claims to build your decentralized reputation on-chain.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Export Your Data</h3>
              <p className="text-sm text-gray-500 mb-4">Download a complete archive of all your identity data, owned content, and on-chain records. Take your data anywhere.</p>
              <Button onClick={exportUserData} icon={<Download size={16} />}>Export All Data</Button>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Data Portability</h3>
              <p className="text-sm text-gray-500 mb-4">Your identity is not locked into this platform. Import your identity into any compatible application that supports the open identity standard.</p>
              <Button variant="secondary" icon={<Upload size={16} />}>Import Identity</Button>
            </Card>
            <Card className="p-6 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b dark:border-gray-800">
                  <span className="text-gray-500">Content Registry Contract</span>
                  <code className="font-mono">{import.meta.env.VITE_CONTENT_REGISTRY_ADDRESS || 'Not configured'}</code>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-800">
                  <span className="text-gray-500">Storage Network</span>
                  <span>IPFS / Filecoin</span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-800">
                  <span className="text-gray-500">Identity Standard</span>
                  <span>W3C Decentralized Identifiers (DIDs)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Blockchain Network</span>
                  <span>Ethereum (EVM compatible)</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}