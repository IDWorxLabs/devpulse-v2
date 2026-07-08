/**
 * Build Spine Refinement V1 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { promptDescribesAssistiveCommunication } from '../../src/prompt-faithful-generation/assistive-communication-profile.js';
import {
  evaluateModuleContractMatch,
  collectStaticProductionBlockers,
} from './one-prompt-build-readiness-audit.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';
import { resolveAeePreviewContractSync } from '../../src/autonomous-engineering-executive/aee-preview-contract.js';
import type { LivePreviewGateResult } from '../../src/live-preview-gate/live-preview-gate-types.js';

export const BUILD_SPINE_REFINEMENT_V1_PASS_TOKEN = 'BUILD_SPINE_REFINEMENT_V1_PASS' as const;

export interface BuildSpineRefinementCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

function assertCheck(
  checks: BuildSpineRefinementCheck[],
  name: string,
  passed: boolean,
  detail: string,
): void {
  checks.push({ name, passed, detail });
}

function minimalGate(blockedBy: LivePreviewGateResult['blockedBy']): LivePreviewGateResult {
  return {
    readOnly: true,
    gateId: 'test-gate',
    state: 'LOCKED',
    unlockVerdict: 'PREVIEW_LOCKED',
    previewUrl: null,
    isPreviewAvailable: false,
    isLimitedPreview: false,
    blockedBy,
    blockerExplanation: { summary: 'interaction proof incomplete', details: [], evidence: [] },
    evidenceSummary: [],
    evaluatedAt: new Date().toISOString(),
  };
}

export function runBuildSpineRefinementValidation(): BuildSpineRefinementCheck[] {
  const checks: BuildSpineRefinementCheck[] = [];
  const orchestrator = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const auditSource = readFileSync(join(ROOT, 'scripts/lib/one-prompt-build-readiness-audit.ts'), 'utf8');

  assertCheck(
    checks,
    'AEE Build AutoFix loop wired on orchestrator',
    orchestrator.includes('runAeeBuildAutofixLoop'),
    'runAeeBuildAutofixLoop',
  );

  assertCheck(
    checks,
    'Audit does not flag AutoFix when npm build passed',
    auditSource.includes('autoFixMissingWhenNeeded') && !auditSource.includes('row.npmBuildRan && !row.autoFixRan'),
    'autoFixMissingWhenNeeded',
  );

  assertCheck(
    checks,
    'Static AutoFix blocker suppressed when loop wired',
    collectStaticProductionBlockers(ROOT).every((b) => b.class !== 'AUTOFIX_NOT_EXECUTING'),
    'no static AUTOFIX_NOT_EXECUTING',
  );

  const assistivePrompt =
    UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'assistive-mobile-accessibility')!.prompt;
  const assistivePlan = resolvePromptFaithfulBuildPlan(assistivePrompt);
  assertCheck(
    checks,
    'Assistive prompt selects ASSISTIVE_COMMUNICATION_APP_V1',
    String(assistivePlan.materializationProfile) === 'ASSISTIVE_COMMUNICATION_APP_V1',
    String(assistivePlan.materializationProfile),
  );
  assertCheck(
    checks,
    'Assistive detection is semantic/general',
    promptDescribesAssistiveCommunication(
      'Build an assistive communication app with gaze selection, blink input, and text-to-speech for severe motor impairment.',
    ),
    'semantic patterns',
  );

  const degradedPreview = resolveAeePreviewContractSync({
    npmInstallOk: true,
    npmBuildOk: true,
    devServerRunning: true,
    devServerUrl: 'http://127.0.0.1:5173',
    gate: minimalGate('INTERACTION_PROOF'),
    gateBlocker: 'Interaction proof incomplete',
    previewRecoveryAttempts: 1,
    routeProbe: {
      readOnly: true,
      attempted: true,
      ok: true,
      statusCode: 200,
      url: 'http://127.0.0.1:5173',
      detail: 'Route responded HTTP 200.',
    },
  });
  assertCheck(
    checks,
    'Route probe unlocks preview with degraded interaction proof',
    degradedPreview.livePreviewAvailable && degradedPreview.previewStatus === 'DEGRADED',
    `${degradedPreview.previewStatus} available=${degradedPreview.livePreviewAvailable}`,
  );

  const aiChatEntry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'ai-chat-app')!;
  const moduleMatch = evaluateModuleContractMatch({
    build: {
      readOnly: true,
      buildId: 'test',
      projectId: 'test',
      projectName: 'test',
      status: 'READY',
      prompt: aiChatEntry.prompt,
      requestType: 'BUILD_FROM_PROMPT',
      workspaceId: 'test',
      workspacePath: '/tmp',
      generatedProfile: 'GENERIC_CUSTOM_APP_V1',
      planningProofLevel: null,
      materializationProofLevel: null,
      buildResult: 'PASS',
      npmInstallOk: true,
      npmBuildOk: true,
      previewUrl: null,
      diagnosticPreviewUrl: null,
      limitedPreviewUrl: null,
      devServerRunning: true,
      livePreviewAvailable: true,
      failureReason: null,
      featureSignals: null,
      materializationManifest: null,
      livePreviewGate: null,
      autonomousSoftwareEngineering: null,
      aeeFinalReport: {
        readOnly: true,
        projectName: 'test',
        selectedProfile: 'GENERIC_CUSTOM_APP_V1',
        generatedModules: ['conversations', 'chat-input', 'responses', 'history', 'navigation-router'],
        workspacePath: '/tmp',
        buildSpineStageReached: 'FINAL_REPORT',
        finalDecision: 'CONTINUE',
        finalOutcome: 'BUILD_COMPLETED_WITH_PREVIEW',
        evidenceProvidersConsulted: [],
        blockersOverridden: [],
        blockersRespected: [],
        repairAttempts: 0,
        retryAttempts: 0,
        npmInstallResult: 'PASS',
        npmBuildResult: 'PASS',
        previewResult: 'PASS',
        livePreviewUrl: null,
        remainingGaps: [],
        overrideEvents: [],
        recordedAt: new Date().toISOString(),
        engineeringIntelligenceReport: {
          readOnly: true,
          reportId: 'ei-test',
          detectedProductDomain: 'ai-chat',
          selectedProfile: 'GENERIC_CUSTOM_APP_V1',
          profileDomainMismatch: null,
          requiredCapabilities: [],
          generatedModules: ['conversations', 'chat-input', 'responses', 'history'],
          missingCapabilities: [],
          rejectedFallbackModules: [],
          productFidelityScore: 85,
          missingCapabilityRepairsAttempted: 0,
          finalCapabilityCoverage: 'FULL',
          moduleContractStatus: 'SATISFIED',
          recordedAt: new Date().toISOString(),
        },
      },
      updatedAt: new Date().toISOString(),
    },
    workspaceModules: ['conversations', 'chat-input', 'responses', 'history', 'navigation-router', 'dashboard'],
    matrixHints: aiChatEntry.requiredModuleHints,
    prePlanApprovedModules: ['dashboard', 'settings'],
  });
  assertCheck(
    checks,
    'Module contract uses EI final modules not stale pre-EI plan',
    moduleMatch.match && moduleMatch.classification.includes('EI'),
    moduleMatch.classification,
  );

  assertCheck(
    checks,
    'ASSISTIVE_COMMUNICATION_APP_V1 profile map exists',
    existsSync(join(ROOT, 'src/prompt-faithful-generation/assistive-communication-profile.ts')),
    'assistive-communication-profile.ts',
  );

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assertCheck(
    checks,
    'package script validate:build-spine-refinement-v1',
    Boolean(pkg.scripts?.['validate:build-spine-refinement-v1']),
    'script',
  );

  return checks;
}
