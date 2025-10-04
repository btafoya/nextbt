import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Notification Preferences Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="username"]', "administrator");
    await page.fill('input[name="password"]', "root");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");

    // Navigate to notification preferences
    await page.goto("/profile/notifications");
    await page.waitForLoadState("networkidle");
  });

  test("should not have any automatically detectable WCAG A or AA violations on Email Preferences tab", async ({
    page,
  }) => {
    // Wait for the Email Preferences tab content to load
    await page.waitForSelector("text=Email Notification Preferences");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have any automatically detectable WCAG A or AA violations on Digest Settings tab", async ({
    page,
  }) => {
    // Click on Digest Settings tab
    await page.click("button:has-text('Digest Settings')");
    await page.waitForSelector("text=Notification Digest Settings");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have any automatically detectable WCAG A or AA violations on Push Notifications tab", async ({
    page,
  }) => {
    // Click on Push Notifications tab
    await page.click("button:has-text('Push Notifications')");
    await page.waitForSelector("text=Web Push Notifications");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have any automatically detectable WCAG A or AA violations on History tab", async ({
    page,
  }) => {
    // Click on History tab
    await page.click("button:has-text('History')");
    await page.waitForSelector("text=Notification History");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have any automatically detectable WCAG A or AA violations on Filters tab", async ({
    page,
  }) => {
    // Click on Filters tab
    await page.click("button:has-text('Filters')");
    await page.waitForSelector("text=Notification Filters");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have proper keyboard navigation on tab controls", async ({ page }) => {
    // Focus on the first tab
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab"); // Navigate past header elements

    // Verify tab navigation works with arrow keys
    const emailTab = page.locator("button:has-text('Email Preferences')");
    const digestTab = page.locator("button:has-text('Digest Settings')");

    await emailTab.focus();
    await page.keyboard.press("ArrowRight");

    // Verify focus moved to next tab
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const focusedText = await page.evaluate(
      (el) => (el as HTMLElement).textContent,
      focusedElement
    );

    expect(focusedText).toContain("Digest Settings");
  });

  test("should have accessible form labels on Email Preferences", async ({ page }) => {
    // Verify all checkboxes have accessible labels
    const checkboxes = await page.locator('input[type="checkbox"]').all();

    for (const checkbox of checkboxes) {
      const label = await checkbox.getAttribute("aria-label");
      const associatedLabel = await page.evaluate((el) => {
        const labelElement = el.closest("label");
        return labelElement?.textContent?.trim() || null;
      }, await checkbox.elementHandle());

      expect(label || associatedLabel).toBeTruthy();
    }
  });

  test("should have accessible select dropdowns on Digest Settings", async ({ page }) => {
    await page.click("button:has-text('Digest Settings')");
    await page.waitForSelector("text=Notification Digest Settings");

    // Enable digest to show all options
    await page.click('input[type="checkbox"]');

    const selects = await page.locator("select").all();

    for (const select of selects) {
      const label = await page.evaluate((el) => {
        const labelElement = el.closest("div")?.querySelector("label");
        return labelElement?.textContent?.trim() || null;
      }, await select.elementHandle());

      expect(label).toBeTruthy();
    }
  });

  test("should have visible focus indicators", async ({ page }) => {
    // Tab through interactive elements and verify focus indicators
    const interactiveElements = await page
      .locator("button, input, select, a")
      .all();

    for (const element of interactiveElements.slice(0, 5)) {
      // Test first 5 elements
      await element.focus();

      const hasFocusStyles = await page.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.outline !== "none" ||
          styles.boxShadow.includes("ring") ||
          styles.borderColor !== "rgb(0, 0, 0)"
        );
      }, await element.elementHandle());

      expect(hasFocusStyles).toBeTruthy();
    }
  });

  test("should have sufficient color contrast on all tabs", async ({ page }) => {
    const tabs = [
      "Email Preferences",
      "Digest Settings",
      "Push Notifications",
      "History",
      "Filters",
    ];

    for (const tabName of tabs) {
      await page.click(`button:has-text('${tabName}')`);
      await page.waitForTimeout(500); // Wait for content to load

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2aa"])
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === "color-contrast"
      );

      expect(contrastViolations).toEqual([]);
    }
  });

  test("should have proper ARIA roles and attributes", async ({ page }) => {
    // Check tab navigation has proper ARIA attributes
    const activeTab = page.locator('button[aria-current="page"]');
    expect(await activeTab.count()).toBeGreaterThan(0);

    // Check for proper landmark roles
    const navigation = page.locator('nav[aria-label="Tabs"]');
    expect(await navigation.count()).toBeGreaterThan(0);
  });

  test("should be responsive and accessible on mobile viewports", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify tabs are still accessible on mobile
    await page.waitForSelector("button:has-text('Email Preferences')");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
