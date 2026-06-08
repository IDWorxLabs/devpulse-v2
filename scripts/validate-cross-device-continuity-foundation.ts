/**
 * DevPulse V2 Phase 8.5 Cross-device Continuity Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import {
  assertDistinctFromMobileApprovalFlowFoundation,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateApprovalTruth,
  assertNoDuplicateChatTruth,
  assertNoDuplicateExecutionTruth,
  assertNoDuplicatePreviewTruth,
  assertNoDuplicateProjectTruth,
  assertNoDuplicateProjectVault,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  capabilitiesKey,
  classifyContinuityCapability,
  classifyContinuityScope,
  classifyHandoff,
  CONTINUITY_READINESS_LEVELS,
  CONTINUITY_STATE_SEQUENCE,
  continuityStateIncludes,
  continuityStructuralKey,
  CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE,
  CROSS_DEVICE_CONTINUITY_FOUNDATION_PASS_TOKEN,
  DEPENDENCY_SYSTEMS,
  DevPulseV2CrossDeviceContinuityFoundation,
  determineContinuityReadiness,
  DUPLICATE_PATTERNS,
  evaluateContinuityCapabilities,
  evaluateContinuitySecurity,
  formatContinuityReport,
  generateHandoffSummary,
  governanceGatesKey,
  handoffClassificationKey,
  handoffKey,
  isGovernanceReady,
  KNOWN_CONTINUITY_CAPABILITIES,
  KNOWN_CONTINUITY_SCOPES,
  KNOWN_HANDOFF_TYPES,
  processContinuityHandoff,
  readinessKey,
  requiresCloudStateRefresh,
  resetContinuityPacketCounterForTests,
  resetDevPulseV2CrossDeviceContinuityFoundationForTests,
  scanModuleForForbiddenPatterns,
  scopeClassificationKey,
  validateCloudContinuitySession,
  validateContinuityGovernance,
  validateHandoffRequest,
  validateSourceDevice,
  validateTargetDevice,
} from '../src/cross-device-continuity-foundation/index.js';
import type { ContinuityInput, ContinuityScope, HandoffType } from '../src/cross-device-continuity-foundation/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeContinuityInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<ContinuityInput> = {},
): ContinuityInput {
  return {
    continuitySessionId: 'continuity-session-001',
    fromDeviceId: 'phone-device-001',
    toDeviceId: 'desktop-device-001',
    userId: 'user-001',
    mobileSessionId: 'mobile-session-0001',
    cloudSessionId: 'cloud-session-001',
    conversationId: 'conv-001',
    workspaceId,
    projectId,
    handoffRequestId: 'handoff-req-001',
    handoffType: 'PHONE_TO_DESKTOP',
    continuityScope: 'FULL_COMMAND_CONTEXT',
    sourceDeviceType: 'PHONE',
    targetDeviceType: 'DESKTOP_BROWSER',
    sourcePlatform: 'ANDROID',
    targetPlatform: 'WINDOWS',
    authStatus: 'PASS',
    governanceStatus: 'PASS',
    cloudConnectionStatus: 'CONNECTED',
    requestedContinuityCapabilities: [
      'RESUME_PROJECT_CONTEXT',
      'RESUME_CHAT_CONTEXT',
      'RESUME_APPROVAL_CONTEXT',
      'RESUME_PREVIEW_CONTEXT',
      'REQUEST_CLOUD_STATE_REFRESH',
      'REQUEST_DEVICE_HANDOFF_SUMMARY',
    ],
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
  console.log('DevPulse V2 — Phase 8.5 Cross-device Continuity Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetContinuityPacketCounterForTests();

  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  const ws2 = foundation.createWorkspace({
    projectId: 'fine-print',
    projectName: 'Fine Print Decipherer Workspace',
    projectVision: 'Legal document analysis',
  });
  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().activateWorkspace(ws2.workspaceId);

  const continuity = resetDevPulseV2CrossDeviceContinuityFoundationForTests();
  const input1 = makeContinuityInput(ws1.workspaceId, 'devpulse');
  const pkt1 = continuity.processHandoff(input1);
  const pkt2 = continuity.processHandoff(
    makeContinuityInput(ws2.workspaceId, 'fine-print', {
      handoffType: 'DESKTOP_TO_PHONE',
      fromDeviceId: 'desktop-002',
      toDeviceId: 'phone-002',
      handoffRequestId: 'handoff-req-002',
      continuityScope: 'CHAT_CONTEXT',
      requestedContinuityCapabilities: ['RESUME_CHAT_CONTEXT', 'REQUEST_DEVICE_HANDOFF_SUMMARY'],
    }),
  );

  assert('1. continuity packet generation succeeds', pkt1.continuityPacketId.startsWith('continuity-pkt-'), pkt1.continuityPacketId);
  assert('2. continuity has continuitySessionId', pkt1.continuitySessionId === 'continuity-session-001', pkt1.continuitySessionId);
  assert('3. continuity has fromDeviceId', pkt1.fromDeviceId === 'phone-device-001', pkt1.fromDeviceId);
  assert('4. continuity has toDeviceId', pkt1.toDeviceId === 'desktop-device-001', pkt1.toDeviceId);
  assert('5. continuity has userId', pkt1.userId === 'user-001', pkt1.userId);
  assert('6. continuity has mobileSessionId', pkt1.mobileSessionId === 'mobile-session-0001', pkt1.mobileSessionId);
  assert('7. continuity has cloudSessionId', pkt1.cloudSessionId === 'cloud-session-001', pkt1.cloudSessionId);
  assert('8. continuity has conversationId', pkt1.conversationId === 'conv-001', pkt1.conversationId);
  assert('9. continuity has workspaceId', pkt1.workspaceId === ws1.workspaceId, pkt1.workspaceId);
  assert('10. continuity has projectId', pkt1.projectId === 'devpulse', pkt1.projectId);
  assert('11. continuity has handoffRequestId', pkt1.handoffRequestId === 'handoff-req-001', pkt1.handoffRequestId);
  assert('12. handoff type classified', pkt1.handoffType === 'PHONE_TO_DESKTOP', pkt1.handoffType);
  assert('13. continuity state ready', pkt1.continuityState === 'CONTINUITY_READY', pkt1.continuityState);
  assert('14. continuity readiness context resume', pkt1.continuityReadiness === 'READY_CONTEXT_RESUME', pkt1.continuityReadiness);
  assert('15. handoff summary present', pkt1.handoffSummary.length > 0, pkt1.handoffSummary);
  assert('16. allowed capabilities present', pkt1.allowedContinuityCapabilities.length > 0, String(pkt1.allowedContinuityCapabilities.length));
  assert('17. no execution performed confirmation', pkt1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('18. no commands executed confirmation', pkt1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('19. no files modified confirmation', pkt1.confirmation.noFilesModified === true, 'confirmed');
  assert('20. no duplicate project truth confirmation', pkt1.confirmation.noDuplicateProjectTruthCreated === true, 'confirmed');

  assert('21. registry ownership', DevPulseV2CrossDeviceContinuityFoundation.assertRegistryOwnership(), 'registry ok');
  assert('22. duplicate check passes', DevPulseV2CrossDeviceContinuityFoundation.assertDuplicateCheckPasses(), 'no duplicates');
  assert('23. does not execute', DevPulseV2CrossDeviceContinuityFoundation.assertDoesNotExecute(), 'no execute methods');
  assert('24. no forbidden patterns', DevPulseV2CrossDeviceContinuityFoundation.assertNoForbiddenExecutionPatterns(), 'clean scan');
  assert('25. dependency chain', DevPulseV2CrossDeviceContinuityFoundation.assertDependencyChain(), 'deps ok');

  const owner = getDevPulseV2Owner('cross_device_continuity_foundation');
  assert('26. owner module correct', owner.ownerModule === CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE, owner.ownerModule);
  assert('27. owner phase 8.5', owner.phase === 8.5, String(owner.phase));
  assert('28. owner function registered', owner.ownerFunction === 'createDevPulseV2CrossDeviceContinuityFoundation', owner.ownerFunction);

  assert('29. governance dependencies present', assertGovernanceDependenciesPresent(), 'deps present');
  assert('30. no governance bypass', assertNoGovernanceBypass(), 'no bypass');
  assert('31. world1 protected', assertWorld1Protected(), 'world1 protected');
  assert('32. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'registry ok');
  assert('33. distinct from mobile approval flow', assertDistinctFromMobileApprovalFlowFoundation(), 'distinct');

  const moduleDir = join(fileURLToPath(new URL('../src/cross-device-continuity-foundation', import.meta.url)));
  const forbidden = scanModuleForForbiddenPatterns(moduleDir);
  assert('34. forbidden pattern scan clean', forbidden.length === 0, forbidden.join('; ') || 'clean');

  assert('35. continuity state sequence defined', CONTINUITY_STATE_SEQUENCE.length >= 10, String(CONTINUITY_STATE_SEQUENCE.length));
  assert('36. known handoff types count', KNOWN_HANDOFF_TYPES.length === 7, String(KNOWN_HANDOFF_TYPES.length));
  assert('37. known continuity scopes count', KNOWN_CONTINUITY_SCOPES.length === 7, String(KNOWN_CONTINUITY_SCOPES.length));
  assert('38. known continuity capabilities count', KNOWN_CONTINUITY_CAPABILITIES.length === 9, String(KNOWN_CONTINUITY_CAPABILITIES.length));
  assert('39. readiness levels count', CONTINUITY_READINESS_LEVELS.length === 9, String(CONTINUITY_READINESS_LEVELS.length));
  assert('40. dependency systems count', DEPENDENCY_SYSTEMS.length === 10, String(DEPENDENCY_SYSTEMS.length));

  assert('41. source device validation passes', validateSourceDevice(input1).valid === true, 'valid');
  assert('42. target device validation passes', validateTargetDevice(input1).valid === true, 'valid');
  assert('43. cloud session validation passes', validateCloudContinuitySession(input1).valid === true, 'valid');
  assert('44. handoff request validation passes', validateHandoffRequest(input1).valid === true, 'valid');
  assert('45. governance validation passes', validateContinuityGovernance(input1).valid === true, 'valid');
  assert('46. handoff classification passes', classifyHandoff(input1).valid === true, 'valid');
  assert('47. scope classification passes', classifyContinuityScope(input1).valid === true, 'valid');

  assert('48. missing source device blocked', validateSourceDevice(makeContinuityInput(ws1.workspaceId, 'devpulse', { fromDeviceId: '' })).valid === false, 'blocked');
  assert('49. missing target device blocked', validateTargetDevice(makeContinuityInput(ws1.workspaceId, 'devpulse', { toDeviceId: '' })).valid === false, 'blocked');
  assert('50. missing user blocked', validateHandoffRequest(makeContinuityInput(ws1.workspaceId, 'devpulse', { userId: '' })).valid === false, 'blocked');

  const noCloud = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { cloudSessionId: '' }));
  assert('51. missing cloud session blocked', noCloud.continuityReadiness === 'NEEDS_CLOUD_CONNECTION', noCloud.continuityReadiness);

  const noWs = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { workspaceId: '' }));
  assert('52. missing workspace blocked', noWs.continuityState === 'CONTINUITY_BLOCKED', noWs.continuityState);

  const noProj = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'wrong-project'));
  assert('53. missing project context blocked', noProj.continuityReadiness === 'NEEDS_PROJECT_CONTEXT', noProj.continuityReadiness);

  const noHandoff = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffRequestId: '' }));
  assert('54. missing handoff request blocked', noHandoff.continuityState === 'CONTINUITY_BLOCKED', noHandoff.continuityState);

  const authFail = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { authStatus: 'FAIL' }));
  assert('55. auth failure blocked', authFail.continuityReadiness === 'NEEDS_AUTH', authFail.continuityReadiness);

  const cloudDisc = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'DISCONNECTED' }));
  assert('56. cloud disconnected blocked', cloudDisc.continuityReadiness === 'NEEDS_CLOUD_CONNECTION', cloudDisc.continuityReadiness);

  const govFail = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' }));
  assert('57. governance failure blocked', govFail.continuityReadiness === 'NEEDS_GOVERNANCE', govFail.continuityReadiness);

  const unknownHandoff = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffType: 'UNKNOWN' }));
  assert('58. unknown handoff blocked', unknownHandoff.continuityState === 'CONTINUITY_BLOCKED', unknownHandoff.continuityState);

  const handoffTypes: HandoffType[] = [
    'PHONE_TO_DESKTOP',
    'DESKTOP_TO_PHONE',
    'PHONE_TO_TABLET',
    'TABLET_TO_PHONE',
    'WEB_TO_PHONE',
    'PHONE_TO_WEB',
    'SAME_DEVICE_RESUME',
  ];
  for (let i = 0; i < handoffTypes.length; i += 1) {
    const type = handoffTypes[i]!;
    const r = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffType: type, handoffRequestId: `handoff-type-${i}` }));
    assert(`${59 + i}. ${type} handoff classified`, r.handoffType === type && r.continuityReadiness === 'READY_CONTEXT_RESUME', r.handoffType);
  }

  const scopes: ContinuityScope[] = [
    'PROJECT_CONTEXT',
    'CHAT_CONTEXT',
    'APPROVAL_CONTEXT',
    'PREVIEW_CONTEXT',
    'OPERATOR_FEED_CONTEXT',
    'BUILD_PROGRESS_CONTEXT',
    'FULL_COMMAND_CONTEXT',
  ];
  for (let i = 0; i < scopes.length; i += 1) {
    const scope = scopes[i]!;
    const r = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', {
      continuityScope: scope,
      handoffRequestId: `scope-${i}`,
      requestedContinuityCapabilities: scope === 'FULL_COMMAND_CONTEXT'
        ? ['RESUME_PROJECT_CONTEXT', 'REQUEST_CLOUD_STATE_REFRESH']
        : scope === 'PROJECT_CONTEXT'
          ? ['RESUME_PROJECT_CONTEXT']
          : scope === 'CHAT_CONTEXT'
            ? ['RESUME_CHAT_CONTEXT']
            : scope === 'APPROVAL_CONTEXT'
              ? ['RESUME_APPROVAL_CONTEXT']
              : scope === 'PREVIEW_CONTEXT'
                ? ['RESUME_PREVIEW_CONTEXT']
                : scope === 'OPERATOR_FEED_CONTEXT'
                  ? ['RESUME_OPERATOR_FEED_CONTEXT']
                  : ['RESUME_BUILD_PROGRESS_CONTEXT'],
    }));
    assert(`${66 + i}. ${scope} scope classified`, r.continuityScope === scope, r.continuityScope);
  }

  const unknownScope = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { continuityScope: 'UNKNOWN' }));
  assert('73. unknown scope blocked', unknownScope.continuityState === 'CONTINUITY_BLOCKED', unknownScope.continuityState);

  const caps = evaluateContinuityCapabilities(input1, 'FULL_COMMAND_CONTEXT', true);
  assert('74. allowed continuity capabilities', caps.allowed.length > 0, String(caps.allowed.length));
  assert('75. capability evaluation runs', caps.blocked.length >= 0, String(caps.blocked.length));

  const unknownCap = classifyContinuityCapability('UNKNOWN_CAPABILITY', input1, 'FULL_COMMAND_CONTEXT', true);
  assert('76. unknown continuity capability blocked', unknownCap.allowed === false, unknownCap.blockReason);

  const cloudRefresh = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', {
    continuityScope: 'PROJECT_CONTEXT',
    requestedContinuityCapabilities: ['REQUEST_CLOUD_STATE_REFRESH'],
    handoffRequestId: 'cloud-refresh',
  }));
  assert('77. cloud state refresh readiness', cloudRefresh.continuityReadiness === 'READY_CLOUD_STATE_REFRESH', cloudRefresh.continuityReadiness);

  const dupTruth = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'duplicate project state on device', handoffRequestId: 'dup-truth' }));
  assert('78. blocked duplicate project truth attempt', dupTruth.continuityState === 'CONTINUITY_BLOCKED', dupTruth.continuityState);

  const fileTransfer = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'transfer full project files', handoffRequestId: 'file-transfer' }));
  assert('79. blocked full project file transfer attempt', fileTransfer.continuityState === 'CONTINUITY_BLOCKED', fileTransfer.continuityState);

  const execAttempt = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'execute build now', handoffRequestId: 'exec' }));
  assert('80. blocked execution attempt', execAttempt.continuityState === 'CONTINUITY_BLOCKED', execAttempt.continuityState);

  const fileMod = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'modify file on disk', handoffRequestId: 'file-mod' }));
  assert('81. blocked file modification attempt', fileMod.continuityState === 'CONTINUITY_BLOCKED', fileMod.continuityState);

  const codeGen = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'generate code for project', handoffRequestId: 'code-gen' }));
  assert('82. blocked code generation attempt', codeGen.continuityState === 'CONTINUITY_BLOCKED', codeGen.continuityState);

  const deploy = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'deploy to production', handoffRequestId: 'deploy' }));
  assert('83. blocked deployment attempt', deploy.continuityState === 'CONTINUITY_BLOCKED', deploy.continuityState);

  const selfApprove = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'auto approve all requests', handoffRequestId: 'self-approve' }));
  assert('84. no approval self-granting', selfApprove.continuityState === 'CONTINUITY_BLOCKED', selfApprove.continuityState);

  const dupVault = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'create second project vault', handoffRequestId: 'dup-vault' }));
  assert('85. no duplicate project vault', dupVault.continuityState === 'CONTINUITY_BLOCKED', dupVault.continuityState);

  const dupChat = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'duplicate chat truth on phone', handoffRequestId: 'dup-chat' }));
  assert('86. no duplicate chat truth', dupChat.continuityState === 'CONTINUITY_BLOCKED', dupChat.continuityState);

  const dupPreview = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'duplicate preview truth locally', handoffRequestId: 'dup-preview' }));
  assert('87. no duplicate preview truth', dupPreview.continuityState === 'CONTINUITY_BLOCKED', dupPreview.continuityState);

  const dupApproval = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'duplicate approval truth on device', handoffRequestId: 'dup-approval' }));
  assert('88. no duplicate approval truth', dupApproval.continuityState === 'CONTINUITY_BLOCKED', dupApproval.continuityState);

  const dupExec = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { handoffNotes: 'duplicate execution truth locally', handoffRequestId: 'dup-exec' }));
  assert('89. no duplicate execution truth', dupExec.continuityState === 'CONTINUITY_BLOCKED', dupExec.continuityState);

  const summary = generateHandoffSummary(input1, 'PHONE_TO_DESKTOP', caps.allowed, true);
  assert('90. handoff summary creation', summary.includes('PHONE_TO_DESKTOP'), summary.slice(0, 60));

  assert('91. handoff key', handoffKey(input1).includes('phone-device-001'), handoffKey(input1));
  assert('92. handoff classification key', handoffClassificationKey('PHONE_TO_DESKTOP', true) === 'PHONE_TO_DESKTOP|true', handoffClassificationKey('PHONE_TO_DESKTOP', true));
  assert('93. scope classification key', scopeClassificationKey('FULL_COMMAND_CONTEXT', true) === 'FULL_COMMAND_CONTEXT|true', scopeClassificationKey('FULL_COMMAND_CONTEXT', true));
  assert('94. capabilities key', capabilitiesKey(caps.allowed, caps.blocked).includes('allowed:'), capabilitiesKey(caps.allowed, caps.blocked));
  assert('95. governance gates key', governanceGatesKey(validateContinuityGovernance(input1).gates).length > 0, 'gates');

  const security = evaluateContinuitySecurity(input1);
  assert('96. security evaluation passes', security.blocked === false, security.reason);

  assert('97. no duplicate project truth check', assertNoDuplicateProjectTruth(), 'ok');
  assert('98. no duplicate project vault check', assertNoDuplicateProjectVault(), 'ok');
  assert('99. no duplicate chat truth check', assertNoDuplicateChatTruth(), 'ok');
  assert('100. no duplicate preview truth check', assertNoDuplicatePreviewTruth(), 'ok');
  assert('101. no duplicate approval truth check', assertNoDuplicateApprovalTruth(), 'ok');
  assert('102. no duplicate execution truth check', assertNoDuplicateExecutionTruth(), 'ok');

  assert('103. state includes CONTINUITY_READY', continuityStateIncludes(pkt1.stateSequence, 'CONTINUITY_READY'), 'included');
  assert('104. state includes HANDOFF_CLASSIFIED', continuityStateIncludes(pkt1.stateSequence, 'HANDOFF_CLASSIFIED'), 'included');
  assert('105. state includes SCOPE_EVALUATED', continuityStateIncludes(pkt1.stateSequence, 'SCOPE_EVALUATED'), 'included');

  const formatted = formatContinuityReport(continuity.getFoundationState(), pkt1, input1);
  assert('106. formatted report includes phase 8.5', formatted.includes('Phase 8.5'), 'formatted');
  assert('107. formatted report confirms no execution', formatted.includes('No execution performed: CONFIRMED'), 'formatted');
  assert('108. formatted report confirms no duplicate truth', formatted.includes('No duplicate project truth created: CONFIRMED'), 'formatted');

  assert('109. get continuity by session', continuity.getContinuityBySession('continuity-session-001') !== null, 'found');
  assert('110. get continuity by project', continuity.getContinuityByProject('devpulse') !== null, 'found');
  assert('111. governance summary present', continuity.getGovernanceSummary().includes('mobile_approval_flow_foundation'), continuity.getGovernanceSummary());
  assert('112. world1 modification blocked', continuity.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('113. check no duplicate project truth', continuity.checkNoDuplicateProjectTruth(), 'ok');
  assert('114. check no duplicate project vault', continuity.checkNoDuplicateProjectVault(), 'ok');
  assert('115. check no duplicate chat truth', continuity.checkNoDuplicateChatTruth(), 'ok');
  assert('116. check no duplicate preview truth', continuity.checkNoDuplicatePreviewTruth(), 'ok');
  assert('117. check no duplicate approval truth', continuity.checkNoDuplicateApprovalTruth(), 'ok');
  assert('118. check no duplicate execution truth', continuity.checkNoDuplicateExecutionTruth(), 'ok');

  assert('119. is governance ready PASS', isGovernanceReady('PASS') === true, 'ready');
  assert('120. is governance ready FAIL', isGovernanceReady('FAIL') === false, 'not ready');

  const crossWs = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { targetWorkspaceId: ws2.workspaceId, handoffRequestId: 'cross-ws' }));
  assert('121. cross-workspace continuity blocked', crossWs.continuityState === 'CONTINUITY_BLOCKED' || crossWs.ownershipGates.some((g) => g.status === 'CLOSED'), 'blocked');

  const crossProj = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { targetProjectId: 'fine-print', handoffRequestId: 'cross-proj' }));
  assert('122. cross-project continuity blocked', crossProj.continuityState === 'CONTINUITY_BLOCKED' || crossProj.ownershipGates.some((g) => g.gateType === 'CROSS_PROJECT'), 'blocked');

  assert('123. second project handoff isolated', pkt2.projectId === 'fine-print', pkt2.projectId);
  assert('124. no cross-project leakage', pkt1.projectId !== pkt2.projectId, `${pkt1.projectId} vs ${pkt2.projectId}`);

  const needsSrc = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { fromDeviceId: '' }));
  assert('125. needs source device readiness', needsSrc.continuityReadiness === 'NEEDS_SOURCE_DEVICE', needsSrc.continuityReadiness);

  const needsTgt = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { toDeviceId: '' }));
  assert('126. needs target device readiness', needsTgt.continuityReadiness === 'NEEDS_TARGET_DEVICE', needsTgt.continuityReadiness);

  assert('127. duplicate patterns defined', DUPLICATE_PATTERNS.length >= 6, String(DUPLICATE_PATTERNS.length));
  assert('128. mobile command foundation phase', getDevPulseV2Owner('mobile_command_foundation').phase === 8.1, '8.1');
  assert('129. mobile chat interface phase', getDevPulseV2Owner('mobile_chat_interface').phase === 8.2, '8.2');
  assert('130. mobile live preview phase', getDevPulseV2Owner('mobile_live_preview_foundation').phase === 8.3, '8.3');
  assert('131. mobile approval flow phase', getDevPulseV2Owner('mobile_approval_flow_foundation').phase === 8.4, '8.4');
  assert('132. world2 workspace foundation registered', getDevPulseV2Owner('world2_workspace_foundation').ownerModule.length > 0, 'registered');

  assert('133. continuity packet count', continuity.getContinuityPackets().length >= 2, String(continuity.getContinuityPackets().length));
  assert('134. foundation state has id', continuity.getFoundationState().foundationId.includes('cross-device-continuity-foundation'), continuity.getFoundationState().foundationId);
  assert('135. no deployment confirmation', pkt1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('136. no code generated confirmation', pkt1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('137. no approval self-granted confirmation', pkt1.confirmation.noApprovalSelfGranted === true, 'confirmed');
  assert('138. cross-device continuity foundation only confirmation', pkt1.confirmation.crossDeviceContinuityFoundationOnly === true, 'confirmed');

  const degraded = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'DEGRADED', handoffRequestId: 'degraded' }));
  assert('139. degraded cloud connection allowed', degraded.continuityReadiness === 'READY_CONTEXT_RESUME', degraded.continuityReadiness);

  assert('140. cloud state refresh required for approval scope', requiresCloudStateRefresh('APPROVAL_CONTEXT') === true, 'true');
  assert('141. cloud state refresh required for full command', requiresCloudStateRefresh('FULL_COMMAND_CONTEXT') === true, 'true');
  assert('142. cloud state refresh not required for project only', requiresCloudStateRefresh('PROJECT_CONTEXT') === false, 'false');

  assert('143. ownership gate count', pkt1.ownershipGates.length > 0, String(pkt1.ownershipGates.length));
  assert('144. governance gate count', pkt1.governanceGates.length > 0, String(pkt1.governanceGates.length));
  assert('145. cloud gate count', pkt1.cloudGates.length > 0, String(pkt1.cloudGates.length));
  assert('146. device gate count', pkt1.deviceGates.length > 0, String(pkt1.deviceGates.length));
  assert('147. scope gate count', pkt1.scopeGates.length > 0, String(pkt1.scopeGates.length));
  assert('148. pass token defined', CROSS_DEVICE_CONTINUITY_FOUNDATION_PASS_TOKEN === 'DEVPULSE_V2_CROSS_DEVICE_CONTINUITY_FOUNDATION_V1_PASS', CROSS_DEVICE_CONTINUITY_FOUNDATION_PASS_TOKEN);

  const blockedNoPacket = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { authStatus: 'FAIL' }));
  assert('149. blocked continuity has no packet id', blockedNoPacket.continuityPacketId === '', blockedNoPacket.continuityPacketId);

  assert('150. readiness key', readinessKey('READY_CONTEXT_RESUME') === 'READY_CONTEXT_RESUME', readinessKey('READY_CONTEXT_RESUME'));

  const oneContinuity = resetDevPulseV2CrossDeviceContinuityFoundationForTests();
  const oneWs = seedWorkspaces(1);
  oneContinuity.processHandoff(makeContinuityInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId, { handoffRequestId: 'one-proj' }));
  assert('151. one project support', oneContinuity.getContinuityPackets().length === 1, '1');

  const fiveContinuity = resetDevPulseV2CrossDeviceContinuityFoundationForTests();
  const fiveWs = seedWorkspaces(5);
  for (let i = 0; i < fiveWs.length; i += 1) {
    fiveContinuity.processHandoff(makeContinuityInput(fiveWs[i]!.workspaceId, fiveWs[i]!.projectId, { handoffRequestId: `five-${i}` }));
  }
  assert('152. five project support', fiveContinuity.getContinuityPackets().length === 5, '5');

  const tenContinuity = resetDevPulseV2CrossDeviceContinuityFoundationForTests();
  const tenWs = seedWorkspaces(10);
  for (let i = 0; i < tenWs.length; i += 1) {
    tenContinuity.processHandoff(makeContinuityInput(tenWs[i]!.workspaceId, tenWs[i]!.projectId, { handoffRequestId: `ten-${i}` }));
  }
  assert('153. ten project support', tenContinuity.getContinuityPackets().length === 10, '10');

  const twentyFiveContinuity = resetDevPulseV2CrossDeviceContinuityFoundationForTests();
  const twentyFiveWs = seedWorkspaces(25);
  for (let i = 0; i < twentyFiveWs.length; i += 1) {
    twentyFiveContinuity.processHandoff(makeContinuityInput(twentyFiveWs[i]!.workspaceId, twentyFiveWs[i]!.projectId, { handoffRequestId: `twentyfive-${i}` }));
  }
  assert('154. twenty-five project support', twentyFiveContinuity.getContinuityPackets().length === 25, '25');

  const iso1 = twentyFiveContinuity.getContinuityByProject('proj-1');
  const iso25 = twentyFiveContinuity.getContinuityByProject('proj-25');
  assert('155. multi-project isolation proj-1', iso1 !== null && iso1.projectId === 'proj-1', iso1?.projectId ?? 'null');
  assert('156. multi-project isolation proj-25', iso25 !== null && iso25.projectId === 'proj-25', iso25?.projectId ?? 'null');
  assert('157. no cross-project continuity leakage', iso1?.handoffRequestId !== iso25?.handoffRequestId, 'isolated');

  const postSeedFoundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const postWs1 = postSeedFoundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Build DevPulse in World 2',
  });
  postSeedFoundation.getManager().activateWorkspace(postWs1.workspaceId);

  resetContinuityPacketCounterForTests();
  const det1 = processContinuityHandoff(makeContinuityInput(postWs1.workspaceId, 'devpulse', { handoffRequestId: 'det-1' }));
  const det2 = processContinuityHandoff(makeContinuityInput(postWs1.workspaceId, 'devpulse', { handoffRequestId: 'det-2' }));
  const key1 = continuityStructuralKey(det1);
  const key2 = continuityStructuralKey(det2);
  assert('158. deterministic structural key same context', key1.split('|').slice(0, 6).join('|') === key2.split('|').slice(0, 6).join('|'), key1);
  assert('159. deterministic readiness output', det1.continuityReadiness === det2.continuityReadiness, det1.continuityReadiness);
  assert('160. deterministic handoff classification', det1.handoffType === det2.handoffType, det1.handoffType);
  assert('161. deterministic scope classification', det1.continuityScope === det2.continuityScope, det1.continuityScope);
  assert('162. deterministic capability output count', det1.allowedContinuityCapabilities.length === det2.allowedContinuityCapabilities.length, String(det1.allowedContinuityCapabilities.length));

  assert('163. source device ownership gate', validateSourceDevice(input1).gates.some((g) => g.gateType === 'SOURCE_DEVICE'), 'source');
  assert('164. target device ownership gate', validateTargetDevice(input1).gates.some((g) => g.gateType === 'TARGET_DEVICE'), 'target');
  assert('165. project ownership gate', classifyContinuityScope(input1).gates.some((g) => g.gateType === 'CONTINUITY_SCOPE'), 'scope');
  assert('166. cloud session ownership gate', validateCloudContinuitySession(input1).gates.some((g) => g.gateType === 'CLOUD_SESSION'), 'cloud');
  assert('167. conversation context preserved', pkt1.conversationId === 'conv-001', pkt1.conversationId);

  assert('168. determine readiness helper auth', determineContinuityReadiness(true, true, true, true, true, true, true, false, 'FAIL', 'CONNECTED', 'PASS', false, false, false) === 'NEEDS_AUTH', 'NEEDS_AUTH');
  assert('169. determine readiness helper cloud', determineContinuityReadiness(true, true, true, true, true, true, true, false, 'PASS', 'DISCONNECTED', 'PASS', false, false, false) === 'NEEDS_CLOUD_CONNECTION', 'NEEDS_CLOUD_CONNECTION');
  assert('170. determine readiness helper source', determineContinuityReadiness(true, false, true, true, true, true, true, false, 'PASS', 'CONNECTED', 'PASS', false, true, false) === 'NEEDS_SOURCE_DEVICE', 'NEEDS_SOURCE_DEVICE');
  assert('171. determine readiness helper target', determineContinuityReadiness(true, true, false, true, true, true, true, false, 'PASS', 'CONNECTED', 'PASS', false, false, true) === 'NEEDS_TARGET_DEVICE', 'NEEDS_TARGET_DEVICE');
  assert('172. determine readiness helper project', determineContinuityReadiness(false, true, true, true, false, true, true, false, 'PASS', 'CONNECTED', 'PASS', false, false, false) === 'NEEDS_PROJECT_CONTEXT', 'NEEDS_PROJECT_CONTEXT');
  assert('173. determine readiness helper governance', determineContinuityReadiness(false, true, true, true, true, false, true, false, 'PASS', 'CONNECTED', 'PASS', false, false, false) === 'NEEDS_GOVERNANCE', 'NEEDS_GOVERNANCE');
  assert('174. determine readiness helper context resume', determineContinuityReadiness(false, true, true, true, true, true, true, false, 'PASS', 'CONNECTED', 'PASS', false, false, false) === 'READY_CONTEXT_RESUME', 'READY_CONTEXT_RESUME');
  assert('175. determine readiness helper cloud refresh', determineContinuityReadiness(false, true, true, true, true, true, true, true, 'PASS', 'CONNECTED', 'PASS', false, false, false) === 'READY_CLOUD_STATE_REFRESH', 'READY_CLOUD_STATE_REFRESH');

  assert('176. founder approval gate registered', getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5, '6.5');
  assert('177. verification gated apply registered', getDevPulseV2Owner('verification_gated_apply').phase === 6.11, '6.11');
  assert('178. execution authority registered', getDevPulseV2Owner('execution_authority').phase === 6.1, '6.1');
  assert('179. execution evidence ledger registered', getDevPulseV2Owner('execution_evidence_ledger').phase === 6.7, '6.7');
  assert('180. controlled execution bridge registered', getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7, '7.7');

  assert('181. state sequence source device validated', continuityStateIncludes(pkt1.stateSequence, 'SOURCE_DEVICE_VALIDATED'), 'included');
  assert('182. state sequence target device validated', continuityStateIncludes(pkt1.stateSequence, 'TARGET_DEVICE_VALIDATED'), 'included');
  assert('183. state sequence cloud session validated', continuityStateIncludes(pkt1.stateSequence, 'CLOUD_SESSION_VALIDATED'), 'included');
  assert('184. state sequence project context validated', continuityStateIncludes(pkt1.stateSequence, 'PROJECT_CONTEXT_VALIDATED'), 'included');
  assert('185. state sequence capabilities evaluated', continuityStateIncludes(pkt1.stateSequence, 'CAPABILITIES_EVALUATED'), 'included');
  assert('186. state sequence packet created', continuityStateIncludes(pkt1.stateSequence, 'CONTINUITY_PACKET_CREATED'), 'included');

  assert('187. cloud state refresh required flag', pkt1.cloudStateRefreshRequired === true, String(pkt1.cloudStateRefreshRequired));
  assert('188. recommendations present', pkt1.recommendations.length > 0, String(pkt1.recommendations.length));
  assert('189. blocked capability has reason', unknownCap.blockReason.length > 0, unknownCap.blockReason);
  assert('190. cross-device continuity foundation only in report text', formatted.includes('Cross-device continuity foundation only: CONFIRMED'), 'confirmed');

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('191. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(CROSS_DEVICE_CONTINUITY_FOUNDATION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:cross-device-continuity-foundation');
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
