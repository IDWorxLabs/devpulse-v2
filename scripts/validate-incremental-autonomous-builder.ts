import {
  printIncrementalBuilderValidationResults,
  runIncrementalBuilderValidation,
} from './lib/incremental-autonomous-builder-validation.js';

const { checks } = runIncrementalBuilderValidation(['all']);
printIncrementalBuilderValidationResults(checks, 'Incremental Autonomous Builder — Full Validation');
