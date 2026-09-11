import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto } from './dto/cart.dto';

@ApiTags('cart')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user active cart' })
  @SwaggerResponse({ status: 200, type: CartResponseDto })
  getActiveCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getActiveCart(user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add an item to cart' })
  @SwaggerResponse({ status: 200, type: CartResponseDto })
  addItem(@CurrentUser() user: JwtPayload, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItem(user.sub, addToCartDto);
  }

  @Post('bundle/:buildId')
  @ApiOperation({ summary: 'Add entire build bundle to cart' })
  @SwaggerResponse({ status: 200, type: CartResponseDto })
  addBuildBundle(
    @CurrentUser() user: JwtPayload,
    @Param('buildId') buildId: string,
  ) {
    return this.cartService.addBuildBundle(user.sub, buildId);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @SwaggerResponse({ status: 200, type: CartResponseDto })
  updateItemQuantity(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCartItemDto
  ) {
    return this.cartService.updateItemQuantity(user.sub, itemId, updateDto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove an item from cart' })
  @SwaggerResponse({ status: 200, type: CartResponseDto })
  removeItem(@CurrentUser() user: JwtPayload, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(user.sub, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear current cart' })
  clearCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.clearCart(user.sub);
  }
}
