import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { CacheService } from '../common/cache/cache.service';
import { ProductFilterDto, ProductSortBy } from './dto/product-filter.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: jest.Mocked<ProductsRepository>;
  let cache: CacheService;

  const mockProduct = {
    id: 'prod-uuid-1',
    name: 'AMD Ryzen 7 7800X3D',
    slug: 'amd-ryzen-7-7800x3d',
    sku: '100-100000910WOF',
    barcode: '730143314930',
    description: '8-core gaming processor',
    shortDescription: 'Ultimate gaming CPU',
    model: '7800X3D',
    componentType: 'CPU',
    brandId: 'brand-uuid-1',
    brand: { id: 'brand-uuid-1', name: 'AMD', slug: 'amd', logoUrl: null },
    isActive: true,
    isDraft: false,
    isFeatured: true,
    weight: 0.15,
    tags: ['gaming', 'am5'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    categories: [
      {
        categoryId: 'cat-1',
        isPrimary: true,
        category: { id: 'cat-1', name: 'Processors', slug: 'processors' },
      },
    ],
    prices: [
      {
        id: 'price-1',
        amount: 449.99,
        compareAt: 499.99,
        currency: 'USD',
        priceType: 'RETAIL',
        isActive: true,
      },
    ],
    inventory: [
      {
        id: 'inv-1',
        quantity: 20,
        reservedQty: 2,
        lowStockThreshold: 5,
      },
    ],
    images: [
      {
        id: 'img-1',
        productId: 'prod-uuid-1',
        url: 'https://images.example.com/cpu.jpg',
        altText: 'CPU front',
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [],
    cpuSpec: {
      id: 'spec-1',
      productId: 'prod-uuid-1',
      socketType: 'AM5',
      cores: 8,
      threads: 16,
      baseClockMhz: 4200,
      boostClockMhz: 5000,
      tdpW: 120,
      memoryType: 'DDR5',
      maxMemoryGb: 128,
    },
  };

  beforeEach(async () => {
    const mockRepo = {
      findWithFilters: jest.fn(),
      countWithFilters: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findManyByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
      createVariant: jest.fn(),
      updateVariant: jest.fn(),
      deleteVariant: jest.fn(),
      addImage: jest.fn(),
      deleteImage: jest.fn(),
      setPrimaryImage: jest.fn(),
      upsertComponentSpec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        CacheService,
        {
          provide: ProductsRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repo = module.get(ProductsRepository);
    cache = module.get(CacheService);
  });

  afterEach(() => {
    cache.flush();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated list of enriched products', async () => {
      repo.findWithFilters.mockResolvedValue([mockProduct as any]);
      repo.countWithFilters.mockResolvedValue(1);

      const filterDto = new ProductFilterDto();
      filterDto.page = 1;
      filterDto.limit = 20;

      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0]!.name).toBe('AMD Ryzen 7 7800X3D');
      expect(result.data[0]!.price?.amount).toBe(449.99);
      expect(result.data[0]!.price?.discountPercent).toBe(10);
      expect(result.data[0]!.inventory.availableQuantity).toBe(18);
      expect(result.data[0]!.inventory.stockStatus).toBe('IN_STOCK');
      expect(result.data[0]!.specifications?.cores).toBe(8);
    });

    it('should sort in-memory when sortBy is PRICE_ASC or PRICE_DESC', async () => {
      const prodA = { ...mockProduct, id: 'a', prices: [{ amount: 500, isActive: true, priceType: 'RETAIL' }] };
      const prodB = { ...mockProduct, id: 'b', prices: [{ amount: 200, isActive: true, priceType: 'RETAIL' }] };

      repo.findWithFilters.mockResolvedValue([prodA as any, prodB as any]);
      repo.countWithFilters.mockResolvedValue(2);

      const filterAsc = new ProductFilterDto();
      filterAsc.sortBy = ProductSortBy.PRICE_ASC;
      const resAsc = await service.findAll(filterAsc);
      expect(resAsc.data[0]!.price?.amount).toBe(200);
      expect(resAsc.data[1]!.price?.amount).toBe(500);

      cache.flush();
      repo.findWithFilters.mockResolvedValue([prodB as any, prodA as any]);
      const filterDesc = new ProductFilterDto();
      filterDesc.sortBy = ProductSortBy.PRICE_DESC;
      const resDesc = await service.findAll(filterDesc);
      expect(resDesc.data[0]!.price?.amount).toBe(500);
      expect(resDesc.data[1]!.price?.amount).toBe(200);
    });
  });

  describe('findOne & findBySlug', () => {
    it('should return product by id', async () => {
      repo.findById.mockResolvedValue(mockProduct as any);
      const res = await service.findOne('prod-uuid-1');
      expect(res.id).toBe('prod-uuid-1');
    });

    it('should throw NotFoundException if product id not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('should return product by slug', async () => {
      repo.findBySlug.mockResolvedValue(mockProduct as any);
      const res = await service.findBySlug('amd-ryzen-7-7800x3d');
      expect(res.slug).toBe('amd-ryzen-7-7800x3d');
    });

    it('should throw NotFoundException if slug not found', async () => {
      repo.findBySlug.mockResolvedValue(null);
      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create & update', () => {
    it('should create product with generated slug and invalidate cache', async () => {
      repo.findBySlug.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockProduct as any);

      const res = await service.create({
        name: 'AMD Ryzen 7 7800X3D',
        description: 'New processor',
        componentType: 'CPU',
        brandId: 'brand-uuid-1',
        basePrice: 449.99,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AMD Ryzen 7 7800X3D' }),
        'amd-ryzen-7-7800x3d',
      );
      expect(res.id).toBe('prod-uuid-1');
    });

    it('should update product and regenerate slug if name changes', async () => {
      repo.findById.mockResolvedValue(mockProduct as any);
      repo.findBySlug.mockResolvedValue(null);
      repo.update.mockResolvedValue({ ...mockProduct, name: 'AMD Ryzen 7 7800X3D V2' } as any);

      const res = await service.update('prod-uuid-1', {
        name: 'AMD Ryzen 7 7800X3D V2',
      });

      expect(repo.update).toHaveBeenCalledWith(
        'prod-uuid-1',
        { name: 'AMD Ryzen 7 7800X3D V2' },
        'amd-ryzen-7-7800x3d-v2',
      );
      expect(res.name).toBe('AMD Ryzen 7 7800X3D V2');
    });
  });

  describe('publish & archive', () => {
    it('should publish draft product if price exists', async () => {
      repo.findById.mockResolvedValue(mockProduct as any);
      repo.updateStatus.mockResolvedValue({ ...mockProduct, isActive: true, isDraft: false } as any);

      const res = await service.publish('prod-uuid-1');
      expect(repo.updateStatus).toHaveBeenCalledWith('prod-uuid-1', { isActive: true, isDraft: false });
      expect(res.isActive).toBe(true);
    });

    it('should fail to publish if product has no prices', async () => {
      const noPriceProduct = { ...mockProduct, prices: [] };
      repo.findById.mockResolvedValue(noPriceProduct as any);

      await expect(service.publish('prod-uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('should archive product', async () => {
      repo.findById.mockResolvedValue(mockProduct as any);
      repo.updateStatus.mockResolvedValue({ ...mockProduct, isActive: false } as any);

      const res = await service.archive('prod-uuid-1');
      expect(repo.updateStatus).toHaveBeenCalledWith('prod-uuid-1', { isActive: false });
      expect(res.isActive).toBe(false);
    });
  });

  describe('compareProducts', () => {
    const mockProduct2 = {
      ...mockProduct,
      id: 'prod-uuid-2',
      name: 'Intel Core i7-14700K',
      slug: 'intel-core-i7-14700k',
      prices: [{ amount: 409.99, compareAt: 429.99, isActive: true, priceType: 'RETAIL' }],
      cpuSpec: {
        socketType: 'LGA1700',
        cores: 20,
        threads: 28,
        baseClockMhz: 3400,
        boostClockMhz: 5600,
        tdpW: 125,
      },
    };

    it('should return comparison matrix with differences detected', async () => {
      repo.findManyByIds.mockResolvedValue([mockProduct as any, mockProduct2 as any]);

      const res = await service.compareProducts(['prod-uuid-1', 'prod-uuid-2']);

      expect(res.products).toHaveLength(2);
      expect(res.isSameComponentType).toBe(true);
      expect(res.allSpecKeys).toContain('cores');
      expect(res.allSpecKeys).toContain('socketType');
      expect(res.differenceKeys).toContain('cores');
      expect(res.differenceKeys).toContain('socketType');
    });

    it('should reject comparison with less than 2 products', async () => {
      await expect(service.compareProducts(['prod-uuid-1'])).rejects.toThrow(BadRequestException);
    });

    it('should reject comparison with more than 5 products', async () => {
      await expect(
        service.compareProducts(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if any requested product ID does not exist', async () => {
      repo.findManyByIds.mockResolvedValue([mockProduct as any]);

      await expect(service.compareProducts(['prod-uuid-1', 'missing-id'])).rejects.toThrow(NotFoundException);
    });
  });
});
