/**
 * ASE Enforcement Engine V1 — validation.
 */

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  ASE_ENFORCEMENT_ENGINE_V1_PASS_TOKEN,
  runAseEnforcementValidation,
} from './lib/ase-enforcement-engine-validation.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const section = process.argv[2];

function main(): void {
  const title =
    section === 'ase-engineering-authority'
      ? 'ASE Engineering Authority'
      : section === 'ase-no-simulation-only'
        ? 'ASE No Simulation Only'
        : section === 'ase-stage-enforcement'
          ? 'ASE Stage Enforcement'
          : section === 'ase-one-prompt-flow'
            ? 'ASE One Prompt Flow'
            : section === 'ase-launch-integration'
              ? 'ASE Launch Integration'
              : section === 'ase-live-preview-integration'
                ? 'ASE Live Preview Integration'
                : section === 'ase-recovery-routing'
                  ? 'ASE Recovery Routing'
                  : section === 'ase-decision-engine'
                    ? 'ASE Decision Engine'
                    : section === 'ase-engineering-routing'
                      ? 'ASE Engineering Routing'
                      : section === 'ase-authorized-execution'
                        ? 'ASE Authorized Execution'
                        : section === 'ase-engineering-state-machine'
                          ? 'ASE Engineering State Machine'
                          : section === 'ase-goal-engine'
                            ? 'ASE Goal Engine'
                            : section === 'ase-action-authority'
                              ? 'ASE Action Authority'
                              : section
                                ? `ASE Enforcement ${section}`
                                : 'ASE Enforcement Engine V1';

  console.log('');
  console.log(`${title} — Validation`);
  console.log('='.repeat(title.length + 14));
  console.log('');

  const results = runAseEnforcementValidation(ROOT, section);
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
      console.log(ASE_ENFORCEMENT_ENGINE_V1_PASS_TOKEN);
    }
    process.exit(0);
  }

  process.exit(1);
}

main();
