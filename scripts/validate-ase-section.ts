import {
  printAutonomousSoftwareEngineeringEngineValidationResults,
  runAutonomousSoftwareEngineeringEngineValidation,
} from './lib/autonomous-software-engineering-engine-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runAutonomousSoftwareEngineeringEngineValidation([section]);
printAutonomousSoftwareEngineeringEngineValidationResults(checks, `validate:${section}`);
