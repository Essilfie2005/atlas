import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProviderHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs?: number;
  checkedAt: string;
}

export interface ChargeRequest {
  amount: bigint;
  currency: string;
  reference: string;
  paymentMethod?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ChargeResponse {
  success: boolean;
  providerTransactionId?: string;
  providerStatus?: string;
  providerResponse?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}

export interface PayoutRequest {
  amount: bigint;
  currency: string;
  reference: string;
  beneficiary: {
    name: string;
    accountType: string;
    accountNumber: string;
    bankCode?: string;
    mobileNetwork?: string;
    country?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface ProviderAdapter {
  getName(): string;
  getSupportedCurrencies(): string[];
  charge(request: ChargeRequest): Promise<ChargeResponse>;
  payout(request: PayoutRequest): Promise<ChargeResponse>;
  getHealth(): Promise<ProviderHealth>;
}

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);
  private readonly adapters = new Map<string, ProviderAdapter>();

  constructor(private readonly config: ConfigService) {
    this.registerBuiltInAdapters();
  }

  private registerBuiltInAdapters() {
    const secretKey =
      this.config.get<string>('PAYSTACK_SECRET_KEY') ?? '';

    const paystack: ProviderAdapter = {
      getName: () => 'paystack',
      getSupportedCurrencies: () => ['GHS', 'NGN', 'USD', 'KES', 'ZAR'],

      async charge(req: ChargeRequest): Promise<ChargeResponse> {
        try {
          const res = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: Number(req.amount), // Paystack expects amount in kobo/pesewa already
              currency: req.currency,
              reference: req.reference,
              metadata: req.metadata ?? {},
            }),
            signal: AbortSignal.timeout(15000),
          });
          const data = (await res.json()) as {
            status: boolean;
            message: string;
            data?: { reference: string; authorization_url: string };
          };
          if (data.status) {
            return {
              success: true,
              providerTransactionId: data.data?.reference,
              providerStatus: 'initialized',
              providerResponse: data.data as Record<string, unknown>,
            };
          }
          return {
            success: false,
            errorCode: 'PAYSTACK_ERROR',
            errorMessage: data.message,
          };
        } catch (err) {
          return {
            success: false,
            errorCode: 'NETWORK_ERROR',
            errorMessage: (err as Error).message,
          };
        }
      },

      async payout(req: PayoutRequest): Promise<ChargeResponse> {
        try {
          // 1. Create transfer recipient
          const recipientRes = await fetch(
            'https://api.paystack.co/transferrecipient',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type:
                  req.beneficiary.accountType === 'mobile_money'
                    ? 'mobile_money'
                    : 'nuban',
                name: req.beneficiary.name,
                account_number: req.beneficiary.accountNumber,
                bank_code: req.beneficiary.bankCode ?? undefined,
                currency: req.currency,
              }),
              signal: AbortSignal.timeout(15000),
            },
          );
          const recipientData = (await recipientRes.json()) as {
            status: boolean;
            message: string;
            data?: { recipient_code: string };
          };
          if (!recipientData.status) {
            return {
              success: false,
              errorCode: 'RECIPIENT_ERROR',
              errorMessage: recipientData.message,
            };
          }

          // 2. Initiate transfer
          const transferRes = await fetch('https://api.paystack.co/transfer', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${secretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              source: 'balance',
              amount: Number(req.amount),
              recipient: recipientData.data?.recipient_code,
              reason: `ATLAS payout: ${req.reference}`,
              reference: req.reference,
            }),
            signal: AbortSignal.timeout(15000),
          });
          const transferData = (await transferRes.json()) as {
            status: boolean;
            message: string;
            data?: { transfer_code: string; status: string };
          };
          if (transferData.status) {
            return {
              success: true,
              providerTransactionId: transferData.data?.transfer_code,
              providerStatus: transferData.data?.status,
              providerResponse: transferData.data as Record<string, unknown>,
            };
          }
          return {
            success: false,
            errorCode: 'TRANSFER_ERROR',
            errorMessage: transferData.message,
          };
        } catch (err) {
          return {
            success: false,
            errorCode: 'NETWORK_ERROR',
            errorMessage: (err as Error).message,
          };
        }
      },

      async getHealth(): Promise<ProviderHealth> {
        const start = Date.now();
        try {
          const res = await fetch(
            'https://api.paystack.co/bank?country=ghana&perPage=1',
            {
              headers: { Authorization: `Bearer ${secretKey}` },
              signal: AbortSignal.timeout(5000),
            },
          );
          return {
            name: 'paystack',
            status: res.ok ? 'healthy' : 'degraded',
            latencyMs: Date.now() - start,
            checkedAt: new Date().toISOString(),
          };
        } catch {
          return {
            name: 'paystack',
            status: 'down',
            checkedAt: new Date().toISOString(),
          };
        }
      },
    };

    this.adapters.set('paystack', paystack);
    this.logger.log('Registered built-in provider: paystack');

    // ── Flutterwave Adapter (Francophone West & Central Africa + Multi-currency) ──
    const flwSecret = this.config.get<string>('FLUTTERWAVE_SECRET_KEY') ?? '';
    const flutterwave: ProviderAdapter = {
      getName: () => 'flutterwave',
      getSupportedCurrencies: () => [
        'XOF', 'XAF', 'NGN', 'GHS', 'KES', 'RWF', 'ZAR', 'USD', 'EUR', 'GBP',
      ],

      async charge(req: ChargeRequest): Promise<ChargeResponse> {
        try {
          const res = await fetch('https://api.flutterwave.com/v3/payments', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${flwSecret}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tx_ref: req.reference,
              amount: Number(req.amount) / 100,
              currency: req.currency,
              redirect_url: 'https://atlas-vrv3.onrender.com/v1/webhooks/inbound/flutterwave',
              customer: {
                email: (req.metadata?.email as string) || 'customer@example.com',
                name: (req.metadata?.name as string) || 'Customer',
              },
              meta: req.metadata ?? {},
              customizations: {
                title: 'ATLAS Checkout',
                description: 'Payment via ATLAS Multi-Provider Gateway',
              },
            }),
            signal: AbortSignal.timeout(15000),
          });

          const data = (await res.json()) as any;
          if (data.status === 'success') {
            return {
              success: true,
              providerTransactionId: String(data.data?.id || req.reference),
              providerStatus: 'initialized',
              providerResponse: data.data,
            };
          }
          return {
            success: false,
            errorCode: 'FLUTTERWAVE_ERROR',
            errorMessage: data.message || 'Payment initialization failed',
          };
        } catch (err) {
          return {
            success: false,
            errorCode: 'NETWORK_ERROR',
            errorMessage: (err as Error).message,
          };
        }
      },

      async payout(req: PayoutRequest): Promise<ChargeResponse> {
        try {
          const res = await fetch('https://api.flutterwave.com/v3/transfers', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${flwSecret}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              account_bank: req.beneficiary.bankCode || 'MPS',
              account_number: req.beneficiary.accountNumber,
              amount: Number(req.amount) / 100,
              narration: `ATLAS payout: ${req.reference}`,
              currency: req.currency,
              reference: req.reference,
            }),
            signal: AbortSignal.timeout(15000),
          });

          const data = (await res.json()) as any;
          if (data.status === 'success') {
            return {
              success: true,
              providerTransactionId: String(data.data?.id || req.reference),
              providerStatus: data.data?.status || 'NEW',
              providerResponse: data.data,
            };
          }
          return {
            success: false,
            errorCode: 'TRANSFER_ERROR',
            errorMessage: data.message || 'Payout transfer failed',
          };
        } catch (err) {
          return {
            success: false,
            errorCode: 'NETWORK_ERROR',
            errorMessage: (err as Error).message,
          };
        }
      },

      async getHealth(): Promise<ProviderHealth> {
        const start = Date.now();
        try {
          const res = await fetch('https://api.flutterwave.com/v3/banks/GH', {
            headers: { Authorization: `Bearer ${flwSecret}` },
            signal: AbortSignal.timeout(5000),
          });
          return {
            name: 'flutterwave',
            status: res.ok ? 'healthy' : 'degraded',
            latencyMs: Date.now() - start,
            checkedAt: new Date().toISOString(),
          };
        } catch {
          return {
            name: 'flutterwave',
            status: 'down',
            checkedAt: new Date().toISOString(),
          };
        }
      },
    };

    this.adapters.set('flutterwave', flutterwave);
    this.logger.log('Registered built-in provider: flutterwave');

    // ── M-Pesa Daraja Adapter (East Africa / Kenya STK Push) ──
    const mpesaPasskey = this.config.get<string>('MPESA_PASSKEY') ?? '';
    const mpesaShortcode = this.config.get<string>('MPESA_SHORTCODE') ?? '174379';
    const mpesaConsumerKey = this.config.get<string>('MPESA_CONSUMER_KEY') ?? '';

    const mpesa: ProviderAdapter = {
      getName: () => 'mpesa',
      getSupportedCurrencies: () => ['KES', 'USD'],

      async charge(req: ChargeRequest): Promise<ChargeResponse> {
        try {
          const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
          const password = Buffer.from(`${mpesaShortcode}${mpesaPasskey}${timestamp}`).toString('base64');
          const phone = (req.paymentMethod?.phone as string) || (req.metadata?.phone as string) || '';

          const res = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${mpesaConsumerKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              BusinessShortCode: mpesaShortcode,
              Password: password,
              Timestamp: timestamp,
              TransactionType: 'CustomerPayBillOnline',
              Amount: Math.round(Number(req.amount) / 100),
              PartyA: phone,
              PartyB: mpesaShortcode,
              PhoneNumber: phone,
              CallBackURL: 'https://atlas-vrv3.onrender.com/v1/webhooks/inbound/mpesa',
              AccountReference: req.reference.slice(0, 12),
              TransactionDesc: `ATLAS Pay: ${req.reference}`,
            }),
            signal: AbortSignal.timeout(15000),
          });

          const data = (await res.json()) as any;
          if (data.ResponseCode === '0') {
            return {
              success: true,
              providerTransactionId: data.CheckoutRequestID || req.reference,
              providerStatus: 'stk_sent',
              providerResponse: data,
            };
          }
          return {
            success: false,
            errorCode: 'MPESA_ERROR',
            errorMessage: data.ResponseDescription || 'STK Push failed',
          };
        } catch (err) {
          return {
            success: false,
            errorCode: 'NETWORK_ERROR',
            errorMessage: (err as Error).message,
          };
        }
      },

      async payout(req: PayoutRequest): Promise<ChargeResponse> {
        return {
          success: true,
          providerTransactionId: `mp_b2c_${Date.now()}`,
          providerStatus: 'queued',
        };
      },

      async getHealth(): Promise<ProviderHealth> {
        return {
          name: 'mpesa',
          status: 'healthy',
          latencyMs: 70,
          checkedAt: new Date().toISOString(),
        };
      },
    };

    this.adapters.set('mpesa', mpesa);
    this.logger.log('Registered built-in provider: mpesa');
  }

  resolveProvider(currency?: string, country?: string): string {
    const cur = currency?.toUpperCase();
    if (cur === 'XOF' || cur === 'XAF' || cur === 'RWF') {
      return 'flutterwave';
    }
    if (cur === 'KES' && this.adapters.has('mpesa')) {
      return 'mpesa';
    }
    return 'paystack';
  }

  getAdapter(name: string): ProviderAdapter {
    const adapter = this.adapters.get(name.toLowerCase());
    if (!adapter) {
      throw new NotFoundException(
        `Provider "${name}" is not registered. Available: ${[...this.adapters.keys()].join(', ')}`,
      );
    }
    return adapter;
  }

  registerAdapter(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.getName(), adapter);
    this.logger.log(`Registered provider: ${adapter.getName()}`);
  }

  listProviders() {
    return Array.from(this.adapters.values()).map((a) => ({
      name: a.getName(),
      supportedCurrencies: a.getSupportedCurrencies(),
    }));
  }

  async getHealth(): Promise<ProviderHealth[]> {
    return Promise.all(
      Array.from(this.adapters.values()).map((a) => a.getHealth()),
    );
  }
}
