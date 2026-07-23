export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async getTitle() {
    return this.page.title();
  }
}
