import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  ApiResponse,
  PaymentIntentResponse,
  PaymentVerificationResponse} from '@pc-platform/types';
import {
  Role,
} from '@pc-platform/types';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import type { CreatePaymentIntentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/payment.dto';
import type { PaymentsService } from './payments.service';


@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @HttpCode(HttpStatus.OK)
  async createPaymentIntent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<ApiResponse<PaymentIntentResponse>> {
    const data = await this.paymentsService.createPaymentIntent(user.sub, dto);
    return { success: true, data };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: VerifyPaymentDto,
  ): Promise<ApiResponse<PaymentVerificationResponse>> {
    const data = await this.paymentsService.verifyPayment(user.sub, dto);
    return { success: true, data };
  }

  @Post('refund')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RefundPaymentDto,
  ): Promise<ApiResponse<{ success: boolean; refundId: string; amount: number; status: string }>> {
    const data = await this.paymentsService.refundPayment(user.sub, dto);
    return { success: true, data };
  }
}
