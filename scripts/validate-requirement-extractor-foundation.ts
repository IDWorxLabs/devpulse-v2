/**
 * DevPulse V2 Requirement Extractor Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { createBuildRequest, resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/index.js';
import { AIDEV_OWNER_MODULE } from '../src/aidev-engine/types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { INTENT_OWNER_MODULE } from '../src/intent-architecture/types.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import {
  assertAiDevOwnershipUnchanged,
  assertCentralBrainOwnershipUnchanged,
  assertIntentArchitectureOwnershipUnchanged,
  DevPulseV2RequirementExtractorAuthority,
  EXTRACTOR_OWNER_MODULE,
  EXTRACTOR_PASS_TOKEN,
  extractConstraints,
  extractFeatures,
  extractPlatforms,
  extractRequirements,
  extractRisks,
  extractSuccessCriteria,
  formatRequirementExtractorReport,
  resetDevPulseV2RequirementExtractorAuthorityForTests,
  summarizeRequirements,
} from '../src/requirement-extractor/index.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const ANDROID_EXAMPLE =
  'Build an Android expense tracker app for students with offline support.';

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Requirement Extractor Foundation Validation');
  console.log('=========================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 4,
    systems: ['requirement_extractor'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts requirement_extractor packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const extractor = resetDevPulseV2RequirementExtractorAuthorityForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();

  assert(
    '2. Requirement Extractor Authority exists',
    extractor instanceof DevPulseV2RequirementExtractorAuthority,
    `ownerModule=${DevPulseV2RequirementExtractorAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('requirement_extractor');
  assert(
    '3. Ownership registry contains requirement_extractor',
    owner.ownerModule === EXTRACTOR_OWNER_MODULE &&
      DevPulseV2RequirementExtractorAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Extractor starts empty',
    extractor.getExtractorState().extractionCount === 0,
    `extractions=${extractor.getExtractorState().extractionCount}`,
  );

  const reqId = 'test-request-001';
  const extracted = extractRequirements({ requestId: reqId, userInput: ANDROID_EXAMPLE });
  assert(
    '5. extractRequirements works',
    extracted.extractionId.length > 0 && extracted.requirements.length > 0,
    `count=${extracted.requirements.length}`,
  );

  const features = extractFeatures(ANDROID_EXAMPLE, reqId);
  assert(
    '6. extractFeatures works',
    features.some((f) => f.value.includes('expense')),
    features.map((f) => f.value).join(', '),
  );

  const constraints = extractConstraints(ANDROID_EXAMPLE, reqId);
  assert(
    '7. extractConstraints works',
    constraints.some((c) => c.value.includes('offline')),
    constraints.map((c) => c.value).join(', '),
  );

  const platforms = extractPlatforms(ANDROID_EXAMPLE, reqId);
  assert(
    '8. extractPlatforms works',
    platforms.some((p) => p.value === 'Android'),
    platforms.map((p) => p.value).join(', '),
  );

  const risks = extractRisks(ANDROID_EXAMPLE, reqId);
  assert(
    '9. extractRisks works',
    risks.length > 0,
    risks.map((r) => r.value).join(', '),
  );

  const success = extractSuccessCriteria(ANDROID_EXAMPLE, reqId);
  assert(
    '10. extractSuccessCriteria works',
    success.length > 0,
    success.map((s) => s.value).join(', '),
  );

  const summary = summarizeRequirements(extracted);
  assert(
    '11. summarizeRequirements works',
    summary.includes('Extraction') && summary.includes(reqId),
    summary.slice(0, 80),
  );

  const featureValues = extracted.requirements.filter((r) => r.category === 'FEATURE').map((r) => r.value);
  const platformValues = extracted.requirements.filter((r) => r.category === 'PLATFORM').map((r) => r.value);
  const userValues = extracted.requirements.filter((r) => r.category === 'USER_TYPE').map((r) => r.value);
  assert(
    '12. Android expense tracker example extracts correctly',
    featureValues.some((v) => v.includes('expense')) &&
      featureValues.some((v) => v.includes('offline')) &&
      platformValues.includes('Android') &&
      userValues.some((v) => v.includes('student')),
    `features=${featureValues.join('|')} platform=${platformValues.join('|')} users=${userValues.join('|')}`,
  );

  const aidevRequest = createBuildRequest(ANDROID_EXAMPLE);
  const fromAidev = extractor.extractFromAiDevRequest(aidevRequest);
  assert(
    '13. AiDev bridge works',
    fromAidev.requestId === aidevRequest.requestId &&
      assertAiDevOwnershipUnchanged() &&
      getDevPulseV2Owner('aidev_engine').ownerModule === AIDEV_OWNER_MODULE,
    `requirements=${fromAidev.requirements.length}`,
  );

  const strategy = extractor.mapIntentToRequirementStrategy(ANDROID_EXAMPLE);
  const intentSummary = extractor.getIntentRequirementSummary(ANDROID_EXAMPLE);
  assert(
    '14. Intent bridge works',
    strategy.intentType === 'BUILD_REQUEST' &&
      intentSummary.includes('BUILD_REQUEST') &&
      assertIntentArchitectureOwnershipUnchanged() &&
      getDevPulseV2Owner('intent_architecture').ownerModule === INTENT_OWNER_MODULE,
    strategy.strategy.slice(0, 60),
  );

  const published = extractor.publishRequirementSummary(fromAidev);
  const latest = extractor.getLatestRequirementSummary();
  assert(
    '15. Central Brain bridge works',
    published.extractionId === fromAidev.extractionId &&
      latest !== null &&
      assertCentralBrainOwnershipUnchanged() &&
      getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    latest?.summary.slice(0, 60) ?? 'missing',
  );

  const stored = extractor.extractAndStore({
    requestId: 'stored-req-001',
    userInput: 'Build a web dashboard for founders',
  });
  const retrieved = extractor.getExtraction(stored.extractionId);
  assert(
    '16. Requirement records stored correctly',
    extractor.getExtractorState().extractionCount >= 2 &&
      retrieved !== null &&
      retrieved.requirements.length > 0,
    `stored=${stored.extractionId}`,
  );

  const reportText = formatRequirementExtractorReport(
    extractor.getExtractorState(),
    extractor.listExtractions(),
  );
  assert(
    '17. Report generated',
    reportText.includes('Requirement Extractor Report') &&
      extractor.formatReport().includes('Recommendation:'),
    `extractions=${extractor.getExtractorState().extractionCount}`,
  );

  assert(
    '18. Requirement Extractor does not generate code',
    DevPulseV2RequirementExtractorAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '19. Requirement Extractor does not execute actions',
    DevPulseV2RequirementExtractorAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '20. Requirement Extractor does not modify projects',
    DevPulseV2RequirementExtractorAuthority.assertDoesNotModifyProjects() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '21. Requirement Extractor does not become answer authority',
    DevPulseV2RequirementExtractorAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    EXTRACTOR_OWNER_MODULE,
  );

  assert(
    '22. Validation Budget Policy still passes',
    DevPulseV2RequirementExtractorAuthority.assertValidationBudgetCompatible() &&
      DevPulseV2ValidationBudgetPolicyAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE,
    `policy=${POLICY_OWNER_MODULE}`,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('23. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('=========================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(EXTRACTOR_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('REQUIREMENT EXTRACTOR FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
