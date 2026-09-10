import { NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { PricesRepository } from './prices.repository';
import { PricesService } from './prices.service';

describe('PricesService', () => {
  let service: PricesService;
  let repo: jest.Mocked<PricesRepository>;

  const mockRepo = {
    findAllByProduct: jest.fn(),
    countAllByProduct: jest.fn(),
    findCurrentByProduct: jest.fn(),
    getPriceMetrics: jest.fn(),
    recordPriceChange: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        {
          provide: PricesRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PricesService>(PricesService);
    repo = module.get(PricesRepository);
    jest.clearAllMocks();
  });

  describe('getPriceSummary', () => {
    it('should aggregate metrics and return current, lowest, highest prices alongside history', async () => {
      const productId = 'prod-123';
      const now = new Date();
      const earlier = new Date(Date.now() - 86400000 * 10);

      mockRepo.getPriceMetrics.mockResolvedValue({
        currentPrice: 42999,
        lowestPrice: 39999,
        highestPrice: 45999,
        averagePrice: 42999,
        total: 3,
      });

      mockRepo.findAllByProduct.mockResolvedValue([
        {
          id: 'ph-1',
          productId,
          variantId: null,
          amount: 42999,
          currency: 'INR',
          source: 'ADMIN_UPDATE',
          effectiveDate: now,
          endDate: null,
          reason: 'Promotional adjustment',
          isCorrection: false,
          originalAmount: null,
          correctionReason: null,
          correctedBy: null,
          correctedAt: null,
          createdAt: now,
        },
        {
          id: 'ph-2',
          productId,
          variantId: null,
          amount: 39999,
          currency: 'INR',
          source: 'BULK_UPDATE',
          effectiveDate: earlier,
          endDate: now,
          reason: 'Flash sale',
          isCorrection: false,
          originalAmount: null,
          correctionReason: null,
          correctedBy: null,
          correctedAt: null,
          createdAt: earlier,
        },
      ]);

      const result = await service.getPriceSummary(productId, { page: 1, limit: 10 });

      expect(result.productId).toBe(productId);
      expect(result.currentPrice).toBe(42999);
      expect(result.lowestPrice).toBe(39999);
      expect(result.highestPrice).toBe(45999);
      expect(result.averagePrice).toBe(42999);
      expect(result.priceHistory).toHaveLength(2);
      expect(result.priceHistory[0]!.price).toBe(42999);
      expect(result.priceHistory[1]!.endDate).toBe(now.toISOString());
    });
  });

  describe('findCurrentByProduct', () => {
    it('should return the current active price DTO', async () => {
      const productId = 'prod-123';
      const now = new Date();
      mockRepo.findCurrentByProduct.mockResolvedValue({
        id: 'price-1',
        productId,
        variantId: null,
        amount: 29999,
        currency: 'INR',
        source: 'STORE_ACTIVE_PRICE',
        effectiveDate: now,
        endDate: null,
        createdAt: now,
      });

      const result = await service.findCurrentByProduct(productId);
      expect(result.amount).toBe(29999);
      expect(result.currency).toBe('INR');
      expect(result.source).toBe('STORE_ACTIVE_PRICE');
    });

    it('should throw NotFoundException if no price found', async () => {
      mockRepo.findCurrentByProduct.mockResolvedValue(null);
      await expect(service.findCurrentByProduct('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should delegate creation to repository and return formatted DTO', async () => {
      const now = new Date();
      mockRepo.create.mockResolvedValue({
        id: 'ph-new',
        productId: 'prod-123',
        variantId: null,
        amount: 19999,
        currency: 'INR',
        source: 'ADMIN_UPDATE',
        effectiveDate: now,
        endDate: null,
        createdAt: now,
      });

      const result = await service.create({
        productId: 'prod-123',
        amount: 19999,
      });

      expect(result.amount).toBe(19999);
      expect(result.source).toBe('ADMIN_UPDATE');
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });
});
