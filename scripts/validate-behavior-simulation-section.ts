import {
  printBehaviorSimulationValidationResults,
  runBehaviorSimulationValidation,
} from './lib/behavior-simulation-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runBehaviorSimulationValidation([section]);
printBehaviorSimulationValidationResults(checks, `validate:${section}`);
