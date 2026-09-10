import { Injectable } from '@nestjs/common';
import type { DatabaseService } from '@pc-platform/database';

@Injectable()
export class WishlistRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByUser(userId: string) {
    return this.db.wishlist.findFirst({
      where: { userId },
      include: {
        items: true,
      },
    });
  }

  async create(userId: string) {
    return this.db.wishlist.create({
      data: {
        userId,
      },
      include: {
        items: true,
      },
    });
  }

  async addItem(wishlistId: string, productId: string) {
    return this.db.wishlistItem.create({
      data: {
        wishlistId,
        productId,
      },
    });
  }

  async removeItem(itemId: string) {
    return this.db.wishlistItem.delete({
      where: { id: itemId },
    });
  }
}
