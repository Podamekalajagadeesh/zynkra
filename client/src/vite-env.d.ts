/// <reference types="vite/client" />
import { Eip1193Provider } from 'ethers';

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}
interface Window {
  ethereum?: Eip1193Provider;
}