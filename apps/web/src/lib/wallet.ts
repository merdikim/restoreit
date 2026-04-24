import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';

export const walletConfig = getDefaultConfig({
  appName: 'RestoreIt',
  projectId: 'YOUR_PROJECT_ID',
  chains: [base, baseSepolia],
  ssr: true,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
