/**
 * Build Spine Refinement V1 — validation entry point.
 */

import {
  BUILD_SPINE_REFINEMENT_V1_PASS_TOKEN,
  runBuildSpineRefinementValidation,
} from './lib/build-spine-refinement-validation.js';

async function main(): Promise<void> {
  const checks = runBuildSpineRefinementValidation();
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'}: ${check.name} — ${check.detail}`);
  }
  if (!checks.every((c) => c.passed)) {
    console.error('Build Spine Refinement V1 validation failed.');
    process.exit(1);
  }
  console.log(BUILD_SPINE_REFINEMENT_V1_PASS_TOKEN);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
