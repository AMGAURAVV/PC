import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';


import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { WishlistResponseDto } from './dto/wishlist.dto';
import type { AddToWishlistDto} from './dto/wishlist.dto';
import type { WishlistService } from './wishlist.service';

@ApiTags('wishlist')
@ApiBearerAuth('access-token')
@UseGuards(RolesGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist' })
  @SwaggerResponse({ status: 200, type: WishlistResponseDto })
  getWishlist(@CurrentUser() user: JwtPayload) {
    return this.wishlistService.getWishlist(user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a product to wishlist' })
  @SwaggerResponse({ status: 200, type: WishlistResponseDto })
  addItem(@CurrentUser() user: JwtPayload, @Body() addToWishlistDto: AddToWishlistDto) {
    return this.wishlistService.addItem(user.sub, addToWishlistDto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove a product from wishlist' })
  @SwaggerResponse({ status: 200, type: WishlistResponseDto })
  removeItem(@CurrentUser() user: JwtPayload, @Param('itemId') itemId: string) {
    return this.wishlistService.removeItem(user.sub, itemId);
  }
}
