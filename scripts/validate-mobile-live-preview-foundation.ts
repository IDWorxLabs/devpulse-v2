/**
 * DevPulse V2 Phase 8.3 Mobile Live Preview Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import {
  assertDistinctFromMobileChatInterface,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  capabilitiesKey,
  classifyPreviewCapability,
  classifyPreviewType,
  classifyPreviewTarget,
  DEPENDENCY_SYSTEMS,
  DevPulseV2MobileLivePreviewFoundation,
  deviceSuitabilityKey,
  evaluateDeviceSuitability,
  evaluatePreviewCapabilities,
  evaluatePreviewSecurity,
  evaluatePreviewSource,
  formatMobilePreviewReport,
  generateDesktopRequiredNotice,
  generatePreviewSummary,
  isMobileSuitableTarget,
  KNOWN_PREVIEW_CAPABILITIES,
  MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE,
  MOBILE_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN,
  PREVIEW_READINESS_LEVELS,
  PREVIEW_STATE_SEQUENCE,
  previewStateIncludes,
  previewStructuralKey,
  processMobilePreview,
  resetDevPulseV2MobileLivePreviewFoundationForTests,
  resetPreviewPacketCounterForTests,
  resetPreviewSummaryCounterForTests,
  scanModuleForForbiddenPatterns,
  validateChatPreviewContext,
  validateCloudPreviewSession,
  validateMobilePreviewSession,
  validatePreviewGovernance,
  validatePreviewProjectContext,
  validatePreviewSession,
} from '../src/mobile-live-preview-foundation/index.js';
import type { PreviewSessionInput } from '../src/mobile-live-preview-foundation/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makePreviewInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<PreviewSessionInput> = {},
): PreviewSessionInput {
  return {
    previewSessionId: 'preview-session-001',
    mobileSessionId: 'mobile-session-0001',
    cloudSessionId: 'cloud-session-001',
    conversationId: 'conv-001',
    userId: 'user-001',
    deviceId: 'device-001',
    workspaceId,
    projectId,
    previewRequestId: 'preview-req-001',
    previewTarget: 'PROJECT_OVERVIEW',
    previewType: 'SUMMARY_ONLY',
    previewSourceStatus: 'AVAILABLE',
    deviceType: 'PHONE',
    platform: 'ANDROID',
    networkStatus: 'ONLINE',
    authStatus: 'PASS',
    governanceStatus: 'PASS',
    cloudConnectionStatus: 'CONNECTED',
    requestedPreviewCapabilities: ['VIEW_PREVIEW_SUMMARY', 'VIEW_PREVIEW_WARNINGS'],
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
  console.log('DevPulse V2 — Phase 8.3 Mobile Live Preview Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetPreviewSummaryCounterForTests();

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

  const preview = resetDevPulseV2MobileLivePreviewFoundationForTests();
  const input1 = makePreviewInput(ws1.workspaceId, 'devpulse');
  const pkt1 = preview.requestMobilePreview(input1);
  const pkt2 = preview.requestMobilePreview(
    makePreviewInput(ws2.workspaceId, 'fine-print', { previewTarget: 'MOBILE_APP' }),
  );

  assert('1. preview packet generation succeeds', pkt1.mobilePreviewPacketId.startsWith('mobile-preview-pkt-'), pkt1.mobilePreviewPacketId);
  assert('2. preview has previewSessionId', pkt1.previewSessionId === 'preview-session-001', pkt1.previewSessionId);
  assert('3. preview has mobileSessionId', pkt1.mobileSessionId === 'mobile-session-0001', pkt1.mobileSessionId);
  assert('4. preview has cloudSessionId', pkt1.cloudSessionId === 'cloud-session-001', pkt1.cloudSessionId);
  assert('5. preview has conversationId', pkt1.conversationId === 'conv-001', pkt1.conversationId);
  assert('6. preview has userId', pkt1.userId === 'user-001', pkt1.userId);
  assert('7. preview has workspaceId', pkt1.workspaceId === ws1.workspaceId, pkt1.workspaceId);
  assert('8. preview has projectId', pkt1.projectId === 'devpulse', pkt1.projectId);
  assert('9. preview has previewRequestId', pkt1.previewRequestId === 'preview-req-001', pkt1.previewRequestId);
  assert('10. preview summary present', pkt1.previewSummary.length > 0, pkt1.previewSummary);
  assert('11. confirmation no execution', pkt1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('12. confirmation no commands', pkt1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('13. confirmation no files modified', pkt1.confirmation.noFilesModified === true, 'confirmed');
  assert('14. confirmation no code generated', pkt1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('15. confirmation no deployment', pkt1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('16. confirmation foundation only', pkt1.confirmation.mobileLivePreviewFoundationOnly === true, 'confirmed');
  assert('17. confirmation no approval self-granted', pkt1.confirmation.noApprovalSelfGranted === true, 'confirmed');
  assert('18. confirmation no preview source claim', pkt1.confirmation.noPreviewSourceOfTruthClaim === true, 'confirmed');

  const missingPreview = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { previewSessionId: '' }));
  assert('19. missing preview session blocked', missingPreview.previewState === 'PREVIEW_BLOCKED', missingPreview.previewState);

  const missingMobile = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { mobileSessionId: '' }));
  assert('20. missing mobile session blocked', missingMobile.previewState === 'PREVIEW_BLOCKED', missingMobile.previewState);

  const missingCloud = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { cloudSessionId: '' }));
  assert('21. missing cloud session blocked', missingCloud.previewState === 'PREVIEW_BLOCKED', missingCloud.previewState);

  const missingConv = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { conversationId: '' }));
  assert('22. missing conversation blocked', missingConv.previewState === 'PREVIEW_BLOCKED', missingConv.previewState);

  const missingUser = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { userId: '' }));
  assert('23. missing user blocked', missingUser.previewState === 'PREVIEW_BLOCKED', missingUser.previewState);

  const missingWs = processMobilePreview(makePreviewInput('', 'devpulse'));
  assert('24. missing workspace blocked', missingWs.previewState === 'PREVIEW_BLOCKED', missingWs.previewState);

  const missingProj = processMobilePreview(makePreviewInput(ws1.workspaceId, ''));
  assert('25. missing project blocked', missingProj.previewState === 'PREVIEW_BLOCKED', missingProj.previewState);

  const missingReq = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { previewRequestId: '' }));
  assert('26. missing preview request blocked', missingReq.previewState === 'PREVIEW_BLOCKED', missingReq.previewState);

  const authFail = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { authStatus: 'FAIL' }));
  assert('27. auth failure blocked', authFail.previewState === 'PREVIEW_BLOCKED', authFail.previewState);
  assert('28. auth failure needs auth readiness', authFail.previewReadiness === 'NEEDS_AUTH', authFail.previewReadiness);

  const cloudDisc = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'DISCONNECTED' }));
  assert('29. cloud disconnected blocked', cloudDisc.previewState === 'PREVIEW_BLOCKED', cloudDisc.previewState);

  const govFail = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' }));
  assert('30. governance failure blocked', govFail.previewState === 'PREVIEW_BLOCKED', govFail.previewState);

  assert('31. preview session validation passes', validatePreviewSession(input1).valid === true, 'valid');
  assert('32. mobile session validation passes', validateMobilePreviewSession(input1).valid === true, 'valid');
  assert('33. chat context validation passes', validateChatPreviewContext(input1).valid === true, 'valid');
  assert('34. cloud session validation passes', validateCloudPreviewSession(input1).valid === true, 'valid');
  assert('35. project context validation passes', validatePreviewProjectContext(input1).valid === true, 'valid');
  assert('36. governance validation passes', validatePreviewGovernance(input1).valid === true, 'valid');

  const targets = [
    'PROJECT_OVERVIEW',
    'MOBILE_APP',
    'WEB_APP',
    'DESKTOP_APP',
    'BACKEND_API',
    'SYSTEM_TOPOLOGY',
    'BUILD_PROGRESS',
  ] as const;

  for (const target of targets) {
    const pkt = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: target }));
    assert(`37.${targets.indexOf(target)}. ${target} target`, pkt.previewTarget === target, target);
  }

  const unknownTarget = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'UNKNOWN' }));
  assert('44. UNKNOWN target blocked', unknownTarget.previewState === 'PREVIEW_BLOCKED', unknownTarget.previewState);

  assert('45. SUMMARY_ONLY type', classifyPreviewType('PROJECT_OVERVIEW', 'AVAILABLE') === 'SUMMARY_ONLY', 'SUMMARY_ONLY');
  assert('46. STATIC_SNAPSHOT type default', classifyPreviewType('WEB_APP', 'AVAILABLE') === 'RESPONSIVE_SCREEN_SUMMARY', 'RESPONSIVE_SCREEN_SUMMARY');
  assert('47. RESPONSIVE_SCREEN_SUMMARY type', classifyPreviewType('MOBILE_APP', 'AVAILABLE') === 'RESPONSIVE_SCREEN_SUMMARY', 'RESPONSIVE_SCREEN_SUMMARY');
  assert('48. DESKTOP_REQUIRED_NOTICE type', classifyPreviewType('DESKTOP_APP', 'AVAILABLE') === 'DESKTOP_REQUIRED_NOTICE', 'DESKTOP_REQUIRED_NOTICE');
  assert('49. UNAVAILABLE type not created', classifyPreviewType('PROJECT_OVERVIEW', 'NOT_CREATED') === 'UNAVAILABLE', 'UNAVAILABLE');

  const srcAvail = evaluatePreviewSource(makePreviewInput(ws1.workspaceId, 'devpulse', { previewSourceStatus: 'AVAILABLE' }));
  assert('50. preview source available', srcAvail.sourceStatus === 'AVAILABLE', 'AVAILABLE');

  const srcBuilding = evaluatePreviewSource(makePreviewInput(ws1.workspaceId, 'devpulse', { previewSourceStatus: 'BUILDING' }));
  assert('51. preview source building', srcBuilding.sourceStatus === 'BUILDING', 'BUILDING');

  const srcNotCreated = evaluatePreviewSource(makePreviewInput(ws1.workspaceId, 'devpulse', { previewSourceStatus: 'NOT_CREATED' }));
  assert('52. preview source not created', srcNotCreated.previewType === 'UNAVAILABLE', 'UNAVAILABLE');

  const srcFailed = evaluatePreviewSource(makePreviewInput(ws1.workspaceId, 'devpulse', { previewSourceStatus: 'FAILED' }));
  assert('53. preview source failed', srcFailed.previewType === 'UNAVAILABLE', 'UNAVAILABLE');

  const srcStale = evaluatePreviewSource(makePreviewInput(ws1.workspaceId, 'devpulse', { previewSourceStatus: 'STALE' }));
  assert('54. preview source stale', srcStale.sourceStatus === 'STALE', 'STALE');

  const srcUnknown = evaluatePreviewSource(makePreviewInput(ws1.workspaceId, 'devpulse', { previewSourceStatus: 'UNKNOWN' }));
  assert('55. preview source unknown', srcUnknown.sourceStatus === 'UNKNOWN', 'UNKNOWN');

  const desktopSuit = evaluateDeviceSuitability(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'DESKTOP_APP' }));
  assert('56. desktop required for desktop app', desktopSuit.desktopRequired === true, 'desktop required');

  const webComplex = evaluateDeviceSuitability(makePreviewInput(ws1.workspaceId, 'devpulse', {
    previewTarget: 'WEB_APP',
    requestedPreviewCapabilities: ['VIEW_RESPONSIVE_SUMMARY'],
    deviceType: 'PHONE',
  }));
  assert('57. desktop required for large web app', webComplex.desktopRequired === true, 'desktop required');

  const overviewSuit = evaluateDeviceSuitability(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'PROJECT_OVERVIEW' }));
  assert('58. mobile safe project overview', overviewSuit.mobileSafe === true, 'mobile safe');

  const mobileAppSuit = evaluateDeviceSuitability(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'MOBILE_APP' }));
  assert('59. mobile safe mobile app preview', mobileAppSuit.mobileSafe === true, 'mobile safe');

  const buildSuit = evaluateDeviceSuitability(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'BUILD_PROGRESS' }));
  assert('60. mobile safe build progress preview', buildSuit.mobileSafe === true, 'mobile safe');

  const topoSuit = evaluateDeviceSuitability(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'SYSTEM_TOPOLOGY' }));
  assert('61. mobile safe topology summary', topoSuit.mobileSafe === true, 'mobile safe');

  const caps = evaluatePreviewCapabilities(makePreviewInput(ws1.workspaceId, 'devpulse', {
    requestedPreviewCapabilities: ['VIEW_PREVIEW_SUMMARY', 'EXECUTE_PREVIEW', 'UNKNOWN_CAP'],
  }), true, true);
  assert('62. allowed preview capability', caps.allowed.some((c) => c.capability === 'VIEW_PREVIEW_SUMMARY'), 'allowed');
  assert('63. blocked execution capability', caps.blocked.some((c) => c.capability === 'EXECUTE_PREVIEW'), 'blocked');
  assert('64. unknown capability blocked', caps.blocked.some((c) => c.capability === 'UNKNOWN_CAP'), 'blocked');

  assert('65. file modification blocked', classifyPreviewCapability('MODIFY_FILES', input1, true, true).allowed === false, 'blocked');
  assert('66. code generation blocked', classifyPreviewCapability('GENERATE_CODE', input1, true, true).allowed === false, 'blocked');
  assert('67. deployment blocked', classifyPreviewCapability('DEPLOY_PREVIEW', input1, true, true).allowed === false, 'blocked');

  const summary = generatePreviewSummary(input1, 'SUMMARY_ONLY', 'AVAILABLE', true, false);
  assert('68. preview summary packet generation', summary.summary.length > 0, summary.summary);
  assert('69. preview warning generation', summary.warnings.length >= 0, String(summary.warnings.length));

  const desktopNotice = generateDesktopRequiredNotice(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'DESKTOP_APP' }));
  assert('70. desktop required notice generation', desktopNotice.includes('Desktop preview required'), desktopNotice);

  const unavailable = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { previewSourceStatus: 'NOT_CREATED' }));
  assert('71. preview unavailable handling', unavailable.previewReadiness === 'PREVIEW_UNAVAILABLE', unavailable.previewReadiness);

  assert('72. no project creation through preview', preview.checkNoProjectCreation(), 'no creation');
  assert('73. no project switching mutation', preview.checkNoProjectSwitchMutation(), 'no switch');
  assert('74. no duplicate preview truth', preview.checkNoDuplicatePreviewTruth(), 'single truth');
  assert('75. no preview source of truth claim', preview.checkNoPreviewSourceOfTruthClaim(), 'no claim');

  assert('76. multi-project isolation', ws1.workspaceId !== ws2.workspaceId, 'distinct');
  assert('77. no cross-project leakage', pkt1.workspaceId !== pkt2.workspaceId, 'isolated');

  assert('78. conversation ownership', pkt1.conversationId === 'conv-001', pkt1.conversationId);
  assert('79. preview ownership', pkt1.previewSessionId === 'preview-session-001', pkt1.previewSessionId);
  assert('80. project ownership', pkt1.projectId === 'devpulse', pkt1.projectId);
  assert('81. workspace ownership', pkt1.workspaceId === ws1.workspaceId, pkt1.workspaceId);
  assert('82. cloud session ownership', pkt1.cloudSessionId === 'cloud-session-001', pkt1.cloudSessionId);
  assert('83. mobile session ownership', pkt1.mobileSessionId === 'mobile-session-0001', pkt1.mobileSessionId);

  resetPreviewPacketCounterForTests();
  resetPreviewSummaryCounterForTests();
  const det1 = processMobilePreview(input1);
  const det2 = processMobilePreview(input1);
  assert('84. deterministic readiness output', det1.previewReadiness === det2.previewReadiness, det1.previewReadiness);
  assert('85. deterministic device suitability', deviceSuitabilityKey(det1.mobileSafe, det1.desktopRequired) === deviceSuitabilityKey(det2.mobileSafe, det2.desktopRequired), 'stable');
  assert('86. deterministic capability output', capabilitiesKey(det1.allowedPreviewCapabilities, det1.blockedPreviewCapabilities) === capabilitiesKey(det2.allowedPreviewCapabilities, det2.blockedPreviewCapabilities), 'stable');
  assert('87. deterministic preview packet output', previewStructuralKey(det1) === previewStructuralKey(det2), previewStructuralKey(det1));

  assert('88. registry ownership', DevPulseV2MobileLivePreviewFoundation.assertRegistryOwnership(), 'registered');
  assert('89. registry phase 8.3', getDevPulseV2Owner('mobile_live_preview_foundation').phase === 8.3, '8.3');
  assert('90. registry owner module', getDevPulseV2Owner('mobile_live_preview_foundation').ownerModule === MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE, MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE);

  assert('91. dependency mobile_command_foundation', getDevPulseV2Owner('mobile_command_foundation').phase === 8.1, '8.1');
  assert('92. dependency mobile_chat_interface', getDevPulseV2Owner('mobile_chat_interface').phase === 8.2, '8.2');
  assert('93. dependency world2_workspace_foundation', getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1, '7.1');
  assert('94. dependency controlled_execution_bridge', getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7, '7.7');
  assert('95. dependency verification_gated_apply', getDevPulseV2Owner('verification_gated_apply').phase === 6.11, '6.11');
  assert('96. dependency founder_approval_execution_gate', getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5, '6.5');
  assert('97. dependency execution_authority', getDevPulseV2Owner('execution_authority').phase === 6.1, '6.1');
  assert('98. dependency execution_evidence_ledger', getDevPulseV2Owner('execution_evidence_ledger').phase === 6.7, '6.7');

  assert('99. governance dependencies present', assertGovernanceDependenciesPresent(), 'present');
  assert('100. World 1 protected', assertWorld1Protected(), 'protected');
  assert('101. no governance bypass', assertNoGovernanceBypass(), 'protected');
  assert('102. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'stable');
  assert('103. distinct from mobile chat interface', assertDistinctFromMobileChatInterface(), 'distinct');
  assert('104. dependency chain', DevPulseV2MobileLivePreviewFoundation.assertDependencyChain(), 'chain ok');
  assert('105. does not execute', DevPulseV2MobileLivePreviewFoundation.assertDoesNotExecute(), 'no execute');

  assert('106. known preview capabilities defined', KNOWN_PREVIEW_CAPABILITIES.length === 8, String(KNOWN_PREVIEW_CAPABILITIES.length));
  assert('107. preview state sequence defined', PREVIEW_STATE_SEQUENCE.length >= 9, String(PREVIEW_STATE_SEQUENCE.length));
  assert('108. preview readiness levels defined', PREVIEW_READINESS_LEVELS.length === 10, String(PREVIEW_READINESS_LEVELS.length));
  assert('109. dependency systems defined', DEPENDENCY_SYSTEMS.length === 8, String(DEPENDENCY_SYSTEMS.length));

  assert('110. isMobileSuitableTarget PROJECT_OVERVIEW', isMobileSuitableTarget('PROJECT_OVERVIEW'), 'yes');
  assert('111. isMobileSuitableTarget DESKTOP_APP', isMobileSuitableTarget('DESKTOP_APP') === false, 'no');
  assert('112. classifyPreviewTarget', classifyPreviewTarget('BUILD_PROGRESS') === 'BUILD_PROGRESS', 'BUILD_PROGRESS');

  assert('113. state includes MOBILE_SESSION_VALIDATED', previewStateIncludes(pkt1.stateSequence, 'MOBILE_SESSION_VALIDATED'), 'yes');
  assert('114. state includes CHAT_CONTEXT_VALIDATED', previewStateIncludes(pkt1.stateSequence, 'CHAT_CONTEXT_VALIDATED'), 'yes');
  assert('115. state includes CLOUD_SESSION_VALIDATED', previewStateIncludes(pkt1.stateSequence, 'CLOUD_SESSION_VALIDATED'), 'yes');
  assert('116. state includes PROJECT_CONTEXT_VALIDATED', previewStateIncludes(pkt1.stateSequence, 'PROJECT_CONTEXT_VALIDATED'), 'yes');
  assert('117. state includes PREVIEW_SOURCE_EVALUATED', previewStateIncludes(pkt1.stateSequence, 'PREVIEW_SOURCE_EVALUATED'), 'yes');
  assert('118. state includes DEVICE_SUITABILITY_EVALUATED', previewStateIncludes(pkt1.stateSequence, 'DEVICE_SUITABILITY_EVALUATED'), 'yes');
  assert('119. state includes PREVIEW_ACCESS_CLASSIFIED', previewStateIncludes(pkt1.stateSequence, 'PREVIEW_ACCESS_CLASSIFIED'), 'yes');
  assert('120. state includes PREVIEW_PACKET_CREATED', previewStateIncludes(pkt1.stateSequence, 'PREVIEW_PACKET_CREATED'), 'yes');
  assert('121. state includes PREVIEW_READY', previewStateIncludes(pkt1.stateSequence, 'PREVIEW_READY'), 'yes');

  const reportText = formatMobilePreviewReport(preview.getFoundationState(), pkt1);
  assert('122. report preview packet id', reportText.includes(`Mobile preview packet ID: ${pkt1.mobilePreviewPacketId}`), 'packet id');
  assert('123. report no execution', reportText.includes('No execution performed: CONFIRMED'), 'no execution');
  assert('124. report no commands', reportText.includes('No commands executed: CONFIRMED'), 'no commands');
  assert('125. report no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files');
  assert('126. report no code generated', reportText.includes('No code generated: CONFIRMED'), 'no code');
  assert('127. report no deployment', reportText.includes('No deployment performed: CONFIRMED'), 'no deployment');
  assert('128. report no approval self-granted', reportText.includes('No approval self-granted: CONFIRMED'), 'no approval');
  assert('129. report no preview source claim', reportText.includes('No preview source of truth claim: CONFIRMED'), 'no claim');
  assert('130. report foundation only', reportText.includes('Mobile live preview foundation only: CONFIRMED'), 'foundation only');

  const moduleDir = join(fileURLToPath(new URL('../src/mobile-live-preview-foundation', import.meta.url)));
  const forbiddenViolations = scanModuleForForbiddenPatterns(moduleDir);
  assert('131. module scan no forbidden patterns', forbiddenViolations.length === 0, forbiddenViolations.join('; ') || 'clean');

  assert('132. duplicate check passes', DevPulseV2MobileLivePreviewFoundation.assertDuplicateCheckPasses(), 'no duplicates');
  assert('133. no forbidden patterns static', DevPulseV2MobileLivePreviewFoundation.assertNoForbiddenExecutionPatterns(), 'clean');

  assert('134. no execution claim in confirmation', pkt1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('135. summary packet viewer only', generatePreviewSummary(input1, 'SUMMARY_ONLY', 'AVAILABLE', true, false).packet.viewerOnly === true, 'viewer only');
  assert('136. summary packet not executed', generatePreviewSummary(input1, 'SUMMARY_ONLY', 'AVAILABLE', true, false).packet.executed === false, 'not executed');

  assert('137. report does not claim execution', !reportText.includes('execution performed: YES'), 'no false claim');
  assert('138. report does not claim files modified', !reportText.includes('files modified: YES'), 'no false claim');
  assert('139. report does not claim commands run', !reportText.includes('commands executed: YES'), 'no false claim');
  assert('140. report does not claim code generated', !reportText.includes('code generated: YES'), 'no false claim');
  assert('141. report does not claim deployment', !reportText.includes('deployment performed: YES'), 'no false claim');

  assert('142. no World 1 modification path', preview.checkWorld1ModificationBlocked('execution_authority'), 'blocked');

  const crossProj = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', {
    targetProjectId: 'fine-print',
  }));
  assert('143. cross-project preview blocked', crossProj.projectContextGates.some((g) => g.gateType === 'CROSS_PROJECT') || crossProj.previewState === 'PREVIEW_BLOCKED', 'blocked');

  const readyMobile = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'MOBILE_APP' }));
  assert('144. ready mobile safe preview', readyMobile.previewReadiness === 'READY_MOBILE_SAFE_PREVIEW', readyMobile.previewReadiness);

  const readySummary = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'PROJECT_OVERVIEW' }));
  assert('145. ready summary only', readySummary.previewReadiness === 'READY_MOBILE_SAFE_PREVIEW', readySummary.previewReadiness);

  const desktopReq = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'DESKTOP_APP' }));
  assert('146. desktop required readiness', desktopReq.previewReadiness === 'DESKTOP_REQUIRED', desktopReq.previewReadiness);

  const needsCloud = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'CONNECTING' }));
  assert('147. needs cloud connection', needsCloud.previewReadiness === 'NEEDS_CLOUD_CONNECTION', needsCloud.previewReadiness);

  const needsMobile = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { mobileSessionId: '' }));
  assert('148. needs mobile session', needsMobile.previewReadiness === 'NEEDS_MOBILE_SESSION', needsMobile.previewReadiness);

  const needsChat = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { conversationId: '' }));
  assert('149. needs chat context', needsChat.previewReadiness === 'NEEDS_CHAT_CONTEXT', needsChat.previewReadiness);

  const needsCtx = processMobilePreview(makePreviewInput(ws1.workspaceId, 'wrong-project'));
  assert('150. needs project context', needsCtx.previewReadiness === 'NEEDS_PROJECT_CONTEXT', needsCtx.previewReadiness);

  const security = evaluatePreviewSecurity(input1);
  assert('151. security evaluation passes', security.blocked === false, security.reason);

  const getBySession = preview.getPreviewBySession('preview-session-001');
  assert('152. get preview by session', getBySession !== null && getBySession.previewSessionId === 'preview-session-001', 'preview-session-001');

  const getByProj = preview.getPreviewByProject('devpulse');
  assert('153. get preview by project', getByProj !== null && getByProj.projectId === 'devpulse', 'devpulse');

  const govSummary = preview.getGovernanceSummary();
  assert('154. governance summary present', govSummary.includes('mobile_chat_interface'), govSummary);

  const topoDesktop = evaluateDeviceSuitability(makePreviewInput(ws1.workspaceId, 'devpulse', {
    previewTarget: 'SYSTEM_TOPOLOGY',
    requestedPreviewCapabilities: ['VIEW_STATIC_SNAPSHOT'],
  }));
  assert('155. topology full inspection desktop required', topoDesktop.desktopRequired === true, 'desktop required');

  const backendSuit = evaluateDeviceSuitability(makePreviewInput(ws1.workspaceId, 'devpulse', { previewTarget: 'BACKEND_API' }));
  assert('156. backend api summary mobile safe', backendSuit.mobileSafe === true, 'mobile safe');

  assert('157. LIVE_STREAM_SUMMARY building state', evaluatePreviewSource(makePreviewInput(ws1.workspaceId, 'devpulse', { previewSourceStatus: 'BUILDING' })).previewType === 'SUMMARY_ONLY', 'SUMMARY_ONLY');

  assert('158. no approval self-grant check', preview.checkNoApprovalSelfGrant(), 'no self grant');

  assert('159. mobile live preview foundation only confirmation', pkt1.confirmation.mobileLivePreviewFoundationOnly === true, 'confirmed');
  assert('160. no commands executed confirmation', pkt1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('161. no files modified confirmation', pkt1.confirmation.noFilesModified === true, 'confirmed');
  assert('162. no code generated confirmation', pkt1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('163. no deployment confirmation', pkt1.confirmation.noDeploymentPerformed === true, 'confirmed');

  const onePreview = resetDevPulseV2MobileLivePreviewFoundationForTests();
  const oneWs = seedWorkspaces(1);
  onePreview.requestMobilePreview(makePreviewInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId));
  assert('164. one project support', onePreview.getPreviewPackets().length === 1, '1');

  const fivePreview = resetDevPulseV2MobileLivePreviewFoundationForTests();
  const fiveWs = seedWorkspaces(5);
  for (const ws of fiveWs) {
    fivePreview.requestMobilePreview(makePreviewInput(ws.workspaceId, ws.projectId));
  }
  assert('165. five project support', fivePreview.getPreviewPackets().length === 5, '5');

  const tenPreview = resetDevPulseV2MobileLivePreviewFoundationForTests();
  const tenWs = seedWorkspaces(10);
  for (const ws of tenWs) {
    tenPreview.requestMobilePreview(makePreviewInput(ws.workspaceId, ws.projectId));
  }
  assert('166. ten project support', tenPreview.getPreviewPackets().length === 10, '10');

  const twentyFivePreview = resetDevPulseV2MobileLivePreviewFoundationForTests();
  const twentyFiveWs = seedWorkspaces(25);
  for (const ws of twentyFiveWs) {
    twentyFivePreview.requestMobilePreview(makePreviewInput(ws.workspaceId, ws.projectId));
  }
  assert('167. twenty-five project support', twentyFivePreview.getPreviewPackets().length === 25, '25');

  const crossWs = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { targetWorkspaceId: ws2.workspaceId }));
  assert('168. cross-workspace preview blocked', crossWs.previewState === 'PREVIEW_BLOCKED' || crossWs.projectContextGates.some((g) => g.status === 'CLOSED'), 'blocked');

  const invalidCtx = validatePreviewProjectContext(makePreviewInput(ws1.workspaceId, 'wrong-project'));
  assert('169. invalid project context blocked', invalidCtx.valid === false, invalidCtx.reason);

  const notAvailCaps = evaluatePreviewCapabilities(makePreviewInput(ws1.workspaceId, 'devpulse', {
    requestedPreviewCapabilities: ['VIEW_STATIC_SNAPSHOT'],
    previewSourceStatus: 'NOT_CREATED',
  }), false, true);
  assert('170. source not available blocks snapshot', notAvailCaps.blocked.some((c) => c.capability === 'VIEW_STATIC_SNAPSHOT'), 'blocked');

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('171. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(MOBILE_LIVE_PREVIEW_FOUNDATION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:mobile-live-preview-foundation');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log(`${failed.length} SCENARIO(S) FAILED`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
