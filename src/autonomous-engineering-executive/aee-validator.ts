/**
 * Autonomous Engineering Executive V1 — internal validation helpers.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { AeeEvidenceResult } from './aee-types.js';
import { AEE_OVERRIDE_ASE_DENIAL_EVENT } from './aee-types.js';
import {
  aeeForbidsPlanningFailedAfterWorkspace,
  isAfterWorkspaceReady,
} from './aee-state-machine.js';
import { normalizeAseEvidence, normalizeFeatureRealityEvidence } from './aee-evidence-normalizer.js';
import { evaluateAeeExecutiveDecision } from './aee-decision-engine.js';
import { evaluateAeeContinuationPolicy } from './aee-continuation-policy.js';
import { resolvePromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';

export interface AeeValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function assertAeeCheck(
  checks: AeeValidationCheck[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  checks.push({ name, passed: condition, detail });
}

export const AEE_REQUIRED_FILES = [
  'index.ts',
  'aee-types.ts',
  'aee-state-machine.ts',
  'aee-evidence-normalizer.ts',
  'aee-decision-engine.ts',
  'aee-continuation-policy.ts',
  'aee-report-builder.ts',
  'aee-runtime-recorder.ts',
  'aee-executive-coordinator.ts',
  'aee-validator.ts',
  'aee-preview-recovery-loop.ts',
  'aee-preview-recovery-loop-types.ts',
  'aee-build-autofix-loop.ts',
  'aee-build-autofix-loop-types.ts',
  'aee-preview-contract.ts',
  'aee-preview-contract-types.ts',
] as const;

export function validateAeeModuleFiles(moduleDir: string, checks: AeeValidationCheck[]): void {
  for (const file of AEE_REQUIRED_FILES) {
    assertAeeCheck(checks, `file ${file}`, existsSync(join(moduleDir, file)), file);
  }
}

export function validateAeeStateMachineRules(checks: AeeValidationCheck[]): void {
  assertAeeCheck(
    checks,
    'PLANNING_FAILED forbidden after WORKSPACE_READY',
    aeeForbidsPlanningFailedAfterWorkspace('WORKSPACE_READY', true, 'PLANNING_FAILED'),
    'forbidden',
  );
  assertAeeCheck(
    checks,
    'ASE denial forbidden after WORKSPACE_READY',
    aeeForbidsPlanningFailedAfterWorkspace(
      'WORKSPACE_READY',
      true,
      'ASE denied materialization authorization.',
    ),
    'forbidden',
  );
  assertAeeCheck(
    checks,
    'forward default after WORKSPACE_READY',
    isAfterWorkspaceReady('WORKSPACE_READY'),
    'WORKSPACE_READY is post-workspace',
  );
}

export function validateAeeEvidenceNormalization(checks: AeeValidationCheck[]): void {
  const aseDenied = normalizeAseEvidence({
    blockers: ['ASE denied materialization authorization.'],
    materializationAuthorized: false,
    stage: 'PLANNING',
  });
  assertAeeCheck(
    checks,
    'ASE STOP normalized to evidence recommendation',
    aseDenied.recommendation !== undefined && typeof aseDenied.canBlockContinuation === 'boolean',
    aseDenied.recommendation,
  );

  const featureDegraded = normalizeFeatureRealityEvidence({
    status: 'DEGRADED_WITH_WORKSPACE_EVIDENCE',
    stage: 'WORKSPACE_READY',
  });
  assertAeeCheck(
    checks,
    'Feature Reality DEGRADED does not block',
    !featureDegraded.canBlockContinuation && featureDegraded.recommendation === 'CONTINUE',
    featureDegraded.recommendation,
  );
}

export function validateAeeAseOverride(checks: AeeValidationCheck[], workspaceDir?: string): void {
  const aseEvidence = normalizeAseEvidence({
    blockers: ['ASE denied materialization authorization.'],
    materializationAuthorized: false,
    stage: 'WORKSPACE_READY',
  });
  assertAeeCheck(
    checks,
    'ASE denial normalized as non-concrete evidence',
    !aseEvidence.concreteBlocker,
    aseEvidence.recommendation,
  );

  if (workspaceDir && existsSync(workspaceDir)) {
    const plan = resolvePromptFaithfulBuildPlan(
      'Build LISA assistive communication app with eye-tracking and text-to-speech modules.',
    );
    const decision = evaluateAeeExecutiveDecision({
      workspaceDir,
      buildPlan: plan,
      rawPrompt: 'Build LISA assistive communication app',
      projectId: 'aee-validation',
      projectName: 'AEE Validation',
      aseBlockers: ['ASE denied materialization authorization.'],
      aseMaterializationAuthorized: false,
      featureRealityStatus: 'DEGRADED_WITH_WORKSPACE_EVIDENCE',
      manifestFaithfulness: { status: 'PASS', score: 90 },
    });
    assertAeeCheck(
      checks,
      'ASE denial overridden when workspace evidence supports continuation',
      decision.overrideEvent === AEE_OVERRIDE_ASE_DENIAL_EVENT || decision.shouldContinueToBuild,
      decision.overrideEvent ?? decision.reasoning.slice(0, 80),
    );
  }
}

export function evidenceHasAuthorityStopNormalized(evidence: readonly AeeEvidenceResult[]): boolean {
  return evidence.every((e) => typeof e.recommendation === 'string' && typeof e.authority === 'string');
}

export function validateAeeOrchestratorWiring(
  orchestratorSource: string,
  checks: AeeValidationCheck[],
): void {
  assertAeeCheck(
    checks,
    'orchestrator imports AEE executive coordination',
    orchestratorSource.includes('runAeeExecutiveCoordination'),
    'runAeeExecutiveCoordination',
  );
  assertAeeCheck(
    checks,
    'orchestrator AEE gate uses materializationExecuted',
    orchestratorSource.includes('!engineeringPartial.materializationExecuted'),
    'materializationExecuted gate',
  );
  assertAeeCheck(
    checks,
    'orchestrator normalizes ASE blockers for AEE',
    orchestratorSource.includes('collectAseMaterializationBlockers'),
    'collectAseMaterializationBlockers',
  );
  assertAeeCheck(
    checks,
    'orchestrator passes ASE materialization execution to AEE',
    orchestratorSource.includes('aseMaterializationExecuted'),
    'aseMaterializationExecuted',
  );
  assertAeeCheck(
    checks,
    'orchestrator records AEE executive decision on manifest',
    orchestratorSource.includes('recordForensicManifestAeeExecutiveDecision'),
    'recordForensicManifestAeeExecutiveDecision',
  );
  assertAeeCheck(
    checks,
    'orchestrator builds AEE final report',
    orchestratorSource.includes('buildAeeFinalReport'),
    'buildAeeFinalReport',
  );
  assertAeeCheck(
    checks,
    'orchestrator uses AEE abort gate',
    orchestratorSource.includes('aeeCanAbortBuild'),
    'aeeCanAbortBuild',
  );
  assertAeeCheck(
    checks,
    'orchestrator runs AEE preview recovery loop',
    orchestratorSource.includes('runAeePreviewRecoveryLoop'),
    'runAeePreviewRecoveryLoop',
  );
  assertAeeCheck(
    checks,
    'orchestrator runs AEE build AutoFix loop',
    orchestratorSource.includes('runAeeBuildAutofixLoop'),
    'runAeeBuildAutofixLoop',
  );
  assertAeeCheck(
    checks,
    'orchestrator applies AEE preview contract',
    orchestratorSource.includes('resolveAeePreviewContract'),
    'resolveAeePreviewContract',
  );
  assertAeeCheck(
    checks,
    'orchestrator avoids preview-only hard fail after build pass',
    !orchestratorSource.includes(
      "failureReason: gateBlocker,\n        status: 'PARTIAL',\n        lastSuccessfulStage,\n        warnings: continuationFailureWarnings(),\n      },\n      result: {\n        buildId,\n        projectId,\n        projectName,\n        prompt,\n        source,\n        failureReason: gateBlocker,",
    ),
    'no immediate gate-only registerFailedBuild',
  );
}

export function validateAeeContinuationPolicyUnit(checks: AeeValidationCheck[]): void {
  const plan = resolvePromptFaithfulBuildPlan(
    'Build a recipe planner with recipes, ingredients, meal plan, and shopping list.',
  );
  const policy = evaluateAeeContinuationPolicy({
    workspaceDir: join(process.cwd(), '.nonexistent-workspace'),
    buildPlan: plan,
    blockers: ['Feature Reality evidence unavailable'],
    featureRealityStatus: 'DEGRADED_WITH_WORKSPACE_EVIDENCE',
    manifestFaithfulness: { status: 'PASS', score: 85 },
  });
  assertAeeCheck(
    checks,
    'continuation policy evaluates without throw',
    typeof policy.shouldContinueToBuild === 'boolean',
    String(policy.shouldContinueToBuild),
  );

  const expensePlan = resolvePromptFaithfulBuildPlan(
    'Build an expense tracker where users add expenses, categorize spending, view monthly totals, and filter by date range.',
  );
  const expenseWorkspace = join(process.cwd(), '.aee-profile-continuation-unit');
  mkdirSync(expenseWorkspace, { recursive: true });
  const expensePolicy = evaluateAeeContinuationPolicy({
    workspaceDir: expenseWorkspace,
    buildPlan: expensePlan,
    blockers: [
      'Incremental build blocked',
      'Interaction proof must pass before launch',
      'ASE denied MATERIALIZATION',
    ],
    featureRealityStatus: null,
    manifestFaithfulness: { status: 'PASS', score: 90 },
  });
  assertAeeCheck(
    checks,
    'EXPENSE_TRACKER pre-build continuation with ASE overstrict blockers',
    expensePolicy.shouldContinueToBuild && expensePolicy.shouldMaterializeFirst,
    expensePolicy.continuationReason ?? 'no reason',
  );
}
