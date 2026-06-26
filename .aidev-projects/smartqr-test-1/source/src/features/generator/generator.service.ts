/** Service adapter for generator — Qr Code Scanning */
import type { GeneratorRecord } from './generator.types';

const DEMO_GENERATOR_RECORDS: GeneratorRecord[] = [
  { id: 'generator-1', label: 'Sample Generator record', createdAt: new Date().toISOString() },
  { id: 'generator-2', label: 'Generator preview entry', createdAt: new Date().toISOString() },
];

export function listGeneratorRecords(): GeneratorRecord[] {
  return DEMO_GENERATOR_RECORDS;
}
