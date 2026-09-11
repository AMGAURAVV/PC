import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { CartRepository } from './cart.repository';
import type { AddToCartDto, UpdateCartItemDto, CartResponseDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly cartRepo: CartRepository) {}

  async getActiveCart(userId: string): Promise<CartResponseDto> {
    let cart = await this.cartRepo.findActiveCartByUser(userId);
    if (!cart) {
      cart = await this.cartRepo.createCart(userId);
    }
    return this.mapToDto(cart);
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartResponseDto> {
    let cart = await this.cartRepo.findActiveCartByUser(userId);
    if (!cart) {
      cart = await this.cartRepo.createCart(userId);
    }

    // Check if item already exists in cart to update quantity instead
    const existingItem = cart.items?.find(
      (i: any) => i.productId === dto.productId && i.productVariantId === dto.productVariantId
    );

    if (existingItem) {
      await this.cartRepo.updateItemQuantity(existingItem.id, existingItem.quantity + dto.quantity);
    } else {
      await this.cartRepo.addItemToCart(cart.id, dto);
    }

    // Fetch updated cart
    const updatedCart = await this.cartRepo.findActiveCartByUser(userId);
    return this.mapToDto(updatedCart);
  }

  async updateItemQuantity(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findActiveCartByUser(userId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }

    const itemExists = cart.items?.some((i: any) => i.id === itemId);
    if (!itemExists) {
      throw new NotFoundException('Item not found in cart');
    }

    await this.cartRepo.updateItemQuantity(itemId, dto.quantity);

    const updatedCart = await this.cartRepo.findActiveCartByUser(userId);
    return this.mapToDto(updatedCart);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findActiveCartByUser(userId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }

    const itemExists = cart.items?.some((i: any) => i.id === itemId);
    if (!itemExists) {
      throw new NotFoundException('Item not found in cart');
    }

    await this.cartRepo.removeItem(itemId);

    const updatedCart = await this.cartRepo.findActiveCartByUser(userId);
    return this.mapToDto(updatedCart);
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    const cart = await this.cartRepo.findActiveCartByUser(userId);
    if (!cart) {
      throw new NotFoundException('Active cart not found');
    }

    await this.cartRepo.clearCart(cart.id);
    return { message: 'Cart cleared successfully' };
  }

  async addBuildBundle(userId: string, buildId: string): Promise<CartResponseDto> {
    const build = await this.cartRepo.findBuildWithItems(buildId);
    if (!build) {
      throw new NotFoundException(`Build with ID ${buildId} not found`);
    }

    if (build.userId !== userId && !build.isPublic) {
      throw new ForbiddenException('Access denied to private build bundle');
    }

    if (!build.items || build.items.length === 0) {
      throw new NotFoundException('Build contains no components to add to cart');
    }

    let cart = await this.cartRepo.findActiveCartByUser(userId);
    if (!cart) {
      cart = await this.cartRepo.createCart(userId);
    }

    for (const item of build.items) {
      const existing = cart.items?.find((i: any) => i.productId === item.productId);
      if (existing) {
        await this.cartRepo.updateItemQuantity(existing.id, existing.quantity + item.quantity);
      } else {
        const itemDto: AddToCartDto = {
          productId: item.productId,
          quantity: item.quantity,
          ...(item.variantId ? { productVariantId: item.variantId } : {}),
        };
        await this.cartRepo.addItemToCart(cart.id, itemDto);
      }
    }

    const updated = await this.cartRepo.findActiveCartByUser(userId);
    return this.mapToDto(updated);
  }

  private mapToDto(cart: any): CartResponseDto {
    return {
      id: cart.id,
      userId: cart.userId,
      status: cart.status,
      items:
        cart.items?.map((item: any) => {
          const product = item.product;
          const livePricePaise = product?.prices?.[0]?.amount;
          const unitPrice = livePricePaise
            ? Math.round(Number(livePricePaise) / 100)
            : Number(item.priceAtAdded || 0);
          const availableStock = product?.inventory?.quantity ?? 10;

          return {
            id: item.id,
            productId: item.productId,
            productVariantId: item.productVariantId || undefined,
            quantity: item.quantity,
            priceAtAdded: Number(item.priceAtAdded || 0),
            productName: product?.name || undefined,
            brandName: product?.brand?.name || undefined,
            unitPrice,
            totalPrice: unitPrice * item.quantity,
            inStock: availableStock >= item.quantity,
          };
        }) || [],
      updatedAt: cart.updatedAt ? cart.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}
