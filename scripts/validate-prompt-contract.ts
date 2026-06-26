import { runPromptFaithfulnessV2Validation, printValidationResults } from './lib/prompt-faithfulness-v2-validation.js';
const { checks } = runPromptFaithfulnessV2Validation(['contract']);
printValidationResults(checks, 'validate:prompt-contract');
