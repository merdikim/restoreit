import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';

import { env } from './env';

const preferredChain = env.baseChainId === baseSepolia.id ? baseSepolia : base;
const transports = {
  [base.id]: http(env.baseChainId === base.id ? env.baseRpcUrl : 'https://mainnet.base.org'),
  [baseSepolia.id]: http(env.baseChainId === baseSepolia.id ? env.baseRpcUrl : 'https://sepolia.base.org'),
};

export const walletConfig = getDefaultConfig({
  appName: 'RestoreIt',
  projectId: 'YOUR_PROJECT_ID',
  chains: preferredChain.id === base.id ? [base, baseSepolia] : [baseSepolia, base],
  ssr: true,
  transports,
});
