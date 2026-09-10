import type { PaymentVerificationInput } from '@pc-platform/types';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;
}

export class VerifyPaymentDto implements PaymentVerificationInput {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  providerPaymentId!: string;

  @IsString()
  @IsOptional()
  providerOrderId?: string;

  @IsString()
  @IsOptional()
  signature?: string;
}

export class RefundPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
