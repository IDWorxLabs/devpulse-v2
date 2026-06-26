import {
  printLivePreviewGateValidationResults,
  runLivePreviewGateValidation,
} from './lib/live-preview-gate-validation.js';

const { checks } = runLivePreviewGateValidation(['all']);
printLivePreviewGateValidationResults(checks, 'Live Preview Gate — Full Validation');
