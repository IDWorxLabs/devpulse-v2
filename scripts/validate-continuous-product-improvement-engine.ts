import {
  printContinuousProductImprovementValidationResults,
  runContinuousProductImprovementValidation,
} from './lib/continuous-product-improvement-validation.js';

const { checks } = runContinuousProductImprovementValidation(['all']);
printContinuousProductImprovementValidationResults(checks, 'Continuous Product Improvement Engine — Full Validation');
