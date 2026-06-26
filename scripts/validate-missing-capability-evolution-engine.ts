import {
  printMissingCapabilityEvolutionValidationResults,
  runMissingCapabilityEvolutionValidation,
} from './lib/missing-capability-evolution-validation.js';

const { checks } = runMissingCapabilityEvolutionValidation(['all']);
printMissingCapabilityEvolutionValidationResults(checks, 'Missing Capability Evolution Engine — Full Validation');
