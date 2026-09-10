import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider as DbPaymentProvider, PaymentStatus } from '@pc-platform/database';

import type {
  PaymentProvider,
  CreatePaymentParams,
  PaymentIntentResult,
  VerifyPaymentParams,
  PaymentVerificationResult,
  RefundPaymentParams,
  RefundResult,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);
  readonly name = DbPaymentProvider.COD; // Using database enum or fallback

  public async createPayment(params: CreatePaymentParams): Promise<PaymentIntentResult> {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString('hex');
    const providerOrderId = `order_mock_${timestamp}_${randomHex}`;
    const providerPaymentId = `pay_mock_${timestamp}_${randomHex}`;
    const clientSecret = `mock_secret_${crypto.randomBytes(16).toString('hex')}`;

    this.logger.log(
      `[MockPaymentProvider] Created mock payment intent for order ${params.orderNumber} (₹${params.amount})`,
    );

    return {
      providerPaymentId,
      providerOrderId,
      clientSecret,
      amount: params.amount,
      currency: params.currency || 'INR',
      status: PaymentStatus.PENDING,
      provider: DbPaymentProvider.RAZORPAY,
      providerData: {
        mockMode: true,
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    this.logger.log(
      `[MockPaymentProvider] Verifying payment for paymentId=${params.providerPaymentId}`,
    );

    // Mock failure condition for testing: signature ending in '_invalid' fails
    if (params.signature && params.signature.endsWith('_invalid')) {
      return {
        verified: false,
        providerPaymentId: params.providerPaymentId,
        status: PaymentStatus.FAILED,
        failureReason: 'Invalid payment signature or authorization denied',
      };
    }

    return {
      verified: true,
      providerPaymentId: params.providerPaymentId,
      status: PaymentStatus.CAPTURED,
    };
  }

  public async refundPayment(params: RefundPaymentParams): Promise<RefundResult> {
    const refundId = `rfnd_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.logger.log(
      `[MockPaymentProvider] Processed mock refund for paymentId=${params.paymentId}`,
    );

    return {
      success: true,
      refundId,
      amount: params.amount || 0,
      status: PaymentStatus.REFUNDED,
    };
  }
}
