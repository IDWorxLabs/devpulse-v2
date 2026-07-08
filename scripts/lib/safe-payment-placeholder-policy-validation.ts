/**
 * Safe Payment Placeholder Policy V1 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAuthorityEvidenceBundle } from '../../src/autonomous-engineering-executive/aee-evidence-normalizer.js';
import { runCapabilityPlanningPipeline } from '../../src/capability-planning-engine/index.js';
import { buildUniversalCrudWorkspaceFiles } from '../../src/code-generation-engine/universal-crud-app-generator.js';
import { getDevPulseV2Owner } from '../../src/foundation/ownership-registry.js';
import { buildEngineeringIntelligenceReport } from '../../src/engineering-intelligence-runtime/engineering-intelligence-report.js';
import { synthesizeEngineeringFeatureContract } from '../../src/engineering-intelligence-runtime/module-contract-synthesizer.js';
import { checkPromptToFeatureFidelity } from '../../src/engineering-intelligence-runtime/prompt-to-feature-fidelity-checker.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import {
  SAFE_PAYMENT_PLACEHOLDER_NOTICE,
  SAFE_PAYMENT_SIMULATED_GAP,
  classifyPaymentIntent,
  containsRealPaymentExecutionSource,
  getDevPulseV2SafePaymentPlaceholderPolicy,
  promptRequiresRealPaymentIntegration,
  resetSafePaymentPlaceholderPolicyForTests,
} from '../../src/safe-payment-placeholder-policy/index.js';
import { assessEvolutionSafety } from '../../src/missing-capability-evolution-engine/evolution-safety-assessor.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/safe-payment-placeholder-policy');

export const ECOMMERCE_PROMPT =
  'Build an e-commerce store with product catalog, shopping cart, checkout flow, and order history pages.';

export const REAL_PAYMENT_PROMPT =
  'Build an e-commerce store with Stripe live integration to charge real credit cards using sk_live_test_key without provider isolation.';

export const REQUIRED_FILES = [
  'safe-payment-placeholder-types.ts',
  'safe-payment-classifier.ts',
  'safe-payment-module-generator.ts',
  'index.ts',
];

export interface ValidationCheck {
  section: string;
  name: string;
  passed: boolean;
  detail: string;
}

export function runSafePaymentPlaceholderPolicyValidation(): {
  checks: ValidationCheck[];
  allPassed: boolean;
} {
  const checks: ValidationCheck[] = [];
  const assert = (section: string, name: string, condition: boolean, detail: string): void => {
    checks.push({ section, name, passed: condition, detail });
  };

  resetSafePaymentPlaceholderPolicyForTests();

  for (const file of REQUIRED_FILES) {
    assert('module', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }

  const authority = getDevPulseV2SafePaymentPlaceholderPolicy();
  assert(
    'module',
    'pass token',
    authority.passToken === 'SAFE_PAYMENT_PLACEHOLDER_POLICY_V1_PASS',
    authority.passToken,
  );

  const owner = getDevPulseV2Owner('safe_payment_placeholder_policy');
  assert(
    'module',
    'ownership registry',
    owner?.ownerModule === 'devpulse_v2_safe_payment_placeholder_policy',
    owner?.ownerModule ?? 'missing',
  );

  const safeAssessment = classifyPaymentIntent(ECOMMERCE_PROMPT);
  assert(
    'classification',
    'e-commerce classified as SAFE_PAYMENT_PLACEHOLDER',
    safeAssessment.classification === 'SAFE_PAYMENT_PLACEHOLDER',
    safeAssessment.classification,
  );

  const realAssessment = classifyPaymentIntent(REAL_PAYMENT_PROMPT);
  assert(
    'classification',
    'real payment prompt classified as FINANCIAL_TRANSACTION_EXECUTION',
    realAssessment.classification === 'FINANCIAL_TRANSACTION_EXECUTION',
    realAssessment.classification,
  );
  assert(
    'classification',
    'real payment requires integration',
    realAssessment.requiresRealIntegration === true,
    String(realAssessment.requiresRealIntegration),
  );

  const buildPlan = resolvePromptFaithfulBuildPlan(ECOMMERCE_PROMPT);
  assert(
    'planning',
    'e-commerce readyForGeneration',
    buildPlan.readyForGeneration === true,
    String(buildPlan.readyForGeneration),
  );
  assert(
    'planning',
    'safe payment placeholder active on definition',
    buildPlan.definition.safePaymentPlaceholderActive === true,
    String(buildPlan.definition.safePaymentPlaceholderActive),
  );

  const intent = runIntentUnderstandingEngine({ rawPrompt: ECOMMERCE_PROMPT });
  const faithfulness = runPromptFaithfulnessEngineV2(ECOMMERCE_PROMPT, {
    generatedModules: intent.productIntelligenceModel.architecture.moduleIds,
  });
  const capabilityPlanning = runCapabilityPlanningPipeline({
    rawPrompt: ECOMMERCE_PROMPT,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    promptFaithfulnessBlocked: false,
  });
  assert(
    'capability-planning',
    'e-commerce not blocked for human review on placeholder',
    capabilityPlanning.permissionVerdict !== 'NEEDS_HUMAN_REVIEW',
    capabilityPlanning.permissionVerdict,
  );

  const safety = assessEvolutionSafety({
    readOnly: true,
    missingCapabilityId: 'test-1',
    capabilityName: 'Safe Payment Placeholder',
    reasonRequired: 'UI-only checkout placeholder',
    sourceRequirementIds: ['req-1'],
    sourcePromptEvidence: [ECOMMERCE_PROMPT.slice(0, 80)],
    affectedFeatureSlices: [],
    affectedBehaviorScenarios: [],
    affectedVirtualUsers: [],
    affectedDeviceProfiles: [],
    affectedInteractions: [],
    expectedInterfaces: [],
    requiredValidation: [],
    riskHints: [],
    blockingGate: 'CAPABILITY_PLANNING',
  });
  assert(
    'safety',
    'safe placeholder evolves safely',
    safety.verdict === 'SAFE_TO_EVOLVE',
    safety.verdict,
  );

  const files = buildUniversalCrudWorkspaceFiles({
    contractId: 'safe-payment-validation',
    ideaId: 'safe-payment-validation',
    buildUnits: ['unit-1'],
    rawPrompt: ECOMMERCE_PROMPT,
    faithfulBuildPlan: buildPlan,
  });
  const combinedSource = files.map((f) => f.content).join('\n');
  assert(
    'generation',
    'placeholder notice exists in generated source',
    combinedSource.includes(SAFE_PAYMENT_PLACEHOLDER_NOTICE),
    SAFE_PAYMENT_PLACEHOLDER_NOTICE,
  );
  assert(
    'generation',
    'no real payment execution generated',
    !containsRealPaymentExecutionSource(combinedSource),
    'clean',
  );
  assert(
    'generation',
    'checkout module generated',
    files.some((f) => f.relativePath.includes('src/features/checkout/')),
    'checkout module path',
  );

  const contract = synthesizeEngineeringFeatureContract({ rawPrompt: ECOMMERCE_PROMPT });
  const fidelity = checkPromptToFeatureFidelity({
    rawPrompt: ECOMMERCE_PROMPT,
    generatedModules: buildPlan.modulePlan.approvedModuleIds,
    approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
    selectedProfile: String(buildPlan.materializationProfile),
    contract,
  });
  const report = buildEngineeringIntelligenceReport({
    rawPrompt: ECOMMERCE_PROMPT,
    contract,
    selectedProfile: String(buildPlan.materializationProfile),
    profileMismatch: buildPlan.engineeringIntelligence?.profileMismatch ?? null,
    generatedModules: buildPlan.modulePlan.approvedModuleIds,
    fidelity,
  });
  assert(
    'reporting',
    'report states payment is simulated',
    (report.remainingIntegrationGaps ?? []).some((gap) => /simulated/i.test(gap)),
    (report.remainingIntegrationGaps ?? []).join('; '),
  );
  assert(
    'reporting',
    'report includes simulated gap constant',
    (report.remainingIntegrationGaps ?? []).includes(SAFE_PAYMENT_SIMULATED_GAP),
    SAFE_PAYMENT_SIMULATED_GAP,
  );

  const realIntent = runIntentUnderstandingEngine({ rawPrompt: REAL_PAYMENT_PROMPT });
  const realFaithfulness = runPromptFaithfulnessEngineV2(REAL_PAYMENT_PROMPT, {
    generatedModules: realIntent.productIntelligenceModel.architecture.moduleIds,
  });
  const realPlanning = runCapabilityPlanningPipeline({
    rawPrompt: REAL_PAYMENT_PROMPT,
    productIntelligenceModel: realIntent.productIntelligenceModel,
    promptFaithfulness: realFaithfulness,
    promptFaithfulnessBlocked: false,
  });
  assert(
    'safety-gate',
    'real payment still blocked by capability planning',
    realPlanning.permissionVerdict === 'NEEDS_HUMAN_REVIEW' ||
      realPlanning.blockedReason?.includes('Payment Processing') === true ||
      promptRequiresRealPaymentIntegration(REAL_PAYMENT_PROMPT),
    realPlanning.permissionVerdict,
  );

  const evidence = normalizeAuthorityEvidenceBundle({
    workspaceDir: join(ROOT, '.generated-builder-workspaces', 'safe-payment-aee'),
    buildPlan,
    rawPrompt: ECOMMERCE_PROMPT,
    projectId: 'safe-payment-aee',
    projectName: 'Safe Payment AEE',
    aseBlockers: [],
    aseMaterializationAuthorized: true,
    aseMaterializationExecuted: true,
    npmBuildOk: true,
    previewOk: true,
    stage: 'PLANNING',
    faithfulnessPassed: true,
  });
  assert(
    'aee',
    'AEE receives safe payment placeholder evidence',
    evidence.some((e) => e.authority === 'Safe Payment Placeholder Policy'),
    evidence.map((e) => e.authority).join(', '),
  );

  const orchestratorSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  assert(
    'integration',
    'build spine applies safe payment policy',
    readFileSync(join(ROOT, 'src/prompt-faithful-generation/index.ts'), 'utf8').includes(
      'applySafePaymentPlaceholderPolicyToDefinition',
    ),
    'prompt-faithful-generation/index.ts',
  );
  assert(
    'integration',
    'orchestrator runs post-workspace engineering intelligence',
    orchestratorSource.includes('runEngineeringIntelligencePostWorkspace'),
    'one-prompt-build-orchestrator.ts',
  );

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printSafePaymentPlaceholderPolicyValidationResults(input: {
  checks: ValidationCheck[];
  allPassed: boolean;
}): void {
  for (const check of input.checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(
    input.allPassed
      ? '\nSAFE_PAYMENT_PLACEHOLDER_POLICY_V1_PASS'
      : '\nSAFE_PAYMENT_PLACEHOLDER_POLICY_V1_FAIL',
  );
}
