import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CompatibilityService } from '@pc-platform/compatibility-engine';
import {
  DatabaseService,
  OrderStatus,
  AddressType,
  ComponentType,
} from '@pc-platform/database';
import type {
  BuildComponents,
  CheckoutSummaryResult,
  CheckoutSummaryItem} from '@pc-platform/types';
import {
  CheckoutOrderInput,
  CheckoutSummaryInput,
  ComponentCategory,
} from '@pc-platform/types';

import { CartRepository } from '../cart/cart.repository';
import type { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/dto/response.dto';
import { CouponsService } from '../coupons/coupons.service';
import { PaymentsService } from '../payments/payments.service';

import type { CheckoutOrderDto, CheckoutSummaryDto } from './dto/checkout.dto';
import type { CreateOrderDto, UpdateOrderStatusDto, OrderResponseDto } from './dto/order.dto';
import { OrdersRepository } from './orders.repository';

interface ResolvedItem {
  product: any;
  variantId?: string | undefined;
  quantity: number;
  unitPrice: number; // in Rupees
  totalPrice: number;
  inStock: boolean;
  availableStock: number;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly ordersRepo: OrdersRepository,
    private readonly cartRepo: CartRepository,
    private readonly compatibilityService: CompatibilityService,
    private readonly couponsService: CouponsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  // ── Queries & Existing Flow ─────────────────────────────────────────────

  async findAllByUser(
    userId: string,
    query: PaginationDto,
  ): Promise<PaginatedResponse<OrderResponseDto>> {
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

  // ── Authoritative Checkout Summary Preview ───────────────────────────────

  async getCheckoutSummary(
    userId: string,
    dto: CheckoutSummaryDto,
  ): Promise<CheckoutSummaryResult> {
    const resolvedItems = await this.resolveItems(userId, dto);
    if (resolvedItems.length === 0) {
      throw new BadRequestException('Checkout item list is empty');
    }

    const subtotal = resolvedItems.reduce((acc, item) => acc + item.totalPrice, 0);

    // Coupon calculation
    let discountAmount = 0;
    let appliedCoupon: any = undefined;
    if (dto.couponCode) {
      appliedCoupon = await this.couponsService.validateCoupon(
        dto.couponCode,
        subtotal,
        userId,
      );
      if (appliedCoupon.valid) {
        discountAmount = appliedCoupon.discountAmount;
      }
    }

    // Shipping calculation (Free over ₹50,000 or if coupon provides free shipping)
    let shippingCost = 1500;
    if (subtotal >= 50000 || appliedCoupon?.couponType === 'FREE_SHIPPING') {
      shippingCost = 0;
    } else if (dto.shippingOption === 'express') {
      shippingCost = 3000;
    }

    const taxAmount = Math.round(subtotal * 0.18); // 18% GST component
    const total = Math.max(0, subtotal - discountAmount + shippingCost);

    // Build compatibility check if build bundle
    let buildCompatibility: any = undefined;
    if (dto.buildId) {
      buildCompatibility = await this.evaluateBuildCompatibility(dto.buildId);
    }

    const unavailableItems = resolvedItems
      .filter((i) => !i.inStock)
      .map((i) => ({
        productId: i.product.id,
        requestedQty: i.quantity,
        availableQty: i.availableStock,
      }));

    const summaryItems: CheckoutSummaryItem[] = resolvedItems.map((i) => ({
      productId: i.product.id,
      variantId: i.variantId ?? undefined,
      productName: i.product.name,
      brand: i.product.brand?.name || 'Standard',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      inStock: i.inStock,
      availableStock: i.availableStock,
    }));

    return {
      items: summaryItems,
      itemCount: resolvedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal,
      discountAmount,
      shippingCost,
      taxAmount,
      total,
      appliedCoupon,
      isBuildBundle: Boolean(dto.buildId),
      buildCompatibility,
      inventoryAvailable: unavailableItems.length === 0,
      unavailableItems,
    };
  }

  // ── Authoritative 7-Step Checkout Workflow ──────────────────────────────

  async checkout(userId: string, dto: CheckoutOrderDto): Promise<any> {
    this.logger.log(`Starting authoritative checkout for user ${userId}`);

    // 1. Backend retrieves current product prices & resolves items
    const resolvedItems = await this.resolveItems(userId, dto);
    if (resolvedItems.length === 0) {
      throw new BadRequestException('Cannot checkout with an empty list of items');
    }

    // 2. Backend verifies inventory
    const unavailable = resolvedItems.filter((i) => !i.inStock);
    if (unavailable.length > 0) {
      const names = unavailable.map((u) => u.product.name).join(', ');
      throw new ConflictException(
        `Insufficient inventory for: ${names}. Please adjust quantities.`,
      );
    }

    // 3. Backend verifies build compatibility where required
    if (dto.buildId) {
      const compat = await this.evaluateBuildCompatibility(dto.buildId);
      if (compat && compat.status === 'incompatible') {
        throw new BadRequestException(
          'Cannot place order: Selected PC build has critical hardware incompatibilities',
        );
      }
    }

    // 4. Backend calculates final totals
    const subtotal = resolvedItems.reduce((acc, item) => acc + item.totalPrice, 0);

    let discountAmount = 0;
    let validCouponId: string | null = null;
    if (dto.couponCode) {
      const couponResult = await this.couponsService.validateCoupon(
        dto.couponCode,
        subtotal,
        userId,
      );
      if (couponResult.valid) {
        discountAmount = couponResult.discountAmount;
        const couponRecord = await this.db.coupon.findUnique({
          where: { code: dto.couponCode.toUpperCase().trim() },
        });
        if (couponRecord) validCouponId = couponRecord.id;
      }
    }

    let shippingCost = 1500;
    if (subtotal >= 50000 || discountAmount >= 1500 && dto.couponCode?.toUpperCase() === 'FREESHIP') {
      shippingCost = 0;
    } else if (dto.shippingOption === 'express') {
      shippingCost = 3000;
    }

    const taxAmount = Math.round(subtotal * 0.18);
    const total = Math.max(0, subtotal - discountAmount + shippingCost);

    // Resolve / Create Shipping Address
    const shippingAddr = await this.resolveAddress(userId, dto.shippingAddress);

    // 5. Backend creates order & 6. reserves inventory in database transaction
    const orderNumber = `PCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const order = await this.db.$transaction(async (tx) => {
      // 5. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          buildId: dto.buildId ?? null,
          shippingAddressId: shippingAddr.id,
          couponId: validCouponId,
          status: OrderStatus.PENDING,
          currency: 'INR',
          subtotal,
          discountAmount,
          shippingCost,
          taxAmount,
          total,
          notes: JSON.stringify({
            billingAddress: dto.useShippingForBilling ? dto.shippingAddress : (dto.billingAddress || dto.shippingAddress),
            userNotes: dto.notes ?? null,
            isBuildBundle: Boolean(dto.buildId),
          }),
          items: {
            create: resolvedItems.map((item) => ({
              productId: item.product.id,
              variantId: item.variantId ?? null,
              productName: item.product.name,
              variantName: item.product.model || null,
              sku: item.product.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              currency: 'INR',
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 6. Reserve inventory (atomic increment reservedQty)
      for (const item of resolvedItems) {
        const inv = await tx.inventory.findFirst({
          where: {
            productId: item.product.id,
            ...(item.variantId ? { variantId: item.variantId } : {}),
          },
        });

        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              reservedQty: inv.reservedQty + item.quantity,
            },
          });
        }
      }

      // Record coupon usage if applied
      if (validCouponId) {
        await tx.couponUsage.create({
          data: {
            couponId: validCouponId,
            userId,
            orderId: newOrder.id,
          },
        });
        await tx.coupon.update({
          where: { id: validCouponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Clear active cart if checked out from cart
      if (!dto.items && !dto.buildId) {
        const cart = await tx.cart.findFirst({ where: { userId } });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }

      return newOrder;
    });

    this.logger.log(`Created order ${order.orderNumber} with reserved inventory`);

    // 7. Backend creates payment intent
    const paymentIntent = await this.paymentsService.createPaymentIntent(userId, {
      orderId: order.id,
    });

    return {
      order: this.mapToDto(order),
      paymentIntent,
    };
  }

  // ── Backwards Compatible createFromCart ──────────────────────────────────

  async createFromCart(userId: string, createDto: CreateOrderDto): Promise<OrderResponseDto> {
    const cart = await this.cartRepo.findActiveCartByUser(userId);
    const cartItems = (cart as any)?.items;
    if (!cart || !cartItems || cartItems.length === 0) {
      throw new BadRequestException('Cannot create order from an empty cart');
    }

    const checkoutResult = await this.checkout(userId, {
      shippingAddress: {
        firstName: 'Valued',
        lastName: 'Customer',
        line1: 'Primary Address',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'IN',
      },
      useShippingForBilling: true,
    });

    return checkoutResult.order;
  }

  // ── Status Transitions & Inventory Synchronization ───────────────────────

  async updateStatus(
    id: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const currentStatus = order.status;
    const targetStatus = updateDto.status as OrderStatus;

    if (currentStatus === targetStatus) {
      return this.mapToDto(order);
    }

    // Atomic status transition with inventory synchronization
    const updated = await this.db.$transaction(async (tx) => {
      // If cancelling from PENDING, release reserved stock
      if (currentStatus === OrderStatus.PENDING && targetStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          const inv = await tx.inventory.findFirst({
            where: {
              productId: item.productId,
              ...(item.variantId ? { variantId: item.variantId } : {}),
            },
          });
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                reservedQty: Math.max(0, inv.reservedQty - item.quantity),
              },
            });
          }
        }
      }

      // If confirming from PENDING, commit reserved stock
      if (currentStatus === OrderStatus.PENDING && targetStatus === OrderStatus.CONFIRMED) {
        for (const item of order.items) {
          const inv = await tx.inventory.findFirst({
            where: {
              productId: item.productId,
              ...(item.variantId ? { variantId: item.variantId } : {}),
            },
          });
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                quantity: Math.max(0, inv.quantity - item.quantity),
                reservedQty: Math.max(0, inv.reservedQty - item.quantity),
              },
            });
          }
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          status: targetStatus,
          ...(targetStatus === OrderStatus.CANCELLED ? { cancelledAt: new Date() } : {}),
        },
        include: { items: true },
      });
    });

    return this.mapToDto(updated);
  }

  // ── Helper Utilities ─────────────────────────────────────────────────────

  private async resolveItems(
    userId: string,
    input: { items?: any[]; buildId?: string },
  ): Promise<ResolvedItem[]> {
    let rawItems: { productId: string; variantId?: string | undefined; quantity: number }[] = [];

    if (input.items && input.items.length > 0) {
      rawItems = input.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId ?? undefined,
        quantity: i.quantity,
      }));
    } else if (input.buildId) {
      const build = await this.db.build.findUnique({
        where: { id: input.buildId },
        include: { items: true },
      });
      if (!build) {
        throw new NotFoundException(`Build with ID ${input.buildId} not found`);
      }
      rawItems = build.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId ?? undefined,
        quantity: i.quantity,
      }));
    } else {
      // Pull from active cart
      const cart = await this.cartRepo.findActiveCartByUser(userId);
      if (!cart || !cart.items || cart.items.length === 0) {
        return [];
      }
      rawItems = cart.items.map((i: any) => ({
        productId: i.productId,
        variantId: i.variantId ?? undefined,
        quantity: i.quantity,
      }));
    }

    const resolved: ResolvedItem[] = [];

    for (const raw of rawItems) {
      const product = await this.db.product.findUnique({
        where: { id: raw.productId },
        include: {
          brand: true,
          prices: {
            where: { isActive: true },
            orderBy: { amount: 'asc' },
          },
          inventory: true,
          cpuSpec: true,
          gpuSpec: true,
          motherboardSpec: true,
          ramSpec: true,
          storageSpec: true,
          psuSpec: true,
          caseSpec: true,
          coolerSpec: true,
        },
      });

      if (!product || !product.isActive) {
        throw new BadRequestException(
          `Product ${raw.productId} is inactive or no longer in catalog`,
        );
      }

      // Authoritative lowest price from DB (in rupees)
      const pricePaise = product.prices?.[0]?.amount || 1000000;
      const unitPrice = Math.round(Number(pricePaise) / 100);

      // Aggregate available stock across inventory records
      let totalQty = 0;
      let reservedQty = 0;
      const invList = Array.isArray(product.inventory)
        ? product.inventory
        : (product.inventory ? [product.inventory] : []);

      for (const inv of invList) {
        if (!raw.variantId || inv.variantId === raw.variantId) {
          totalQty += inv.quantity || 0;
          reservedQty += inv.reservedQty || 0;
        }
      }
      const availableStock = Math.max(0, totalQty - reservedQty);

      resolved.push({
        product,
        variantId: raw.variantId,
        quantity: raw.quantity,
        unitPrice,
        totalPrice: unitPrice * raw.quantity,
        availableStock,
        inStock: availableStock >= raw.quantity,
      });
    }

    return resolved;
  }

  private async evaluateBuildCompatibility(buildId: string): Promise<any> {
    const build = await this.db.build.findUnique({
      where: { id: buildId },
      include: {
        items: {
          include: {
            product: {
              include: {
                cpuSpec: true,
                gpuSpec: true,
                motherboardSpec: true,
                ramSpec: true,
                storageSpec: true,
                psuSpec: true,
                caseSpec: true,
                coolerSpec: true,
              },
            },
          },
        },
      },
    });

    if (!build) return null;

    const components: BuildComponents = {};

    for (const item of build.items) {
      const p = item.product;
      const specs =
        p.cpuSpec ||
        p.gpuSpec ||
        p.motherboardSpec ||
        p.ramSpec ||
        p.storageSpec ||
        p.psuSpec ||
        p.caseSpec ||
        p.coolerSpec ||
        {};

      const specObj = {
        productId: p.id,
        name: p.name,
        category: this.mapCategory(p.componentType),
        specs,
      };

      switch (p.componentType) {
        case ComponentType.CPU:
          components.cpu = specObj;
          break;
        case ComponentType.MOTHERBOARD:
          components.motherboard = specObj;
          break;
        case ComponentType.GPU:
          components.gpu = specObj;
          break;
        case ComponentType.RAM:
          components.ram = [specObj];
          break;
        case ComponentType.STORAGE:
          components.storage = [specObj];
          break;
        case ComponentType.PSU:
          components.psu = specObj;
          break;
        case ComponentType.CASE:
          components.case = specObj;
          break;
        case ComponentType.COOLER:
          components.cooling = specObj;
          break;
      }
    }

    const result = this.compatibilityService.check(components);
    return {
      status: result.status,
      compatible: result.compatible,
      issuesCount: result.issues?.length || 0,
      warningsCount: result.warnings?.length || 0,
    };
  }

  private async resolveAddress(userId: string, input: any): Promise<any> {
    const existing = await this.db.userAddress.findFirst({
      where: {
        userId,
        line1: input.line1,
        postalCode: input.postalCode,
      },
    });

    if (existing) return existing;

    return this.db.userAddress.create({
      data: {
        userId,
        type: AddressType.HOME,
        firstName: input.firstName || 'Customer',
        lastName: input.lastName || 'User',
        phone: input.phone || null,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country || 'IN',
      },
    });
  }

  private mapCategory(type: ComponentType): ComponentCategory {
    switch (type) {
      case ComponentType.CPU:
        return ComponentCategory.CPU;
      case ComponentType.MOTHERBOARD:
        return ComponentCategory.MOTHERBOARD;
      case ComponentType.RAM:
        return ComponentCategory.RAM;
      case ComponentType.GPU:
        return ComponentCategory.GPU;
      case ComponentType.STORAGE:
        return ComponentCategory.STORAGE;
      case ComponentType.PSU:
        return ComponentCategory.PSU;
      case ComponentType.CASE:
        return ComponentCategory.CASE;
      case ComponentType.COOLER:
        return ComponentCategory.COOLING;
      default:
        return ComponentCategory.OTHER;
    }
  }

  private mapToDto(order: any): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      totalAmount: Number(order.total || order.subtotal || 0),
      status: order.status,
      shippingAddressId: order.shippingAddressId,
      items:
        order.items?.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productVariantId: item.variantId || undefined,
          quantity: item.quantity,
          priceAtPurchase: Number(item.unitPrice || 0),
        })) || [],
      createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: order.updatedAt ? order.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}
