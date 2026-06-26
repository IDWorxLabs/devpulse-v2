import {
  printVirtualUserValidationResults,
  runVirtualUserValidation,
} from './lib/virtual-user-validation.js';

const { checks } = runVirtualUserValidation(['all']);
printVirtualUserValidationResults(checks, 'Virtual User Engine — Full Validation');
