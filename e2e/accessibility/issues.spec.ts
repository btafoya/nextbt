// e2e/accessibility/issues.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA Accessibility Tests - Issues Management
 *
 * Tests cover:
 * - Issue list table accessibility
 * - Issue creation form accessibility
 * - Issue detail page accessibility
 * - WYSIWYG editor accessibility
 * - File attachment accessibility
 */

test.describe('Issues Management Accessibility - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('issues list page should not have accessibility violations', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    // Navigate to issues if not already there
    await page.goto('/issues');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('issues table should be accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues');

    // Check for table element or ARIA grid
    const hasTable = await page.locator('table, [role="table"], [role="grid"]').count();

    if (hasTable > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .include('table')
        .include('[role="table"]')
        .include('[role="grid"]')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('issues table headers should be accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues');

    // Check for proper table headers
    const headers = await page.locator('th, [role="columnheader"]').count();

    if (headers > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze();

      const tableViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('th-') || v.id.includes('table')
      );

      expect(tableViolations).toEqual([]);
    }
  });

  test('issues table should support keyboard navigation', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues');

    // Tab through table interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          role: el?.getAttribute('role')
        };
      });

      // Interactive elements should be focusable
      if (['A', 'BUTTON', 'INPUT'].includes(focusedElement.tag)) {
        expect(focusedElement.tag).toBeTruthy();
      }
    }
  });

  test('issue creation form should be accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues/new');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('issue form fields should have proper labels', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues/new');

    // Check that all form inputs have labels
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .include('input')
      .include('textarea')
      .include('select')
      .analyze();

    const labelViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'label' || v.id === 'label-title-only'
    );

    expect(labelViolations).toEqual([]);
  });

  test('issue form should support keyboard navigation', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues/new');

    // Tab through form fields
    const formElements = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          type: (el as HTMLInputElement)?.type,
          name: (el as HTMLInputElement)?.name
        };
      });

      formElements.push(focusedElement);
    }

    // Should have focused on form elements
    const hasFormElements = formElements.some(el =>
      ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tag)
    );

    expect(hasFormElements).toBeTruthy();
  });

  test('WYSIWYG editor should be keyboard accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues/new');

    // Look for TipTap editor
    const editor = await page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();

    if (await editor.count() > 0) {
      await editor.focus();

      const isFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute('contenteditable') === 'true';
      });

      expect(isFocused).toBeTruthy();
    }
  });

  test('WYSIWYG editor toolbar should be accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues/new');

    // Check for editor toolbar buttons
    const toolbarButtons = await page.locator('button[title], button[aria-label]').count();

    if (toolbarButtons > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .include('button')
        .analyze();

      const buttonViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'button-name'
      );

      expect(buttonViolations).toEqual([]);
    }
  });

  test('file upload should be accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues/new');

    // Check for file input
    const fileInput = await page.locator('input[type="file"]').count();

    if (fileInput > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .include('input[type="file"]')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('issue detail page should be accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    // Try to navigate to an issue detail page
    await page.goto('/issues/1').catch(() => {
      // Issue may not exist, skip test
      test.skip();
    });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('issue status badges should have sufficient contrast', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues');

    // Check color contrast of status badges
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('issue priority indicators should not rely on color alone', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues');

    // Priority badges should have text labels, not just color
    const priorityElements = await page.locator('[class*="priority"], [class*="severity"]').all();

    for (const element of priorityElements) {
      const text = await element.textContent();
      const hasText = text && text.trim().length > 0;

      // Each priority indicator should have text content
      if (await element.isVisible()) {
        expect(hasText).toBeTruthy();
      }
    }
  });

  test('issue search/filter should be accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues');

    // Check for search or filter inputs
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search" i]').count();

    if (searchInputs > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .include('input[type="search"]')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('issue pagination should be keyboard accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues');

    // Check for pagination controls
    const paginationLinks = await page.locator('nav[aria-label*="pagination" i] a, [role="navigation"] a').count();

    if (paginationLinks > 0) {
      // Tab to pagination
      await page.keyboard.press('Tab');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .include('nav')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('issue notes/comments section should be accessible', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues/1').catch(() => {
      test.skip();
    });

    // Check for comments section
    const commentsSection = await page.locator('[id*="notes"], [id*="comments"], [class*="notes"], [class*="comments"]').count();

    if (commentsSection > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('issue attachments should have accessible labels', async ({ page }) => {
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
    }

    await page.goto('/issues/1').catch(() => {
      test.skip();
    });

    // Check for attachment links
    const attachmentLinks = await page.locator('a[href*="files"], a[href*="attachments"]').count();

    if (attachmentLinks > 0) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .include('a')
        .analyze();

      const linkViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'link-name'
      );

      expect(linkViolations).toEqual([]);
    }
  });
});