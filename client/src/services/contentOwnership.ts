import { ethers } from 'ethers';
import { walletService } from './wallet';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Content Ownership Registry ABI - minimal ERC721-like registry for content ownership
const CONTENT_REGISTRY_ABI = [
  'function registerContent(string calldata contentHash, string calldata metadataURI) external returns (uint256)',
  'function verifyOwnership(uint256 tokenId) external view returns (address)',
  'function getContentByOwner(address owner) external view returns (uint256[] memory)',
  'function transferContent(uint256 tokenId, address to) external',
  'event ContentRegistered(uint256 indexed tokenId, address indexed owner, string contentHash, uint256 timestamp)'
];

export interface ContentMetadata {
  id: string;
  title: string;
  description: string;
  contentType: 'post' | 'reel' | 'story' | 'photo' | 'video';
  contentHash: string;
  timestamp: number;
  ipfsHash: string;
  creatorAddress: string;
  tags: string[];
  license: 'all-rights-reserved' | 'creative-commons' | 'public-domain';
}

export interface OwnershipProof {
  tokenId: string;
  transactionHash: string;
  blockNumber: number;
  contentHash: string;
  ownerAddress: string;
  timestamp: number;
  metadataURI: string;
}

export interface IdentityClaim {
  id: string;
  claimType: 'name' | 'profile' | 'verification' | 'reputation';
  issuer: string;
  subject: string;
  data: any;
  signature: string;
  timestamp: number;
  validUntil: number;
}

export interface SocialGraphConnection {
  address: string;
  username: string;
  since: number;
  type: 'follower' | 'following';
}

export interface UserDigitalIdentity {
  walletAddress: string;
  claims: IdentityClaim[];
  ownedContent: OwnershipProof[];
  socialGraph: SocialGraphConnection[]; // Complete social graph: followers and following
  reputationScore: number;
  dataVault: string; // IPFS hash of encrypted user data
  lastUpdated: number;
}

class ContentOwnershipService {
  private registryContract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  private async ensureContract() {
    const wallet = walletService.getConnectedWallet();
    if (!wallet) throw new Error('No wallet connected');

    if (!this.provider && typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }

    if (!this.provider) {
      throw new Error('Ethereum provider is not available');
    }

    this.signer = await this.provider.getSigner(wallet.address);
    
    // Content Registry contract address - would be deployed on mainnet
    const registryAddress = import.meta.env.VITE_CONTENT_REGISTRY_ADDRESS || '0x...';
    this.registryContract = new ethers.Contract(registryAddress, CONTENT_REGISTRY_ABI, this.signer);
  }

  // Generate content hash for immutable proof
  private generateContentHash(content: any): string {
    const contentString = JSON.stringify(content);
    return ethers.id(contentString);
  }

  // Upload content metadata to IPFS
  private async uploadToIPFS(metadata: any): Promise<string> {
    try {
      const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      throw error;
    }
  }

  // Register content on-chain to establish immutable ownership
  async registerContent(content: any, contentType: ContentMetadata['contentType']): Promise<OwnershipProof> {
    await this.ensureContract();
    
    const wallet = walletService.getConnectedWallet();
    if (!wallet) throw new Error('No wallet connected');

    // Create metadata
    const contentId = uuidv4();
    const contentHash = this.generateContentHash(content);
    
    const metadata: ContentMetadata = {
      id: contentId,
      title: content.title || 'Untitled Content',
      description: content.description || '',
      contentType,
      contentHash,
      timestamp: Date.now(),
      ipfsHash: '',
      creatorAddress: wallet.address,
      tags: content.tags || [],
      license: content.license || 'all-rights-reserved'
    };

    // Upload metadata to IPFS
    const ipfsHash = await this.uploadToIPFS(metadata);
    metadata.ipfsHash = ipfsHash;

    // Register on-chain
    const tx = await this.registryContract!.registerContent(contentHash, `ipfs://${ipfsHash}`);
    const receipt = await tx.wait();
    
    const proof: OwnershipProof = {
      tokenId: receipt.events[0].args.tokenId.toString(),
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      contentHash,
      ownerAddress: wallet.address,
      timestamp: Date.now(),
      metadataURI: `ipfs://${ipfsHash}`
    };

    // Store proof locally
    this.storeOwnershipProof(proof);
    
    return proof;
  }

  // Verify content ownership
  async verifyContentOwnership(tokenId: string): Promise<{isOwner: boolean; ownerAddress: string}> {
    await this.ensureContract();
    const wallet = walletService.getConnectedWallet();
    
    const ownerAddress = await this.registryContract!.verifyOwnership(tokenId);
    return {
      isOwner: ownerAddress.toLowerCase() === wallet?.address.toLowerCase(),
      ownerAddress
    };
  }

