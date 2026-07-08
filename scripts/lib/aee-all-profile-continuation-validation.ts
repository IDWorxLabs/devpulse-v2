/**
 * AEE All Profile Continuation V1 — route-level matrix validation.
 * Ensures named-profile apps reach npm install/build instead of stopping at ASE.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listWorkspaceFeatureModuleIds } from '../../src/prompt-faithful-generation/index.js';
import { runOnePromptLivePreviewBuild } from '../../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { resetOnePromptLivePreviewForTests } from '../../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../../src/aidev-engine/aidev-engine-authority.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';
import type { OnePromptLivePreviewBuildResult } from '../../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

export const AEE_ALL_PROFILE_CONTINUATION_V1_PASS_TOKEN =
  'AEE_ALL_PROFILE_CONTINUATION_V1_PASS' as const;

const ASE_MATERIALIZATION_STOP =
  'ASE-authorized materialization did not complete.' as const;

export const AEE_PROFILE_CONTINUATION_MATRIX_IDS = [
  'expense-tracker',
  'saas-crm',
  'ai-chat-app',
  'internal-hr-admin',
] as const;

export interface AeeProfileContinuationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface AeeProfileContinuationRow {
  categoryId: string;
  label: string;
  selectedProfile: string | null;
  workspaceGenerated: boolean;
  npmInstallRan: boolean;
  npmBuildRan: boolean;
  aeeDecision: string | null;
  failureReason: string | null;
  durationMs: number;
}

export function resetAeeProfileContinuationTestHarness(): void {
  resetOnePromptLivePreviewForTests();
  resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

export async function runAeeAllProfileContinuationValidation(rootDir: string): Promise<{
  checks: AeeProfileContinuationCheck[];
  rows: AeeProfileContinuationRow[];
  allPassed: boolean;
}> {
  const checks: AeeProfileContinuationCheck[] = [];
  const rows: AeeProfileContinuationRow[] = [];

  resetAeeProfileContinuationTestHarness();

  for (const categoryId of AEE_PROFILE_CONTINUATION_MATRIX_IDS) {
    const entry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((row) => row.categoryId === categoryId);
    if (!entry) {
      checks.push({
        name: `${categoryId}: matrix entry exists`,
        passed: false,
        detail: 'missing matrix entry',
      });
      continue;
    }

    const startedAt = Date.now();
    const projectId = `aee-profile-continuation-${categoryId}-${Date.now()}`;
    let build: OnePromptLivePreviewBuildResult;

    try {
      build = await runOnePromptLivePreviewBuild({
        rawPrompt: entry.prompt,
        projectRootDir: rootDir,
        source: 'api',
        projectId,
        projectName: entry.categoryLabel,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      build = {
        readOnly: true,
        buildId: 'error',
        projectId,
        projectName: entry.categoryLabel,
        status: 'FAILED',
        prompt: entry.prompt,
        requestType: 'BUILD_FROM_PROMPT',
        workspaceId: projectId,
        workspacePath: null,
        generatedProfile: null,
        planningProofLevel: null,
        materializationProofLevel: null,
        buildResult: 'FAIL',
        npmInstallOk: false,
        npmBuildOk: false,
        previewUrl: null,
        diagnosticPreviewUrl: null,
        limitedPreviewUrl: null,
        devServerRunning: false,
        livePreviewAvailable: false,
        failureReason: message,
        featureSignals: null,
        materializationManifest: null,
        livePreviewGate: null,
        autonomousSoftwareEngineering: null,
        updatedAt: new Date().toISOString(),
      };
    }

    const workspaceDir = join(rootDir, GENERATED_BUILDER_WORKSPACES_DIR, projectId);
    const workspaceModules = existsSync(workspaceDir) ? listWorkspaceFeatureModuleIds(workspaceDir) : [];
    const aeeDecision =
      build.aeeFinalReport?.finalDecision ?? build.aeeExecutiveDecision?.decision ?? null;

    const row: AeeProfileContinuationRow = {
      categoryId,
      label: entry.categoryLabel,
      selectedProfile: build.generatedProfile ? String(build.generatedProfile) : null,
      workspaceGenerated: workspaceModules.length > 0,
      npmInstallRan: build.npmInstallOk,
      npmBuildRan: build.npmBuildOk,
      aeeDecision,
      failureReason: build.failureReason,
      durationMs: Date.now() - startedAt,
    };
    rows.push(row);

    const notAseStopped = build.failureReason !== ASE_MATERIALIZATION_STOP;
    checks.push({
      name: `${categoryId}: not stopped at ASE materialization gate`,
      passed: notAseStopped,
      detail: build.failureReason ?? 'ok',
    });

    checks.push({
      name: `${categoryId}: workspace generated`,
      passed: row.workspaceGenerated,
      detail: `${workspaceModules.length} modules`,
    });

    checks.push({
      name: `${categoryId}: npm install reached`,
      passed: build.npmInstallOk,
      detail: build.npmInstallOk ? 'PASS' : 'FAIL',
    });

    checks.push({
      name: `${categoryId}: npm build reached`,
      passed: build.npmBuildOk,
      detail: build.npmBuildOk ? 'PASS' : 'FAIL',
    });

    checks.push({
      name: `${categoryId}: AEE allowed build spine through npm`,
      passed: build.npmBuildOk,
      detail: build.npmBuildOk
        ? `final aee=${aeeDecision ?? 'null'}`
        : build.failureReason ?? 'npm build not reached',
    });
  }

  const allPassed = checks.every((check) => check.passed);
  return { checks, rows, allPassed };
}

export function printAeeAllProfileContinuationResults(
  checks: readonly AeeProfileContinuationCheck[],
  rows: readonly AeeProfileContinuationRow[],
): number {
  for (const row of rows) {
    console.log(`- ${row.label} (${row.categoryId})`);
    console.log(`  profile=${row.selectedProfile ?? 'null'} workspace=${row.workspaceGenerated}`);
    console.log(`  npm install/build=${row.npmInstallRan}/${row.npmBuildRan} aee=${row.aeeDecision ?? 'null'}`);
    console.log(`  failure=${row.failureReason ?? 'none'} (${row.durationMs}ms)`);
    console.log('');
  }

  let passed = 0;
  for (const check of checks) {
    const mark = check.passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${check.name}`);
    if (!check.passed) {
      console.log(`       ${check.detail}`);
    } else {
      passed += 1;
    }
  }
  return passed;
}
