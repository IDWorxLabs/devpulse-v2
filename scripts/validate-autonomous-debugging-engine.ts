import {
  printAutonomousDebuggingValidationResults,
  runAutonomousDebuggingValidation,
} from './lib/autonomous-debugging-validation.js';

const { checks } = runAutonomousDebuggingValidation(['all']);
printAutonomousDebuggingValidationResults(checks, 'Autonomous Debugging Engine — Full Validation');
