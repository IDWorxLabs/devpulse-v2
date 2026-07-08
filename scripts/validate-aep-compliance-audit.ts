/**
 * AEP Compliance Audit V1 — validation suite (read-only audit artifacts).
 */

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  AEP_COMPLIANCE_AUDIT_V1_PASS_TOKEN,
  runAepComplianceAuditValidation,
} from './lib/aep-compliance-audit-validation.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const section = process.argv[2];

function main(): void {
  const title =
    section === 'report-exists'
      ? 'AEP Audit Report Exists'
      : section === 'json-schema'
        ? 'AEP Audit JSON Schema'
        : section === 'finding-coverage'
          ? 'AEP Audit Finding Coverage'
          : section === 'severity-ranking'
            ? 'AEP Audit Severity Ranking'
            : section === 'implementation-order'
              ? 'AEP Audit Implementation Order'
              : 'AEP Compliance Audit V1';

  console.log('');
  console.log(`${title} — Validation`);
  console.log('='.repeat(title.length + 14));
  console.log('');

  const results = runAepComplianceAuditValidation(ROOT, section);
  let passed = 0;
  for (const result of results) {
    const mark = result.passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${result.name} — ${result.detail}`);
    if (result.passed) passed += 1;
  }

  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    if (!section) {
      console.log(AEP_COMPLIANCE_AUDIT_V1_PASS_TOKEN);
    }
    process.exit(0);
  }

  process.exit(1);
}

main();
