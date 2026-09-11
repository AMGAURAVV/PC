import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@pc-platform/database';

import type { AddToCartDto} from './dto/cart.dto';
import { UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartRepository {
  constructor(private readonly db: DatabaseService) {}

  async findActiveCartByUser(userId: string) {
    return this.db.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                prices: {
                  where: { isActive: true },
                  orderBy: { amount: 'asc' },
                },
                inventory: true,
              },
            },
          },
        },
      },
    });
  }

  async createCart(userId: string) {
    return this.db.cart.create({
      data: {
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                prices: {
                  where: { isActive: true },
                  orderBy: { amount: 'asc' },
                },
                inventory: true,
              },
            },
          },
        },
      },
    });
  }

  async addItemToCart(cartId: string, data: AddToCartDto) {
    // Basic implementation: assuming priceAtAdded is fetched properly in service
    // Defaulting to 0 here if not handled
    return this.db.cartItem.create({
      data: {
        cartId,
        productId: data.productId,
        ...(data.productVariantId && { variantId: data.productVariantId }),
        quantity: data.quantity,
      },
    });
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    return this.db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(itemId: string) {
    return this.db.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(cartId: string) {
    return this.db.cartItem.deleteMany({
      where: { cartId },
    });
  }

  async findBuildWithItems(buildId: string) {
    return this.db.build.findUnique({
      where: { id: buildId },
      include: {
        items: true,
      },
    });
  }

}
