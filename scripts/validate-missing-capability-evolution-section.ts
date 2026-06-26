import {
  printMissingCapabilityEvolutionValidationResults,
  runMissingCapabilityEvolutionValidation,
} from './lib/missing-capability-evolution-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runMissingCapabilityEvolutionValidation([section]);
printMissingCapabilityEvolutionValidationResults(checks, `validate:${section}`);
