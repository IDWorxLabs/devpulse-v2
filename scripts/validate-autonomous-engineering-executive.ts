/**
 * Autonomous Engineering Executive V1 — validation entry script.
 */

import {
  AUTONOMOUS_ENGINEERING_EXECUTIVE_V1_PASS_TOKEN,
  printAutonomousEngineeringExecutiveValidationResults,
  runAutonomousEngineeringExecutiveValidation,
} from './lib/autonomous-engineering-executive-validation.js';

async function main(): Promise<void> {
  console.log('');
  console.log('Autonomous Engineering Executive V1 — Validation');
  console.log('===============================================');
  console.log('');

  const { checks, allPassed } = await runAutonomousEngineeringExecutiveValidation();
  const passed = printAutonomousEngineeringExecutiveValidationResults(checks);

  if (allPassed && passed === checks.length) {
    console.log(AUTONOMOUS_ENGINEERING_EXECUTIVE_V1_PASS_TOKEN);
    process.exit(0);
  }

  process.exit(1);
}

void main();
