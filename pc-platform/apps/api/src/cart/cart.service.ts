import { Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto } from './dto/cart.dto';

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

  private mapToDto(cart: any): CartResponseDto {
    return {
      id: cart.id,
      userId: cart.userId,
      status: cart.status,
      items: cart.items?.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        priceAtAdded: Number(item.priceAtAdded),
      })) || [],
      updatedAt: cart.updatedAt.toISOString(),
    };
  }
}
