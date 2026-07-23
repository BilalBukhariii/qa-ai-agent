import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage.js";

test.describe("Enterprise Dashboard Functionality", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login("bilal.admin@gmail.com", "bilal12345");
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should display dashboard stats and charts", async ({ page }) => {
    // Check main title
    await expect(
      page.getByRole("heading", { name: "QA Automation Dashboard" })
    ).toBeVisible();

    // Check stat cards presence
    await expect(page.getByRole("paragraph").filter({ hasText: /^Passed$/ })).toBeVisible();
    await expect(page.getByRole("paragraph").filter({ hasText: /^Failed$/ })).toBeVisible();
    await expect(page.getByText("Pending Execution")).toBeVisible();
  });

  test("should toggle dark and light mode", async ({ page }) => {
    const themeButton = page.locator("button", { hasText: "Toggle" });
    await expect(themeButton).toBeVisible();

    // Click to toggle theme
    await themeButton.click();
    
    // Check if html root element has 'dark' class or toggling occurred
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveClass(/dark/);
  });
});
