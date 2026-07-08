import {
  printPromptBoundedMaterializationValidationResults,
  runPromptBoundedMaterializationValidation,
} from './lib/prompt-bounded-materialization-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runPromptBoundedMaterializationValidation([section]);
printPromptBoundedMaterializationValidationResults(checks, `validate:${section}`);
