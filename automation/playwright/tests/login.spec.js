import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage.js";

test.describe("Login functionality", () => {
  test("should login successfully with valid admin credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login("admin@example.com", "Passw0rd!");

    // Verify navigation to dashboard upon successful login
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should display error message on invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Verify error message presence
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(/Invalid email or password|Login failed/);
  });
});
