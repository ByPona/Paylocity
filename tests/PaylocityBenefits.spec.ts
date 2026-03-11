import { test, expect, Page } from '@playwright/test';
import LoginPage from '../pages/LoginPage';
import BenefitsDashboardPage from '../pages/BenefitsDashboardPage';
import { benefitsEmployeesGridData, editedBenefitsEmployeesGridData } from '../data/BenefitsDashboardPageData';
import { employeesAPIData, editedEmployeesAPIData } from '../data/APIEmployeesData';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const WEBUSERNAME = process.env.WEBUSERNAME || '';
const WEBPASSWORD = process.env.WEBPASSWORD || '';
const APIKEY = process.env.APIKEY || '';

test.describe('E2E Testing', ()=>{
  test.describe('Login Tests', () => {
  test('Positive Scenario - Correct Login', async ({ page }) => {
    await page.goto('./Account/LogIn');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('form[action="/Prod/Account/LogIn"]');

    await expect(page).toHaveScreenshot('login-container.png', { fullPage: false });
    const loginPage = new LoginPage(page);

    await loginPage.login(WEBUSERNAME, WEBPASSWORD);
    await page.waitForLoadState('networkidle');
    expect(page.url(), `URL should contained Benefits`).toContain('Benefits');
    expect(page.getByText('Paylocity Benefits Dashboard'), `Benefits Dashboard text should be visible`).toBeVisible({timeout: 2000});
  });

  test('Negative Scenario - Wrong Credentials', async ({ page }) => {
    await page.goto('./Account/LogIn');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('form[action="/Prod/Account/LogIn"]');

    const loginPage = new LoginPage(page);
    await loginPage.login('WrongUserName', 'WrongPassword');
    await page.waitForLoadState('networkidle');
    expect(page.locator('.text-danger.validation-summary-errors'), `Validation errors should be visible`).toBeVisible({timeout: 2000});
    expect(page.getByText('The specified username or password is incorrect.'), `Error message should be visible`).toBeVisible({timeout: 2000});
    expect(loginPage.formContainer , `Login form should have error screenshot`).toHaveScreenshot('login-error.png');
    expect(page.url() , `URL should contain LogIn`).toContain('LogIn');
  });

  test('Unexpected Scenario - Empty Credentials', async ({ page }) => {
    await page.goto('./Account/LogIn');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('form[action="/Prod/Account/LogIn"]');

    const loginPage = new LoginPage(page);
    await loginPage.login('', '');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.text-danger.validation-summary-errors') , `Validation errors should be visible`).toBeVisible({timeout: 2000});
    await expect(page.getByText('The Username field is required.'), `Username required message should be visible`).toBeVisible({timeout: 2000});
    await expect(page.getByText('The Password field is required.'), `Password required message should be visible`).toBeVisible({timeout: 2000});
    await expect(loginPage.formContainer , `Login form should have empty screenshot`).toHaveScreenshot('login-empty.png');
    await page.waitForLoadState('networkidle');
    expect(page.url() , `URL should contain LogIn`).toContain('LogIn');
  });
});

test.describe('Logout Tests', () => {
  test('Positive Scenario - Logout', async ({ page }) => {
    await page.goto('./Account/LogIn');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('form[action="/Prod/Account/LogIn"]');

    const loginPage = new LoginPage(page);

    await loginPage.login(WEBUSERNAME, WEBPASSWORD);
    await page.waitForLoadState('networkidle');
    expect(page.url() , `URL should contain Benefits`).toContain('Benefits');
    expect(page.getByText('Paylocity Benefits Dashboard'), `Benefits Dashboard text should be visible`).toBeVisible({timeout: 2000});

    await page.getByText('Log Out').click();
    await page.waitForLoadState('networkidle');
    expect(page.url() , `URL should contain LogIn`).toContain('LogIn');
  });
});

test.describe('Employees Grid Tests', () => {
  //Abstract credentials into env variables

  let idsEmployeesToClean: string[] = [];
  const populateBenefitsGrid = async (page: Page, benefitsDashboardPage: BenefitsDashboardPage) => {
    const employeesAded = [];
    var employeeId = '';
    page.on('response', async (response) => {
      if(response.url().includes('Prod/api/employees') && response.request().method() === 'POST') {
        const responseBody = await response.json();
        employeeId = responseBody.id;
      }
    });

    for(const employee of benefitsEmployeesGridData ) {
      await benefitsDashboardPage.addEmployee(employee.firstName, employee.lastName, employee.dependents);
      await page.waitForResponse(response => response.url().includes('Prod/api/employees') && response.request().method() === 'POST');
      await page.waitForResponse(response => response.url().includes(`Prod/api/employees`) && response.request().method() === 'GET');
      expect(await benefitsDashboardPage.verifyEmployeeInformationInGrid(employeeId, employee.firstName, employee.lastName, employee.dependents, employee.salary, employee.grossPay, employee.benefitsCost, employee.netPay) , `Employee information should be visible in the grid`).toBeTruthy();
      employeesAded.push({employeeId, ...employee});
    }

    return employeesAded;
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('./Account/LogIn');
    await page.waitForLoadState('networkidle');

    const loginPage = new LoginPage(page);
    await loginPage.login(WEBUSERNAME, WEBPASSWORD);
    await page.waitForLoadState('networkidle');
    expect(page.url() , `URL should contain Benefits`).toContain('Benefits');
  });

  test.afterAll(async ({ browser }) => {

    const context = await browser.newContext();
    const page = await context.newPage();    

    await page.goto('./Account/LogIn');
    await page.waitForLoadState('networkidle');

    const loginPage = new LoginPage(page);
    await loginPage.login(WEBUSERNAME, WEBPASSWORD);
    await page.waitForLoadState('networkidle');
    expect(page.url() , `URL should contain Benefits`).toContain('Benefits');
    const benefitsDashboardPage = new BenefitsDashboardPage(page);
    await benefitsDashboardPage.cleanEmployeesGrid(idsEmployeesToClean);
  });


  test('Add Employees and Verify in Grid', async ({ page }) => {
    var employeeId = '';
    page.on('response', async (response) => {
      if(response.url().includes('Prod/api/employees') && response.request().method() === 'POST') {
        const responseBody = await response.json();
        employeeId = responseBody.id;
      }
    });
    const benefitsDashboardPage = new BenefitsDashboardPage(page);

    for(const employee of benefitsEmployeesGridData ) {
      await test.step(`Adding employee ${employee.firstName} ${employee.lastName} with ${employee.dependents} dependents`, async () => {
        await benefitsDashboardPage.addEmployee(employee.firstName, employee.lastName, employee.dependents);
        await page.waitForResponse(response => response.url().includes('Prod/api/employees') && response.request().method() === 'POST');
        await page.waitForResponse(response => response.url().includes(`Prod/api/employees`) && response.request().method() === 'GET');
        await expect(employeeId).not.toBe('');
        idsEmployeesToClean.push(employeeId);
        expect(await benefitsDashboardPage.verifyEmployeeInformationInGrid(employeeId, employee.firstName, employee.lastName, employee.dependents, employee.salary, employee.grossPay, employee.benefitsCost, employee.netPay) , `Employee information should be visible in the grid`).toBeTruthy();
      });

    }

  });

  test('Edit Employee and Verify in Grid', async ({ page }) => {
    const benefitsDashboardPage = new BenefitsDashboardPage(page);
    var employeesAdded: any[] = [];
    await test.step('Adding employees', async () => {
      employeesAdded = await populateBenefitsGrid(page, benefitsDashboardPage);
      idsEmployeesToClean.push(...employeesAdded.map((e: any) => e.employeeId));
    });

    for(let i = 0; i < 4; i++) {
      await test.step(`Editing employee ${employeesAdded[i].firstName} ${employeesAdded[i].lastName} with ${employeesAdded[i].dependents} dependents`, async () => {
        let editedEmployee = await benefitsDashboardPage.editEmployee(employeesAdded[i].employeeId, editedBenefitsEmployeesGridData[i].firstName, editedBenefitsEmployeesGridData[i].lastName, editedBenefitsEmployeesGridData[i].dependents);
        expect(editedEmployee.firstName , `First name should match for employee ${employeesAdded[i].firstName}`).toBe(editedBenefitsEmployeesGridData[i].firstName ? editedBenefitsEmployeesGridData[i].firstName : employeesAdded[i].firstName);
        expect(editedEmployee.lastName , `Last name should match for employee ${employeesAdded[i].lastName}`).toBe(editedBenefitsEmployeesGridData[i].lastName ? editedBenefitsEmployeesGridData[i].lastName : employeesAdded[i].lastName);
        expect(editedEmployee.dependents , `Dependents should match for employee ${employeesAdded[i].firstName}`).toBe(editedBenefitsEmployeesGridData[i].dependents ? editedBenefitsEmployeesGridData[i].dependents : employeesAdded[i].dependents);
        expect(editedEmployee.salary , `Salary should match for employee ${employeesAdded[i].firstName}`).toBe(editedBenefitsEmployeesGridData[i].salary ? editedBenefitsEmployeesGridData[i].salary : employeesAdded[i].salary);
        expect(editedEmployee.grossPay , `Gross pay should match for employee ${employeesAdded[i].firstName}`).toBe(editedBenefitsEmployeesGridData[i].grossPay ? editedBenefitsEmployeesGridData[i].grossPay : employeesAdded[i].grossPay);
        expect(editedEmployee.benefitsCost , `Benefits cost should match for employee ${employeesAdded[i].firstName}`).toBe(editedBenefitsEmployeesGridData[i].benefitsCost ? editedBenefitsEmployeesGridData[i].benefitsCost : employeesAdded[i].benefitsCost);
        expect(editedEmployee.netPay , `Net pay should match for employee ${employeesAdded[i].firstName}`).toBe(editedBenefitsEmployeesGridData[i].netPay ? editedBenefitsEmployeesGridData[i].netPay : employeesAdded[i].netPay);
      });
    }
  });

  test('Delete Employee and Verify Removal from Grid', async ({ page }) => {
    const benefitsDashboardPage = new BenefitsDashboardPage(page);
    var employeesAdded: any[] = [];
    await test.step('Adding employees', async () => {
      employeesAdded = await populateBenefitsGrid(page, benefitsDashboardPage);
      idsEmployeesToClean.push(...employeesAdded.map((e: any) => e.employeeId));
    });


      for(const employee of employeesAdded) {
        expect(await benefitsDashboardPage.deleteEmployee(employee.employeeId), `Should delete employee ${employee.firstName} ${employee.lastName}`).toBe(true);
      }
  });

  test('Add invalid employee and verify error handling', async ({ page }) => {
    const benefitsDashboardPage = new BenefitsDashboardPage(page);
    await test.step('Adding employee with empty values', async () => {
      await benefitsDashboardPage.addEmployeeButton.click();
      await benefitsDashboardPage.page.waitForSelector(benefitsDashboardPage.employeeModalSelector);
      await page.locator(benefitsDashboardPage.employeeModalSubmitButtonSelector).first().click();
      const response = await page.waitForResponse(response => response.url().includes('Prod/api/employees') && response.request().method() === 'POST' && response.status() === 405, {timeout: 5000});
      await expect(response, 'Expected error response for employee with empty values').not.toBeNull();
      await page.locator(benefitsDashboardPage.employeeModalCancelButtonSelector).first().click();
    });
    
    await test.step('Adding employee with negative dependents', async () => {
      await benefitsDashboardPage.addEmployeeButton.click();
      await benefitsDashboardPage.page.waitForSelector(benefitsDashboardPage.employeeModalSelector);
      await page.fill(benefitsDashboardPage.employeeModalFirstNameInputSelector, 'Test');
      await page.fill(benefitsDashboardPage.employeeModalLastNameInputSelector, 'Test');
      await page.fill(benefitsDashboardPage.employeeModalDependentsInputSelector, '-1');
      await page.locator(benefitsDashboardPage.employeeModalSubmitButtonSelector).first().click();
      const response = await page.waitForResponse(response => response.url().includes('Prod/api/employees') && response.request().method() === 'POST' && response.status() === 400, {timeout: 5000});
      await expect(response, 'Expected error response for employee with negative dependents').not.toBeNull();
      await page.locator(benefitsDashboardPage.employeeModalCancelButtonSelector).first().click();
    });

    await test.step('Adding employee with decimal dependents', async () => {
      await benefitsDashboardPage.addEmployeeButton.click();
      await benefitsDashboardPage.page.waitForSelector(benefitsDashboardPage.employeeModalSelector);
      await page.fill(benefitsDashboardPage.employeeModalFirstNameInputSelector, 'Test');
      await page.fill(benefitsDashboardPage.employeeModalLastNameInputSelector, 'Test');
      await page.fill(benefitsDashboardPage.employeeModalDependentsInputSelector, '2.5');
      await page.locator(benefitsDashboardPage.employeeModalSubmitButtonSelector).first().click();
      //Here we need to see if system should allows decimal values for dependents or not, based on the current implementation it is allowing but returning 405 status code, if this is not the expected behavior we can change the assertion to expect a 400 status code instead and update the system accordingly
      const response = await page.waitForResponse(response => response.url().includes('Prod/api/employees') && response.request().method() === 'POST' && (response.status() === 405 || response.status() === 400), {timeout: 5000});
      await expect(response, 'Expected error response for employee with decimal dependents').not.toBeNull();
      await page.locator(benefitsDashboardPage.employeeModalCancelButtonSelector).first().click();
    });

  });

  test('Verify Visual Regression', async ({ page }) => {
    var benefitsDashboardPage = new BenefitsDashboardPage(page);
    var startTestFlag = false
    await test.step('Adding employees', async () => {
      let employeesAdded = await populateBenefitsGrid(page, benefitsDashboardPage);
      idsEmployeesToClean.push(...employeesAdded.map((e: any) => e.employeeId));
    });
    startTestFlag = true;
    await page.route('**/api/employees', async route => {
      const response = await route.fetch();
      const data = await response.json();
      if(response.status() === 200 && startTestFlag) {
        const mocked = data.map((employee: any, index: number) => {
          return {
            ...employee,
            id: "1c241c0b-0b76-4348-8b3e-4454e3255b0e",
            firstName: `FirstNameMockUser${index}`,
            lastName: `LastNameMockUser${index}`,
            salary: 52000,
            gross: 2000,
            benefitsCost: 76.92308,
            net: 1923.0769
          }
        });
        await route.fulfill({
          response,
          contentType: 'application/json',
          body: JSON.stringify(mocked)
        });
      }

  });

    await page.reload();
    await page.waitForLoadState('networkidle');
    benefitsDashboardPage = new BenefitsDashboardPage(page);
    await expect(benefitsDashboardPage.table, 'Employee grid should match screenshot').toHaveScreenshot('employee-grid-regression.png');

  });

});
});


