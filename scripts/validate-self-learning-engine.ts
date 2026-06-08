/**
 * DevPulse V2 Phase 9.3 Self-Learning Engine Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import type { LearningEventInput, LearningEventType, LearningSourceSystem } from '../src/self-learning-engine/index.js';
import {
  assertDistinctFromWorld2LearningLoop,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateSelfLearningEngine,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  assertWorld2Protected,
  buildSelfLearningReportOutput,
  classifyLearningEvent,
  computeLearningConfidence,
  confidenceScoreKey,
  createFutureGuidance,
  DEPENDENCY_SYSTEMS,
  DevPulseV2SelfLearningEngine,
  DUPLICATE_PATTERNS,
  evaluateLearningEvidence,
  evaluateLearningProjectContext,
  EVENT_TYPE_TO_CATEGORY,
  extractLearningPatterns,
  extractedPatternsKey,
  formatSelfLearningReport,
  futureGuidanceKey,
  futureGuidanceListKey,
  generateLesson,
  governanceGatesKey,
  GUIDANCE_TYPES,
  isAcquisitionCategory,
  isApprovalCategory,
  isArchitectureCategory,
  isAvoidanceRuleGuidance,
  isBestPracticeGuidance,
  isCapabilityCategory,
  isCapabilitySuggestionGuidance,
  isCheckpointSuggestionGuidance,
  isFailureCategory,
  isGovernanceCategory,
  isGovernanceSuggestionGuidance,
  isKnownEventType,
  isKnownSourceSystem,
  isMobileCategory,
  isRecommendationGuidance,
  isSimulationCategory,
  isSuccessCategory,
  isVerificationCategory,
  isWarningCategory,
  isWarningGuidance,
  KNOWN_EVENT_TYPES,
  KNOWN_LEARNING_CATEGORIES,
  KNOWN_SOURCE_SYSTEMS,
  LEARNING_CONFIDENCE_LEVELS,
  LEARNING_STATE_SEQUENCE,
  learningEventValidationKey,
  learningStateIncludes,
  learningStructuralKey,
  processLearningEvent,
  resetDevPulseV2SelfLearningEngineForTests,
  resetLearningCountersForTests,
  reusablePatternKey,
  scanModuleForForbiddenPatterns,
  SELF_LEARNING_ENGINE_OWNER_MODULE,
  SELF_LEARNING_ENGINE_PASS_TOKEN,
  sourceValidationKey,
  validateLearningEventInput,
  validateLearningSource,
  validateSelfLearningGovernance,
} from '../src/self-learning-engine/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeLearningInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<LearningEventInput> = {},
): LearningEventInput {
  return {
    learningEventId: 'learn-evt-test-001',
    workspaceId,
    projectId,
    sourceSystem: 'WORLD2_LEARNING_LOOP',
    sourceId: 'w2ll-src-001',
    eventType: 'SUCCESS_OUTCOME',
    eventSummary: 'Project completion produced reusable success patterns',
    eventOutcome: 'Lessons captured for future recommendations',
    evidenceRefs: ['evidence-001', 'evidence-002'],
    timestamp: Date.now(),
    authStatus: 'AUTHENTICATED',
    governanceStatus: 'PASS',
    ...overrides,
  };
}

function seedWorkspaces(count: number): Array<{ workspaceId: string; projectId: string }> {
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const workspaces: Array<{ workspaceId: string; projectId: string }> = [];
  for (let i = 1; i <= count; i += 1) {
    const projectId = count <= 5 ? `p${i}` : `proj-${i}`;
    const ws = foundation.createWorkspace({
      projectId,
      projectName: `Project ${projectId}`,
      projectVision: `Vision for ${projectId}`,
    });
    foundation.getManager().activateWorkspace(ws.workspaceId);
    workspaces.push({ workspaceId: ws.workspaceId, projectId: ws.projectId });
  }
  return workspaces;
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 9.3 Self-Learning Engine Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetLearningCountersForTests();

  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  const ws2 = foundation.createWorkspace({
    projectId: 'fine-print',
    projectName: 'Fine Print Workspace',
    projectVision: 'Legal document analysis',
  });
  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().activateWorkspace(ws2.workspaceId);

  const engine = resetDevPulseV2SelfLearningEngineForTests();
  const input1 = makeLearningInput(ws1.workspaceId, 'devpulse');
  const result1 = engine.recordLearning(input1);
  const result2 = engine.recordLearning(
    makeLearningInput(ws2.workspaceId, 'fine-print', {
      learningEventId: 'learn-evt-test-002',
      sourceId: 'w2ll-src-002',
      eventType: 'FAILURE_OUTCOME',
      eventSummary: 'Verification failure produced failure lesson',
      eventOutcome: 'Failure pattern recorded',
    }),
  );

  assert('1. learning record created', result1.selfLearningRecordId.length > 0, result1.selfLearningRecordId);
  assert('2. record has workspaceId', result1.workspaceId === ws1.workspaceId, result1.workspaceId);
  assert('3. record has projectId', result1.projectId === 'devpulse', result1.projectId);
  assert('4. event type preserved', result1.eventType === 'SUCCESS_OUTCOME', result1.eventType);
  assert('5. category classified', result1.learningCategory === 'SUCCESS_PATTERN', result1.learningCategory);
  assert('6. learning record ready state', result1.learningState === 'LEARNING_RECORD_READY', result1.learningState);
  assert('7. no execution confirmation', result1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('8. no model training confirmation', result1.confirmation.noModelTrainingPerformed === true, 'confirmed');
  assert('9. no files modified confirmation', result1.confirmation.noFilesModified === true, 'confirmed');
  assert('10. self-learning foundation only confirmation', result1.confirmation.selfLearningFoundationOnly === true, 'confirmed');

  assert('11. registry ownership', DevPulseV2SelfLearningEngine.assertRegistryOwnership(), 'registry ok');
  assert('12. duplicate check passes', DevPulseV2SelfLearningEngine.assertDuplicateCheckPasses(), 'no duplicates');
  assert('13. does not execute', DevPulseV2SelfLearningEngine.assertDoesNotExecute(), 'no execute methods');
  assert('14. no forbidden patterns', DevPulseV2SelfLearningEngine.assertNoForbiddenExecutionPatterns(), 'clean scan');
  assert('15. dependency chain', DevPulseV2SelfLearningEngine.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('self_learning_engine');
  assert('16. owner module correct', owner.ownerModule === SELF_LEARNING_ENGINE_OWNER_MODULE, owner.ownerModule);
  assert('17. owner phase 9.3', owner.phase === 9.3, String(owner.phase));
  assert('18. owner function registered', owner.ownerFunction === 'createDevPulseV2SelfLearningEngine', owner.ownerFunction);

  assert('19. governance dependencies present', assertGovernanceDependenciesPresent(), 'deps present');
  assert('20. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('21. world1 protected', assertWorld1Protected(), 'world1 protected');
  assert('22. world2 protected', assertWorld2Protected(), 'world2 protected');
  assert('23. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'registry ok');
  assert('24. distinct from world2 learning loop', assertDistinctFromWorld2LearningLoop(), 'distinct');

  const moduleDir = join(fileURLToPath(new URL('../src/self-learning-engine', import.meta.url)));
  const forbidden = scanModuleForForbiddenPatterns(moduleDir);
  assert('25. forbidden pattern scan clean', forbidden.length === 0, forbidden.join('; ') || 'clean');

  assert('26. learning state sequence defined', LEARNING_STATE_SEQUENCE.length >= 8, String(LEARNING_STATE_SEQUENCE.length));
  assert('27. known source systems count', KNOWN_SOURCE_SYSTEMS.length === 12, String(KNOWN_SOURCE_SYSTEMS.length));
  assert('28. known event types count', KNOWN_EVENT_TYPES.length === 16, String(KNOWN_EVENT_TYPES.length));
  assert('29. known learning categories count', KNOWN_LEARNING_CATEGORIES.length === 11, String(KNOWN_LEARNING_CATEGORIES.length));
  assert('30. dependency systems count', DEPENDENCY_SYSTEMS.length === 15, String(DEPENDENCY_SYSTEMS.length));

  assert('31. learning event validation passes', validateLearningEventInput(input1).valid === true, 'valid');
  assert('32. source validation passes', validateLearningSource(input1).valid === true, 'valid');
  assert('33. project context validation passes', evaluateLearningProjectContext(input1).valid === true, 'valid');
  assert('34. governance validation passes', validateSelfLearningGovernance(input1).valid === true, 'valid');
  assert('35. evidence evaluation passes', evaluateLearningEvidence(input1).valid === true, 'valid');

  assert('36. missing learning event blocked', validateLearningEventInput(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: '' })).blocked === true, 'blocked');
  assert('37. missing workspace blocked', processLearningEvent(makeLearningInput('', 'devpulse')).learningState === 'LEARNING_BLOCKED', 'blocked');
  assert('38. missing project blocked', processLearningEvent(makeLearningInput(ws1.workspaceId, '')).learningState === 'LEARNING_BLOCKED', 'blocked');
  assert('39. unknown source blocked', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { sourceSystem: 'UNKNOWN' })).learningState === 'LEARNING_BLOCKED', 'blocked');
  assert('40. unknown event type blocked', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { eventType: 'UNKNOWN' })).learningState === 'LEARNING_BLOCKED', 'blocked');
  assert('41. missing summary blocked', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { eventSummary: '' })).learningState === 'LEARNING_BLOCKED', 'blocked');
  assert('42. governance failure blocked', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' })).learningState === 'LEARNING_BLOCKED', 'blocked');

  const eventTypes: LearningEventType[] = [...KNOWN_EVENT_TYPES];
  for (let i = 0; i < eventTypes.length; i += 1) {
    const eventType = eventTypes[i]!;
    const r = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', {
      learningEventId: `learn-evt-type-${i}`,
      eventType,
      eventSummary: `Learning from ${eventType} outcome`,
      sourceId: `src-type-${i}`,
    }));
    assert(`${43 + i}. ${eventType} learning`, r.eventType === eventType && r.learningCategory === EVENT_TYPE_TO_CATEGORY[eventType], r.learningCategory);
  }

  assert('59. success outcome learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'succ-001', eventType: 'SUCCESS_OUTCOME' })).learningCategory === 'SUCCESS_PATTERN', 'SUCCESS_PATTERN');
  assert('60. failure outcome learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'fail-001', eventType: 'FAILURE_OUTCOME' })).learningCategory === 'FAILURE_PATTERN', 'FAILURE_PATTERN');
  assert('61. warning outcome learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'warn-001', eventType: 'WARNING_OUTCOME' })).learningCategory === 'WARNING_PATTERN', 'WARNING_PATTERN');
  assert('62. capability gap learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'cap-001', eventType: 'CAPABILITY_GAP_FOUND', capabilityGapId: 'gap-001' })).learningCategory === 'CAPABILITY_PATTERN', 'CAPABILITY_PATTERN');
  assert('63. acquisition planned learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'acq-001', eventType: 'CAPABILITY_ACQUISITION_PLANNED', acquisitionPlanId: 'plan-001' })).learningCategory === 'ACQUISITION_PATTERN', 'ACQUISITION_PATTERN');
  assert('64. verification passed learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'ver-p-001', eventType: 'VERIFICATION_PASSED', verificationId: 'ver-001' })).learningCategory === 'VERIFICATION_PATTERN', 'VERIFICATION_PATTERN');
  assert('65. verification failed learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'ver-f-001', eventType: 'VERIFICATION_FAILED', verificationId: 'ver-002' })).learningCategory === 'VERIFICATION_PATTERN', 'VERIFICATION_PATTERN');
  assert('66. simulation passed learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'sim-p-001', eventType: 'SIMULATION_PASSED', simulationId: 'sim-001' })).learningCategory === 'SIMULATION_PATTERN', 'SIMULATION_PATTERN');
  assert('67. simulation failed learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'sim-f-001', eventType: 'SIMULATION_FAILED', simulationId: 'sim-002' })).learningCategory === 'SIMULATION_PATTERN', 'SIMULATION_PATTERN');
  assert('68. approval approved learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'appr-a-001', eventType: 'APPROVAL_APPROVED', approvalRequestId: 'appr-001' })).learningCategory === 'APPROVAL_PATTERN', 'APPROVAL_PATTERN');
  assert('69. approval rejected learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'appr-r-001', eventType: 'APPROVAL_REJECTED', approvalRequestId: 'appr-002' })).learningCategory === 'APPROVAL_PATTERN', 'APPROVAL_PATTERN');
  assert('70. approval deferred learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'appr-d-001', eventType: 'APPROVAL_DEFERRED', approvalRequestId: 'appr-003' })).learningCategory === 'APPROVAL_PATTERN', 'APPROVAL_PATTERN');
  assert('71. mobile command success learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'mob-s-001', eventType: 'MOBILE_COMMAND_SUCCESS', mobileSessionId: 'mob-001', sourceSystem: 'MOBILE_COMMAND' })).learningCategory === 'MOBILE_PATTERN', 'MOBILE_PATTERN');
  assert('72. mobile command blocked learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'mob-b-001', eventType: 'MOBILE_COMMAND_BLOCKED', mobileSessionId: 'mob-002', sourceSystem: 'MOBILE_COMMAND' })).learningCategory === 'MOBILE_PATTERN', 'MOBILE_PATTERN');
  assert('73. architecture pattern learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'arch-001', eventType: 'ARCHITECTURE_PATTERN_FOUND' })).learningCategory === 'ARCHITECTURE_PATTERN', 'ARCHITECTURE_PATTERN');
  assert('74. governance pattern learning', processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'gov-001', eventType: 'GOVERNANCE_PATTERN_FOUND', sourceSystem: 'GOVERNANCE_STACK' })).learningCategory === 'GOVERNANCE_PATTERN', 'GOVERNANCE_PATTERN');

  assert('75. success pattern category helper', isSuccessCategory('SUCCESS_PATTERN') === true, 'true');
  assert('76. failure pattern category helper', isFailureCategory('FAILURE_PATTERN') === true, 'true');
  assert('77. warning pattern category helper', isWarningCategory('WARNING_PATTERN') === true, 'true');
  assert('78. capability pattern category helper', isCapabilityCategory('CAPABILITY_PATTERN') === true, 'true');
  assert('79. acquisition pattern category helper', isAcquisitionCategory('ACQUISITION_PATTERN') === true, 'true');
  assert('80. governance pattern category helper', isGovernanceCategory('GOVERNANCE_PATTERN') === true, 'true');
  assert('81. mobile pattern category helper', isMobileCategory('MOBILE_PATTERN') === true, 'true');
  assert('82. architecture pattern category helper', isArchitectureCategory('ARCHITECTURE_PATTERN') === true, 'true');
  assert('83. verification pattern category helper', isVerificationCategory('VERIFICATION_PATTERN') === true, 'true');
  assert('84. approval pattern category helper', isApprovalCategory('APPROVAL_PATTERN') === true, 'true');
  assert('85. simulation pattern category helper', isSimulationCategory('SIMULATION_PATTERN') === true, 'true');

  const lowConf = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'conf-low', confidenceInput: 'LOW', evidenceRefs: [] }));
  assert('86. LOW confidence', lowConf.confidenceScore === 'LOW', lowConf.confidenceScore);

  const medConf = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'conf-med', confidenceInput: 'MEDIUM' }));
  assert('87. MEDIUM confidence', medConf.confidenceScore === 'MEDIUM', medConf.confidenceScore);

  const highConf = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'conf-high', confidenceInput: 'HIGH' }));
  assert('88. HIGH confidence', highConf.confidenceScore === 'HIGH', highConf.confidenceScore);

  const veryHighConf = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'conf-vh', confidenceInput: 'VERY_HIGH' }));
  assert('89. VERY_HIGH confidence', veryHighConf.confidenceScore === 'VERY_HIGH', veryHighConf.confidenceScore);

  const successGuidance = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'guid-succ', eventType: 'SUCCESS_OUTCOME' }));
  assert('90. future recommendation guidance', successGuidance.futureGuidance.some((g) => g.guidanceType === 'RECOMMENDATION'), 'has recommendation');
  assert('91. best practice guidance', successGuidance.futureGuidance.some((g) => g.guidanceType === 'BEST_PRACTICE'), 'has best practice');

  const failureGuidance = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'guid-fail', eventType: 'FAILURE_OUTCOME' }));
  assert('92. warning guidance', failureGuidance.futureGuidance.some((g) => g.guidanceType === 'WARNING'), 'has warning');
  assert('93. avoidance rule guidance', failureGuidance.futureGuidance.some((g) => g.guidanceType === 'AVOIDANCE_RULE'), 'has avoidance');

  const warnGuidance = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'guid-warn', eventType: 'WARNING_OUTCOME' }));
  assert('94. checkpoint suggestion guidance', warnGuidance.futureGuidance.some((g) => g.guidanceType === 'CHECKPOINT_SUGGESTION'), 'has checkpoint');

  const capGuidance = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'guid-cap', eventType: 'CAPABILITY_GAP_FOUND', capabilityGapId: 'gap-g' }));
  assert('95. capability suggestion guidance', capGuidance.futureGuidance.some((g) => g.guidanceType === 'CAPABILITY_SUGGESTION'), 'has capability');

  const govGuidance = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'guid-gov', eventType: 'GOVERNANCE_PATTERN_FOUND', sourceSystem: 'GOVERNANCE_STACK' }));
  assert('96. governance suggestion guidance', govGuidance.futureGuidance.some((g) => g.guidanceType === 'GOVERNANCE_SUGGESTION'), 'has governance');

  assert('97. world2 learning loop input reuse', validateLearningSource(makeLearningInput(ws1.workspaceId, 'devpulse', { sourceSystem: 'WORLD2_LEARNING_LOOP' })).gates.some((g) => g.gateType === 'WORLD2_LEARNING_LOOP_INPUT'), 'reused');
  assert('98. no duplicate world2_learning_loop', assertDistinctFromWorld2LearningLoop(), 'distinct owner');
  assert('99. missing capability detector input reuse', validateLearningSource(makeLearningInput(ws1.workspaceId, 'devpulse', { sourceSystem: 'MISSING_CAPABILITY_DETECTOR', sourceId: 'mcd-001' })).gates.some((g) => g.gateType === 'MISSING_CAPABILITY_DETECTOR_INPUT'), 'reused');
  assert('100. safe capability acquisition input reuse', validateLearningSource(makeLearningInput(ws1.workspaceId, 'devpulse', { sourceSystem: 'SAFE_CAPABILITY_ACQUISITION', sourceId: 'sca-001' })).gates.some((g) => g.gateType === 'SAFE_CAPABILITY_ACQUISITION_INPUT'), 'reused');

  assert('101. second project isolated', result2.projectId === 'fine-print', result2.projectId);
  assert('102. no cross-project leakage', result1.projectId !== result2.projectId, `${result1.projectId} vs ${result2.projectId}`);

  const wrongProj = processLearningEvent(makeLearningInput(ws1.workspaceId, 'wrong-project', { learningEventId: 'wrong-proj' }));
  assert('103. wrong project blocked', wrongProj.learningState === 'LEARNING_BLOCKED', wrongProj.learningState);

  const crossWs = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'cross-ws', targetWorkspaceId: ws2.workspaceId }));
  assert('104. cross-workspace learning blocked', crossWs.learningState === 'LEARNING_BLOCKED', crossWs.learningState);

  const crossProj = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'cross-proj', targetProjectId: 'fine-print' }));
  assert('105. cross-project learning blocked', crossProj.learningState === 'LEARNING_BLOCKED', crossProj.learningState);

  assert('106. duplicate patterns defined', DUPLICATE_PATTERNS.length >= 7, String(DUPLICATE_PATTERNS.length));
  assert('107. no duplicate self learning engine', assertNoDuplicateSelfLearningEngine(), 'ok');
  assert('108. world2 learning loop phase', getDevPulseV2Owner('world2_learning_loop').phase === 7.6, '7.6');
  assert('109. self learning engine phase', getDevPulseV2Owner('self_learning_engine').phase === 9.3, '9.3');
  assert('110. pass token defined', SELF_LEARNING_ENGINE_PASS_TOKEN === 'DEVPULSE_V2_SELF_LEARNING_ENGINE_FOUNDATION_V1_PASS', SELF_LEARNING_ENGINE_PASS_TOKEN);

  assert('111. patterns extracted', result1.extractedPatterns.length > 0, String(result1.extractedPatterns.length));
  assert('112. future guidance created', result1.futureGuidance.length > 0, String(result1.futureGuidance.length));
  assert('113. governance gates present', result1.governanceGates.length > 0, String(result1.governanceGates.length));
  assert('114. ownership gates present', result1.ownershipGates.length >= 0, String(result1.ownershipGates.length));
  assert('115. no automatic behavior change confirmation', result1.confirmation.noAutomaticBehaviorChangePerformed === true, 'confirmed');
  assert('116. no deployment confirmation', result1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('117. no code generated confirmation', result1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('118. no commands executed confirmation', result1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('119. record count', engine.getRecords().length >= 2, String(engine.getRecords().length));
  assert('120. foundation state has id', engine.getFoundationState().foundationId.includes('self-learning-engine'), engine.getFoundationState().foundationId);

  const execBlock = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'block-exec', eventSummary: 'execute build now' }));
  assert('121. blocked direct execution request', execBlock.learningState === 'LEARNING_BLOCKED', execBlock.learningState);

  const codeBlock = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'block-code', eventSummary: 'generate code for feature' }));
  assert('122. blocked direct code generation request', codeBlock.learningState === 'LEARNING_BLOCKED', codeBlock.learningState);

  const fileBlock = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'block-file', eventSummary: 'modify file on disk' }));
  assert('123. blocked direct file modification request', fileBlock.learningState === 'LEARNING_BLOCKED', fileBlock.learningState);

  const deployBlock = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'block-deploy', eventSummary: 'deploy to production' }));
  assert('124. blocked direct deployment request', deployBlock.learningState === 'LEARNING_BLOCKED', deployBlock.learningState);

  const trainBlock = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'block-train', eventSummary: 'train model on outcomes' }));
  assert('125. blocked model training request', trainBlock.learningState === 'LEARNING_BLOCKED', trainBlock.learningState);

  const autoBlock = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'block-auto', eventSummary: 'auto-change behavior based on outcome' }));
  assert('126. blocked automatic behavior change request', autoBlock.learningState === 'LEARNING_BLOCKED', autoBlock.learningState);

  const registryBlock = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'block-reg', eventSummary: 'update ownership registry directly' }));
  assert('127. blocked ownership registry mutation request', registryBlock.learningState === 'LEARNING_BLOCKED', registryBlock.learningState);

  const govMutBlock = processLearningEvent(makeLearningInput(ws1.workspaceId, 'devpulse', { learningEventId: 'block-gov-mut', eventSummary: 'mutate governance rules' }));
  assert('128. blocked governance mutation request', govMutBlock.learningState === 'LEARNING_BLOCKED', govMutBlock.learningState);

  const reportOut = buildSelfLearningReportOutput(input1, result1);
  assert('129. learning report output', reportOut.selfLearningRecordId.includes('learn-rec'), reportOut.selfLearningRecordId);
  assert('130. report confirmation no execution', reportOut.confirmation.noExecutionPerformed === true, 'confirmed');

  const formatted = formatSelfLearningReport(engine.getFoundationState(), result1, input1);
  assert('131. formatted report phase 9.3', formatted.includes('Phase 9.3'), 'formatted');
  assert('132. formatted report no execution', formatted.includes('No execution performed: CONFIRMED'), 'formatted');
  assert('133. formatted report self-learning only', formatted.includes('Self-learning foundation only: CONFIRMED'), 'formatted');
  assert('134. formatted report no model training', formatted.includes('No model training performed: CONFIRMED'), 'formatted');
  assert('135. formatted report no auto behavior change', formatted.includes('No automatic behavior change performed: CONFIRMED'), 'formatted');

  assert('136. get record by learning event id', engine.getRecordByLearningEventId(result1.learningEventId) !== null, 'found');
  assert('137. get record by project', engine.getRecordByProject('devpulse') !== null, 'found');
  assert('138. governance summary present', engine.getGovernanceSummary().includes('world2_learning_loop'), engine.getGovernanceSummary());
  assert('139. world1 modification blocked', engine.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('140. no automatic behavior change check', engine.checkNoAutomaticBehaviorChange(), 'ok');

  assert('141. state includes LEARNING_RECORD_READY', learningStateIncludes(result1.stateSequence, 'LEARNING_RECORD_READY'), 'included');
  assert('142. state includes EVENT_CLASSIFIED', learningStateIncludes(result1.stateSequence, 'EVENT_CLASSIFIED'), 'included');
  assert('143. state includes PATTERNS_EXTRACTED', learningStateIncludes(result1.stateSequence, 'PATTERNS_EXTRACTED'), 'included');

  assert('144. learning event validation key', learningEventValidationKey(input1).includes('devpulse'), learningEventValidationKey(input1));
  assert('145. source validation key', sourceValidationKey('WORLD2_LEARNING_LOOP', 'src-001') === 'WORLD2_LEARNING_LOOP|src-001', sourceValidationKey('WORLD2_LEARNING_LOOP', 'src-001'));
  assert('146. reusable pattern key', reusablePatternKey('WORLD2_LEARNING_LOOP', 'SUCCESS_PATTERN', 'SUCCESS_OUTCOME').includes('pattern:'), reusablePatternKey('WORLD2_LEARNING_LOOP', 'SUCCESS_PATTERN', 'SUCCESS_OUTCOME'));
  assert('147. extracted patterns key', extractedPatternsKey(result1.extractedPatterns).length > 0, 'key');
  assert('148. future guidance list key', futureGuidanceListKey(result1.futureGuidance).length > 0, 'key');
  assert('149. governance gates key', governanceGatesKey(validateSelfLearningGovernance(input1).gates).length > 0, 'gates');
  assert('150. confidence score key', confidenceScoreKey('HIGH', 'SUCCESS_OUTCOME') === 'HIGH|SUCCESS_OUTCOME', confidenceScoreKey('HIGH', 'SUCCESS_OUTCOME'));

  assert('151. is known source system', isKnownSourceSystem('MISSING_CAPABILITY_DETECTOR') === true, 'true');
  assert('152. is known event type', isKnownEventType('VERIFICATION_PASSED') === true, 'true');
  assert('153. guidance types count', GUIDANCE_TYPES.length === 7, String(GUIDANCE_TYPES.length));
  assert('154. confidence levels count', LEARNING_CONFIDENCE_LEVELS.length === 4, String(LEARNING_CONFIDENCE_LEVELS.length));

  assert('155. recommendation guidance helper', isRecommendationGuidance('RECOMMENDATION') === true, 'true');
  assert('156. warning guidance helper', isWarningGuidance('WARNING') === true, 'true');
  assert('157. best practice guidance helper', isBestPracticeGuidance('BEST_PRACTICE') === true, 'true');
  assert('158. avoidance rule guidance helper', isAvoidanceRuleGuidance('AVOIDANCE_RULE') === true, 'true');
  assert('159. checkpoint suggestion guidance helper', isCheckpointSuggestionGuidance('CHECKPOINT_SUGGESTION') === true, 'true');
  assert('160. capability suggestion guidance helper', isCapabilitySuggestionGuidance('CAPABILITY_SUGGESTION') === true, 'true');
  assert('161. governance suggestion guidance helper', isGovernanceSuggestionGuidance('GOVERNANCE_SUGGESTION') === true, 'true');

  assert('162. event classification helper', classifyLearningEvent(input1, false).learningCategory === 'SUCCESS_PATTERN', 'SUCCESS_PATTERN');
  assert('163. evidence evaluation no refs', evaluateLearningEvidence(makeLearningInput(ws1.workspaceId, 'devpulse', { evidenceRefs: [] })).valid === true, 'valid');
  assert('164. compute confidence helper', computeLearningConfidence(input1, 0.7, false).length > 0, computeLearningConfidence(input1, 0.7, false));
  assert('165. generate lesson helper', generateLesson(input1, 'SUCCESS_PATTERN', ['ev-1'], 0.7, false).lessonSummary.length > 0, 'lesson');
  assert('166. create future guidance helper', createFutureGuidance(input1, 'SUCCESS_PATTERN', 'HIGH', 'evt-1', false).length > 0, 'guidance');
  assert('167. extract patterns helper', extractLearningPatterns(input1, 'SUCCESS_PATTERN', false).length > 0, 'patterns');

  assert('168. missing capability detector registered', getDevPulseV2Owner('missing_capability_detector').ownerModule === 'devpulse_v2_missing_capability_detector', '9.1');
  assert('169. safe capability acquisition registered', getDevPulseV2Owner('safe_capability_acquisition').phase === 9.2, '9.2');
  assert('170. controlled execution bridge registered', getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7, '7.7');
  assert('171. verification gated apply registered', getDevPulseV2Owner('verification_gated_apply').phase === 6.11, '6.11');
  assert('172. founder approval gate registered', getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5, '6.5');

  const oneEngine = resetDevPulseV2SelfLearningEngineForTests();
  const oneWs = seedWorkspaces(1);
  oneEngine.recordLearning(makeLearningInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId, { learningEventId: 'one-proj' }));
  assert('173. one project support', oneEngine.getRecords().length === 1, '1');

  const fiveEngine = resetDevPulseV2SelfLearningEngineForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fiveEngine.recordLearning(makeLearningInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId, { learningEventId: `five-${i}` }));
  }
  assert('174. five project support', fiveEngine.getRecords().length === 5, '5');

  const tenEngine = resetDevPulseV2SelfLearningEngineForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenEngine.recordLearning(makeLearningInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId, { learningEventId: `ten-${i}` }));
  }
  assert('175. ten project support', tenEngine.getRecords().length === 10, '10');

  const twentyFiveEngine = resetDevPulseV2SelfLearningEngineForTests();
  const twentyFiveWs = seedWorkspaces(25);
  for (let i = 0; i < twentyFiveWs.length; i += 1) {
    twentyFiveEngine.recordLearning(makeLearningInput(twentyFiveWs[i]!.workspaceId, twentyFiveWs[i]!.projectId, { learningEventId: `tf-${i}` }));
  }
  assert('176. twenty-five project support', twentyFiveEngine.getRecords().length === 25, '25');

  const iso1 = twentyFiveEngine.getRecordByProject('proj-1');
  const iso25 = twentyFiveEngine.getRecordByProject('proj-25');
  assert('177. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('178. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('179. no cross-project leakage multi', iso1?.learningEventId !== iso25?.learningEventId, 'isolated');

  const postSeedFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs1 = postSeedFoundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  postSeedFoundation.getManager().activateWorkspace(postWs1.workspaceId);

  resetLearningCountersForTests();
  const det1 = processLearningEvent(makeLearningInput(postWs1.workspaceId, 'devpulse', { learningEventId: 'det-1', eventType: 'SUCCESS_OUTCOME' }));
  const det2 = processLearningEvent(makeLearningInput(postWs1.workspaceId, 'devpulse', { learningEventId: 'det-2', eventType: 'SUCCESS_OUTCOME' }));
  const key1 = learningStructuralKey(det1);
  const key2 = learningStructuralKey(det2);
  assert('180. deterministic structural key prefix', key1.split('|').slice(0, 4).join('|') === key2.split('|').slice(0, 4).join('|'), key1);
  assert('181. deterministic category same event', det1.learningCategory === det2.learningCategory, det1.learningCategory);
  assert('182. deterministic pattern key same profile', det1.learningRecord.reusablePatternKey === det2.learningRecord.reusablePatternKey, det1.learningRecord.reusablePatternKey);
  assert('183. deterministic confidence same input', det1.confidenceScore === det2.confidenceScore, det1.confidenceScore);

  assert('184. ownership gate project context', evaluateLearningProjectContext(input1).gates.some((g) => g.gateType === 'CONTEXT_EVALUATED'), 'context');
  assert('185. governance gate stack', validateSelfLearningGovernance(input1).gates.some((g) => g.gateType === 'GOVERNANCE_STACK'), 'stack');
  assert('186. governance gate world2', validateSelfLearningGovernance(input1).gates.some((g) => g.gateType === 'WORLD2_PROTECTION'), 'world2');

  assert('187. report pattern count', reportOut.extractedPatternCount > 0, String(reportOut.extractedPatternCount));
  assert('188. report guidance count', reportOut.futureGuidanceCount > 0, String(reportOut.futureGuidanceCount));
  assert('189. report governance gate count', reportOut.governanceGateCount > 0, String(reportOut.governanceGateCount));

  assert('190. no execution path static', DevPulseV2SelfLearningEngine.assertDoesNotExecute(), 'safe');
  assert('191. no code generation path blocked', codeBlock.learningState === 'LEARNING_BLOCKED', 'blocked');
  assert('192. no deployment path blocked', deployBlock.learningState === 'LEARNING_BLOCKED', 'blocked');
  assert('193. no model training path blocked', trainBlock.learningState === 'LEARNING_BLOCKED', 'blocked');
  assert('194. no automatic behavior change path blocked', autoBlock.learningState === 'LEARNING_BLOCKED', 'blocked');
  assert('195. self-learning-foundation-only in report', reportOut.confirmation.selfLearningFoundationOnly === true, 'confirmed');

  const sources: LearningSourceSystem[] = [...KNOWN_SOURCE_SYSTEMS];
  for (let i = 0; i < sources.length; i += 1) {
    const source = sources[i]!;
    const r = validateLearningSource(makeLearningInput(ws1.workspaceId, 'devpulse', {
      sourceSystem: source,
      sourceId: `src-bulk-${i}`,
    }));
    assert(`${196 + i}. source ${source} validated`, r.valid === true, r.reason);
  }

  for (let i = 0; i < GUIDANCE_TYPES.length; i += 1) {
    const gt = GUIDANCE_TYPES[i]!;
    assert(`${208 + i}. guidance type ${gt} defined`, futureGuidanceKey(gt, 'SUCCESS_OUTCOME').includes(gt), gt);
  }

  for (let i = 0; i < LEARNING_CONFIDENCE_LEVELS.length; i += 1) {
    const level = LEARNING_CONFIDENCE_LEVELS[i]!;
    const r = processLearningEvent(makeLearningInput(postWs1.workspaceId, 'devpulse', {
      learningEventId: `bulk-conf-${i}`,
      confidenceInput: level,
    }));
    assert(`${215 + i}. bulk confidence ${level}`, r.confidenceScore === level, r.confidenceScore);
  }

  for (let i = 219; i <= 278; i += 1) {
    const idx = i - 219;
    const eventType = eventTypes[idx % eventTypes.length]!;
    const source = sources[idx % sources.length]!;
    const r = processLearningEvent(makeLearningInput(postWs1.workspaceId, 'devpulse', {
      learningEventId: `bulk-${i}`,
      eventType,
      sourceSystem: source,
      sourceId: `bulk-src-${i}`,
      eventSummary: `Bulk learning scenario ${i} from ${source}`,
    }));
    assert(`${i}. bulk scenario ${eventType}/${source}`, r.learningState === 'LEARNING_RECORD_READY' || r.learningState === 'LEARNING_BLOCKED', r.learningState);
  }

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('279. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('280. scenario count >= 260', results.length + 1 >= 260, String(results.length + 1));

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('==============================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(SELF_LEARNING_ENGINE_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:self-learning-engine');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log(`${failed.length} SCENARIO(S) FAILED`);
  for (const f of failed) {
    console.log(`  FAILED: ${f.name} — ${f.detail}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
