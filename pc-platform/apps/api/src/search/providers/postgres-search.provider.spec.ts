import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '@pc-platform/database';

import { PostgresSearchProvider } from './postgres-search.provider';

describe('PostgresSearchProvider', () => {
  let provider: PostgresSearchProvider;
  let mockDb: any;

  const mockProduct = {
    id: 'prod-1',
    name: 'AMD Ryzen 7 7800X3D',
    slug: 'amd-ryzen-7-7800x3d',
    sku: 'AMD-7800X3D-01',
    description: 'Gaming processor with 3D V-Cache',
    model: '7800X3D',
    componentType: 'CPU',
    brandId: 'brand-amd',
    brand: { id: 'brand-amd', name: 'AMD', slug: 'amd' },
    categories: [
      {
        isPrimary: true,
        category: { id: 'cat-cpu', name: 'Processors', slug: 'processors' },
      },
    ],
    prices: [
      {
        id: 'price-1',
        amount: 38999,
        compareAt: 42999,
        currency: 'INR',
        isActive: true,
        priceType: 'RETAIL',
      },
    ],
    inventory: [
      {
        id: 'inv-1',
        quantity: 15,
        reservedQty: 2,
      },
    ],
    images: [
      {
        id: 'img-1',
        url: 'https://example.com/7800x3d.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: [],
    tags: ['am5', 'zen4', 'gaming'],
    isActive: true,
    isDraft: false,
    isFeatured: true,
    cpuSpec: {
      id: 'spec-1',
      socketType: 'AM5',
      architecture: 'Zen 4',
      cores: 8,
      threads: 16,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockDb = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      brand: {
        findMany: jest.fn(),
      },
      category: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresSearchProvider,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    provider = module.get<PostgresSearchProvider>(PostgresSearchProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('search()', () => {
    it('should search products and build multi-field where clause for text query', async () => {
      mockDb.product.findMany
        .mockResolvedValueOnce([mockProduct]) // items
        .mockResolvedValueOnce([
          {
            id: mockProduct.id,
            componentType: mockProduct.componentType,
            brand: mockProduct.brand,
            categories: mockProduct.categories,
            prices: mockProduct.prices,
            inventory: mockProduct.inventory,
            cpuSpec: { socketType: 'AM5' },
            gpuSpec: null,
            motherboardSpec: null,
            ramSpec: null,
          },
        ]); // facet records
      mockDb.product.count.mockResolvedValueOnce(1);

      const result = await provider.search({
        query: '7800X3D',
        page: 1,
        limit: 10,
      });

      expect(mockDb.product.findMany).toHaveBeenCalled();
      const whereArg = mockDb.product.findMany.mock.calls[0][0].where;

      // Checks that OR clause includes name, model, specifications, etc.
      expect(whereArg.OR).toBeDefined();
      expect(whereArg.OR.some((clause: any) => clause.name?.contains === '7800X3D')).toBe(true);
      expect(whereArg.OR.some((clause: any) => clause.cpuSpec?.socketType?.contains === '7800X3D')).toBe(true);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('AMD Ryzen 7 7800X3D');
      expect(result.total).toBe(1);
      expect(result.facets.categories).toEqual([
        { value: 'processors', label: 'Processors', count: 1 },
      ]);
      expect(result.facets.brands).toEqual([
        { value: 'amd', label: 'AMD', count: 1 },
      ]);
      expect(result.facets.priceRange).toEqual({ min: 38999, max: 38999 });
      expect(result.facets.inStockCount).toBe(1);
      expect(result.facets.specifications?.socket).toEqual([
        { value: 'AM5', label: 'AM5', count: 1 },
      ]);
    });

    it('should filter by category and brand slugs', async () => {
      mockDb.product.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockDb.product.count.mockResolvedValueOnce(0);

      await provider.search({
        categorySlugs: ['processors'],
        brandSlugs: ['amd'],
        inStock: true,
        minPrice: 10000,
        maxPrice: 50000,
      });

      const whereArg = mockDb.product.findMany.mock.calls[0][0].where;
      expect(whereArg.categories.some.category.slug.in).toEqual(['processors']);
      expect(whereArg.brand.slug.in).toEqual(['amd']);
      expect(whereArg.inventory.some.quantity.gt).toBe(0);
      expect(whereArg.prices.some.amount.gte).toBe(10000);
      expect(whereArg.prices.some.amount.lte).toBe(50000);
    });

    it('should sort by price_asc in-memory', async () => {
      const p1 = { ...mockProduct, id: 'p1', prices: [{ amount: 40000, isActive: true, priceType: 'RETAIL' }] };
      const p2 = { ...mockProduct, id: 'p2', prices: [{ amount: 20000, isActive: true, priceType: 'RETAIL' }] };

      mockDb.product.findMany
        .mockResolvedValueOnce([p1, p2])
        .mockResolvedValueOnce([]);
      mockDb.product.count.mockResolvedValueOnce(2);

      const result = await provider.search({
        sortBy: 'price_asc',
      });

      expect(result.items[0]?.price?.amount).toBe(20000);
      expect(result.items[1]?.price?.amount).toBe(40000);
    });
  });

  describe('suggest()', () => {
    it('should return brand, category, and product suggestions', async () => {
      mockDb.brand.findMany.mockResolvedValueOnce([
        { id: 'b1', name: 'AMD', slug: 'amd' },
      ]);
      mockDb.category.findMany.mockResolvedValueOnce([
        { id: 'c1', name: 'Processors', slug: 'processors' },
      ]);
      mockDb.product.findMany.mockResolvedValueOnce([
        {
          id: 'p1',
          name: 'AMD Ryzen 7 7800X3D',
          slug: 'amd-ryzen-7-7800x3d',
          componentType: 'CPU',
          prices: [{ amount: 38999, priceType: 'RETAIL', isActive: true }],
          categories: [{ category: { name: 'Processors' } }],
        },
      ]);

      const suggestions = await provider.suggest('amd', 5);

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toEqual({
        id: 'b1',
        title: 'AMD',
        type: 'brand',
        slug: 'amd',
      });
      expect(suggestions[1]).toEqual({
        id: 'c1',
        title: 'Processors',
        type: 'category',
        slug: 'processors',
      });
      expect(suggestions[2]).toEqual({
        id: 'p1',
        title: 'AMD Ryzen 7 7800X3D',
        type: 'product',
        slug: 'amd-ryzen-7-7800x3d',
        category: 'Processors',
        price: 38999,
      });
    });

    it('should return empty array for empty query', async () => {
      const suggestions = await provider.suggest('   ');
      expect(suggestions).toEqual([]);
      expect(mockDb.brand.findMany).not.toHaveBeenCalled();
    });
  });
});
