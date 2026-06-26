import { runPromptFaithfulnessV2Validation, printValidationResults } from './lib/prompt-faithfulness-v2-validation.js';
const { checks } = runPromptFaithfulnessV2Validation(['ambiguity']);
printValidationResults(checks, 'validate:prompt-ambiguity-detection');
