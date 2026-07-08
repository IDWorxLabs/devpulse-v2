/**
 * Audit Project Isolation and Cleanup V1 — validation entry script.
 */

import {
  AUDIT_PROJECT_ISOLATION_AND_CLEANUP_V1_PASS_TOKEN,
  printAuditProjectIsolationResults,
  runAuditProjectIsolationValidation,
} from './lib/audit-project-isolation-validation.js';

async function main(): Promise<void> {
  console.log('');
  console.log('Audit Project Isolation and Cleanup V1 — Validation');
  console.log('=====================================================');
  console.log('');

  const { checks, allPassed } = await runAuditProjectIsolationValidation();
  const passed = printAuditProjectIsolationResults(checks);

  if (allPassed && passed === checks.length) {
    console.log(AUDIT_PROJECT_ISOLATION_AND_CLEANUP_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
