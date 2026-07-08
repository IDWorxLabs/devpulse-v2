/**
 * Safe Payment Placeholder Policy V1 — validation entrypoint.
 */

import {
  printSafePaymentPlaceholderPolicyValidationResults,
  runSafePaymentPlaceholderPolicyValidation,
} from './lib/safe-payment-placeholder-policy-validation.js';

const result = runSafePaymentPlaceholderPolicyValidation();
printSafePaymentPlaceholderPolicyValidationResults(result);
process.exit(result.allPassed ? 0 : 1);
