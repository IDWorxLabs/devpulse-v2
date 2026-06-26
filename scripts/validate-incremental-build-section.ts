import {
  printIncrementalBuilderValidationResults,
  runIncrementalBuilderValidation,
} from './lib/incremental-autonomous-builder-validation.js';

const section = process.argv[2] ?? 'all';
const { checks } = runIncrementalBuilderValidation([section]);
printIncrementalBuilderValidationResults(checks, `validate:${section}`);
