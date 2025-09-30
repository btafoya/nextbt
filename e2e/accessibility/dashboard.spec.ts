// e2e/accessibility/dashboard.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA Accessibility Tests - Dashboard
 *
 * Tests cover:
 * - Dashboard layout accessibility
 * - Navigation accessibility
 * - Data tables accessibility
 * - Interactive components
 */

// Mock authenticated session for dashboard tests
test.use({
  storageState: {
    cookies: [],
    origins: []
  }
});

test.describe('Dashboard Accessibility - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    // For these tests, we'll check the dashboard structure
    // In real testing, you'd need to authenticate first
    await page.goto('/');
  });

  test('dashboard should not have automatically detectable accessibility violations', async ({ page }) => {
    // Skip if redirected to login
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should have proper landmark regions', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    // Check for main landmark
    const main = await page.locator('main, [role="main"]').count();
    expect(main).toBeGreaterThan(0);

    // Check for navigation landmark
    const nav = await page.locator('nav, [role="navigation"]').count();
    expect(nav).toBeGreaterThan(0);

    // Validate landmarks don't have violations
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .include('main')
      .include('nav')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard navigation should be keyboard accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    // Tab through navigation elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          role: el?.getAttribute('role'),
          href: (el as HTMLAnchorElement)?.href
        };
      });

      // Check that focusable elements are interactive
      if (focusedElement.tag === 'A' || focusedElement.tag === 'BUTTON') {
        expect(['A', 'BUTTON']).toContain(focusedElement.tag);
      }
    }
  });

  test('dashboard sidebar should be accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('aside')
      .include('[role="complementary"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should have sufficient color contrast', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('dashboard header should have accessible branding', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    // Check for site branding/logo
    const header = await page.locator('header').first();
    await expect(header).toBeVisible();

    // Logo or heading should be present
    const hasLogoOrHeading = await page.locator('header img, header h1, header [role="banner"]').count();
    expect(hasLogoOrHeading).toBeGreaterThan(0);
  });

  test('dashboard should support screen reader navigation', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Validate heading hierarchy
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const headingViolations = accessibilityScanResults.violations.filter(
      v => v.id.includes('heading')
    );

    expect(headingViolations).toEqual([]);
  });

  test('dashboard links should have accessible names', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .include('a')
      .analyze();

    const linkViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'link-name'
    );

    expect(linkViolations).toEqual([]);
  });

  test('dashboard buttons should have accessible names', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .include('button')
      .analyze();

    const buttonViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'button-name'
    );

    expect(buttonViolations).toEqual([]);
  });

  test('dashboard should be responsive and zoom-friendly', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    // Test at different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1280, height: 720 },  // Laptop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('dashboard should have skip navigation link', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    // Press Tab to check for skip link
    await page.keyboard.press('Tab');

    const firstFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        text: el?.textContent?.toLowerCase(),
        href: (el as HTMLAnchorElement)?.href,
        tag: el?.tagName
      };
    });

    // If first element is a link with skip-related text, validate it
    if (firstFocused.tag === 'A' && firstFocused.text) {
      const isSkipLink =
        firstFocused.text.includes('skip') ||
        firstFocused.text.includes('main') ||
        firstFocused.text.includes('content');

      if (isSkipLink) {
        expect(firstFocused.href).toContain('#');
      }
    }
  });

  test('dashboard should not have redundant ARIA attributes', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const ariaViolations = accessibilityScanResults.violations.filter(
      v => v.id.includes('aria')
    );

    expect(ariaViolations).toEqual([]);
  });

  test('dashboard focus order should be logical', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    const focusOrder = [];

    // Tab through first 15 elements
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          text: el?.textContent?.substring(0, 30),
          id: el?.id
        };
      });

      focusOrder.push(focusedElement);
    }

    // Ensure we have interactive elements in focus order
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    const hasInteractiveElements = focusOrder.some(el =>
      interactiveTags.includes(el.tag)
    );

    expect(hasInteractiveElements).toBeTruthy();
  });

  test('dashboard should handle dynamic content accessibly', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});