  // Get all content owned by current user
  async getUserOwnedContent(): Promise<OwnershipProof[]> {
    await this.ensureContract();
    const wallet = walletService.getConnectedWallet();
    if (!wallet) return [];

    const tokenIds = await this.registryContract!.getContentByOwner(wallet.address);
    
    // Fetch metadata for each token
    const proofs: OwnershipProof[] = [];
    for (const tokenId of tokenIds) {
      // This would fetch from chain or local storage
      const storedProofs = this.getStoredProofs();
      const stored = storedProofs.find(p => p.tokenId === tokenId.toString());
      if (stored) proofs.push(stored);
    }
    
    return proofs;
  }

  // Transfer content ownership to another address
  async transferContent(tokenId: string, toAddress: string): Promise<boolean> {
    await this.ensureContract();
    const tx = await this.registryContract!.transferContent(tokenId, toAddress);
    await tx.wait();
    return true;
  }

  // Create self-sovereign identity claim
  async createIdentityClaim(claimType: IdentityClaim['claimType'], data: any): Promise<IdentityClaim> {
    const wallet = walletService.getConnectedWallet();
    if (!wallet) throw new Error('No wallet connected');

    if (!this.provider && typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }

    if (!this.provider) {
      throw new Error('Ethereum provider is not available');
    }

    const signer = await this.provider.getSigner();
    
    const claim: IdentityClaim = {
      id: uuidv4(),
      claimType,
      issuer: wallet.address,
      subject: wallet.address,
      data,
      signature: '',
      timestamp: Date.now(),
      validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
    };

    // Sign the claim
    const claimString = JSON.stringify({ ...claim, signature: undefined });
    claim.signature = await signer.signMessage(claimString);
    
    // Store claim
    this.storeIdentityClaim(claim);
    
    return claim;
  }

  // Verify an identity claim
  verifyIdentityClaim(claim: IdentityClaim): boolean {
    try {
      const claimString = JSON.stringify({ ...claim, signature: undefined });
      const recoveredAddress = ethers.verifyMessage(claimString, claim.signature);
      return recoveredAddress.toLowerCase() === claim.issuer.toLowerCase();
    } catch {
      return false;
    }
  }

  // Get complete user identity
  async getUserIdentity(): Promise<UserDigitalIdentity> {
    const wallet = walletService.getConnectedWallet();
    if (!wallet) throw new Error('No wallet connected');

    const ownedContent = await this.getUserOwnedContent();
    const claims = this.getIdentityClaims();
    const socialGraph = this.getSocialGraph();
    
    // Calculate reputation score (simplified)
    const reputationScore = ownedContent.length * 10 + claims.length * 5 + socialGraph.length * 2;

    return {
      walletAddress: wallet.address,
      claims,
      ownedContent,
      socialGraph,
      reputationScore,
      dataVault: this.getDataVault(),
      lastUpdated: Date.now()
    };
  }

  // Local storage helpers
  private storeOwnershipProof(proof: OwnershipProof) {
    const proofs = this.getStoredProofs();
    proofs.push(proof);
    localStorage.setItem('ownershipProofs', JSON.stringify(proofs));
  }

  private getStoredProofs(): OwnershipProof[] {
    const stored = localStorage.getItem('ownershipProofs');
    return stored ? JSON.parse(stored) : [];
  }

  private storeIdentityClaim(claim: IdentityClaim) {
    const claims = this.getIdentityClaims();
    claims.push(claim);
    localStorage.setItem('identityClaims', JSON.stringify(claims));
  }

  private getIdentityClaims(): IdentityClaim[] {
    const stored = localStorage.getItem('identityClaims');
    return stored ? JSON.parse(stored) : [];
  }

  private getDataVault(): string {
    return localStorage.getItem('dataVault') || '';
  }

  // Social graph storage helpers
  private getSocialGraph(): SocialGraphConnection[] {
    const stored = localStorage.getItem('socialGraph');
    return stored ? JSON.parse(stored) : [];
  }

  private storeSocialGraph(graph: SocialGraphConnection[]) {
    localStorage.setItem('socialGraph', JSON.stringify(graph));
  }

  // Add a follower or following connection
  addSocialConnection(connection: SocialGraphConnection) {
    const graph = this.getSocialGraph();
    // Only add if not already exists
    if (!graph.some(c => c.address === connection.address && c.type === connection.type)) {
      graph.push(connection);
      this.storeSocialGraph(graph);
    }
  }

