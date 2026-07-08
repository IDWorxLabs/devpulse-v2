/** Service adapter for payroll — CRM */
import type { PayrollRecord } from './payroll.types';

const DEMO_PAYROLL_RECORDS: PayrollRecord[] = [
  { id: 'payroll-1', label: 'Sample Payroll record', createdAt: new Date().toISOString() },
  { id: 'payroll-2', label: 'Payroll preview entry', createdAt: new Date().toISOString() },
];

export function listPayrollRecords(): PayrollRecord[] {
  return DEMO_PAYROLL_RECORDS;
}
