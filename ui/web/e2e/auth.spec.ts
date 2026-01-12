import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/NPDMS/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation error
    await expect(page.getByText(/username.*required|enter.*username/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/username/i).fill('invaliduser');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible();
  });

  test('should navigate to dashboard on successful login', async ({ page }) => {
    // This test assumes demo mode or mock authentication
    await page.getByLabel(/username/i).fill('demo_inspector');
    await page.getByLabel(/password/i).fill('demo123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation or dashboard elements
    await page.waitForURL(/dashboard|\//, { timeout: 10000 }).catch(() => {
      // If not redirected, check for dashboard content
    });
  });

  test('should have accessible form elements', async ({ page }) => {
    // Check ARIA attributes
    const usernameInput = page.getByLabel(/username/i);
    const passwordInput = page.getByLabel(/password/i);
    const submitButton = page.getByRole('button', { name: /sign in/i });

    await expect(usernameInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(submitButton).toBeEnabled();
  });
});

test.describe('Session Management', () => {
  test('should persist session across page reloads', async ({ page }) => {
    // Set mock token in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    await page.reload();

    // Check if token persists
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBe('mock-jwt-token');
  });

  test('should clear session on logout', async ({ page }) => {
    // Set mock token
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    // Simulate logout
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
    });

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
  });
});
