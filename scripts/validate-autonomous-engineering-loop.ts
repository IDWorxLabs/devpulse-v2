/**
 * Autonomous Engineering Loop V1 — validation entry point.
 */

import { runAutonomousEngineeringLoopValidation } from './lib/autonomous-engineering-loop-validation.js';
import { AUTONOMOUS_ENGINEERING_LOOP_V1_PASS_TOKEN } from '../src/autonomous-engineering-loop/index.js';

async function main(): Promise<void> {
  const { checks, allPassed } = await runAutonomousEngineeringLoopValidation();
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'}: ${check.name} — ${check.detail}`);
  }
  if (!allPassed) {
    console.error('Autonomous Engineering Loop validation failed.');
    process.exit(1);
  }
  console.log(AUTONOMOUS_ENGINEERING_LOOP_V1_PASS_TOKEN);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