test.describe('API Testing', () =>{

  const addEmployees = async (request: any) => {
    const internalEmployees : any[] = [];
      for(const employee of employeesAPIData) {
      const response = await request.post('./api/employees', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        },
        data: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          dependants: employee.dependants
        }
      });
      expect(response.status(), `Expected success response for employee ${employee.firstName} ${employee.lastName}`).toBe(200);
      const responseBody = await response.json();
      idsEmployeesToClean.push(responseBody.id);
      internalEmployees.push(responseBody);

    }
    return internalEmployees;
  }
  let idsEmployeesToClean: string[] = [];

  test.afterAll(async ({ request }) => {

    for(const employeeId of idsEmployeesToClean) {
      await test.step(`Deleting employee with id ${employeeId}`, async () => {
        const response = await request.delete(`./api/employees/${employeeId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${APIKEY}`
          },
        });
        expect(response.status(), `Expected success response for employee with id ${employeeId}`).toBe(200);
      });
    }
  });


  test('Get Employees API', async ({ request }) => {
    await test.step('Adding employees', async () => {
      await addEmployees(request);
    });
    
    var responseBody : any[] = []
    await test.step('Verify Multiple Employees', async() =>{
      const response = await request.get('./api/employees',{
      headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        },
    });
    expect(response.status(), 'Expected success response for get employees API').toBe(200);
    responseBody = await response.json();
    expect(Array.isArray(responseBody) , 'Expected array response for get employees API').toBeTruthy();
    expect(responseBody.length > 0 , 'Expected at least one employee in the response for get employees API').toBeTruthy();
    })

    await test.step('Verify Single Employeer Data', async () => {
      const response = await request.get(`./api/Employees/${responseBody[0].id}`,{
      headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        },
    });

      expect(response.status(), 'Expected success response for get single employee API').toBe(200);
      const employeeData = await response.json();
      expect(employeeData.firstName, 'First name should match for single employee API').toBe(responseBody[0].firstName);
      expect(employeeData.lastName, 'Last name should match for single employee API').toBe(responseBody[0].lastName);
      expect(employeeData.dependants, 'Dependants should match for single employee API').toBe(responseBody[0].dependants);
      expect(employeeData.salary, 'Salary should match for single employee API').toBe(responseBody[0].salary);
      expect(employeeData.gross, 'Gross pay should match for single employee API').toBe(responseBody[0].gross);
      expect(employeeData.benefitsCost, 'Benefits cost should match for single employee API').toBe(responseBody[0].benefitsCost);
      expect(employeeData.net, 'Net pay should match for single employee API').toBe(responseBody[0].net);
    });
  });

  test('Add Employee API', async ({ request }) => {
    for(const employee of employeesAPIData) {
      await test.step(`Adding employee ${employee.firstName} ${employee.lastName} with ${employee.dependants} dependants`, async () => {
        const response = await request.post('./api/Employees', {
          headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        },
          data: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            dependants: employee.dependants
          }
      });
      expect(response.status() , `Expected success response for employee ${employee.firstName} ${employee.lastName}`).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.firstName, `First name should match for employee ${employee.firstName} ${employee.lastName}`).toBe(employee.firstName);
      expect(responseBody.lastName, `Last name should match for employee ${employee.firstName} ${employee.lastName}`).toBe(employee.lastName);
      expect(responseBody.dependants, `Dependants should match for employee ${employee.firstName} ${employee.lastName}`).toBe(employee.dependants);
      expect(responseBody.salary, `Salary should match for employee ${employee.firstName} ${employee.lastName}`).toBe(employee.salary);
      expect(responseBody.gross, `Gross pay should match for employee ${employee.firstName} ${employee.lastName}`).toBe(employee.gross);
      expect(responseBody.benefitsCost, `Benefits cost should match for employee ${employee.firstName} ${employee.lastName}`).toBe(employee.benefitsCost);
      expect(responseBody.net, `Net pay should match for employee ${employee.firstName} ${employee.lastName}`).toBe(employee.net);
      idsEmployeesToClean.push(responseBody.id);
      });

    }
  });

  test('Update Employee API', async ({ request }) => {
    let internalEmployees : any[] = [];
    await test.step('Adding employees', async () => {
      internalEmployees = await addEmployees(request);
    });
    for(let i = 0; i < 3; i++) {
      await test.step(`Editing employee with id ${internalEmployees[i].id}`, async () => {
        const response = await request.put(`./api/employees`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${APIKEY}`
          },
          data: {
            id: internalEmployees[i].id,
            firstName: editedEmployeesAPIData[i].firstName ? editedEmployeesAPIData[i].firstName : internalEmployees[i].firstName,
            lastName: editedEmployeesAPIData[i].lastName ? editedEmployeesAPIData[i].lastName : internalEmployees[i].lastName,
            dependants: editedEmployeesAPIData[i].dependants ? editedEmployeesAPIData[i].dependants : internalEmployees[i].dependants
          }
        });
        expect(response.status(), `Expected success response for employee ${editedEmployeesAPIData[i].firstName} ${editedEmployeesAPIData[i].lastName}`).toBe(200);
        const responseBody = await response.json();
        expect(responseBody.firstName, `First name should match for employee ${editedEmployeesAPIData[i].firstName} ${editedEmployeesAPIData[i].lastName}`).toBe(editedEmployeesAPIData[i].firstName ? editedEmployeesAPIData[i].firstName : internalEmployees[i].firstName);
        expect(responseBody.lastName, `Last name should match for employee ${editedEmployeesAPIData[i].firstName} ${editedEmployeesAPIData[i].lastName}`).toBe(editedEmployeesAPIData[i].lastName ? editedEmployeesAPIData[i].lastName : internalEmployees[i].lastName);
        expect(responseBody.dependants, `Dependants should match for employee ${editedEmployeesAPIData[i].firstName} ${editedEmployeesAPIData[i].lastName}`).toBe(editedEmployeesAPIData[i].dependants ? editedEmployeesAPIData[i].dependants : internalEmployees[i].dependants);
        expect(responseBody.salary, `Salary should match for employee ${editedEmployeesAPIData[i].firstName} ${editedEmployeesAPIData[i].lastName}`).toBe(editedEmployeesAPIData[i].salary ? editedEmployeesAPIData[i].salary : internalEmployees[i].salary);
        expect(responseBody.gross, `Gross pay should match for employee ${editedEmployeesAPIData[i].firstName} ${editedEmployeesAPIData[i].lastName}`).toBe(editedEmployeesAPIData[i].gross ? editedEmployeesAPIData[i].gross : internalEmployees[i].gross);
        expect(responseBody.benefitsCost, `Benefits cost should match for employee ${editedEmployeesAPIData[i].firstName} ${editedEmployeesAPIData[i].lastName}`).toBe(editedEmployeesAPIData[i].benefitsCost ? editedEmployeesAPIData[i].benefitsCost : internalEmployees[i].benefitsCost);
        expect(responseBody.net, `Net pay should match for employee ${editedEmployeesAPIData[i].firstName} ${editedEmployeesAPIData[i].lastName}`).toBe(editedEmployeesAPIData[i].net ? editedEmployeesAPIData[i].net : internalEmployees[i].net);
        
      });
    }


  });

  test('Delete Employee API', async ({ request }) => {
    let internalEmployeesIds : string[] = [];
    await test.step('Adding employees', async () => {
      const internalEmployees = await addEmployees(request);
      internalEmployeesIds = internalEmployees.map(e => e.id);
    });

    for(const employeeId of internalEmployeesIds) {
      await test.step(`Deleting employee with id ${employeeId}`, async () => {
        const response = await request.delete(`./api/employees/${employeeId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${APIKEY}`
          },
        });
        expect(response.status(), `Expected success response for employee with id ${employeeId}`).toBe(200);
      });
    }
  });

  test('Edge Cases - Negative, Decimal, Nonexistent and Empty Values', async ({ request }) => {
      await test.step('Adding employee with negative dependents', async () => {
        const response = await request.post('./api/Employees', {
          headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        },
          data: {
            firstName: 'Test',
            lastName: 'Test',
            dependants: -1
          }
      });
      expect(response.status(), 'Expected bad request response for employee with negative dependents').toBe(400);
    });

    await test.step('Adding employee with decimal dependents', async () => {
      const response = await request.post('./api/Employees', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        },
        data: {
          firstName: 'Test',
          lastName: 'Test',
          dependants: 2.5
        }
      });
      expect(response.status(), 'Expected method not allowed response for employee with decimal dependents').toBe(405);
    });

    await test.step('Adding employee with empty values', async () => {
      const response = await request.post('./api/employees', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        },
        data: {
          firstName: '',
          lastName: '',
          dependants: 2
        }
      });
      expect(response.status(), 'Expected bad request response for employee with empty values').toBe(400);
    });

    await test.step('Adding employee with zero dependants', async () => {
      const response = await request.post('./api/employees', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        },
        data: {
          firstName: 'Test',
          lastName: 'Test',
          dependants: 0
        }
      });
      expect(response.status(), 'Expected success response for employee with zero dependants').toBe(200);
    });

    await test.step('Delete employee with non valid ID', async () => {
      const response = await request.delete(`./api/employees/999`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        }
      });
      expect(response.status(), 'Expected method not allowed response for employee with non valid ID').toBe(405);
    });

    await test.step('Delete employee with non existing ID', async () => {
      const response = await request.delete(`./api/employees/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${APIKEY}`
        }
      });
      expect(response.status(), 'Expected success response for employee with non existing ID').toBe(200);
    });

  }); 
});