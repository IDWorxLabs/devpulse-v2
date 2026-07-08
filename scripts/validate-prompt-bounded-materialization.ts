import {
  printPromptBoundedMaterializationValidationResults,
  runPromptBoundedMaterializationValidation,
} from './lib/prompt-bounded-materialization-validation.js';

const { checks } = runPromptBoundedMaterializationValidation(['all']);
printPromptBoundedMaterializationValidationResults(checks, 'Prompt-Bounded Materialization — Full Validation');
