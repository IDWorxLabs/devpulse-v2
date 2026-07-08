/**
 * AEP Preview Gate Authority V1 — enforcement validation.
 */

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  AEP_PREVIEW_GATE_AUTHORITY_V1_PASS_TOKEN,
  runAepPreviewGateAuthorityValidation,
} from './lib/aep-preview-gate-authority-validation.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const section = process.argv[2];

function main(): void {
  const title =
    section === 'preview-url-not-readiness'
      ? 'Preview URL Not Readiness'
      : section === 'build-success-not-preview-ready'
        ? 'Build Success Not Preview Ready'
        : section === 'materialization-not-preview-ready'
          ? 'Materialization Not Preview Ready'
          : section === 'client-cannot-promote-preview'
            ? 'Client Cannot Promote Preview'
            : section === 'canonical-preview-state-no-bypass'
              ? 'Canonical Preview State No Bypass'
              : section === 'locked-preview-url-hidden'
                ? 'Locked Preview URL Hidden'
                : section === 'diagnostic-preview-url-separated'
                  ? 'Diagnostic Preview URL Separated'
                  : section === 'live-preview-gate-authority-regression'
                    ? 'Live Preview Gate Authority Regression'
                    : 'AEP Preview Gate Authority V1';

  console.log('');
  console.log(`${title} — Validation`);
  console.log('='.repeat(title.length + 14));
  console.log('');

  const results = runAepPreviewGateAuthorityValidation(ROOT, section);
  let passed = 0;
  for (const result of results) {
    const mark = result.passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${result.name} — ${result.detail}`);
    if (result.passed) passed += 1;
  }

  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    if (!section) {
      console.log(AEP_PREVIEW_GATE_AUTHORITY_V1_PASS_TOKEN);
    }
    process.exit(0);
  }

  process.exit(1);
}

main();
