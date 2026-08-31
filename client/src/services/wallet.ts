
import { ethers, Eip1193Provider } from 'ethers';
import { SiweMessage } from 'siwe';
import axios from 'axios';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export interface WalletInfo {
  address: string;
  chainId: number;
  providerType: 'metamask' | 'walletconnect';
}

class WalletService {
  private wcProvider: InstanceType<typeof EthereumProvider> | null = null;
  private connectedWallets: Map<string, WalletInfo> = new Map();
  private activeWalletAddress: string | null = null;

  constructor() {
    this.loadState();
  }

  private saveState(): void {
    localStorage.setItem('connectedWallets', JSON.stringify(Array.from(this.connectedWallets.entries())));
    localStorage.setItem('activeWalletAddress', this.activeWalletAddress || '');
  }

  private loadState(): void {
    const storedWallets = localStorage.getItem('connectedWallets');
    if (storedWallets) {
      this.connectedWallets = new Map(JSON.parse(storedWallets));
    }
    this.activeWalletAddress = localStorage.getItem('activeWalletAddress') ?? null;
    if (this.activeWalletAddress === '') {
      this.activeWalletAddress = null;
    }
  }

  public isProviderAvailable(providerType: 'metamask' | 'walletconnect'): boolean {
    if (providerType === 'metamask') {
      return typeof window.ethereum !== 'undefined';
    }
    return true;
  }

  public async connectWallet(providerType: 'metamask' | 'walletconnect'): Promise<{ walletInfo: WalletInfo; accessToken: string }> {
    if (providerType === 'metamask') {
      return this.connectMetaMask();
    } else if (providerType === 'walletconnect') {
      return this.connectWalletConnect();
    }
    throw new Error('Unsupported wallet provider');
  }

  private async connectMetaMask(): Promise<{ walletInfo: WalletInfo; accessToken: string }> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const chainId = (await provider.getNetwork()).chainId;

      const nonce = await this.fetchNonce();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId: Number(chainId),
        nonce,
      });

      const signature = await signer.signMessage(message.prepareMessage());

      const response = await axios.post('http://localhost:3000/siwe/verify', {
        message: message.prepareMessage(),
        signature,
      });

      const newWalletInfo: WalletInfo = { address, chainId: Number(chainId), providerType: 'metamask' };
      this.connectedWallets.set(address, newWalletInfo);
      this.activeWalletAddress = address;
      this.saveState();
      return { walletInfo: newWalletInfo, accessToken: response.data.access_token };
    } catch (error) {
      console.error('Failed to connect to MetaMask:', error);
      throw error;
    }
  }

  private async connectWalletConnect(): Promise<{ walletInfo: WalletInfo; accessToken: string }> {
    try {
      const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
      const isPlaceholder = !projectId || projectId === 'dev-placeholder' || projectId === 'your-walletconnect-project-id';
      if (isPlaceholder) {
        throw new Error(
          'WalletConnect is not configured. Add a valid VITE_WALLETCONNECT_PROJECT_ID to client/.env.local (see client/.env.example).'
        );
      }

      this.wcProvider = await EthereumProvider.init({
        projectId,
        chains: [1],
        showQrModal: true,
      });

      await this.wcProvider.connect();

      const web3Provider = new ethers.BrowserProvider(this.wcProvider);
      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();
      const network = await web3Provider.getNetwork();
      const chainId = network.chainId;

      const nonce = await this.fetchNonce();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId: Number(chainId),
        nonce,
      });

      const signature = await signer.signMessage(message.prepareMessage());

      const response = await axios.post('http://localhost:3000/siwe/verify', {
        message: message.prepareMessage(),
        signature,
      });

      const newWalletInfo: WalletInfo = { address, chainId: Number(chainId), providerType: 'walletconnect' };
      this.connectedWallets.set(address, newWalletInfo);
      this.activeWalletAddress = address;
      this.saveState();
      return { walletInfo: newWalletInfo, accessToken: response.data.access_token };
    } catch (error) {
      console.error('Failed to connect to WalletConnect:', error);
      throw error;
    }
  }

  public async disconnectWallet(): Promise<void> {
    if (this.activeWalletAddress) {
      const walletInfo = this.connectedWallets.get(this.activeWalletAddress);
      if (walletInfo?.providerType === 'walletconnect' && this.wcProvider?.disconnect) {
        await this.wcProvider.disconnect();
      }
      this.connectedWallets.delete(this.activeWalletAddress);
      this.activeWalletAddress = null;
      this.saveState();
    }
  }

  private async fetchNonce(): Promise<string> {
    const response = await axios.get('http://localhost:3000/siwe/nonce');
    return response.data;
  }

  public getConnectedWallet(): WalletInfo | null {
    if (this.activeWalletAddress) {
      return this.connectedWallets.get(this.activeWalletAddress) || null;
    }
    return null;
  }
}

export const walletService = new WalletService();