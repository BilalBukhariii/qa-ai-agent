import { BasePage } from "./BasePage.js";

export class SignupPage extends BasePage {
  constructor(page) {
    super(page);
    this.nameInput = page.getByPlaceholder("Full Name");
    this.emailInput = page.getByPlaceholder("Email");
    this.passwordInput = page.getByPlaceholder("Password");
    this.submitButton = page.getByRole("button", { name: "Sign up" });
    this.errorMessage = page.locator("form p.text-red-500");
  }

  async open() {
    await this.goto("/signup");
  }

  async signup(name, email, password) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
