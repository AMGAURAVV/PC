import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import type { AddToWishlistDto, WishlistResponseDto } from './dto/wishlist.dto';
import { WishlistRepository } from './wishlist.repository';

@Injectable()
export class WishlistService {
  constructor(private readonly wishlistRepo: WishlistRepository) {}

  async getWishlist(userId: string): Promise<WishlistResponseDto> {
    let wishlist = await this.wishlistRepo.findByUser(userId);
    if (!wishlist) {
      wishlist = await this.wishlistRepo.create(userId);
    }
    return this.mapToDto(wishlist);
  }

  async addItem(userId: string, dto: AddToWishlistDto): Promise<WishlistResponseDto> {
    let wishlist = await this.wishlistRepo.findByUser(userId);
    if (!wishlist) {
      wishlist = await this.wishlistRepo.create(userId);
    }

    const itemExists = (wishlist as any).items?.some((i: any) => i.productId === dto.productId);
    if (itemExists) {
      throw new ConflictException('Product is already in wishlist');
    }

    await this.wishlistRepo.addItem(wishlist.id, dto.productId);

    const updatedWishlist = await this.wishlistRepo.findByUser(userId);
    return this.mapToDto(updatedWishlist);
  }

  async removeItem(userId: string, itemId: string): Promise<WishlistResponseDto> {
    const wishlist = await this.wishlistRepo.findByUser(userId);
    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    const itemExists = (wishlist as any).items?.some((i: any) => i.id === itemId);
    if (!itemExists) {
      throw new NotFoundException('Item not found in wishlist');
    }

    await this.wishlistRepo.removeItem(itemId);

    const updatedWishlist = await this.wishlistRepo.findByUser(userId);
    return this.mapToDto(updatedWishlist);
  }

  private mapToDto(wishlist: any): WishlistResponseDto {
    return {
      id: wishlist.id,
      userId: wishlist.userId,
      items: (wishlist as any).items?.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        addedAt: item.createdAt.toISOString(),
      })) || [],
    };
  }
}
