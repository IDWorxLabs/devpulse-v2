/** Service adapter for employees — CRM */
import type { EmployeesRecord } from './employees.types';

const DEMO_EMPLOYEES_RECORDS: EmployeesRecord[] = [
  { id: 'employees-1', label: 'Sample Employees record', createdAt: new Date().toISOString() },
  { id: 'employees-2', label: 'Employees preview entry', createdAt: new Date().toISOString() },
];

export function listEmployeesRecords(): EmployeesRecord[] {
  return DEMO_EMPLOYEES_RECORDS;
}
