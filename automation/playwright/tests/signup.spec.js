import { test, expect } from "@playwright/test";
import { SignupPage } from "../pages/SignupPage.js";

test.describe("Signup functionality", () => {
  test("should register a new user successfully", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.open();
    const uniqueEmail = `user_${Date.now()}@example.com`;
    await signupPage.signup("New User", uniqueEmail, "password123");

    // Should redirect to dashboard upon successful registration
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
