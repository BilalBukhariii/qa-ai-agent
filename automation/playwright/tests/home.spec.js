import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage.js";

test.describe("Smoke: Home page", () => {
  test("has correct title", async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await expect(page).toHaveTitle(/Playwright/);
  });

  test("get started link navigates to installation docs", async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.clickGetStarted();
    await expect(
      page.getByRole("heading", { name: "Installation" })
    ).toBeVisible();
  });
});
