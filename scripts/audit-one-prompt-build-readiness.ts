/**
 * AiDevEngine One-Prompt Build Readiness Audit V1
 * Runs real production-path orchestrator builds for the canonical matrix subset.
 */

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  ONE_PROMPT_BUILD_READINESS_AUDIT_V1_COMPLETE,
  auditOnePromptBuildReadiness,
  writeBuildReadinessAuditArtifacts,
} from './lib/one-prompt-build-readiness-audit.js';
import {
  ONE_PROMPT_CALCULATOR_BUILD_READY_PASS,
  auditCalculatorOnePromptBuildReadiness,
} from './lib/one-prompt-calculator-build-readiness.js';
import { resetOnePromptLivePreviewForTests } from '../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

async function resetBuildModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

async function main(): Promise<void> {
  console.log('');
  console.log('AiDevEngine One-Prompt Build Readiness Audit V1');
  console.log('===============================================');
  console.log('');
  console.log('Running calculator simple-utility build readiness gate first...');
  console.log('');

  await resetBuildModules();
  const calculatorReport = await auditCalculatorOnePromptBuildReadiness(ROOT);
  for (const check of calculatorReport.checks) {
    console.log(`[${check.passed ? 'PASS' : 'FAIL'}] calculator — ${check.name}: ${check.detail}`);
  }
  console.log('');
  if (calculatorReport.passed) {
    console.log(ONE_PROMPT_CALCULATOR_BUILD_READY_PASS);
  } else {
    console.log('ONE_PROMPT_CALCULATOR_BUILD_READY_FAIL');
    process.exit(1);
  }

  console.log('');
  console.log('Running real production-path builds (runOnePromptLivePreviewBuild, source=api)...');
  console.log('This may take several minutes per app category.');
  console.log('');

  const report = await auditOnePromptBuildReadiness(ROOT);
  const { mdPath, jsonPath } = writeBuildReadinessAuditArtifacts(ROOT, report);

  for (const row of report.appRows) {
    console.log(
      `[${row.buildStatus}] ${row.label} — npm i:${row.npmInstallRan ? 'Y' : 'N'} npm build:${row.npmBuildRan ? 'Y' : 'N'} preview:${row.livePreviewAvailable ? 'Y' : 'N'} promoted:${row.persistentPromoted ? 'Y' : 'N'} (${row.durationMs}ms)`,
    );
    if (row.failureReason) {
      console.log(`  reason: ${row.failureReason.slice(0, 140)}`);
    }
  }

  console.log('');
  console.log('Top blockers:');
  for (const [index, blocker] of report.topBlockers.entries()) {
    console.log(`  ${index + 1}. [${blocker.class}] ${blocker.summary}`);
  }

  console.log('');
  console.log(`Wrote ${mdPath}`);
  console.log(`Wrote ${jsonPath}`);
  console.log('');
  console.log(ONE_PROMPT_BUILD_READINESS_AUDIT_V1_COMPLETE);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
