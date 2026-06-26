import {
  printBehaviorSimulationValidationResults,
  runBehaviorSimulationValidation,
} from './lib/behavior-simulation-validation.js';

const { checks } = runBehaviorSimulationValidation(['all']);
printBehaviorSimulationValidationResults(checks, 'Behavior Simulation Engine — Full Validation');
