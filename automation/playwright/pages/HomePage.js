import { BasePage } from "./BasePage.js";

export class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.getStartedLink = page.getByRole("link", { name: "Get started" });
    this.heading = page.getByRole("heading", { level: 1 });
  }

  async open() {
    await this.goto("/");
  }

  async clickGetStarted() {
    await this.getStartedLink.click();
  }
}
