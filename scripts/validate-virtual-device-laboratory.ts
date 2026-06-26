import {
  printVirtualDeviceValidationResults,
  runVirtualDeviceValidation,
} from './lib/virtual-device-validation.js';

const { checks } = runVirtualDeviceValidation(['all']);
printVirtualDeviceValidationResults(checks, 'Virtual Device Laboratory — Full Validation');
