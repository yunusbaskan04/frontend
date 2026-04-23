import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { defineChain } from 'viem';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Garantör',
  projectId: 'f726715456f966b4476059d22c9c2275', // WalletConnect Cloud Project ID (Example)
  chains: [monadTestnet],
  ssr: true,
  transports: {
    [monadTestnet.id]: http(),
  },
});
