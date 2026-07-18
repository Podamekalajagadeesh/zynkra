import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, sepolia } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not configured.');
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
