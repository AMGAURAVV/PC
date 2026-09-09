import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CartRepository } from '../cart/cart.repository';
import { CreateOrderDto, UpdateOrderStatusDto, OrderResponseDto } from './dto/order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly cartRepo: CartRepository,
  ) {}

  async findAllByUser(userId: string, query: PaginationDto): Promise<PaginatedResponse<OrderResponseDto>> {
    const [orders, total] = await Promise.all([
      this.ordersRepo.findAllByUser(userId, query.skip, query.limit),
      this.ordersRepo.countAllByUser(userId),
    ]);

    const data = orders.map((o) => this.mapToDto(o));
    return PaginatedResponse.ok(data, query.page, query.limit, total);
  }

  async findAll(query: PaginationDto): Promise<PaginatedResponse<OrderResponseDto>> {
    const [orders, total] = await Promise.all([
      this.ordersRepo.findAll(query.skip, query.limit),
      this.ordersRepo.countAll(),
    ]);

    const data = orders.map((o) => this.mapToDto(o));
    return PaginatedResponse.ok(data, query.page, query.limit, total);
  }

  async findOne(id: string, userId: string, isAdmin: boolean): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }
    return this.mapToDto(order);
  }

  async createFromCart(userId: string, createDto: CreateOrderDto): Promise<OrderResponseDto> {
    const cart = await this.cartRepo.findActiveCartByUser(userId);
    const cartItems = (cart as any).items;
    if (!cart || !cartItems || cartItems.length === 0) {
      throw new BadRequestException('Cannot create order from an empty cart');
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum: number, item: any) => {
      return sum + (Number(item.priceAtAdded) * item.quantity);
    }, 0);

    const order = await this.ordersRepo.create(userId, createDto, totalAmount, cartItems);

    // Clear cart
    await this.cartRepo.clearCart(cart.id);

    return this.mapToDto(order);
  }

  async updateStatus(id: string, updateDto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.ordersRepo.updateStatus(id, updateDto.status);
    return this.mapToDto(updatedOrder);
  }

  private mapToDto(order: any): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      shippingAddressId: order.shippingAddressId,
      items: order.items?.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productVariantId: item.variantId,
        quantity: item.quantity,
        priceAtPurchase: Number(item.unitPrice),
      })) || [],
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