  // Export all user data for portability
  async exportAllUserData(): Promise<Blob> {
    const identity = await this.getUserIdentity();
    const dataStr = JSON.stringify(identity, null, 2);
    return new Blob([dataStr], { type: 'application/json' });
  }

  // Import identity data from another platform (cross-platform portability)
  async importIdentityData(identityData: string): Promise<UserDigitalIdentity> {
    const wallet = walletService.getConnectedWallet();
    if (!wallet) throw new Error('No wallet connected');

    try {
      // Parse the imported identity data
      const importedIdentity: UserDigitalIdentity = JSON.parse(identityData);
      
      // Validate the imported data structure
      if (!importedIdentity.claims || !Array.isArray(importedIdentity.claims)) {
        throw new Error('Invalid identity format: claims must be an array');
      }
      if (!importedIdentity.ownedContent || !Array.isArray(importedIdentity.ownedContent)) {
        throw new Error('Invalid identity format: ownedContent must be an array');
      }
      if (!importedIdentity.socialGraph || !Array.isArray(importedIdentity.socialGraph)) {
        // Backward compatibility: if socialGraph doesn't exist, initialize as empty
        importedIdentity.socialGraph = [];
      }

      // Verify all identity claims are cryptographically valid
      const verifiedClaims = importedIdentity.claims.filter(claim => this.verifyIdentityClaim(claim));
      
      // Merge with existing local storage
      const existingClaims = this.getIdentityClaims();
      const existingProofs = this.getStoredProofs();
      const existingSocialGraph = this.getSocialGraph();
      
      // Add new claims that don't already exist
      const newClaims = verifiedClaims.filter(
        newClaim => !existingClaims.some(existing => existing.id === newClaim.id)
      );
      const allClaims = [...existingClaims, ...newClaims];
      
      // Add new content ownership proofs that don't already exist
      const newProofs = importedIdentity.ownedContent.filter(
        newProof => !existingProofs.some(existing => existing.tokenId === newProof.tokenId)
      );
      const allProofs = [...existingProofs, ...newProofs];
      
      // Add new social graph connections that don't already exist (merge social graph)
      const newConnections = importedIdentity.socialGraph.filter(
        newConn => !existingSocialGraph.some(existing => existing.address === newConn.address && existing.type === newConn.type)
      );
      const allSocialGraph = [...existingSocialGraph, ...newConnections];
      
      // Save merged data to local storage
      localStorage.setItem('identityClaims', JSON.stringify(allClaims));
      localStorage.setItem('ownershipProofs', JSON.stringify(allProofs));
      this.storeSocialGraph(allSocialGraph);
      
      // Upload all imported data to IPFS to create a new data vault
      const vaultData = {
        walletAddress: wallet.address,
        claims: allClaims,
        ownedContent: allProofs,
        socialGraph: allSocialGraph,
        importedFrom: importedIdentity.walletAddress,
        importTimestamp: Date.now()
      };
      
      const ipfsHash = await this.uploadToIPFS(vaultData);
      localStorage.setItem('dataVault', ipfsHash);
      
      // Return the merged identity with full social graph, data, and assets
      return {
        walletAddress: wallet.address,
        claims: allClaims,
        ownedContent: allProofs,
        socialGraph: allSocialGraph,
        reputationScore: allProofs.length * 10 + allClaims.length * 5 + allSocialGraph.length * 2,
        dataVault: ipfsHash,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Failed to import identity:', error);
      throw error;
    }
  }

  // Verify imported identity from any compatible platform
  async verifyImportedIdentity(identityData: string): Promise<{valid: boolean; stats: any}> {
    try {
      const importedIdentity: UserDigitalIdentity = JSON.parse(identityData);
      
      // Verify claims
      const verifiedClaims = importedIdentity.claims.filter(claim => this.verifyIdentityClaim(claim));
      
      // Count social graph connections
      const socialConnections = importedIdentity.socialGraph?.length || 0;
      const followers = importedIdentity.socialGraph?.filter(c => c.type === 'follower').length || 0;
      const following = importedIdentity.socialGraph?.filter(c => c.type === 'following').length || 0;
      
      return {
        valid: true,
        stats: {
          totalClaims: importedIdentity.claims.length,
          verifiedClaims: verifiedClaims.length,
          totalContent: importedIdentity.ownedContent.length,
          socialConnections,
          followers,
          following,
          sourceAddress: importedIdentity.walletAddress
        }
      };
    } catch (error) {
      console.error('Failed to verify identity:', error);
      return {
        valid: false,
        stats: null
      };
    }
  }
}

export const contentOwnershipService = new ContentOwnershipService();