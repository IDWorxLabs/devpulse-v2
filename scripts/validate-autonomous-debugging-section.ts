import {
  printAutonomousDebuggingValidationResults,
  runAutonomousDebuggingValidation,
} from './lib/autonomous-debugging-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runAutonomousDebuggingValidation([section]);
printAutonomousDebuggingValidationResults(checks, `validate:${section}`);
