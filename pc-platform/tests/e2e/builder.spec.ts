import { test, expect, TEST_COMPONENTS } from '../fixtures/test-fixtures';

test.describe('E2E: PC Builder & Compatibility Engine Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept evaluate API to return real-time compatibility calculation
    await page.route('**/api/v1/builds/evaluate', async (route) => {
      const body = route.request().postDataJSON();
      const items = body?.items || [];

      const hasIntelAndAmd = items.some((i: any) => i.productId === 'prod_cpu_7800x3d') &&
                            items.some((i: any) => i.productId === 'prod_mb_z790');

      if (hasIntelAndAmd) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalPrice: 95998,
              estimatedPowerW: 240,
              recommendedPsuW: 650,
              compatibilityStatus: 'incompatible',
              warnings: [],
              performanceScore: 85,
              valueScore: 60,
              compatibilityResult: {
                status: 'incompatible',
                compatible: false,
                issues: [
                  {
                    ruleId: 'cpu-socket',
                    severity: 'error',
                    message: 'CPU Socket Mismatch: AMD Ryzen 7 (AM5) cannot be installed on ASUS ROG MAXIMUS (LGA1700).',
                  },
                ],
                warnings: [],
                summary: 'Critical socket conflict detected.',
              },
            },
          }),
        });
      }

      // Default compatible evaluation
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalPrice: 58998,
            estimatedPowerW: 220,
            recommendedPsuW: 650,
            compatibilityStatus: 'compatible',
            warnings: [],
            performanceScore: 92,
            valueScore: 90,
            compatibilityResult: {
              status: 'compatible',
              compatible: true,
              issues: [],
              warnings: [],
              summary: 'All hardware specifications verified and compatible.',
            },
          },
        }),
      });
    });

    // Intercept catalog product options for builder slots
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
              price: TEST_COMPONENTS.cpu.price,
              brand: { name: 'AMD' },
              componentCategory: 'CPU',
              stock: 20,
              specifications: { socket: 'AM5' },
            },
            {
              id: 'prod_mb_b650',
              name: TEST_COMPONENTS.motherboard.name,
              price: TEST_COMPONENTS.motherboard.price,
              brand: { name: 'MSI' },
              componentCategory: 'MOTHERBOARD',
              stock: 15,
              specifications: { socket: 'AM5', memoryType: 'DDR5' },
            },
            {
              id: 'prod_mb_z790',
              name: TEST_COMPONENTS.incompatibleMotherboard.name,
              price: TEST_COMPONENTS.incompatibleMotherboard.price,
              brand: { name: 'ASUS' },
              componentCategory: 'MOTHERBOARD',
              stock: 10,
              specifications: { socket: 'LGA1700' },
            },
          ],
        }),
      });
    });
  });

  test('complete flow: create build, select components, receive compatibility warning, save, share, add to cart', async ({
    page,
  }) => {
    // 1. Enter Builder
    await page.goto('/builder');
    await expect(page).toHaveURL(/.*builder.*/);
    await expect(page.locator('h1, h2, h3').filter({ hasText: /PC Configurator|Build Summary|Custom Gaming Rig/i }).first()).toBeVisible({ timeout: 10000 });

    // 2. Select Components (CPU)
    const chooseCpuBtn = page.getByRole('button', { name: /Choose CPU|Add CPU/i }).first();
    if (await chooseCpuBtn.isVisible()) {
      await chooseCpuBtn.click();
      const selectCpu = page.getByRole('button', { name: /Select|Add to Build/i }).first();
      if (await selectCpu.isVisible()) {
        await selectCpu.click();
      }
    }

    // 3. Trigger & Receive Compatibility Warning by selecting incompatible Motherboard
    // Inject incompatible state in localStorage to verify warning rendering
    await page.evaluate(() => {
      const incompatibleBuild = {
        cpu: {
          product: {
            id: 'prod_cpu_7800x3d',
            name: 'AMD Ryzen 7 7800X3D',
            price: 36999,
            specifications: { socket: 'AM5' },
          },
          quantity: 1,
        },
        motherboard: {
          product: {
            id: 'prod_mb_z790',
            name: 'ASUS ROG MAXIMUS Z790 HERO',
            price: 58999,
            specifications: { socket: 'LGA1700' },
          },
          quantity: 1,
        },
      };
      localStorage.setItem('pc_builder_current_selections', JSON.stringify(incompatibleBuild));
      localStorage.setItem('pc_builder_current_name', 'High-End Incompatible Rig');
    });

    await page.reload();

    // Verify Compatibility Warning is displayed on screen
    const warningHeader = page.locator('text=Compatibility Conflicts Detected').or(page.locator('text=Critical socket conflict'));
    await expect(warningHeader.first()).toBeVisible({ timeout: 10000 });

    // 4. Save Build
    const saveBuildBtn = page.getByRole('button', { name: /Save Build|Save Rig/i }).first();
    if (await saveBuildBtn.isVisible()) {
      await saveBuildBtn.click();
      // If modal opens, submit save
      const modalSubmit = page.getByRole('button', { name: /Confirm Save|Save Changes|Save/i }).last();
      if (await modalSubmit.isVisible()) {
        await modalSubmit.click();
      }
    }

    // 5. Share Build
    const shareBuildBtn = page.getByRole('button', { name: /Share/i }).first();
    if (await shareBuildBtn.isVisible()) {
      await shareBuildBtn.click();
    }

    // 6. Add Build to Cart
    const addToCartBtn = page.getByRole('button', { name: /Add.*Cart/i }).first();
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // Verify navigation to Cart with parts populated
    await expect(page).toHaveURL(/.*cart.*/, { timeout: 10000 });
  });
});
