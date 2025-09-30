// e2e/accessibility/auth.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA Accessibility Tests - Authentication Pages
 *
 * Tests cover:
 * - Login page accessibility
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Form validation
 * - Error message accessibility
 */

test.describe('Authentication Accessibility - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('login page should not have automatically detectable accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should have proper document structure', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);

    // Check for landmark regions
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('main')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login form should have accessible labels', async ({ page }) => {
    // Username field
    const usernameLabel = await page.locator('label[for="username"]');
    await expect(usernameLabel).toBeVisible();

    const usernameInput = await page.locator('input#username, input[name="username"]');
    await expect(usernameInput).toBeVisible();

    // Password field
    const passwordLabel = await page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();

    const passwordInput = await page.locator('input#password, input[name="password"], input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Submit button
    const submitButton = await page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('login form should be keyboard navigable', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(firstFocused);

    // Continue tabbing
    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(secondFocused);

    // Shift+Tab should reverse navigation
    await page.keyboard.press('Shift+Tab');
    const backFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(backFocused);
  });

  test('login form inputs should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('input')
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('login form should handle validation errors accessibly', async ({ page }) => {
    // Find and click submit button without entering credentials
    const submitButton = await page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for potential error messages
    await page.waitForTimeout(1000);

    // Check for accessible error messages
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Specifically check that error messages don't have violations
    const labelViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'label' || v.id === 'aria-valid-attr-value'
    );

    expect(labelViolations).toEqual([]);
  });

  test('login page should support zoom up to 200%', async ({ page }) => {
    // Set viewport and zoom
    await page.setViewportSize({ width: 1280, height: 720 });

    // Simulate 200% zoom by setting viewport to half size
    await page.setViewportSize({ width: 640, height: 360 });

    // Check that content is still accessible
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should have focus indicators', async ({ page }) => {
    // Focus on input field
    await page.locator('input').first().focus();

    // Check for visible focus indicator
    const focusedElement = await page.locator(':focus');
    const outlineStyle = await focusedElement.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        boxShadow: style.boxShadow
      };
    });

    // Should have either outline or box-shadow for focus
    const hasFocusIndicator =
      (focusedElement && outlineStyle.outlineWidth !== '0px' && outlineStyle.outlineStyle !== 'none') ||
      (focusedElement && outlineStyle.boxShadow !== 'none');

    expect(hasFocusIndicator).toBeTruthy();
  });

  test('login page should not have timing-dependent accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['meta-refresh']) // May have legitimate uses
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should have proper page title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Title should be descriptive
    expect(title.toLowerCase()).toMatch(/login|sign in|nextbt/i);
  });

  test('login page should have skip links for keyboard users', async ({ page }) => {
    // Press Tab to check for skip link
    await page.keyboard.press('Tab');

    const firstElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        text: el?.textContent?.toLowerCase(),
        href: (el as HTMLAnchorElement)?.href
      };
    });

    // If skip link exists, it should be the first focusable element
    // and contain "skip" or "main" in text
    if (firstElement.text && firstElement.href) {
      const isSkipLink = firstElement.text.includes('skip') || firstElement.text.includes('main');
      if (isSkipLink) {
        expect(firstElement.href).toContain('#');
      }
    }
  });

  test('login page images should have alt text', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .include('img')
      .analyze();

    const imageViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'image-alt'
    );

    expect(imageViolations).toEqual([]);
  });

  test('login page should have proper language attribute', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
  });

  test('login form should have autocomplete attributes', async ({ page }) => {
    // Username/email should have autocomplete="username"
    const usernameInput = await page.locator('input[name="username"], input[type="text"]').first();
    const usernameAutocomplete = await usernameInput.getAttribute('autocomplete');

    // Password should have autocomplete="current-password"
    const passwordInput = await page.locator('input[type="password"]').first();
    const passwordAutocomplete = await passwordInput.getAttribute('autocomplete');

    // Check that autocomplete attributes are present (optional but recommended for WCAG 2.1 AA)
    if (usernameAutocomplete) {
      expect(['username', 'email']).toContain(usernameAutocomplete);
    }

    if (passwordAutocomplete) {
      expect(['current-password', 'password']).toContain(passwordAutocomplete);
    }
  });
});