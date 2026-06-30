import { ethers } from 'ethers';
import { walletService, WalletInfo } from './wallet';
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

export interface UserDigitalIdentity {
  walletAddress: string;
  claims: IdentityClaim[];
  ownedContent: OwnershipProof[];
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
    
    if (!this.provider) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
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

    if (!this.provider) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
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
    
    // Calculate reputation score (simplified)
    const reputationScore = ownedContent.length * 10 + claims.length * 5;

    return {
      walletAddress: wallet.address,
      claims,
      ownedContent,
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

  // Export all user data for portability
  async exportAllUserData(): Promise<Blob> {
    const identity = await this.getUserIdentity();
    const dataStr = JSON.stringify(identity, null, 2);
    return new Blob([dataStr], { type: 'application/json' });
  }
}

export const contentOwnershipService = new ContentOwnershipService();