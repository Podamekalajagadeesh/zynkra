import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, sepolia } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'dev-placeholder';

if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
  console.warn(
    '[Zynkra] VITE_WALLETCONNECT_PROJECT_ID is not configured. WalletConnect features will be unavailable until a valid project ID is added to client/.env.local.'
  );
}

const metadata = {
  name: 'Zynkra',
  description: 'Zynkra - The future of social media',
  url: 'https://zynkra.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const chains = [mainnet, sepolia] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});
