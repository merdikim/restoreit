import { useEffect, useRef, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link, createFileRoute } from '@tanstack/react-router';
import { formatUnits, parseAbi, parseUnits } from 'viem';
import { useAccount, useChainId, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import { SectionCard } from '@/components/layout/section-card';
import { useBillingSummary, useConfirmCheckoutSession, useCreateCheckoutSession } from '@/hooks/use-billing';
import type { BillingProvider, CheckoutSession } from '@/types';

const usdcAbi = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]);

export const Route = createFileRoute('/_protected/settings')({
  validateSearch: (search: Record<string, unknown>) => ({
    checkout: typeof search.checkout === 'string' ? search.checkout : undefined,
    session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
    provider: typeof search.provider === 'string' ? search.provider : undefined,
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const search = Route.useSearch();
  const billingQuery = useBillingSummary();
  const createCheckoutSession = useCreateCheckoutSession();
  const confirmCheckoutSession = useConfirmCheckoutSession();
  const confirmedSessionId = useRef<string | null>(null);
  const confirmedCryptoHash = useRef<string | null>(null);
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { data: walletTxHash, writeContractAsync, isPending: isSubmittingWalletTx, reset: resetWriteContract } =
    useWriteContract();
  const [cryptoSession, setCryptoSession] = useState<CheckoutSession | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  console.log(cryptoSession?.chainId)
  const usdcBalance = useReadContract({
    chainId: cryptoSession?.chainId,
    address: cryptoSession?.tokenAddress as `0x${string}` | undefined,
    abi: usdcAbi,
    functionName: 'balanceOf',
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: Boolean(cryptoSession?.chainId && cryptoSession?.tokenAddress && connectedAddress),
    },
  });
  const walletReceipt = useWaitForTransactionReceipt({
    chainId: cryptoSession?.chainId,
    hash: walletTxHash,
    confirmations: 1,
    query: {
      enabled: Boolean(cryptoSession?.chainId && walletTxHash),
    },
  });

  useEffect(() => {
    if (search.checkout !== 'success' || !search.session_id || search.provider === 'crypto') {
      return;
    }

    if (confirmedSessionId.current === search.session_id || confirmCheckoutSession.isPending) {
      return;
    }

    confirmedSessionId.current = search.session_id;
    confirmCheckoutSession.mutate({
      sessionId: search.session_id,
    });
  }, [confirmCheckoutSession, search.checkout, search.session_id]);

  useEffect(() => {
    if (!cryptoSession || !walletTxHash || !walletReceipt.isSuccess || confirmCheckoutSession.isPending) {
      return;
    }

    if (confirmedCryptoHash.current === walletTxHash) {
      return;
    }

    confirmedCryptoHash.current = walletTxHash;
    confirmCheckoutSession.mutate(
      {
        sessionId: cryptoSession.sessionId,
        transactionHash: walletTxHash,
      },
      {
        onSuccess: () => {
          setCryptoSession(null);
          confirmedCryptoHash.current = null;
          resetWriteContract();
        },
        onError: () => {
          confirmedCryptoHash.current = null;
        },
      },
    );
  }, [
    confirmCheckoutSession,
    cryptoSession,
    resetWriteContract,
    walletReceipt.isSuccess,
    walletTxHash,
  ]);

  const supportedProviders = billingQuery.data?.supportedProviders ?? [];
  const supportsStripe = supportedProviders.includes('stripe');
  const supportsCrypto = supportedProviders.includes('crypto');
  const paymentProviderLabel = search.provider === 'crypto' ? 'USDC on Base' : 'Stripe';
  const activeErrorMessage =
    confirmCheckoutSession.error?.message ??
    createCheckoutSession.error?.message ??
    usdcBalance.error?.message ??
    walletReceipt.error?.message ??
    billingQuery.error?.message;
  const requiredUsdcAmount = cryptoSession?.amountDisplay ? parseUnits(cryptoSession.amountDisplay, 6) : null;
  const usdcBalanceValue = typeof usdcBalance.data === 'bigint' ? usdcBalance.data : null;
  const formattedUsdcBalance = usdcBalanceValue !== null ? Number(formatUnits(usdcBalanceValue, 6)).toFixed(2) : null;
  const hasInsufficientUsdc = requiredUsdcAmount !== null && usdcBalanceValue !== null && usdcBalanceValue < requiredUsdcAmount;

  const statusMessage =
    search.checkout === 'cancelled'
      ? `${paymentProviderLabel} checkout was cancelled. Your token balance has not changed.`
      : confirmCheckoutSession.isSuccess && confirmCheckoutSession.data.provider === 'crypto'
        ? `${confirmCheckoutSession.data.tokensAdded} tokens were added after your USDC payment was verified on Base.`
      : search.checkout === 'success' && confirmCheckoutSession.isSuccess
        ? `${confirmCheckoutSession.data.provider === 'crypto' ? 'USDC on Base payment' : 'Stripe payment'} confirmed. ${confirmCheckoutSession.data.tokensAdded} tokens were added to your balance.`
        : search.checkout === 'success' && confirmCheckoutSession.isPending
          ? 'Confirming your payment and updating your token balance...'
          : null;

  const errorMessage = cryptoSession ? billingQuery.error?.message : activeErrorMessage;
  const startCheckout = async (packageId: string, provider: BillingProvider) => {
    const session = await createCheckoutSession.mutateAsync({ packageId, provider });
    if (provider === 'crypto') {
      setCryptoSession(session);
      setCopyState('idle');
      confirmedCryptoHash.current = null;
      confirmCheckoutSession.reset();
      resetWriteContract();
      return;
    }

    if (!session.checkoutUrl) {
      throw new Error('Stripe checkout did not return a checkout URL.');
    }

    window.location.href = session.checkoutUrl;
  };

  const submitCryptoTransaction = async () => {
    if (!cryptoSession) {
      return;
    }

    if (!isConnected) {
      throw new Error('Connect a wallet before sending USDC.');
    }

    if (!cryptoSession.paymentAddress || !cryptoSession.tokenAddress || !cryptoSession.amountDisplay || !cryptoSession.chainId) {
      throw new Error('Crypto payment session is missing required transaction details.');
    }

    if (chainId !== cryptoSession.chainId) {
      await switchChainAsync({ chainId: cryptoSession.chainId });
    }

    await writeContractAsync({
      chainId: cryptoSession.chainId,
      address: cryptoSession.tokenAddress as `0x${string}`,
      abi: usdcAbi,
      functionName: 'transfer',
      args: [
        cryptoSession.paymentAddress as `0x${string}`,
        parseUnits(cryptoSession.amountDisplay, 6),
      ],
    });
  };

  const copyPaymentAddress = async () => {
    if (!cryptoSession?.paymentAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(cryptoSession.paymentAddress);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard>
        <p className="text-sm uppercase tracking-[0.2em] text-(--brand)">Billing & Tokens</p>
        <h1 className="mt-3 text-3xl font-semibold">Buy restoration tokens</h1>
        <p className="mt-3 max-w-2xl text-(--muted)">
          Each restoration currently costs {billingQuery.data?.jobTokenCost ?? 1} token. Buy a pack below with card via
          Stripe or with USDC on Base. Crypto purchases open a wallet-powered popup that submits the USDC transfer
          directly, then waits for the chain receipt before crediting your balance.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <BalanceCard
            label="Available tokens"
            value={String(billingQuery.data?.tokenBalance ?? 0)}
            helper="Ready to spend on restorations"
          />
          <BalanceCard
            label="Cost per restoration"
            value={`${billingQuery.data?.jobTokenCost ?? 1}`}
            helper="Charged when a job starts"
          />
          <BalanceCard
            label="Need more?"
            value="Top up"
            helper="Choose card or USDC on Base"
          />
        </div>
      </SectionCard>

      {statusMessage ? <p className="text-sm text-(--brand-dark)">{statusMessage}</p> : null}
      {errorMessage ? <p className="text-sm text-(--danger)">{errorMessage}</p> : null}

      <div className="grid gap-5 md:grid-cols-3">
        {billingQuery.data?.packages.map((entry) => (
          <SectionCard key={entry.id} className="bg-white/60">
            <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">{entry.name}</p>
            <p className="mt-3 text-4xl font-semibold">${(entry.amountUsdCents / 100).toFixed(0)}</p>
            <p className="mt-2 text-sm text-(--muted)">{entry.description}</p>
            <div className="mt-6 space-y-3">
              <ProviderButton
                provider="stripe"
                label="Pay with card"
                isAvailable={supportsStripe}
                isBusy={createCheckoutSession.isPending || confirmCheckoutSession.isPending}
                onPurchase={(provider) => startCheckout(entry.id, provider)}
              />
              <ProviderButton
                provider="crypto"
                label="Pay with USDC on Base"
                isAvailable={supportsCrypto}
                isBusy={createCheckoutSession.isPending || confirmCheckoutSession.isPending}
                onPurchase={(provider) => startCheckout(entry.id, provider)}
              />
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard>
        <p className="text-lg font-semibold">Payment Rails</p>
        <p className="mt-2 text-(--muted)">
          Stripe handles card payments, and USDC payments on Base are now verified directly against the blockchain after
          the customer submits a transaction hash.
        </p>
        <Link to="/jobs/new" className="mt-5 inline-flex rounded-full border border-(--line) px-5 py-3 text-sm">
          Start a restoration
        </Link>
      </SectionCard>

      {cryptoSession ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
          <div className="w-full max-w-lg rounded-[28px] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-(--brand)">USDC on Base</p>
                <h2 className="mt-2 text-2xl font-semibold">Send USDC from your wallet</h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-(--line) px-4 py-2 text-sm"
                disabled={confirmCheckoutSession.isPending}
                onClick={() => {
                  setCryptoSession(null);
                  confirmedCryptoHash.current = null;
                  confirmCheckoutSession.reset();
                  resetWriteContract();
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Package</p>
              <p className="mt-2 text-lg font-semibold">{cryptoSession.packageName}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-(--muted)">Amount</p>
              <p className="mt-2 text-lg font-semibold">
                {cryptoSession.amountDisplay} {cryptoSession.currencyCode}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-(--muted)">Destination address</p>
              <p className="mt-2 break-all rounded-2xl border border-(--line) bg-white px-4 py-3 font-mono text-sm">
                {cryptoSession.paymentAddress}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" className="rounded-full border border-(--line) px-4 py-2 text-sm" onClick={copyPaymentAddress}>
                  {copyState === 'copied' ? 'Address copied' : copyState === 'failed' ? 'Copy failed' : 'Copy address'}
                </button>
                <span className="rounded-full border border-(--line) px-4 py-2 text-sm text-(--muted)">
                  Network: {cryptoSession.network}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-(--line) bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Wallet</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <ConnectButton />
                {connectedAddress ? (
                  <span className="rounded-full border border-(--line) px-4 py-2 font-mono text-xs text-(--muted)">
                    {connectedAddress}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 rounded-2xl border border-(--line) bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">USDC balance</p>
                <p className="mt-2 text-lg font-semibold">
                  {isConnected
                    ? usdcBalance.isPending
                      ? 'Loading...'
                      : formattedUsdcBalance !== null
                        ? `${formattedUsdcBalance} USDC`
                        : 'Unavailable'
                    : 'Connect wallet'}
                </p>
                {hasInsufficientUsdc ? (
                  <p className="mt-2 text-sm text-(--danger)">
                    This wallet has less than the required {cryptoSession.amountDisplay} USDC for this purchase.
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-(--muted)">
                The payment is sent from the connected wallet using the Base USDC contract, and the backend verifies the
                resulting transaction before tokens are added.
              </p>
            </div>

            {activeErrorMessage ? <p className="mt-4 text-sm text-(--danger)">{activeErrorMessage}</p> : null}
            {walletTxHash ? (
              <p className="mt-4 rounded-2xl border border-(--line) bg-white/70 px-4 py-3 font-mono text-xs text-(--muted)">
                Transaction: {walletTxHash}
              </p>
            ) : null}
            {walletReceipt.isLoading ? <p className="mt-4 text-sm text-(--brand-dark)">Waiting for the Base transaction to confirm...</p> : null}
            {confirmCheckoutSession.isPending ? <p className="mt-4 text-sm text-(--brand-dark)">Verifying the USDC transfer and crediting tokens...</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-(--brand) px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  !isConnected ||
                  hasInsufficientUsdc ||
                  isSwitchingChain ||
                  isSubmittingWalletTx ||
                  walletReceipt.isLoading ||
                  confirmCheckoutSession.isPending
                }
                onClick={() => void submitCryptoTransaction()}
              >
                {isSwitchingChain
                  ? 'Switching to Base...'
                  : isSubmittingWalletTx
                    ? 'Confirm in wallet...'
                    : walletReceipt.isLoading
                      ? 'Waiting for confirmation...'
                      : confirmCheckoutSession.isPending
                        ? 'Verifying payment...'
                        : 'Send USDC from wallet'}
              </button>
              <button
                type="button"
                className="rounded-full border border-(--line) px-5 py-3 text-sm"
                disabled={confirmCheckoutSession.isPending || walletReceipt.isLoading}
                onClick={() => {
                  setCryptoSession(null);
                  confirmedCryptoHash.current = null;
                  confirmCheckoutSession.reset();
                  resetWriteContract();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BalanceCard(props: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">{props.label}</p>
      <p className="mt-2 text-3xl font-semibold">{props.value}</p>
      <p className="mt-2 text-sm text-(--muted)">{props.helper}</p>
    </div>
  );
}

function ProviderButton(props: {
  provider: BillingProvider;
  label: string;
  isAvailable: boolean;
  isBusy: boolean;
  onPurchase: (provider: BillingProvider) => Promise<void>;
}) {
  const helper =
    props.provider === 'crypto'
      ? 'Direct wallet transfer plus tx-hash verification'
      : 'Hosted Stripe Checkout';

  return (
    <button
      type="button"
      className="w-full rounded-full border border-(--line) bg-white px-5 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!props.isAvailable || props.isBusy}
      onClick={() => props.onPurchase(props.provider)}
    >
      <span className="block font-semibold">{props.isBusy ? 'Opening checkout...' : props.label}</span>
      <span className="mt-1 block text-(--muted)">
        {props.isAvailable ? helper : `${props.provider === 'crypto' ? 'Crypto' : 'Stripe'} is not configured yet`}
      </span>
    </button>
  );
}
