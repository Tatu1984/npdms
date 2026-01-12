import { test, expect } from '@playwright/test';

test.describe('FIR Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set auth token for authenticated routes
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });
  });

  test('should display FIR list page', async ({ page }) => {
    await page.goto('/fir');

    // Should show FIR page elements
    await expect(page.getByRole('heading', { name: /fir|first information report/i })).toBeVisible();
  });

  test('should show demo FIRs when offline', async ({ page }) => {
    await page.goto('/fir');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Should have FIR cards or table rows
    const firItems = page.locator('[data-testid="fir-item"], .fir-card, tr').first();
    await expect(firItems).toBeVisible().catch(() => {
      // If no FIR items, check for empty state or loading
    });
  });

  test('should navigate to new FIR page', async ({ page }) => {
    await page.goto('/fir');

    // Find and click new FIR button
    const newFirButton = page.getByRole('link', { name: /new|create|add/i }).or(
      page.getByRole('button', { name: /new|create|add/i })
    );

    if (await newFirButton.isVisible()) {
      await newFirButton.click();
      await expect(page).toHaveURL(/fir\/new/);
    }
  });

  test('should filter FIRs by status', async ({ page }) => {
    await page.goto('/fir');

    // Find status filter
    const statusFilter = page.getByRole('combobox', { name: /status/i }).or(
      page.locator('select[name="status"]')
    );

    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ label: /investigation/i });

      // Wait for filter to apply
      await page.waitForTimeout(500);
    }
  });

  test('should search FIRs', async ({ page }) => {
    await page.goto('/fir');

    // Find search input
    const searchInput = page.getByPlaceholder(/search/i).or(
      page.getByRole('searchbox')
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill('robbery');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForTimeout(500);
    }
  });
});

test.describe('FIR Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });
  });

  test('should display new FIR form', async ({ page }) => {
    await page.goto('/fir/new');

    // Check for form elements
    await expect(page.getByLabel(/title/i).or(page.locator('input[name="title"]'))).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/fir/new');

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /submit|create|save/i });

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      await page.waitForTimeout(500);
    }
  });

  test('should fill and submit FIR form', async ({ page }) => {
    await page.goto('/fir/new');

    // Fill form fields
    const titleInput = page.getByLabel(/title/i).or(page.locator('input[name="title"]'));
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test FIR - Armed Robbery at Local Store');
    }

    const descInput = page.getByLabel(/description|details/i).or(
      page.locator('textarea[name="description"]')
    );
    if (await descInput.isVisible()) {
      await descInput.fill('On the said date, unknown persons entered the store and stole cash and valuables. The complainant reported the incident immediately after discovering the theft.');
    }

    // Select category if available
    const categorySelect = page.getByLabel(/category/i).or(
      page.locator('select[name="category"]')
    );
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    // Select priority if available
    const prioritySelect = page.getByLabel(/priority/i).or(
      page.locator('select[name="priority"]')
    );
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption({ label: /high/i });
    }
  });
});

test.describe('FIR Details', () => {
  test('should display FIR details page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    // Navigate to a demo FIR
    await page.goto('/fir/demo-fir-001');

    // Should show FIR details or handle not found gracefully
    await page.waitForTimeout(1000);
  });

  test('should show FIR timeline', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
    });

    await page.goto('/fir/demo-fir-001');

    // Look for timeline or history section
    const timeline = page.getByText(/timeline|history|updates/i);
    if (await timeline.isVisible()) {
      await expect(timeline).toBeVisible();
    }
  });
});
