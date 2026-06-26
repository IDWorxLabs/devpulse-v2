import {
  printVirtualDeviceValidationResults,
  runVirtualDeviceValidation,
} from './lib/virtual-device-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runVirtualDeviceValidation([section]);
printVirtualDeviceValidationResults(checks, `validate:${section}`);
