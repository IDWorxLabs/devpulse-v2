import { runPromptFaithfulnessV2Validation, printValidationResults } from './lib/prompt-faithfulness-v2-validation.js';
const { checks } = runPromptFaithfulnessV2Validation(['parser']);
printValidationResults(checks, 'validate:prompt-parser');
