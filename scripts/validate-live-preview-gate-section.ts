import {
  printLivePreviewGateValidationResults,
  runLivePreviewGateValidation,
} from './lib/live-preview-gate-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runLivePreviewGateValidation([section]);
printLivePreviewGateValidationResults(checks, `validate:${section}`);
