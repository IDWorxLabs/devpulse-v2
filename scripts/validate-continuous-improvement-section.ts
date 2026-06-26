import {
  printContinuousProductImprovementValidationResults,
  runContinuousProductImprovementValidation,
} from './lib/continuous-product-improvement-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runContinuousProductImprovementValidation([section]);
printContinuousProductImprovementValidationResults(checks, `validate:${section}`);
