import {
  printLaunchReadinessAuthorityV2ValidationResults,
  runLaunchReadinessAuthorityV2Validation,
} from './lib/launch-readiness-authority-v2-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runLaunchReadinessAuthorityV2Validation([section]);
printLaunchReadinessAuthorityV2ValidationResults(checks, `validate:${section}`);
