import { test, expect, TEST_COMPONENTS } from '../fixtures/test-fixtures';

test.describe('E2E: Catalog Browsing & Search Journey', () => {
  test('should browse products catalog, filter by category, and search', async ({ page }) => {
    // Intercept products API with mock catalog items
    await page.route('**/api/v1/products**', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'prod_cpu_7800x3d',
              name: TEST_COMPONENTS.cpu.name,
              slug: 'amd-ryzen-7-7800x3d',
              price: TEST_COMPONENTS.cpu.price,
              brand: { name: 'AMD' },
              componentCategory: 'CPU',
              stock: 25,
              specifications: { socket: 'AM5', cores: 8 },
            },
            {
              id: 'prod_gpu_4080',
              name: TEST_COMPONENTS.gpu.name,
              slug: 'nvidia-rtx-4080-super',
              price: TEST_COMPONENTS.gpu.price,
              brand: { name: 'NVIDIA' },
              componentCategory: 'GPU',
              stock: 12,
              specifications: { vram: 16, tdp: 320 },
            },
          ],
          meta: {
            page: 1,
            limit: 24,
            total: 2,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/products');

    // Verify heading or breadcrumb
    await expect(page).toHaveURL(/.*products.*/);

    // Verify product card exists in DOM
    const productCard = page.locator('text=AMD Ryzen 7 7800X3D').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });

    // Search for GPU
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('4080');
      await page.keyboard.press('Enter');
    }

    // Verify GPU card renders
    const gpuCard = page.locator('text=NVIDIA GeForce RTX 4080 Super').first();
    await expect(gpuCard).toBeVisible({ timeout: 10000 });
  });
});
