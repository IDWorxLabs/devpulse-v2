/** Service adapter for calculator — calculator */
import type { CalculatorRecord } from './calculator.types';

const DEMO_CALCULATOR_RECORDS: CalculatorRecord[] = [
  { id: 'calculator-1', label: 'Sample Calculator record', createdAt: new Date().toISOString() },
  { id: 'calculator-2', label: 'Calculator preview entry', createdAt: new Date().toISOString() },
];

export function listCalculatorRecords(): CalculatorRecord[] {
  return DEMO_CALCULATOR_RECORDS;
}
