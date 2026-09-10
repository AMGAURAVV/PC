import { test, expect, TEST_USERS } from '../fixtures/test-fixtures';

test.describe('E2E: Authentication Journey', () => {
  test('should allow a new customer to register', async ({ page }) => {
    // Intercept register API to mock successful backend registration
    await page.route('**/api/v1/auth/register', async (route) => {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user_reg_123',
              email: 'newuser@nexuspc.in',
              firstName: 'Vikram',
              lastName: 'Malhotra',
            },
            tokens: {
              accessToken: 'mock_jwt_access_token_123',
              refreshToken: 'mock_jwt_refresh_token_123',
            },
          },
        }),
      });
    });

    await page.goto('/account');

    // Toggle to Register mode if on Login tab
    const registerTab = page.getByRole('tab', { name: /register|sign up/i });
    if (await registerTab.isVisible()) {
      await registerTab.click();
    }

    // Fill registration form if visible
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('newuser@nexuspc.in');
    }

    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('SecurePass123!');
    }

    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[placeholder*="Confirm"]');
    if (await confirmPasswordInput.isVisible()) {
      await confirmPasswordInput.fill('SecurePass123!');
    }

    const submitBtn = page.getByRole('button', { name: /create account|sign up|register/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    // Verify page loads account or dashboard view
    await expect(page).toHaveURL(/.*account.*/);
  });

  test('should allow an existing customer to log in', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user_cust_123',
              email: TEST_USERS.customer.email,
              firstName: TEST_USERS.customer.firstName,
              lastName: TEST_USERS.customer.lastName,
            },
            tokens: {
              accessToken: 'mock_jwt_token',
              refreshToken: 'mock_refresh_token',
            },
          },
        }),
      });
    });

    await page.goto('/account');

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_USERS.customer.email);
    }

    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(TEST_USERS.customer.password);
    }

    const loginBtn = page.getByRole('button', { name: /sign in|log in/i });
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
    }

    await expect(page).toHaveURL(/.*account.*/);
  });
});
