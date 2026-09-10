import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { ApiResponse, CouponValidationResult} from '@pc-platform/types';
import { Role } from '@pc-platform/types';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import type { CouponsService } from './coupons.service';
import type { ValidateCouponDto, CreateCouponDto } from './dto/coupon.dto';


@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateCoupon(
    @Body() dto: ValidateCouponDto,
  ): Promise<ApiResponse<CouponValidationResult>> {
    const data = await this.couponsService.validateCoupon(dto.code, dto.orderAmount);
    return { success: true, data };
  }

  @Public()
  @Get()
  async getActiveCoupons(): Promise<ApiResponse<any[]>> {
    const data = await this.couponsService.findActiveCoupons();
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCoupon(@Body() dto: CreateCouponDto): Promise<ApiResponse<any>> {
    const data = await this.couponsService.createCoupon(dto);
    return { success: true, data };
  }
}
