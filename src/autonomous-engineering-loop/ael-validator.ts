/**
 * Autonomous Engineering Loop V1 — validation helpers.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AelValidationCheck } from './ael-types.js';
import { evaluateProductReality } from './product-reality-engine.js';
import { classifyCapabilityType, runCapabilityEvolutionRuntime } from './capability-evolution-runtime.js';
import { assessEvolutionSafety } from '../missing-capability-evolution-engine/evolution-safety-assessor.js';
import { evaluateAelDecision } from './ael-decision-engine.js';
import { collectAelEvidence } from './ael-evidence-collector.js';
import { listAelStates } from './ael-loop-state-machine.js';
import { isAelEnabled } from './ael-orchestrator.js';

export const AEL_REQUIRED_FILES = [
  'index.ts',
  'ael-types.ts',
  'ael-loop-state-machine.ts',
  'ael-orchestrator.ts',
  'capability-evolution-runtime.ts',
  'product-reality-engine.ts',
  'autonomous-founder-loop.ts',
  'ael-evidence-collector.ts',
  'ael-decision-engine.ts',
  'ael-repair-router.ts',
  'ael-report-builder.ts',
  'ael-validator.ts',
] as const;

export function assertAelCheck(
  checks: AelValidationCheck[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  checks.push({ name, passed: condition, detail });
}

export function validateAelModuleFiles(moduleDir: string, checks: AelValidationCheck[]): void {
  for (const file of AEL_REQUIRED_FILES) {
    assertAelCheck(checks, `file ${file}`, existsSync(join(moduleDir, file)), file);
  }
}

export function validateAelStateMachine(checks: AelValidationCheck[]): void {
  const states = listAelStates();
  assertAelCheck(checks, 'AEL state machine has 12 states', states.length >= 12, String(states.length));
  assertAelCheck(
    checks,
    'AEL_LAUNCH_READY terminal state',
    states.includes('AEL_LAUNCH_READY'),
    'AEL_LAUNCH_READY',
  );
  assertAelCheck(
    checks,
    'AEL_HUMAN_REVIEW_REQUIRED terminal state',
    states.includes('AEL_HUMAN_REVIEW_REQUIRED'),
    'AEL_HUMAN_REVIEW_REQUIRED',
  );
}

export function validatePreGenericFallbackDetection(checks: AelValidationCheck[]): void {
  const genericOnly = evaluateProductReality({
    rawPrompt: 'Build a SaaS CRM with customer records, deal pipeline, activity timeline, and team dashboard.',
    workspaceDir: '.',
    generatedModules: ['dashboard', 'settings', 'persistence'],
  });
  assertAelCheck(
    checks,
    'PRE detects generic dashboard/settings fallback',
    genericOnly.genericFallbackDetected,
    `score=${genericOnly.productRealityScore}`,
  );
}

export function validatePreRichProductPass(checks: AelValidationCheck[]): void {
  const rich = evaluateProductReality({
    rawPrompt: 'Build an expense tracker where users add expenses, categorize spending, view monthly totals.',
    workspaceDir: '.',
    generatedModules: ['expenses', 'categories', 'reports', 'charts', 'dashboard'],
  });
  assertAelCheck(
    checks,
    'PRE passes apps with real product modules',
    !rich.genericFallbackDetected && rich.productRealityScore > genericOnlyScore(),
    `score=${rich.productRealityScore}`,
  );
}

function genericOnlyScore(): number {
  return evaluateProductReality({
    rawPrompt: 'Build a SaaS CRM with customer records, deal pipeline.',
    workspaceDir: '.',
    generatedModules: ['dashboard', 'settings'],
  }).productRealityScore;
}

export function validateCerSafetyGates(checks: AelValidationCheck[]): void {
  const medical = assessEvolutionSafety({
    readOnly: true,
    missingCapabilityId: 'med-1',
    capabilityName: 'medical diagnosis engine',
    reasonRequired: 'test',
    sourceRequirementIds: ['req-1'],
    sourcePromptEvidence: ['diagnose patient condition'],
    affectedFeatureSlices: [],
    affectedBehaviorScenarios: [],
    affectedVirtualUsers: [],
    affectedDeviceProfiles: [],
    affectedInteractions: [],
    expectedInterfaces: [],
    requiredValidation: [],
    riskHints: [],
    blockingGate: 'LAUNCH_AUTHORITY',
  });
  assertAelCheck(
    checks,
    'CER does not bypass safety gates',
    medical.verdict === 'BLOCKED_UNSAFE' ||
      medical.verdict === 'NEEDS_HUMAN_REVIEW' ||
      medical.verdict === 'INSUFFICIENT_EVIDENCE',
    medical.verdict,
  );

  const paymentType = classifyCapabilityType('checkout-payment-integration');
  assertAelCheck(
    checks,
    'Safe placeholders for risky integrations',
    paymentType === 'INTEGRATION_PLACEHOLDER',
    paymentType,
  );
}

export function validateAelDecisionOutcomes(checks: AelValidationCheck[]): void {
  const launchReadyEvidence = collectAelEvidence({
    rawPrompt: 'Build expense tracker',
    workspaceDir: '.',
    generatedModules: ['expenses', 'categories', 'reports'],
    npmInstallOk: true,
    npmBuildOk: true,
    previewOk: true,
    previewDegraded: false,
    autofixAttempts: 0,
    capabilityEvolutionAttempts: 0,
    previewRecoveryAttempts: 0,
    aeeFurthestStage: 'FINAL_REPORT',
    aeeFinalReport: null,
    productRealityReport: {
      readOnly: true,
      productDomain: 'finance-expense',
      productRealityScore: 85,
      requiredCapabilities: ['expense-tracking'],
      coveredCapabilities: ['expense-tracking'],
      missingCapabilities: [],
      genericFallbackDetected: false,
      coreWorkflowCoverage: 90,
      interactionCoverage: 80,
      routeCoverage: 80,
      dataModelCoverage: 80,
      launchReadinessBlockers: [],
      repairRecommendations: [],
    },
    founderLoopReport: {
      readOnly: true,
      cycle: 1,
      verdict: 'LAUNCH_READY',
      launchBlockers: [],
      missingWorkflows: [],
      trustIssues: [],
      safetyGaps: [],
      routedTo: 'DECLARE_LAUNCH_READY',
    },
  });
  const launchDecision = evaluateAelDecision(launchReadyEvidence, 1);
  assertAelCheck(
    checks,
    'AEL stops at LAUNCH_READY when product reality and founder pass',
    launchDecision.decision === 'DECLARE_LAUNCH_READY',
    launchDecision.decision,
  );

  const humanReviewEvidence = collectAelEvidence({
    rawPrompt: 'Build payment processor',
    workspaceDir: '.',
    generatedModules: ['checkout'],
    npmInstallOk: true,
    npmBuildOk: true,
    previewOk: false,
    previewDegraded: true,
    autofixAttempts: 3,
    capabilityEvolutionAttempts: 2,
    previewRecoveryAttempts: 2,
    aeeFurthestStage: 'PREVIEWING',
    aeeFinalReport: null,
    safetyReviewRequired: true,
    founderLoopReport: {
      readOnly: true,
      cycle: 1,
      verdict: 'SAFETY_REVIEW',
      launchBlockers: ['Unsafe live payment integration'],
      missingWorkflows: [],
      trustIssues: [],
      safetyGaps: ['real payment'],
      routedTo: 'REQUEST_HUMAN_REVIEW',
    },
  });
  const humanDecision = evaluateAelDecision(humanReviewEvidence, 1);
  assertAelCheck(
    checks,
    'AEL stops at HUMAN_REVIEW_REQUIRED for high-risk unsafe integrations',
    humanDecision.decision === 'REQUEST_HUMAN_REVIEW',
    humanDecision.decision,
  );

  const limitEvidence = collectAelEvidence({
    rawPrompt: 'Build CRM',
    workspaceDir: '.',
    generatedModules: ['dashboard'],
    npmInstallOk: true,
    npmBuildOk: false,
    previewOk: false,
    previewDegraded: false,
    autofixAttempts: 3,
    capabilityEvolutionAttempts: 2,
    previewRecoveryAttempts: 2,
    aeeFurthestStage: 'BUILDING',
    aeeFinalReport: null,
  });
  const limitDecision = evaluateAelDecision(limitEvidence, 3);
  assertAelCheck(
    checks,
    'AEL stops at ENGINEERING_LIMIT_REACHED after budgets exhausted',
    limitDecision.decision === 'STOP_AT_ENGINEERING_LIMIT',
    limitDecision.decision,
  );
}

export function validateAelOrchestratorWiring(orchestratorSource: string, checks: AelValidationCheck[]): void {
  assertAelCheck(
    checks,
    'orchestrator calls runAutonomousEngineeringLoop',
    orchestratorSource.includes('runAutonomousEngineeringLoop'),
    'runAutonomousEngineeringLoop',
  );
  assertAelCheck(
    checks,
    'AEL calls AEE not replaces it',
    orchestratorSource.includes('runAeeExecutiveCoordination') &&
      orchestratorSource.includes('runAutonomousEngineeringLoop'),
    'AEE + AEL coexist',
  );
}

export function validateAelNoAppHardcoding(moduleDir: string, checks: AelValidationCheck[]): void {
  const forbidden = ['LISA_SPECIFIC', 'hardcodedLisa', 'EXPENSE_TRACKER_ONLY'];
  let clean = true;
  for (const file of AEL_REQUIRED_FILES) {
    if (file === 'ael-validator.ts') continue;
    const path = join(moduleDir, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf8');
    for (const term of forbidden) {
      if (content.includes(term)) clean = false;
    }
  }
  assertAelCheck(checks, 'No app-specific hardcoding in AEL module', clean, 'generic patterns only');
}

export function validateAelFeatureFlag(checks: AelValidationCheck[]): void {
  const prev = process.env.AIDEVENGINE_AEL_ENABLED;
  process.env.AIDEVENGINE_AEL_ENABLED = 'true';
  assertAelCheck(checks, 'AEL enabled when flag true', isAelEnabled(), 'enabled');
  process.env.AIDEVENGINE_AEL_ENABLED = 'false';
  assertAelCheck(checks, 'AEL disabled when flag false', !isAelEnabled(), 'disabled');
  if (prev === undefined) delete process.env.AIDEVENGINE_AEL_ENABLED;
  else process.env.AIDEVENGINE_AEL_ENABLED = prev;
}

export function validateCerModuleGeneration(checks: AelValidationCheck[], tempWorkspace: {
  workspaceDir: string;
  projectRootDir: string;
  workspaceId: string;
  definition: import('../universal-prompt-to-app-materialization/profile-feature-map.js').ProfileFeatureDefinition;
}): void {
  const result = runCapabilityEvolutionRuntime({
    rawPrompt: 'Build AI chat app with conversation history',
    workspaceDir: tempWorkspace.workspaceDir,
    projectRootDir: tempWorkspace.projectRootDir,
    workspaceId: tempWorkspace.workspaceId,
    missingCapabilities: ['conversation-history'],
    definition: tempWorkspace.definition,
    existingModules: ['dashboard', 'settings'],
    attemptBudget: 1,
  });
  assertAelCheck(
    checks,
    'CER generates missing safe modules',
    result.evolvedModules.length > 0 || result.attempts.some((a) => a.generated),
    result.evolvedModules.join(',') || 'attempted',
  );
  assertAelCheck(
    checks,
    'CER never bypasses safety gate',
    result.safetyGateBypassed === false,
    'safetyGateBypassed=false',
  );
}
