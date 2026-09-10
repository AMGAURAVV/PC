# How-To: Add a New Payment Provider

> **Target Audience:** Backend & Fintech Integration Engineers  
> **Estimated Time:** 30–45 minutes  
> **Files Involved:**  
> - `packages/database/prisma/schema.prisma` (`PaymentProvider` enum)  
> - `apps/api/src/payments/interfaces/payment-provider.interface.ts`  
> - `apps/api/src/payments/providers/`  
> - `apps/api/src/payments/payments.module.ts`

---

## 1. Overview & Architecture

All payment gateways (Razorpay, Stripe, Mock) are abstracted behind the `PaymentProvider` interface in `apps/api/src/payments/`.

Neither the checkout controller nor the order fulfillment service directly touches third-party SDKs. Adding a new gateway (e.g. Stripe, PhonePe, Cashfree) requires implementing the standardized methods:
- `createPayment(params)`: Initializes gateway order / payment intent.
- `verifyPayment(params)`: Cryptographically verifies webhook signatures or redirect tokens.
- `refundPayment(params)`: Issues a full or partial refund against captured transactions.

---

## 2. Step-by-Step Instructions

### Step 1: Update Database Enum (If Adding a New Provider Enum)
Open [`packages/database/prisma/schema.prisma`](file:///packages/database/prisma/schema.prisma). Locate `enum PaymentProvider`:
```prisma
enum PaymentProvider {
  RAZORPAY
  STRIPE
  PHONEPE // <── Added
  PAYPAL
  COD
  WALLET
}
```
Deploy migration:
```bash
pnpm --filter @pc-platform/database migrate:dev --name add_phonepe_payment_provider
pnpm --filter @pc-platform/database generate
```

---

### Step 2: Implement the `PaymentProvider` Interface
Create a new provider class in `apps/api/src/payments/providers/phonepe-payment.provider.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider as DbPaymentProvider, PaymentStatus } from '@pc-platform/database';
import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentIntentResult,
  VerifyPaymentParams,
  PaymentVerificationResult,
  RefundPaymentParams,
  RefundResult,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class PhonePePaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(PhonePePaymentProvider.name);
  readonly name = DbPaymentProvider.PHONEPE;

  async createPayment(params: CreatePaymentParams): Promise<PaymentIntentResult> {
    this.logger.log(`Creating PhonePe transaction for order ${params.orderNumber}`);

    // Call PhonePe /pg/v1/pay API here...
    const providerOrderId = `phonepe_order_${Date.now()}`;
    const providerPaymentId = `phonepe_pay_${Date.now()}`;

    return {
      providerPaymentId,
      providerOrderId,
      amount: params.amount,
      currency: params.currency || 'INR',
      status: PaymentStatus.PENDING,
      provider: this.name,
      providerData: { checkoutUrl: 'https://merchants.phonepe.com/pay/...' },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    this.logger.log(`Verifying PhonePe signature for ${params.providerPaymentId}`);

    // Compute SHA256(payload + "/pg/v1/status" + saltKey) + "###" + saltIndex
    const isValidSignature = true; // verify against params.signature

    if (!isValidSignature) {
      return {
        verified: false,
        providerPaymentId: params.providerPaymentId,
        status: PaymentStatus.FAILED,
        failureReason: 'Invalid webhook checksum signature',
      };
    }

    return {
      verified: true,
      providerPaymentId: params.providerPaymentId,
      status: PaymentStatus.CAPTURED,
    };
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundResult> {
    // Invoke PhonePe refund API...
    return {
      success: true,
      refundId: `rfnd_${Date.now()}`,
      amount: params.amount || 0,
      status: PaymentStatus.REFUNDED,
    };
  }
}
```

---

### Step 3: Register in `PaymentsModule`
Open `apps/api/src/payments/payments.module.ts`:
1. Add `PhonePePaymentProvider` to `providers` array.
2. In `PaymentsService`, inject the provider and map it in the provider factory dictionary:
```typescript
constructor(
  private readonly razorpayProvider: RazorpayPaymentProvider,
  private readonly mockProvider: MockPaymentProvider,
  private readonly phonePeProvider: PhonePePaymentProvider,
) {}
```

---

## 3. Verification & Mock Testing

> [!WARNING]
> **Strict Rule**: Never invoke live payment gateways in local development or CI tests. Always use mock payment providers or sandbox keys.

Run payments unit tests:
```bash
pnpm --filter @pc-platform/api test -- apps/api/src/payments/payments.service.spec.ts
```

Test mock payment checkout with Playwright:
```bash
pnpm test:e2e -- tests/e2e/checkout.spec.ts
```
