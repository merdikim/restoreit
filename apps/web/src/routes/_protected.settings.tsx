import { useEffect, useRef, useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';

import { CryptoPaymentModal } from '@/components/billing/crypto-payment-modal';
import { SectionCard } from '@/components/layout/section-card';
import { useBillingSummary, useConfirmCheckoutSession, useCreateCheckoutSession } from '@/hooks/use-billing';
import type { BillingProvider, CheckoutSession } from '@/types';

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
  const [cryptoSession, setCryptoSession] = useState<CheckoutSession | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<{
    packageId: string;
    provider: BillingProvider;
  } | null>(null);

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

  const supportedProviders = billingQuery.data?.supportedProviders ?? [];
  const supportsStripe = supportedProviders.includes('stripe');
  const supportsCrypto = supportedProviders.includes('crypto');
  const paymentProviderLabel = search.provider === 'crypto' ? 'USDC on Base' : 'Stripe';
  const activeErrorMessage =
    confirmCheckoutSession.error?.message ??
    createCheckoutSession.error?.message ??
    billingQuery.error?.message;

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
    setPendingCheckout({ packageId, provider });

    try {
      const session = await createCheckoutSession.mutateAsync({ packageId, provider });
      if (provider === 'crypto') {
        setCryptoSession(session);
        confirmCheckoutSession.reset();
        return;
      }

      if (!session.checkoutUrl) {
        throw new Error('Stripe checkout did not return a checkout URL.');
      }

      window.location.href = session.checkoutUrl;
    } finally {
      setPendingCheckout(null);
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
                isBusy={
                  createCheckoutSession.isPending &&
                  pendingCheckout?.packageId === entry.id &&
                  pendingCheckout.provider === 'stripe'
                }
                isDisabled={
                  !supportsStripe ||
                  createCheckoutSession.isPending ||
                  confirmCheckoutSession.isPending
                }
                onPurchase={(provider) => startCheckout(entry.id, provider)}
              />
              <ProviderButton
                provider="crypto"
                label="Pay with USDC on Base"
                isAvailable={supportsCrypto}
                isBusy={
                  createCheckoutSession.isPending &&
                  pendingCheckout?.packageId === entry.id &&
                  pendingCheckout.provider === 'crypto'
                }
                isDisabled={
                  !supportsCrypto ||
                  createCheckoutSession.isPending ||
                  confirmCheckoutSession.isPending
                }
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
        <CryptoPaymentModal
          session={cryptoSession}
          isConfirmingPayment={confirmCheckoutSession.isPending}
          confirmErrorMessage={activeErrorMessage}
          onConfirmPayment={({ sessionId, transactionHash }) => {
            confirmCheckoutSession.mutate(
              { sessionId, transactionHash },
              {
                onSuccess: () => {
                  setCryptoSession(null);
                },
              },
            );
          }}
          onResetConfirmation={() => {
            confirmCheckoutSession.reset();
          }}
          onClose={() => {
            setCryptoSession(null);
          }}
        />
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
  isDisabled: boolean;
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
      disabled={props.isDisabled}
      onClick={() => props.onPurchase(props.provider)}
    >
      <span className="block font-semibold">{props.isBusy ? 'Opening checkout...' : props.label}</span>
      <span className="mt-1 block text-(--muted)">
        {props.isAvailable ? helper : `${props.provider === 'crypto' ? 'Crypto' : 'Stripe'} is not configured yet`}
      </span>
    </button>
  );
}
