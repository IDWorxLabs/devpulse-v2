import {
  printInteractionProofValidationResults,
  runInteractionProofValidation,
} from './lib/interaction-proof-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runInteractionProofValidation([section]);
printInteractionProofValidationResults(checks, `validate:${section}`);
