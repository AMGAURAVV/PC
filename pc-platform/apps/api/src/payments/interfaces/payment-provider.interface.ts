import type { PaymentProvider as DbPaymentProvider, PaymentStatus } from '@pc-platform/database';

export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number; // In rupees
  currency: string;
  customer: {
    id: string;
    email: string;
    name: string;
    phone?: string | undefined;
  };
  metadata?: Record<string, any> | undefined;
}

export interface PaymentIntentResult {
  providerPaymentId: string;
  providerOrderId?: string | undefined;
  clientSecret?: string | undefined;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: DbPaymentProvider;
  providerData?: Record<string, any> | undefined;
}

export interface VerifyPaymentParams {
  orderId: string;
  providerPaymentId: string;
  providerOrderId?: string | undefined;
  signature?: string | undefined;
  payload?: Record<string, any> | undefined;
}

export interface PaymentVerificationResult {
  verified: boolean;
  providerPaymentId: string;
  status: PaymentStatus;
  failureReason?: string | undefined;
}

export interface RefundPaymentParams {
  paymentId: string;
  amount?: number | undefined;
  reason?: string | undefined;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: PaymentStatus;
}

export interface PaymentProvider {
  readonly name: DbPaymentProvider;
  createPayment(params: CreatePaymentParams): Promise<PaymentIntentResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;
  refundPayment(params: RefundPaymentParams): Promise<RefundResult>;
}

export const PAYMENT_PROVIDER_TOKEN = 'PAYMENT_PROVIDER_TOKEN';
