const benefitsEmployeesGridData = [
  { firstName: 'Jane', lastName: 'Smith', dependents: 0, salary: 52000.00, grossPay: 2000.00, benefitsCost: 38.46, netPay: 1961.54 },
  { firstName: 'Jane', lastName: 'Smith', dependents: 1, salary: 52000.00, grossPay: 2000.00, benefitsCost: 57.69, netPay: 1942.31 },
  { firstName: 'John', lastName: 'Doe', dependents: 2, salary: 52000.00, grossPay: 2000.00, benefitsCost: 76.92, netPay: 1923.08 },
  { firstName: 'Alice', lastName: 'Williams', dependents: 5,  salary: 52000.00 , grossPay: 2000.00, benefitsCost: 134.62, netPay: 1865.38 },
  { firstName: 'Bob', lastName: 'Johnson', dependents: 10, salary: 52000.00, grossPay: 2000.00, benefitsCost: 230.77, netPay: 1769.23 }
];

const editedBenefitsEmployeesGridData = [{
      firstName: 'EditedFirstName',
      lastName: 'EditedLastName',
      dependents: 30,
      salary: 52000.00,
      grossPay: 2000.00,
      benefitsCost: 615.38,
      netPay: 1384.62
    },{
      firstName: 'SecondEditedFirstName',
      lastName: 'SecondEditedLastName',
      dependents: 17,
      salary: 52000.00,
      grossPay: 2000.00,
      benefitsCost: 365.38,
      netPay: 1634.62
    },{
      firstName: undefined,
      lastName: undefined,
      dependents: 17,
      salary: 52000.00,
      grossPay: 2000.00,
      benefitsCost: 365.38,
      netPay: 1634.62
    },{
      firstName: 'ThirdEditedFirstName',
      lastName: 'ThirdEditedLastName',
      dependents: undefined,
      salary: undefined,
      grossPay: undefined,
      benefitsCost: undefined,
      netPay: undefined
    }];
export { benefitsEmployeesGridData, editedBenefitsEmployeesGridData };