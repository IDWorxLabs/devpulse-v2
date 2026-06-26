/**
 * Prompt Faithfulness Engine V2 — full authority validation.
 */

import { runPromptFaithfulnessV2Validation, printValidationResults } from './lib/prompt-faithfulness-v2-validation.js';

const { checks } = runPromptFaithfulnessV2Validation(['all']);
printValidationResults(checks, 'Prompt Faithfulness Engine V2 — Authority Validation');
