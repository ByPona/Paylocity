import { Page, expect} from '@playwright/test';

export default class BenefitsDashboardPage {
  page;
  table;
  addEmployeeButton;
  tableEditEmployeeActionButtonSelector = '.fas.fa-edit'
  tableDeleteEmployeeActionButtonSelector = '.fas.fa-times';

  employeeModalSelector = '#employeeModal';
  employeeModalFirstNameInputSelector = '#employeeModal #firstName';
  employeeModalLastNameInputSelector = '#employeeModal #lastName';
  employeeModalDependentsInputSelector = '#employeeModal #dependants';
  employeeModalSubmitButtonSelector = '#employeeModal .btn.btn-primary';
  employeeModalCancelButtonSelector = '#employeeModal .btn.btn-secondary';
  employeeModalUpdateButtonSelector = '#employeeModal #updateEmployee';

  deleteEmployeeModal = '#deleteModal';
  deleteEmployeeModalDeleteButtonSelector = '#deleteModal #deleteEmployee';
  deleteEmployeeModalCancelButtonSelector = '#deleteModal .btn.btn-secondary';
  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('.table.table-striped');
    this.addEmployeeButton = page.locator('button#add');
  }

  async addEmployee(firstName: string, lastName: string, dependents: number) {
    await this.addEmployeeButton.click();
    await this.page.waitForSelector(this.employeeModalSelector);

    await this.page.fill(this.employeeModalFirstNameInputSelector, firstName);
    await this.page.fill(this.employeeModalLastNameInputSelector, lastName);
    await this.page.fill(this.employeeModalDependentsInputSelector, dependents.toString());
    await this.page.click(this.employeeModalSubmitButtonSelector);
    await this.page.waitForLoadState('networkidle');

  }

  async verifyEmployeeInformationInGrid(id: string, firstName: string, lastName: string, dependents: number, salary: number, grossPay: number, benefitsCost: number, netPay: number) {
    const row = this.table.locator('tbody tr').filter({hasText: id});
    await expect(row).toBeVisible({timeout: 2000});
    if(await row.locator('td').nth(0).innerText() === id && 
       await row.locator('td').nth(1).innerText() === firstName && 
       await row.locator('td').nth(2).innerText() === lastName && 
       await row.locator('td').nth(3).innerText() === dependents.toString() && 
       await row.locator('td').nth(4).innerText() === salary.toFixed(2) && 
       await row.locator('td').nth(5).innerText() === grossPay.toFixed(2) && 
       await row.locator('td').nth(6).innerText() === benefitsCost.toFixed(2) && 
       await row.locator('td').nth(7).innerText() === netPay.toFixed(2)) {
      return true;
    } else {
      return false
    }
  }

  async editEmployee(employeeId: string, firstName?: string, lastName?: string, dependents?: number) {
      const editButton = this.table.locator('tbody tr').filter({hasText: employeeId}).locator(this.tableEditEmployeeActionButtonSelector);
      await expect(editButton).toBeVisible({timeout: 2000});
      await editButton.click();
      await this.page.waitForSelector(this.employeeModalSelector);
      if(firstName){
        await this.page.fill(this.employeeModalFirstNameInputSelector, firstName);
      }
      if(lastName){
        await this.page.fill(this.employeeModalLastNameInputSelector, lastName);
      }
      if(dependents){
        await this.page.fill(this.employeeModalDependentsInputSelector, dependents.toString());
      }
      await this.page.click(this.employeeModalUpdateButtonSelector);
      await this.page.waitForResponse(response => response.url().includes(`Prod/api/employees`) && response.request().method() === 'PUT');
      await this.page.waitForResponse(response => response.url().includes(`Prod/api/employees`) && response.request().method() === 'GET');
      await expect(await this.page.locator(this.employeeModalSelector).getAttribute('style')).toBe('display: none;');
      const row = this.table.locator('tbody tr').filter({hasText: employeeId});
      return {
        id: employeeId,
        firstName: await row.locator('td').nth(1).innerText(),
        lastName: await row.locator('td').nth(2).innerText(),
        dependents: parseInt(await row.locator('td').nth(3).innerText()),
        salary: parseFloat(await row.locator('td').nth(4).innerText()),
        grossPay: parseFloat(await row.locator('td').nth(5).innerText()),
        benefitsCost: parseFloat(await row.locator('td').nth(6).innerText()),
        netPay: parseFloat(await row.locator('td').nth(7).innerText())
      }
  }

  async verifyEmployeeInGrid(id: string) {
    try{
      const row = this.table.locator('tbody tr').filter({hasText: id});
      await expect(row).toBeVisible({timeout: 2000});
      return true;
    }catch(e) {
      return false;
    }
  }

  async deleteEmployee(employeeId: string) {
    if(await this.verifyEmployeeInGrid(employeeId)) {
      const deleteButton = this.table.locator('tbody tr').filter({hasText: employeeId}).locator(this.tableDeleteEmployeeActionButtonSelector);
      await expect(deleteButton).toBeVisible({timeout: 2000});
      await deleteButton.click();

      //Then modal appears
      await this.page.waitForSelector(this.deleteEmployeeModal);
      await this.page.click(this.deleteEmployeeModalDeleteButtonSelector);

      await this.page.waitForResponse(response => response.url().includes(`Prod/api/employees/${employeeId}`) && response.request().method() === 'DELETE');
      await this.page.waitForResponse(response => response.url().includes(`Prod/api/employees`) && response.request().method() === 'GET');
      await expect(await this.page.locator(this.deleteEmployeeModal).getAttribute('style')).toBe('display: none;');
      if(await this.verifyEmployeeInGrid(employeeId)) {
        return false;
      }else{
        return true;
      }
    }else{
      throw new Error(`Employee with id ${employeeId} not found in grid`);
    }
  }

  async cleanEmployeesGrid(employeesIDs: string[] = []) {
    for(const employeeId of employeesIDs) {
      if(await this.verifyEmployeeInGrid(employeeId)) {
        await this.deleteEmployee(employeeId);
      }
    }

  }
}