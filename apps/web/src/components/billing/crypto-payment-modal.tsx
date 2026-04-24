import { useEffect, useRef, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useQuery } from '@tanstack/react-query';
import { createPublicClient, formatUnits, http, parseAbi, parseUnits } from 'viem';
import { useAccount, useChainId, useSwitchChain, useWriteContract } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

import type { CheckoutSession } from '@/types';

const usdcAbi = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]);

export function CryptoPaymentModal(props: {
  session: CheckoutSession;
  isConfirmingPayment: boolean;
  confirmErrorMessage?: string;
  onConfirmPayment: (args: { sessionId: string; transactionHash: string }) => void;
  onResetConfirmation: () => void;
  onClose: () => void;
}) {
  const confirmedCryptoHash = useRef<string | null>(null);
  const { address: connectedAddress, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const chainId = useChainId();
  const [observedChainId, setObservedChainId] = useState<number | undefined>(chainId);
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { data: walletTxHash, writeContractAsync, isPending: isSubmittingWalletTx, reset: resetWriteContract } =
    useWriteContract();

  const usdcBalance = useQuery({
    queryKey: ['usdc-balance', props.session.rpcUrl, props.session.chainId, props.session.tokenAddress, connectedAddress],
    enabled: Boolean(props.session.rpcUrl && props.session.chainId && props.session.tokenAddress && connectedAddress),
    queryFn: async () => {
      if(!connectedAddress) return null
      if (!props.session.rpcUrl || !props.session.chainId || !props.session.tokenAddress) {
        throw new Error('Missing USDC balance configuration.');
      }

      const client = createPaymentPublicClient(props.session.chainId, props.session.rpcUrl);
      return client.readContract({
        address: props.session.tokenAddress as `0x${string}`,
        abi: usdcAbi,
        functionName: 'balanceOf',
        args: [connectedAddress],
      });
    },
    refetchInterval: 10_000,
  });

  const walletReceipt = useQuery({
    queryKey: ['wallet-receipt', props.session.rpcUrl, props.session.chainId, walletTxHash],
    enabled: Boolean(props.session.rpcUrl && props.session.chainId && walletTxHash),
    queryFn: async () => {
      if (!props.session.rpcUrl || !props.session.chainId || !walletTxHash) {
        throw new Error('Missing transaction receipt configuration.');
      }

      const client = createPaymentPublicClient(props.session.chainId, props.session.rpcUrl);
      return client.waitForTransactionReceipt({
        hash: walletTxHash,
        confirmations: 1,
      });
    },
  });
  const isWaitingForConfirmation = Boolean(walletTxHash) && walletReceipt.isPending;

  useEffect(() => {
    props.onResetConfirmation();
    confirmedCryptoHash.current = null;
    resetWriteContract();
    void usdcBalance.refetch();
  }, [props.session.sessionId]);

  useEffect(() => {
    if (!walletTxHash || !walletReceipt.isSuccess || props.isConfirmingPayment) {
      return;
    }

    if (confirmedCryptoHash.current === walletTxHash) {
      return;
    }

    confirmedCryptoHash.current = walletTxHash;
    props.onConfirmPayment({
      sessionId: props.session.sessionId,
      transactionHash: walletTxHash,
    });
  }, [props, walletReceipt.isSuccess, walletTxHash]);

  const activeErrorMessage =
    props.confirmErrorMessage ??
    usdcBalance.error?.message ??
    walletReceipt.error?.message;

  const requiredUsdcAmount = props.session.amountDisplay ? parseUnits(props.session.amountDisplay, 6) : null;
  const usdcBalanceValue = typeof usdcBalance.data === 'bigint' ? usdcBalance.data : null;
  const formattedUsdcBalance = usdcBalanceValue !== null ? Number(formatUnits(usdcBalanceValue, 6)).toFixed(2) : null;
  const hasInsufficientUsdc =
    requiredUsdcAmount !== null && usdcBalanceValue !== null && usdcBalanceValue < requiredUsdcAmount;
  const isWrongNetwork = Boolean(
    isConnected &&
    props.session.chainId &&
    observedChainId !== props.session.chainId,
  );

  useEffect(() => {
    setObservedChainId(chainId);
  }, [chainId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    type EthereumProvider = {
      on?: (event: 'chainChanged', listener: (value: string) => void) => void;
      removeListener?: (event: 'chainChanged', listener: (value: string) => void) => void;
    };

    const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!ethereum?.on) {
      return;
    }

    const handleChainChanged = (value: string) => {
      const nextChainId = Number.parseInt(value, 16);
      if (Number.isFinite(nextChainId)) {
        setObservedChainId(nextChainId);
      }
    };

    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  const submitCryptoTransaction = async () => {
    if (!isConnected) {
      throw new Error('Connect a wallet before sending USDC.');
    }

    if (!props.session.paymentAddress || !props.session.tokenAddress || !props.session.amountDisplay || !props.session.chainId) {
      throw new Error('Crypto payment session is missing required transaction details.');
    }

    if (observedChainId !== props.session.chainId) {
      await switchChainAsync({ chainId: props.session.chainId });
    }

    const txHash = await writeContractAsync({
      chainId: props.session.chainId,
      address: props.session.tokenAddress as `0x${string}`,
      abi: usdcAbi,
      functionName: 'transfer',
      args: [
        props.session.paymentAddress as `0x${string}`,
        parseUnits(props.session.amountDisplay, 6),
      ],
    });
  };

  const handlePrimaryAction = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (isWrongNetwork && props.session.chainId) {
      await switchChainAsync({ chainId: props.session.chainId });
      return;
    }

    await submitCryptoTransaction();
  };


  const primaryButtonLabel = !isConnected
    ? 'Connect wallet'
    : isSwitchingChain
      ? `Switching to ${props.session.network ?? 'network'}...`
      : isSubmittingWalletTx
        ? 'Confirm in wallet...'
        : isWaitingForConfirmation
          ? 'Waiting for confirmation...'
          : props.isConfirmingPayment
            ? 'Verifying payment...'
            : isWrongNetwork
              ? `Switch to ${props.session.network ?? 'network'}`
              : 'Send USDC';

  const isPrimaryButtonDisabled = isSwitchingChain
    || isSubmittingWalletTx
    || isWaitingForConfirmation
    || props.isConfirmingPayment
    || (isConnected && !isWrongNetwork && hasInsufficientUsdc);

  const closeModal = () => {
    confirmedCryptoHash.current = null;
    props.onResetConfirmation();
    resetWriteContract();
    props.onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
      <div className="w-full max-w-2xl rounded-[28px] bg-(--surface) p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-(--brand)">USDC on Base</p>
            <h2 className="mt-2 text-2xl font-semibold">Send USDC from your wallet</h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-(--line) px-4 py-2 text-sm"
            disabled={props.isConfirmingPayment || isWaitingForConfirmation}
            onClick={closeModal}
          >
            Close
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Package</p>
          <p className="mt-2 text-lg font-semibold">{props.session.packageName}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-(--muted)">Amount</p>
          <p className="mt-2 text-lg font-semibold">
            {props.session.amountDisplay} {props.session.currencyCode}
          </p>
        </div>

        <p className="mt-2 text-lg font-semibold">
              {isConnected
                ? usdcBalance.isPending
                  ? 'Loading...'
                  : formattedUsdcBalance !== null
                    ? `You have ${formattedUsdcBalance} USDC on Base`
                    : 'Unavailable'
                : 'Connect wallet'}
          </p>

        <p className="mt-3 text-sm text-(--muted)">
            The payment is sent from the connected wallet to RestoreIt wallet address using USDC on Base
          </p>

        {activeErrorMessage ? <p className="mt-4 text-sm text-(--danger)">{activeErrorMessage}</p> : null}
        {walletTxHash ? (
          <p className="mt-4 rounded-2xl border border-(--line) bg-white/70 px-4 py-3 font-mono text-xs text-(--muted)">
            Transaction: {walletTxHash}
          </p>
        ) : null}
        {isWaitingForConfirmation ? <p className="mt-4 text-sm text-(--brand-dark)">Waiting for the Base transaction to confirm...</p> : null}
        {props.isConfirmingPayment ? <p className="mt-4 text-sm text-(--brand-dark)">Verifying the USDC transfer and crediting tokens...</p> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-(--brand) w-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPrimaryButtonDisabled}
            onClick={() => void handlePrimaryAction()}
          >
            {primaryButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function createPaymentPublicClient(chainId: number, rpcUrl: string) {
  return createPublicClient({
    chain: chainId === baseSepolia.id ? baseSepolia : base,
    transport: http(rpcUrl),
  });
}
