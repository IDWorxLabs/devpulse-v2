import {
  printAutonomousSoftwareEngineeringEngineValidationResults,
  runAutonomousSoftwareEngineeringEngineValidation,
} from './lib/autonomous-software-engineering-engine-validation.js';

const { checks } = runAutonomousSoftwareEngineeringEngineValidation(['all']);
printAutonomousSoftwareEngineeringEngineValidationResults(checks, 'Autonomous Software Engineering Engine — Full Validation');
