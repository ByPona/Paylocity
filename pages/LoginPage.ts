import {Page} from '@playwright/test';

export default class LoginPage {
  page;
  formContainer;
  userNameInput;
  passwordInput;
  constructor(page: Page) {
    this.page = page;
    this.formContainer = page.locator('.col-5.login-form-container.rounded');
    this.userNameInput = page.locator('input[name="Username"]');
    this.passwordInput = page.locator('input[name="Password"]');
  }

    async login(userName: string, password: string) {
        await this.userNameInput.fill(userName);
        await this.passwordInput.fill(password);
        await this.page.click('button[type="submit"]');
    }

}