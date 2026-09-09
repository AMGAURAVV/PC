import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductFilterDto } from './dto/product-filter.dto';
import { PaginatedResponse } from '../common/dto/response.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  const mockProductResponse = {
    id: 'prod-uuid-1',
    name: 'AMD Ryzen 7 7800X3D',
    slug: 'amd-ryzen-7-7800x3d',
    sku: '100-100000910WOF',
    componentType: 'CPU',
    brand: { id: 'brand-1', name: 'AMD', slug: 'amd' },
    price: { amount: 449.99, compareAt: 499.99, currency: 'USD', priceType: 'RETAIL', discountPercent: 10 },
    inventory: { inStock: true, totalQuantity: 10, reservedQuantity: 0, availableQuantity: 10, stockStatus: 'IN_STOCK' },
    categories: [],
    images: [],
    variants: [],
    tags: ['cpu'],
    isActive: true,
    isDraft: false,
    isFeatured: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      publish: jest.fn(),
      archive: jest.fn(),
      remove: jest.fn(),
      compareProducts: jest.fn(),
      addVariant: jest.fn(),
      updateVariant: jest.fn(),
      removeVariant: jest.fn(),
      addImage: jest.fn(),
      removeImage: jest.fn(),
      setPrimaryImage: jest.fn(),
      upsertSpecification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to productsService.findAll', async () => {
      const filter = new ProductFilterDto();
      filter.cpuSocket = 'AM5';
      service.findAll.mockResolvedValue(PaginatedResponse.ok([mockProductResponse as any], 1, 20, 1));

      const res = await controller.findAll(filter);
      expect(service.findAll).toHaveBeenCalledWith(filter);
      expect(res.data).toHaveLength(1);
    });
  });

  describe('compareProducts', () => {
    it('should delegate to productsService.compareProducts', async () => {
      const mockComparison = {
        products: [mockProductResponse as any],
        allSpecKeys: ['cores'],
        differenceKeys: [],
        isSameComponentType: true,
      };
      service.compareProducts.mockResolvedValue(mockComparison);

      const res = await controller.compareProducts({ ids: ['id-1', 'id-2'] });
      expect(service.compareProducts).toHaveBeenCalledWith(['id-1', 'id-2']);
      expect(res.isSameComponentType).toBe(true);
    });
  });

  describe('create, update, publish, archive, remove', () => {
    it('should call create', async () => {
      service.create.mockResolvedValue(mockProductResponse as any);
      const dto = {
        name: 'New CPU',
        description: 'Desc',
        componentType: 'CPU',
        brandId: 'b1',
        basePrice: 299.99,
      };
      const res = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(res.id).toBe('prod-uuid-1');
    });

    it('should call update', async () => {
      service.update.mockResolvedValue(mockProductResponse as any);
      const res = await controller.update('prod-uuid-1', { name: 'Updated' });
      expect(service.update).toHaveBeenCalledWith('prod-uuid-1', { name: 'Updated' });
      expect(res.id).toBe('prod-uuid-1');
    });

    it('should call publish', async () => {
      service.publish.mockResolvedValue({ ...mockProductResponse, isActive: true } as any);
      const res = await controller.publish('prod-uuid-1');
      expect(service.publish).toHaveBeenCalledWith('prod-uuid-1');
      expect(res.isActive).toBe(true);
    });

    it('should call archive', async () => {
      service.archive.mockResolvedValue({ ...mockProductResponse, isActive: false } as any);
      const res = await controller.archive('prod-uuid-1');
      expect(service.archive).toHaveBeenCalledWith('prod-uuid-1');
      expect(res.isActive).toBe(false);
    });

    it('should call remove', async () => {
      service.remove.mockResolvedValue({ message: 'Product archived successfully' });
      const res = await controller.remove('prod-uuid-1');
      expect(service.remove).toHaveBeenCalledWith('prod-uuid-1');
      expect(res.message).toBe('Product archived successfully');
    });
  });

  describe('variants & images', () => {
    it('should add variant', async () => {
      service.addVariant.mockResolvedValue({ id: 'v1' } as any);
      const res = await controller.addVariant('prod-1', { name: 'Variant 1', sku: 'V1' });
      expect(service.addVariant).toHaveBeenCalledWith('prod-1', { name: 'Variant 1', sku: 'V1' });
      expect(res.id).toBe('v1');
    });

    it('should add image', async () => {
      service.addImage.mockResolvedValue({ id: 'img-1' } as any);
      const res = await controller.addImage('prod-1', { url: 'https://img.com/1.jpg' });
      expect(service.addImage).toHaveBeenCalledWith('prod-1', { url: 'https://img.com/1.jpg' });
      expect(res.id).toBe('img-1');
    });

    it('should upsert component spec', async () => {
      service.upsertSpecification.mockResolvedValue({ id: 'spec-1' } as any);
      const res = await controller.upsertSpecification('prod-1', 'CPU', { cores: 8 });
      expect(service.upsertSpecification).toHaveBeenCalledWith('prod-1', 'CPU', { cores: 8 });
      expect(res.id).toBe('spec-1');
    });
  });
});
