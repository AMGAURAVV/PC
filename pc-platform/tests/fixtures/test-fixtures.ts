import { test as base, Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TestAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const TEST_USERS = {
  customer: {
    email: 'test.customer@nexuspc.in',
    password: 'Password123!',
    firstName: 'Arjun',
    lastName: 'Verma',
  },
  admin: {
    email: 'admin.lead@nexuspc.in',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'Lead',
  },
};

export const TEST_SHIPPING_ADDRESS: TestAddress = {
  fullName: 'Gaurav Sharma',
  phone: '+91 98765 43210',
  email: 'gaurav.sharma@example.com',
  addressLine1: 'Flat 402, Quantum Towers, Cyber City',
  addressLine2: 'Phase II, Hitec City',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500081',
  country: 'India',
};

export const TEST_COMPONENTS = {
  cpu: {
    name: 'AMD Ryzen 7 7800X3D',
    price: 36999,
    socket: 'AM5',
    category: 'cpu',
  },
  motherboard: {
    name: 'MSI MAG B650 TOMAHAWK WIFI',
    price: 21999,
    socket: 'AM5',
    category: 'motherboard',
  },
  incompatibleMotherboard: {
    name: 'ASUS ROG MAXIMUS Z790 HERO',
    price: 58999,
    socket: 'LGA1700',
    category: 'motherboard',
  },
  ram: {
    name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
    price: 10499,
    category: 'memory',
  },
  gpu: {
    name: 'NVIDIA GeForce RTX 4080 Super',
    price: 102999,
    category: 'gpu',
  },
  storage: {
    name: 'Samsung 990 PRO 2TB NVMe SSD',
    price: 16999,
    category: 'storage',
  },
  psu: {
    name: 'Corsair RM850x 850W Gold',
    price: 12499,
    category: 'psu',
  },
  underpoweredPsu: {
    name: 'Corsair CV450 450W Bronze',
    price: 3499,
    category: 'psu',
  },
  case: {
    name: 'Lian Li LANCOOL 216',
    price: 8499,
    category: 'case',
  },
};

/**
 * CRITICAL SAFETY REQUIREMENT:
 * Ensures ZERO real payments occur in test environments.
 * Intercepts all outgoing payment gateway and checkout calls,
 * mocking simulated responses.
 */
export async function setupPaymentMock(page: Page) {
  // Block any live external Razorpay / Stripe CDN scripts or payment domains
  await page.route(/(razorpay|stripe|paypal|cashfree)\.com/, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.Razorpay = function() { return { open: function() {}, on: function() {} }; };',
    });
  });

  // Mock internal payment intent creation
  await page.route('**/api/v1/payments/**', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            paymentIntentId: 'pi_mock_e2e_sandbox_123',
            clientSecret: 'cs_mock_secret_test_456',
            orderId: 'order_mock_test_789',
            amount: 216993,
            currency: 'INR',
            provider: 'MOCK_SANDBOX_GATEWAY',
            isSandbox: true,
          },
        }),
      });
    }
    return route.continue();
  });

  // Mock order checkout endpoint
  await page.route('**/api/v1/orders/checkout', async (route) => {
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          order: {
            id: 'order_e2e_' + Date.now(),
            orderNumber: 'PCP-2026-MOCK-' + Math.floor(1000 + Math.random() * 9000),
            status: 'CONFIRMED',
            subtotal: 216993,
            totalAmount: 216993,
          },
          paymentIntent: {
            isSandbox: true,
            provider: 'MOCK_SANDBOX_GATEWAY',
          },
        },
      }),
    });
  });
}

/**
 * Custom Playwright test fixture extending base test with mock payment safety
 */
export const test = base.extend<{
  mockPayments: void;
}>({
  mockPayments: [
    async ({ page }, use) => {
      await setupPaymentMock(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
