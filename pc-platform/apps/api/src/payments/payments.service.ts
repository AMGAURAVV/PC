import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { DatabaseService} from '@pc-platform/database';
import { OrderStatus, PaymentStatus } from '@pc-platform/database';
import type {
  PaymentIntentResponse,
  PaymentVerificationResponse,
} from '@pc-platform/types';

import type { CreatePaymentIntentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/payment.dto';
import type {
  PaymentProvider} from './interfaces/payment-provider.interface';
import {
  PAYMENT_PROVIDER_TOKEN,
} from './interfaces/payment-provider.interface';


@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(PAYMENT_PROVIDER_TOKEN)
    private readonly paymentProvider: PaymentProvider,
  ) {}

  public async createPaymentIntent(
    userId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponse> {
    const order = await this.db.order.findUnique({
      where: { id: dto.orderId },
      include: {
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You are not authorized to pay for this order');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot initiate payment for order in status ${order.status}`,
      );
    }

    const intent = await this.paymentProvider.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency,
      customer: {
        id: order.user.id,
        email: order.user.email,
        name: `${order.user.firstName} ${order.user.lastName}`.trim(),
        phone: order.user.phone ?? undefined,
      },
    });

    // Record or update payment record in database
    const payment = await this.db.payment.create({
      data: {
        orderId: order.id,
        provider: intent.provider,
        providerPaymentId: intent.providerPaymentId,
        providerOrderId: intent.providerOrderId ?? null,
        amount: order.total,
        currency: order.currency,
        status: PaymentStatus.PENDING,
        metadata: (intent.providerData as any) ?? undefined,
      },
    });

    return {
      paymentId: payment.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency,
      provider: intent.provider as any,
      clientSecret: intent.clientSecret,
      providerOrderId: intent.providerOrderId,
      status: PaymentStatus.PENDING,
    };
  }

  public async verifyPayment(
    userId: string,
    dto: VerifyPaymentDto,
  ): Promise<PaymentVerificationResponse> {
    const order = await this.db.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Access denied to order verification');
    }

    const verification = await this.paymentProvider.verifyPayment({
      orderId: order.id,
      providerPaymentId: dto.providerPaymentId,
      providerOrderId: dto.providerOrderId,
      signature: dto.signature,
    });

    if (!verification.verified) {
      await this.db.payment.updateMany({
        where: {
          orderId: order.id,
          providerPaymentId: dto.providerPaymentId,
        },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: verification.failureReason || 'Verification failed',
        },
      });

      return {
        verified: false,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.status as any,
        paymentStatus: PaymentStatus.FAILED,
        message: verification.failureReason || 'Payment verification failed',
      };
    }

    // Payment Verified: Commit inventory and set order to CONFIRMED
    await this.db.$transaction(async (tx) => {
      // 1. Update Payment status
      await tx.payment.updateMany({
        where: {
          orderId: order.id,
          providerPaymentId: dto.providerPaymentId,
        },
        data: {
          status: PaymentStatus.CAPTURED,
          paidAt: new Date(),
        },
      });

      // 2. Update Order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CONFIRMED,
        },
      });

      // 3. Commit reserved inventory (decrement both quantity and reservedQty)
      for (const item of order.items) {
        const inv = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
          },
        });

        if (inv) {
          const newQty = Math.max(0, inv.quantity - item.quantity);
          const newReserved = Math.max(0, inv.reservedQty - item.quantity);
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              quantity: newQty,
              reservedQty: newReserved,
            },
          });
        }
      }
    });

    this.logger.log(
      `[PaymentsService] Payment captured and order ${order.orderNumber} confirmed. Inventory committed.`,
    );

    return {
      verified: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: OrderStatus.CONFIRMED as any,
      paymentStatus: PaymentStatus.CAPTURED,
      message: 'Payment verified and order confirmed successfully',
    };
  }

  public async refundPayment(
    adminUserId: string,
    dto: RefundPaymentDto,
  ): Promise<{ success: boolean; refundId: string; amount: number; status: string }> {
    const payment = await this.db.payment.findUnique({
      where: { id: dto.paymentId },
      include: {
        order: {
          include: { items: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${dto.paymentId} not found`);
    }

    const refundAmount = dto.amount || Number(payment.amount);
    const refundResult = await this.paymentProvider.refundPayment({
      paymentId: payment.providerPaymentId || payment.id,
      amount: refundAmount,
      reason: dto.reason,
    });

    if (!refundResult.success) {
      throw new BadRequestException('Payment provider rejected refund');
    }

    await this.db.$transaction(async (tx) => {
      // Update Payment record
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAmount: refundAmount,
          refundedAt: new Date(),
        },
      });

      // Update Order status
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.REFUNDED,
        },
      });

      // Optionally restore inventory if applicable
      for (const item of payment.order.items) {
        const inv = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
          },
        });

        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              quantity: inv.quantity + item.quantity,
            },
          });
        }
      }
    });

    this.logger.log(
      `[PaymentsService] Payment ${payment.id} refunded by admin ${adminUserId}. Restored stock.`,
    );

    return {
      success: true,
      refundId: refundResult.refundId,
      amount: refundAmount,
      status: PaymentStatus.REFUNDED,
    };
  }
}
