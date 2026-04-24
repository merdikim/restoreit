import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';

import { PrismaService } from '../prisma/prisma.service.js';
import { BILLING_PROVIDERS, DEFAULT_JOB_TOKEN_COST, type BillingProvider, TOKEN_PACKAGES, getTokenPackage } from './billing.constants.js';

@Injectable()
export class BillingService {
  private static readonly ERC20_TRANSFER_TOPIC =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  private readonly stripeProvider: BillingProvider = 'stripe';
  private readonly cryptoProvider: BillingProvider = 'crypto';
  private readonly stripe: Stripe;
  private readonly frontendUrl: string;
  private readonly jobTokenCost: number;
  private readonly stripeSecretKey?: string;
  private readonly usdcPaymentWalletAddress?: string;
  private readonly baseRpcUrl: string;
  private readonly baseChainId: number;
  private readonly baseNetworkName: string;
  private readonly baseUsdcTokenAddress: string;
  private readonly baseMinConfirmations: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY') ?? undefined;
    this.usdcPaymentWalletAddress = this.normalizeAddress(
      this.configService.get<string>('USDC_PAYMENT_WALLET_ADDRESS') ?? undefined,
    );
    this.baseRpcUrl = this.configService.get<string>('BASE_RPC_URL', 'https://mainnet.base.org').replace(/\/+$/, '');
    this.baseChainId = Number(this.configService.get<string>('BASE_CHAIN_ID', '8453'));
    this.baseNetworkName = this.configService.get<string>('BASE_NETWORK_NAME', 'Base') ?? 'Base';
    const configuredUsdcTokenAddress = this.normalizeAddress(
      this.configService.get<string>('BASE_USDC_TOKEN_ADDRESS', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
    );
    if (!configuredUsdcTokenAddress) {
      throw new Error('BASE_USDC_TOKEN_ADDRESS must be configured.');
    }
    this.baseUsdcTokenAddress = configuredUsdcTokenAddress;
    this.baseMinConfirmations = Number(this.configService.get<string>('BASE_PAYMENT_MIN_CONFIRMATIONS', '1'));
    this.stripe = new Stripe(this.stripeSecretKey ?? 'sk_test_placeholder');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000').replace(/\/+$/, '');
    this.jobTokenCost = Number(this.configService.get<string>('JOB_TOKEN_COST', String(DEFAULT_JOB_TOKEN_COST)));
  }

  async getSummary(userId: string) {
    const account = await this.getOrCreateAccount(userId);
    const supportedProviders = BILLING_PROVIDERS.filter((provider) => this.isProviderConfigured(provider));

    return {
      tokenBalance: account.tokenBalance,
      jobTokenCost: this.jobTokenCost,
      packages: TOKEN_PACKAGES,
      supportedProviders,
    };
  }

  async createCheckoutSession(userId: string, packageId: string, provider: BillingProvider) {
    const tokenPackage = getTokenPackage(packageId);
    if (!tokenPackage) {
      throw new BadRequestException('Unsupported token package.');
    }

    this.assertProviderConfigured(provider);

    if (provider === this.stripeProvider) {
      return this.createStripeCheckoutSession(userId, tokenPackage.id);
    }

    if (provider === this.cryptoProvider) {
      return this.createCryptoCheckoutSession(userId, tokenPackage.id);
    }

    throw new BadRequestException('Unsupported payment provider.');
  }

