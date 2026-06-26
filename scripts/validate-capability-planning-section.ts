import {
  printCapabilityPlanningValidationResults,
  runCapabilityPlanningV3Validation,
} from './lib/capability-planning-v3-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runCapabilityPlanningV3Validation([section]);
printCapabilityPlanningValidationResults(checks, `validate:${section}`);
