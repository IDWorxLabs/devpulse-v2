import {
  printLaunchReadinessAuthorityV2ValidationResults,
  runLaunchReadinessAuthorityV2Validation,
} from './lib/launch-readiness-authority-v2-validation.js';

const { checks } = runLaunchReadinessAuthorityV2Validation(['all']);
printLaunchReadinessAuthorityV2ValidationResults(
  checks,
  'Launch Readiness Authority V2 — Full Validation',
);
