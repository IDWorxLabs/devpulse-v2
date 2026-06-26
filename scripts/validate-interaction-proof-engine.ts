import {
  printInteractionProofValidationResults,
  runInteractionProofValidation,
} from './lib/interaction-proof-validation.js';

const { checks } = runInteractionProofValidation(['all']);
printInteractionProofValidationResults(checks, 'Interaction Proof Engine — Full Validation');
