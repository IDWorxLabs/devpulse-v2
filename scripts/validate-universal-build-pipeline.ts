/**
 * Universal Build Pipeline Verification V1 — validation entry script.
 */

import {
  printUniversalBuildPipelineValidationResults,
  runUniversalBuildPipelineValidation,
  UNIVERSAL_BUILD_PIPELINE_V1_PASS_TOKEN,
} from './lib/universal-build-pipeline-validation.js';

const { checks, allPassed } = runUniversalBuildPipelineValidation();
const passed = printUniversalBuildPipelineValidationResults(checks);

if (allPassed && passed === checks.length) {
  console.log(UNIVERSAL_BUILD_PIPELINE_V1_PASS_TOKEN);
  process.exit(0);
}

process.exit(1);