  private async createStripeCheckoutSession(userId: string, packageId: string) {
    const tokenPackage = getTokenPackage(packageId);
    if (!tokenPackage) {
      throw new BadRequestException('Unsupported token package.');
    }

    const account = await this.getOrCreateAccount(userId);
    const stripeProfile = await this.getPaymentProfile(account.id, this.stripeProvider);
    const successUrl = `${this.frontendUrl}/settings?checkout=success&provider=${this.stripeProvider}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.frontendUrl}/settings?checkout=cancelled&provider=${this.stripeProvider}`;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      customer: stripeProfile?.providerCustomerId,
      customer_creation: stripeProfile ? undefined : 'always',
      metadata: {
        userId,
        packageId: tokenPackage.id,
        tokenAmount: String(tokenPackage.tokenAmount),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tokenPackage.amountUsdCents,
            product_data: {
              name: tokenPackage.name,
              description: tokenPackage.description,
            },
          },
        },
      ],
    });

    await this.prisma.tokenPurchase.upsert({
      where: {
        providerSessionId: session.id,
      },
      update: {
        billingAccountId: account.id,
        provider: this.stripeProvider,
        packageId: tokenPackage.id,
        currencyCode: 'usd',
        amountMinor: tokenPackage.amountUsdCents,
        tokenAmount: tokenPackage.tokenAmount,
        metadata: {
          provider: this.stripeProvider,
          checkoutMode: 'payment',
        },
      },
      create: {
        billingAccountId: account.id,
        provider: this.stripeProvider,
        providerSessionId: session.id,
        packageId: tokenPackage.id,
        currencyCode: 'usd',
        amountMinor: tokenPackage.amountUsdCents,
        tokenAmount: tokenPackage.tokenAmount,
        metadata: {
          provider: this.stripeProvider,
          checkoutMode: 'payment',
        },
      },
    });

    if (!stripeProfile && typeof session.customer === 'string') {
      await this.prisma.billingPaymentProfile.create({
        data: {
          billingAccountId: account.id,
          provider: this.stripeProvider,
          providerCustomerId: session.customer,
        },
      });
    }

    if (!session.url) {
      throw new Error('Stripe checkout session returned no URL.');
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      provider: this.stripeProvider,
    };
  }

  async confirmCheckoutSession(userId: string, sessionId: string, transactionHash?: string) {
    const purchase = await this.prisma.tokenPurchase.findUnique({
      where: {
        providerSessionId: sessionId,
      },
      include: {
        billingAccount: true,
      },
    });

    if (!purchase || purchase.billingAccount.userId !== userId) {
      throw new NotFoundException('Purchase not found.');
    }

    if (purchase.provider === this.stripeProvider) {
      if (transactionHash) {
        throw new BadRequestException('Stripe confirmation does not accept a transaction hash.');
      }
      return this.confirmStripeCheckoutSession(userId, sessionId, purchase.tokenAmount);
    }

    if (purchase.provider === this.cryptoProvider) {
      return this.confirmCryptoCheckoutSession(userId, sessionId, purchase.tokenAmount, transactionHash);
    }

    throw new BadRequestException('Unsupported payment provider.');
  }

  private async confirmStripeCheckoutSession(userId: string, sessionId: string, fallbackTokenAmount: number) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.client_reference_id !== userId) {
      throw new NotFoundException('Checkout session not found.');
    }

    const purchase = await this.prisma.tokenPurchase.findUnique({
      where: {
        providerSessionId: session.id,
      },
      include: {
        billingAccount: true,
      },
    });

    if (!purchase || purchase.billingAccount.userId !== userId) {
      throw new NotFoundException('Purchase not found.');
    }

    if (purchase.status === 'completed') {
      const refreshed = await this.getOrCreateAccount(userId);
      return {
        status: purchase.status,
        tokenBalance: refreshed.tokenBalance,
        tokensAdded: purchase.tokenAmount ?? fallbackTokenAmount,
        provider: this.stripeProvider,
      };
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment has not completed yet.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const currentPurchase = await tx.tokenPurchase.findUnique({
        where: {
          providerSessionId: session.id,
        },
      });

      if (!currentPurchase) {
        throw new NotFoundException('Purchase not found.');
      }

      if (currentPurchase.status === 'completed') {
        const existingAccount = await tx.billingAccount.findUniqueOrThrow({
          where: { userId },
        });

        return {
          tokenBalance: existingAccount.tokenBalance,
          tokensAdded: currentPurchase.tokenAmount,
        };
      }

      const account = await tx.billingAccount.update({
        where: { userId },
        data: {
          tokenBalance: {
            increment: currentPurchase.tokenAmount,
          },
        },
      });

      if (typeof session.customer === 'string') {
        await tx.billingPaymentProfile.upsert({
          where: {
            billingAccountId_provider: {
              billingAccountId: account.id,
              provider: this.stripeProvider,
            },
          },
          update: {
            providerCustomerId: session.customer,
          },
          create: {
            billingAccountId: account.id,
            provider: this.stripeProvider,
            providerCustomerId: session.customer,
          },
        });
      }

      await tx.tokenPurchase.update({
        where: {
          providerSessionId: session.id,
        },
        data: {
          status: 'completed',
          completedAt: new Date(),
          providerPaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          metadata: {
            provider: this.stripeProvider,
            paymentStatus: session.payment_status,
          },
        },
      });

      return {
        tokenBalance: account.tokenBalance,
        tokensAdded: currentPurchase.tokenAmount ?? fallbackTokenAmount,
      };
    });

    return {
      status: 'completed',
      tokenBalance: result.tokenBalance,
      tokensAdded: result.tokensAdded,
      provider: this.stripeProvider,
    };
  }

  async consumeTokens(
    userId: string,
    amount = this.jobTokenCost,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    await this.getOrCreateAccount(userId, prisma);

    const result = await prisma.billingAccount.updateMany({
      where: {
        userId,
        tokenBalance: {
          gte: amount,
        },
      },
      data: {
        tokenBalance: {
          decrement: amount,
        },
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(`You need at least ${amount} token${amount === 1 ? '' : 's'} to start a restoration.`);
    }
  }

  private async getOrCreateAccount(
    userId: string,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    return prisma.billingAccount.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
      },
    });
  }

  private async getPaymentProfile(
    billingAccountId: string,
    provider: BillingProvider,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    return prisma.billingPaymentProfile.findUnique({
      where: {
        billingAccountId_provider: {
          billingAccountId,
          provider,
        },
      },
    });
  }

  private async createCryptoCheckoutSession(userId: string, packageId: string) {
    const tokenPackage = getTokenPackage(packageId);
    if (!tokenPackage) {
      throw new BadRequestException('Unsupported token package.');
    }

    const account = await this.getOrCreateAccount(userId);
    const sessionId = randomUUID();
    const amountDisplay = (tokenPackage.amountUsdCents / 100).toFixed(2);

    await this.prisma.tokenPurchase.upsert({
      where: {
        providerSessionId: sessionId,
      },
      update: {
        billingAccountId: account.id,
        provider: this.cryptoProvider,
        packageId: tokenPackage.id,
        currencyCode: 'USDC',
        amountMinor: tokenPackage.amountUsdCents,
        tokenAmount: tokenPackage.tokenAmount,
        metadata: {
          provider: this.cryptoProvider,
          network: this.baseNetworkName,
          chainId: this.baseChainId,
          address: this.usdcPaymentWalletAddress,
          tokenAddress: this.baseUsdcTokenAddress,
          amountDisplay,
          kind: 'direct-usdc-transfer',
        },
      },
      create: {
        billingAccountId: account.id,
        provider: this.cryptoProvider,
        providerSessionId: sessionId,
        packageId: tokenPackage.id,
        currencyCode: 'USDC',
        amountMinor: tokenPackage.amountUsdCents,
        tokenAmount: tokenPackage.tokenAmount,
        metadata: {
          provider: this.cryptoProvider,
          network: this.baseNetworkName,
          chainId: this.baseChainId,
          address: this.usdcPaymentWalletAddress,
          tokenAddress: this.baseUsdcTokenAddress,
          amountDisplay,
          kind: 'direct-usdc-transfer',
        },
      },
    });

    return {
      checkoutUrl: null,
      sessionId,
      provider: this.cryptoProvider,
      paymentAddress: this.usdcPaymentWalletAddress,
      network: this.baseNetworkName,
      chainId: this.baseChainId,
      tokenAddress: this.baseUsdcTokenAddress,
      currencyCode: 'USDC',
      amountDisplay,
      packageName: tokenPackage.name,
    };
  }

  private async confirmCryptoCheckoutSession(
    userId: string,
    sessionId: string,
    fallbackTokenAmount: number,
    transactionHash?: string,
  ) {
    const purchase = await this.prisma.tokenPurchase.findUnique({
      where: {
        providerSessionId: sessionId,
      },
      include: {
        billingAccount: true,
      },
    });

    if (!purchase || purchase.billingAccount.userId !== userId) {
      throw new NotFoundException('Purchase not found.');
    }

    if (purchase.status === 'completed') {
      const refreshed = await this.getOrCreateAccount(userId);
      return {
        status: purchase.status,
        tokenBalance: refreshed.tokenBalance,
        tokensAdded: purchase.tokenAmount ?? fallbackTokenAmount,
        provider: this.cryptoProvider,
      };
    }

    const hashToVerify = this.normalizeTransactionHash(transactionHash ?? purchase.providerPaymentId ?? undefined);
    if (!hashToVerify) {
      throw new BadRequestException('Submit the USDC transaction hash so we can verify the payment on Base.');
    }

    const verification = await this.verifyUsdcTransfer({
      transactionHash: hashToVerify,
      expectedAmountMinor: purchase.amountMinor,
      recipientAddress: this.usdcPaymentWalletAddress,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const duplicatePurchase = await tx.tokenPurchase.findFirst({
        where: {
          provider: this.cryptoProvider,
          providerPaymentId: hashToVerify,
          NOT: {
            providerSessionId: sessionId,
          },
        },
      });

      if (duplicatePurchase) {
        throw new BadRequestException('This transaction hash has already been used for another purchase.');
      }

      const currentPurchase = await tx.tokenPurchase.findUnique({
        where: {
          providerSessionId: sessionId,
        },
      });

      if (!currentPurchase) {
        throw new NotFoundException('Purchase not found.');
      }

      if (currentPurchase.status === 'completed') {
        const existingAccount = await tx.billingAccount.findUniqueOrThrow({
          where: { userId },
        });

        return {
          tokenBalance: existingAccount.tokenBalance,
          tokensAdded: currentPurchase.tokenAmount ?? fallbackTokenAmount,
        };
      }

      const account = await tx.billingAccount.update({
        where: { userId },
        data: {
          tokenBalance: {
            increment: currentPurchase.tokenAmount,
          },
        },
      });

      await tx.tokenPurchase.update({
        where: {
          providerSessionId: sessionId,
        },
        data: {
          status: 'completed',
          completedAt: new Date(),
          providerPaymentId: hashToVerify,
          metadata: {
            provider: this.cryptoProvider,
            network: this.baseNetworkName,
            chainId: this.baseChainId,
            address: this.usdcPaymentWalletAddress,
            tokenAddress: this.baseUsdcTokenAddress,
            transactionHash: hashToVerify,
            blockNumber: verification.blockNumber,
            confirmations: verification.confirmations,
            fromAddress: verification.fromAddress,
            matchedAmountRaw: verification.amountRaw,
            kind: 'direct-usdc-transfer',
          },
        },
      });

      return {
        tokenBalance: account.tokenBalance,
        tokensAdded: currentPurchase.tokenAmount ?? fallbackTokenAmount,
      };
    });

    return {
      status: 'completed',
      tokenBalance: result.tokenBalance,
      tokensAdded: result.tokensAdded,
      provider: this.cryptoProvider,
    };
  }

  private isProviderConfigured(provider: BillingProvider) {
    if (provider === this.stripeProvider) {
      return Boolean(this.stripeSecretKey);
    }

    if (provider === this.cryptoProvider) {
      return Boolean(this.usdcPaymentWalletAddress);
    }

    return false;
  }

  private assertProviderConfigured(provider: BillingProvider) {
    if (!this.isProviderConfigured(provider)) {
      if (provider === this.stripeProvider) {
        throw new BadRequestException('Stripe payments are not configured.');
      }

      if (provider === this.cryptoProvider) {
        throw new BadRequestException('Direct USDC payments are not configured.');
      }
    }
  }

  private normalizeAddress(address?: string) {
    if (!address) {
      return undefined;
    }

    const trimmed = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      throw new Error(`Invalid address configured: ${trimmed}`);
    }

    return trimmed.toLowerCase();
  }

  private normalizeTransactionHash(transactionHash?: string) {
    if (!transactionHash) {
      return undefined;
    }

    const trimmed = transactionHash.trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
      throw new BadRequestException('Transaction hash must be a valid 0x-prefixed 32-byte hash.');
    }

    return trimmed.toLowerCase();
  }

  private async verifyUsdcTransfer(input: {
    transactionHash: string;
    expectedAmountMinor: number;
    recipientAddress?: string;
  }) {
    if (!input.recipientAddress) {
      throw new BadRequestException('Direct USDC wallet address is not configured.');
    }

    const receipt = await this.rpcRequest<{
      status?: string;
      blockNumber?: string;
      logs?: Array<{
        address?: string;
        data?: string;
        topics?: string[];
      }>;
    }>('eth_getTransactionReceipt', [input.transactionHash]);

    if (!receipt) {
      throw new BadRequestException('Transaction was not found on Base yet. Please wait a moment and try again.');
    }

    if (receipt.status !== '0x1') {
      throw new BadRequestException('The submitted transaction did not succeed on-chain.');
    }

    const blockNumber = this.hexToBigInt(receipt.blockNumber, 'transaction block number');
    const latestBlockNumber = this.hexToBigInt(
      await this.rpcRequest<string>('eth_blockNumber', []),
      'latest block number',
    );
    const confirmations = latestBlockNumber - blockNumber + 1n;
    if (confirmations < BigInt(this.baseMinConfirmations)) {
      throw new BadRequestException(
        `Payment is detected but still needs ${this.baseMinConfirmations} confirmation${this.baseMinConfirmations === 1 ? '' : 's'}.`,
      );
    }

    const expectedAmountRaw = BigInt(input.expectedAmountMinor) * 10_000n;
    const expectedRecipientTopic = this.addressToTopic(input.recipientAddress);
    const matchingLog = receipt.logs?.find((log) => {
      if (!log.address || !log.topics || log.topics.length < 3 || !log.data) {
        return false;
      }

      return (
        log.address.toLowerCase() === this.baseUsdcTokenAddress &&
        log.topics[0]?.toLowerCase() === BillingService.ERC20_TRANSFER_TOPIC &&
        log.topics[2]?.toLowerCase() === expectedRecipientTopic &&
        this.hexToBigInt(log.data, 'transfer amount') === expectedAmountRaw
      );
    });

    if (!matchingLog) {
      throw new BadRequestException(
        `No USDC transfer to ${input.recipientAddress} for the expected amount was found in that transaction.`,
      );
    }

    return {
      blockNumber: Number(blockNumber),
      confirmations: Number(confirmations),
      amountRaw: expectedAmountRaw.toString(),
      fromAddress: this.topicToAddress(matchingLog.topics?.[1]),
    };
  }

  private async rpcRequest<T>(method: string, params: unknown[]) {
    const response = await fetch(this.baseRpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: randomUUID(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadRequestException(`Base RPC request failed: ${text || response.statusText}`);
    }

    const payload = (await response.json()) as {
      result?: T;
      error?: { message?: string };
    };

    if (payload.error) {
      throw new BadRequestException(`Base RPC request failed: ${payload.error.message ?? 'Unknown RPC error'}`);
    }

    return payload.result as T;
  }

  private hexToBigInt(value: string | undefined, label: string) {
    if (!value || !/^0x[0-9a-fA-F]+$/.test(value)) {
      throw new BadRequestException(`Invalid ${label} returned by Base RPC.`);
    }

    return BigInt(value);
  }

  private addressToTopic(address: string) {
    return `0x${address.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
  }

  private topicToAddress(topic?: string) {
    if (!topic || !/^0x[0-9a-fA-F]{64}$/.test(topic)) {
      return null;
    }

    return `0x${topic.slice(-40)}`.toLowerCase();
  }
}
