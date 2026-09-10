import { NotFoundException, ForbiddenException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

describe('CartService (Unit Tests)', () => {
  let service: CartService;
  let cartRepo: jest.Mocked<CartRepository>;

  const mockProduct = {
    id: 'prod_cpu_1',
    name: 'AMD Ryzen 7 7800X3D',
    brand: { name: 'AMD' },
    prices: [{ amount: 3699900 }], // ₹36,999 in paise
    inventory: { quantity: 15 },
  };

  const mockCart = {
    id: 'cart_1',
    userId: 'user_123',
    status: 'ACTIVE',
    updatedAt: new Date('2026-09-10T12:00:00Z'),
    items: [
      {
        id: 'item_1',
        productId: 'prod_cpu_1',
        quantity: 2,
        priceAtAdded: 36999,
        product: mockProduct,
      },
    ],
  };

  beforeEach(async () => {
    const mockRepo = {
      findActiveCartByUser: jest.fn(),
      createCart: jest.fn(),
      addItemToCart: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      findBuildWithItems: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: CartRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepo = module.get(CartRepository);
  });

  describe('getActiveCart and calculations', () => {
    it('calculates unitPrice, totalPrice, and inStock status accurately from live prices in paise', async () => {
      cartRepo.findActiveCartByUser.mockResolvedValue(mockCart as any);

      const result = await service.getActiveCart('user_123');

      expect(result.id).toBe('cart_1');
      expect(result.items).toHaveLength(1);
      const lineItem = result.items[0]!;
      expect(lineItem.unitPrice).toBe(36999);
      expect(lineItem.quantity).toBe(2);
      expect(lineItem.totalPrice).toBe(73998); // 36999 * 2
      expect(lineItem.inStock).toBe(true); // 15 available >= 2 requested
    });

    it('creates a new cart if active cart does not exist for user', async () => {
      cartRepo.findActiveCartByUser.mockResolvedValue(null);
      cartRepo.createCart.mockResolvedValue({ id: 'cart_new', userId: 'user_new', items: [] } as any);

      const result = await service.getActiveCart('user_new');

      expect(cartRepo.createCart).toHaveBeenCalledWith('user_new');
      expect(result.id).toBe('cart_new');
      expect(result.items).toHaveLength(0);
    });

    it('marks inStock as false when item quantity exceeds available inventory', async () => {
      const lowStockProduct = {
        ...mockProduct,
        inventory: { quantity: 1 },
      };
      const cartWithExcessQuantity = {
        ...mockCart,
        items: [
          {
            ...mockCart.items[0],
            quantity: 5,
            product: lowStockProduct,
          },
        ],
      };
      cartRepo.findActiveCartByUser.mockResolvedValue(cartWithExcessQuantity as any);

      const result = await service.getActiveCart('user_123');
      expect(result.items![0]!.inStock).toBe(false);
    });
  });

  describe('addItem', () => {
    it('increments quantity when adding an item already present in cart', async () => {
      cartRepo.findActiveCartByUser
        .mockResolvedValueOnce(mockCart as any) // Initial check
        .mockResolvedValueOnce({
          ...mockCart,
          items: [{ ...mockCart.items[0], quantity: 3 }],
        } as any); // After update

      const result = await service.addItem('user_123', {
        productId: 'prod_cpu_1',
        quantity: 1,
      });

      expect(cartRepo.updateItemQuantity).toHaveBeenCalledWith('item_1', 3);
      expect(result.items![0]!.quantity).toBe(3);
      expect(result.items![0]!.totalPrice).toBe(36999 * 3);
    });

    it('adds fresh item to cart when product is not yet in cart', async () => {
      cartRepo.findActiveCartByUser
        .mockResolvedValueOnce({ ...mockCart, items: [] } as any)
        .mockResolvedValueOnce(mockCart as any);

      await service.addItem('user_123', {
        productId: 'prod_cpu_1',
        quantity: 2,
      });

      expect(cartRepo.addItemToCart).toHaveBeenCalledWith('cart_1', {
        productId: 'prod_cpu_1',
        quantity: 2,
      });
    });
  });

  describe('updateItemQuantity and removeItem', () => {
    it('updates quantity of existing cart item', async () => {
      cartRepo.findActiveCartByUser
        .mockResolvedValueOnce(mockCart as any)
        .mockResolvedValueOnce({
          ...mockCart,
          items: [{ ...mockCart.items[0], quantity: 4 }],
        } as any);

      const result = await service.updateItemQuantity('user_123', 'item_1', { quantity: 4 });
      expect(cartRepo.updateItemQuantity).toHaveBeenCalledWith('item_1', 4);
      expect(result.items![0]!.quantity).toBe(4);
    });

    it('throws NotFoundException when updating non-existent item', async () => {
      cartRepo.findActiveCartByUser.mockResolvedValue(mockCart as any);

      await expect(
        service.updateItemQuantity('user_123', 'item_unknown', { quantity: 2 })
      ).rejects.toThrow(NotFoundException);
    });

    it('removes item from cart and recalculates items list', async () => {
      cartRepo.findActiveCartByUser
        .mockResolvedValueOnce(mockCart as any)
        .mockResolvedValueOnce({ ...mockCart, items: [] } as any);

      const result = await service.removeItem('user_123', 'item_1');
      expect(cartRepo.removeItem).toHaveBeenCalledWith('item_1');
      expect(result.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('clears active cart successfully', async () => {
      cartRepo.findActiveCartByUser.mockResolvedValue(mockCart as any);

      const response = await service.clearCart('user_123');
      expect(cartRepo.clearCart).toHaveBeenCalledWith('cart_1');
      expect(response.message).toBe('Cart cleared successfully');
    });

    it('throws NotFoundException if active cart not found on clear', async () => {
      cartRepo.findActiveCartByUser.mockResolvedValue(null);

      await expect(service.clearCart('user_123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addBuildBundle', () => {
    it('successfully adds entire build bundle to active cart', async () => {
      const mockBuild = {
        id: 'build_1',
        userId: 'user_123',
        isPublic: false,
        items: [
          { productId: 'prod_cpu_1', quantity: 1 },
          { productId: 'prod_gpu_1', quantity: 1 },
        ],
      };

      cartRepo.findBuildWithItems.mockResolvedValue(mockBuild as any);
      cartRepo.findActiveCartByUser
        .mockResolvedValueOnce({ ...mockCart, items: [] } as any)
        .mockResolvedValueOnce({
          ...mockCart,
          items: [
            { id: 'item_1', productId: 'prod_cpu_1', quantity: 1, product: mockProduct },
            { id: 'item_2', productId: 'prod_gpu_1', quantity: 1, product: { ...mockProduct, id: 'prod_gpu_1' } },
          ],
        } as any);

      const result = await service.addBuildBundle('user_123', 'build_1');

      expect(cartRepo.addItemToCart).toHaveBeenCalledTimes(2);
      expect(result.items).toHaveLength(2);
    });

    it('prevents unauthorized access to private build bundles owned by another user', async () => {
      const privateBuild = {
        id: 'build_private',
        userId: 'different_user',
        isPublic: false,
        items: [{ productId: 'prod_cpu_1', quantity: 1 }],
      };

      cartRepo.findBuildWithItems.mockResolvedValue(privateBuild as any);

      await expect(service.addBuildBundle('attacker_user', 'build_private')).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
