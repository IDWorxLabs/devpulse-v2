import {
  printVirtualUserValidationResults,
  runVirtualUserValidation,
} from './lib/virtual-user-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runVirtualUserValidation([section]);
printVirtualUserValidationResults(checks, `validate:${section}`);
