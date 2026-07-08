/**
 * Engineering Intelligence Runtime V1 — validation entrypoint.
 */

import {
  printEngineeringIntelligenceRuntimeValidationResults,
  runEngineeringIntelligenceRuntimeValidation,
} from './lib/engineering-intelligence-runtime-validation.js';

const section = process.argv[2];
const sections = section ? [section] : undefined;
const result = await runEngineeringIntelligenceRuntimeValidation(sections);
printEngineeringIntelligenceRuntimeValidationResults(result);
process.exit(result.allPassed ? 0 : 1);
