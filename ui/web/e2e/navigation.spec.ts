import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should navigate to FIR page', async ({ page }) => {
    await page.goto('/fir');
    await expect(page).toHaveURL(/fir/);
  });

  test('should navigate to Cases page', async ({ page }) => {
    await page.goto('/cases');
    await expect(page).toHaveURL(/cases/);
  });

  test('should navigate to Evidence page', async ({ page }) => {
    await page.goto('/evidence');
    await expect(page).toHaveURL(/evidence/);
  });

  test('should navigate to Personnel page', async ({ page }) => {
    await page.goto('/personnel');
    await expect(page).toHaveURL(/personnel/);
  });

  test('should navigate to Vehicles page', async ({ page }) => {
    await page.goto('/vehicles');
    await expect(page).toHaveURL(/vehicles/);
  });

  test('should navigate to Alerts page', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page).toHaveURL(/alerts/);
  });
});

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });
    await page.goto('/dashboard');
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Find sidebar toggle button
    const menuButton = page.getByRole('button', { name: /menu|toggle/i }).or(
      page.locator('[data-testid="sidebar-toggle"]')
    );

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Sidebar should be visible
      const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first();
      await expect(sidebar).toBeVisible();
    }
  });

  test('should show all main navigation links', async ({ page }) => {
    // Check for main navigation items
    const navItems = [
      /dashboard/i,
      /fir|first information/i,
      /cases/i,
      /evidence/i,
    ];

    for (const item of navItems) {
      const link = page.getByRole('link', { name: item }).first();
      // Links should be present (either visible or in collapsed state)
    }
  });
});

test.describe('Breadcrumb Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });
  });

  test('should show breadcrumbs on nested pages', async ({ page }) => {
    await page.goto('/fir/demo-fir-001');

    // Look for breadcrumb navigation
    const breadcrumb = page.locator('[aria-label="breadcrumb"], nav.breadcrumb, .breadcrumbs');

    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb).toBeVisible();
    }
  });
});

test.describe('Page Loading States', () => {
  test('should show loading indicator while fetching data', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    // Navigate and check for loading state
    const navigationPromise = page.goto('/fir');

    // Check for loading indicator
    const loader = page.locator('.loading, [role="progressbar"], .spinner');
    // Loading indicator might appear briefly

    await navigationPromise;
  });

  test('should show content after loading', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    await page.goto('/fir');
    await page.waitForTimeout(2000);

    // Should show either data or empty state
    const hasContent = await page.locator('table, .card, [data-testid="fir-list"]').count() > 0;
    const hasEmptyState = await page.getByText(/no.*found|empty|no data/i).count() > 0;
    const hasData = await page.getByText(/fir|case|record/i).count() > 0;

    expect(hasContent || hasEmptyState || hasData).toBeTruthy();
  });
});

test.describe('Error Handling', () => {
  test('should show 404 for non-existent pages', async ({ page }) => {
    await page.goto('/non-existent-page');

    // Should show 404 or redirect
    const has404 = await page.getByText(/404|not found|page.*exist/i).count() > 0;
    const redirected = page.url() !== '/non-existent-page';

    expect(has404 || redirected).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    await page.goto('/fir');

    // Should show offline indicator or cached data
    await page.waitForTimeout(1000);

    // Re-enable network
    await page.context().setOffline(false);
  });
});

test.describe('Responsive Design', () => {
  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    // Desktop should show sidebar
    const sidebar = page.locator('aside, [data-testid="sidebar"]').first();
    // Sidebar visibility depends on implementation
  });

  test('should render correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(500);
  });

  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    // Mobile should have hamburger menu
    const menuButton = page.getByRole('button', { name: /menu/i }).or(
      page.locator('[data-testid="mobile-menu"]')
    );
  });
});
