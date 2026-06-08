/**
 * DevPulse V2 Phase 8.1 Mobile Command Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import {
  resetDevPulseV2World2WorkspaceFoundationForTests,
} from '../src/world2-workspace-foundation/index.js';
import {
  assertDistinctFromControlledExecutionBridge,
  assertGovernanceDependenciesPresent,
  assertNoApprovalSelfGrant,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertNoWorld2MutationPath,
  assertWorld1Protected,
  classifyCapability,
  CONNECTION_READINESS_LEVELS,
  DEPENDENCY_SYSTEMS,
  determineConnectionReadiness,
  DevPulseV2MobileCommandFoundation,
  establishMobileSession,
  evaluateCapabilities,
  evaluateSecurity,
  formatMobileCommandReport,
  isCloudConnectionReady,
  isKnownDeviceType,
  isKnownPlatform,
  isProjectRequestCapability,
  isSessionReady,
  KNOWN_CAPABILITIES,
  MOBILE_COMMAND_FOUNDATION_OWNER_MODULE,
  MOBILE_COMMAND_FOUNDATION_PASS_TOKEN,
  READ_ONLY_CAPABILITIES,
  resetDevPulseV2MobileCommandFoundationForTests,
  resetSessionCounterForTests,
  scanModuleForForbiddenPatterns,
  SESSION_STATE_SEQUENCE,
  sessionStateIncludes,
  sessionStructuralKey,
  validateCloudSession,
  validateDevice,
  validateGovernance,
  validateWorkspaceOwnership,
} from '../src/mobile-command-foundation/index.js';
import type { MobileSessionInput } from '../src/mobile-command-foundation/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const CONNECTION_MODES = [
  'LOCAL_NETWORK',
  'CLOUD_RELAY',
  'MANUAL_CODE',
  'QR_PAIRING',
  'UNKNOWN',
] as const;

function makeSessionInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<MobileSessionInput> = {},
): MobileSessionInput {
  return {
    deviceId: 'device-001',
    userId: 'user-001',
    sessionId: 'session-001',
    workspaceId,
    projectId,
    deviceType: 'PHONE',
    deviceName: 'Test Phone',
    platform: 'ANDROID',
    connectionMode: 'CLOUD_RELAY',
    requestedCapabilities: ['VIEW_PROJECT_STATUS', 'SEND_CHAT_INTENT'],
    networkStatus: 'ONLINE',
    authStatus: 'PASS',
    governanceStatus: 'PASS',
    cloudSessionId: 'cloud-session-001',
    cloudWorkspaceId: workspaceId,
    cloudExecutionRegion: 'us-east-1',
    cloudConnectionStatus: 'CONNECTED',
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
  console.log('DevPulse V2 — Phase 8.1 Mobile Command Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();

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

  const mobile = resetDevPulseV2MobileCommandFoundationForTests();
  const input1 = makeSessionInput(ws1.workspaceId, 'devpulse', {
    requestedCapabilities: [
      'VIEW_PROJECT_STATUS',
      'SEND_CHAT_INTENT',
      'START_WORLD2_PROJECT',
      'SEND_PROJECT_VISION',
    ],
  });
  const session1 = mobile.registerMobileSession(input1);
  const session2 = mobile.registerMobileSession(
    makeSessionInput(ws2.workspaceId, 'fine-print', {
      requestedCapabilities: ['VIEW_OPERATOR_FEED', 'VIEW_BUILD_PROGRESS'],
    }),
  );

  assert('1. mobile session generation succeeds', session1.mobileSessionId.startsWith('mobile-session-'), session1.mobileSessionId);
  assert('2. session has deviceId', session1.deviceId === 'device-001', session1.deviceId);
  assert('3. session has userId', session1.userId === 'user-001', session1.userId);
  assert('4. session has workspaceId', session1.workspaceId === ws1.workspaceId, session1.workspaceId);
  assert('5. session has projectId', session1.projectId === 'devpulse', session1.projectId);
  assert('6. session has cloudSessionId', session1.cloudSessionId === 'cloud-session-001', session1.cloudSessionId);
  assert('7. allowed capabilities present', session1.allowedCapabilities.length >= 1, String(session1.allowedCapabilities.length));
  assert('8. governance gates present', session1.governanceGates.length >= 1, String(session1.governanceGates.length));
  assert('9. ownership gates present', session1.ownershipGates.length >= 1, String(session1.ownershipGates.length));
  assert('10. confirmation no execution', session1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('11. confirmation no commands', session1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('12. confirmation no files modified', session1.confirmation.noFilesModified === true, 'confirmed');
  assert('13. confirmation no code generated', session1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('14. confirmation no deployment', session1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('15. confirmation foundation only', session1.confirmation.mobileCommandFoundationOnly === true, 'confirmed');
  assert('16. confirmation no approval self-granted', session1.confirmation.noApprovalSelfGranted === true, 'confirmed');

  const missingDevice = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { deviceId: '' }));
  assert('17. missing device blocked', missingDevice.sessionState === 'SESSION_BLOCKED', missingDevice.sessionState);

  const missingUser = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { userId: '' }));
  assert('18. missing user blocked', missingUser.sessionState === 'SESSION_BLOCKED', missingUser.sessionState);

  const missingSession = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { sessionId: '' }));
  assert('19. missing session blocked', missingSession.sessionState === 'SESSION_BLOCKED', missingSession.sessionState);

  const missingCloud = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { cloudSessionId: '' }));
  assert('20. missing cloud session blocked', missingCloud.sessionState === 'SESSION_BLOCKED', missingCloud.sessionState);

  const deviceVal = validateDevice(makeSessionInput(ws1.workspaceId, 'devpulse'));
  assert('21. device validation passes', deviceVal.valid === true, deviceVal.reason);

  const ownershipVal = validateWorkspaceOwnership(makeSessionInput(ws1.workspaceId, 'devpulse'));
  assert('22. workspace ownership validation passes', ownershipVal.valid === true, ownershipVal.reason);

  const badOwnership = validateWorkspaceOwnership(makeSessionInput(ws1.workspaceId, 'wrong-project'));
  assert('23. project ownership validation fails on mismatch', badOwnership.valid === false, badOwnership.reason);

  const govVal = validateGovernance(makeSessionInput(ws1.workspaceId, 'devpulse'));
  assert('24. governance validation passes', govVal.valid === true, govVal.reason);

  const govFail = validateGovernance(makeSessionInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' }));
  assert('25. governance FAIL blocked', govFail.valid === false, govFail.reason);

  const cloudVal = validateCloudSession(makeSessionInput(ws1.workspaceId, 'devpulse'));
  assert('26. cloud session validation passes', cloudVal.valid === true, cloudVal.reason);

  const cloudDisconnected = validateCloudSession(
    makeSessionInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'DISCONNECTED' }),
  );
  assert('27. cloud disconnected blocked', cloudDisconnected.valid === false, cloudDisconnected.reason);

  const caps = evaluateCapabilities(makeSessionInput(ws1.workspaceId, 'devpulse', {
    requestedCapabilities: ['VIEW_PROJECT_STATUS', 'EXECUTE_COMMAND', 'UNKNOWN_CAP'],
  }), 'PASS');
  assert('28. allowed capability classification', caps.allowed.some((c) => c.capability === 'VIEW_PROJECT_STATUS'), 'VIEW_PROJECT_STATUS');
  assert('29. blocked execution capability', caps.blocked.some((c) => c.capability === 'EXECUTE_COMMAND'), 'EXECUTE_COMMAND');
  assert('30. unknown capability blocked', caps.blocked.some((c) => c.capability === 'UNKNOWN_CAP'), 'UNKNOWN_CAP');

  const fileMod = classifyCapability('MODIFY_FILES', makeSessionInput(ws1.workspaceId, 'devpulse'), true);
  assert('31. file modification capability blocked', fileMod.allowed === false, fileMod.blockReason);

  const codeGen = classifyCapability('GENERATE_CODE', makeSessionInput(ws1.workspaceId, 'devpulse'), true);
  assert('32. code generation capability blocked', codeGen.allowed === false, codeGen.blockReason);

  const deploy = classifyCapability('DEPLOY_PROJECT', makeSessionInput(ws1.workspaceId, 'devpulse'), true);
  assert('33. deployment capability blocked', deploy.allowed === false, deploy.blockReason);

  const authFail = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { authStatus: 'FAIL' }));
  assert('34. needs auth readiness', authFail.connectionReadiness === 'NEEDS_AUTH', authFail.connectionReadiness);

  const ownFail = establishMobileSession(makeSessionInput(ws1.workspaceId, 'wrong-project'));
  assert('35. needs ownership readiness', ownFail.connectionReadiness === 'NEEDS_OWNERSHIP', ownFail.connectionReadiness);

  const govPending = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'PENDING' }));
  assert('36. needs governance readiness', govPending.connectionReadiness === 'NEEDS_GOVERNANCE', govPending.connectionReadiness);

  const cloudNeed = establishMobileSession(
    makeSessionInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'CONNECTING' }),
  );
  assert('37. needs cloud readiness', cloudNeed.connectionReadiness === 'NEEDS_CLOUD_CONNECTION', cloudNeed.connectionReadiness);

  const readOnly = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', {
    requestedCapabilities: ['VIEW_PROJECT_STATUS', 'VIEW_OPERATOR_FEED'],
  }));
  assert('38. read-only readiness', readOnly.connectionReadiness === 'READY_READ_ONLY', readOnly.connectionReadiness);

  const commandIntent = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', {
    requestedCapabilities: ['SEND_CHAT_INTENT', 'SEND_PROJECT_VISION'],
  }));
  assert('39. command-intent-only readiness', commandIntent.connectionReadiness === 'READY_COMMAND_INTENT_ONLY', commandIntent.connectionReadiness);

  const w1Project = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', {
    requestedCapabilities: ['START_WORLD1_PROJECT', 'CREATE_PROJECT_REQUEST'],
  }));
  assert('40. World 1 project request allowed as intent', w1Project.allowedCapabilities.some((c) => c.capability === 'START_WORLD1_PROJECT'), 'START_WORLD1_PROJECT');
  assert('41. project request creation allowed', w1Project.allowedCapabilities.some((c) => c.capability === 'CREATE_PROJECT_REQUEST'), 'CREATE_PROJECT_REQUEST');

  const w2Project = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', {
    requestedCapabilities: ['START_WORLD2_PROJECT'],
  }));
  assert('42. World 2 project request allowed as intent', w2Project.allowedCapabilities.some((c) => c.capability === 'START_WORLD2_PROJECT'), 'START_WORLD2_PROJECT');

  const vision = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', {
    requestedCapabilities: ['SEND_PROJECT_VISION'],
  }));
  assert('43. project vision submission allowed', vision.allowedCapabilities.some((c) => c.capability === 'SEND_PROJECT_VISION'), 'SEND_PROJECT_VISION');

  const android = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { platform: 'ANDROID' }));
  assert('44. Android support', android.sessionState !== 'SESSION_REVOKED', android.sessionState);

  const ios = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { platform: 'IOS' }));
  assert('45. iOS support', ios.sessionState !== 'SESSION_REVOKED', ios.sessionState);

  const web = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { platform: 'WEB', deviceType: 'DESKTOP_BROWSER' }));
  assert('46. Web support', web.sessionState !== 'SESSION_REVOKED', web.sessionState);

  const windows = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { platform: 'WINDOWS' }));
  assert('47. Windows support', windows.sessionState !== 'SESSION_REVOKED', windows.sessionState);

  const macos = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { platform: 'MACOS' }));
  assert('48. macOS support', macos.sessionState !== 'SESSION_REVOKED', macos.sessionState);

  const unknownDevice = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', {
    deviceType: 'UNKNOWN',
    platform: 'UNKNOWN',
  }));
  assert('49. unknown device handling', unknownDevice.securityWarnings.length >= 1, String(unknownDevice.securityWarnings.length));

  for (const mode of CONNECTION_MODES) {
    const modeSession = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { connectionMode: mode }));
    assert(`50.${CONNECTION_MODES.indexOf(mode)}. ${mode} connection mode`, modeSession.mobileSessionId.length > 0, mode);
  }

  assert('55. multi-project isolation distinct workspaces', ws1.workspaceId !== ws2.workspaceId, 'distinct');
  assert('56. no cross-project session leakage', session1.workspaceId !== session2.workspaceId, 'isolated');

  const oneProject = resetDevPulseV2MobileCommandFoundationForTests();
  const oneWs = seedWorkspaces(1);
  oneProject.registerMobileSession(makeSessionInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId));
  assert('57. one project support', oneProject.getSessions().length === 1, '1');

  const fiveMobile = resetDevPulseV2MobileCommandFoundationForTests();
  const fiveWs = seedWorkspaces(5);
  for (const ws of fiveWs) {
    fiveMobile.registerMobileSession(makeSessionInput(ws.workspaceId, ws.projectId));
  }
  assert('58. five project support', fiveMobile.getSessions().length === 5, '5');

  const tenMobile = resetDevPulseV2MobileCommandFoundationForTests();
  const tenWs = seedWorkspaces(10);
  for (const ws of tenWs) {
    tenMobile.registerMobileSession(makeSessionInput(ws.workspaceId, ws.projectId));
  }
  assert('59. ten project support', tenMobile.getSessions().length === 10, '10');

  const twentyFiveMobile = resetDevPulseV2MobileCommandFoundationForTests();
  const twentyFiveWs = seedWorkspaces(25);
  for (const ws of twentyFiveWs) {
    twentyFiveMobile.registerMobileSession(makeSessionInput(ws.workspaceId, ws.projectId));
  }
  assert('60. twenty-five project support', twentyFiveMobile.getSessions().length === 25, '25');

  assert('61. no World 1 modification path', mobile.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('62. no World 2 mutation path', mobile.checkNoWorld2Mutation(['MODIFY_WORLD2']) === false, 'blocked');
  assert('63. no governance bypass', assertNoGovernanceBypass(), 'protected');
  assert('64. no approval self-granting', mobile.checkNoApprovalSelfGrant(makeSessionInput(ws1.workspaceId, 'devpulse')), 'no self grant');
  assert('65. no duplicate project truth', mobile.checkNoDuplicateProjectTruth(), 'single truth');

  const det1 = establishMobileSession(input1);
  const det2 = establishMobileSession(input1);
  assert('66. deterministic capability output', det1.allowedCapabilities.length === det2.allowedCapabilities.length, 'same count');
  assert('67. deterministic readiness output', det1.connectionReadiness === det2.connectionReadiness, det1.connectionReadiness);

  resetSessionCounterForTests();
  const struct1 = sessionStructuralKey(establishMobileSession(input1));
  const struct2 = sessionStructuralKey(establishMobileSession(input1));
  assert('68. deterministic session structural key', struct1 === struct2, struct1);

  assert('69. registry ownership', DevPulseV2MobileCommandFoundation.assertRegistryOwnership(), 'registered');
  assert('70. registry phase 8.1', getDevPulseV2Owner('mobile_command_foundation').phase === 8.1, '8.1');
  assert('71. registry owner module', getDevPulseV2Owner('mobile_command_foundation').ownerModule === MOBILE_COMMAND_FOUNDATION_OWNER_MODULE, MOBILE_COMMAND_FOUNDATION_OWNER_MODULE);

  assert('72. dependency integrity world2_workspace_foundation', getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1, '7.1');
  assert('73. dependency integrity controlled_execution_bridge', getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7, '7.7');
  assert('74. dependency integrity verification_gated_apply', getDevPulseV2Owner('verification_gated_apply').phase === 6.11, '6.11');
  assert('75. dependency integrity founder_approval_execution_gate', getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5, '6.5');
  assert('76. dependency integrity execution_authority', getDevPulseV2Owner('execution_authority').phase === 6.1, '6.1');
  assert('77. dependency integrity execution_evidence_ledger', getDevPulseV2Owner('execution_evidence_ledger').phase === 6.7, '6.7');

  assert('78. governance dependencies present', assertGovernanceDependenciesPresent(), 'present');
  assert('79. World 1 protected', assertWorld1Protected(), 'protected');
  assert('80. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'stable');
  assert('81. distinct from controlled execution bridge', assertDistinctFromControlledExecutionBridge(), 'distinct');
  assert('82. dependency chain', DevPulseV2MobileCommandFoundation.assertDependencyChain(), 'chain ok');
  assert('83. does not execute', DevPulseV2MobileCommandFoundation.assertDoesNotExecute(), 'no execute methods');

  assert('84. known capabilities defined', KNOWN_CAPABILITIES.length === 13, String(KNOWN_CAPABILITIES.length));
  assert('85. read-only capabilities defined', READ_ONLY_CAPABILITIES.length >= 7, String(READ_ONLY_CAPABILITIES.length));
  assert('86. session state sequence defined', SESSION_STATE_SEQUENCE.length >= 7, String(SESSION_STATE_SEQUENCE.length));
  assert('87. connection readiness levels defined', CONNECTION_READINESS_LEVELS.length === 7, String(CONNECTION_READINESS_LEVELS.length));
  assert('88. dependency systems defined', DEPENDENCY_SYSTEMS.length === 6, String(DEPENDENCY_SYSTEMS.length));

  assert('89. isKnownDeviceType PHONE', isKnownDeviceType('PHONE'), 'PHONE');
  assert('90. isKnownPlatform ANDROID', isKnownPlatform('ANDROID'), 'ANDROID');
  assert('91. isCloudConnectionReady CONNECTED', isCloudConnectionReady('CONNECTED'), 'CONNECTED');
  assert('92. isCloudConnectionReady DEGRADED', isCloudConnectionReady('DEGRADED'), 'DEGRADED');
  assert('93. isSessionReady command intent', isSessionReady('READY_COMMAND_INTENT_ONLY'), 'ready');
  assert('94. isSessionReady read only', isSessionReady('READY_READ_ONLY'), 'ready');
  assert('95. isProjectRequestCapability START_WORLD1', isProjectRequestCapability('START_WORLD1_PROJECT'), 'yes');

  const crossTarget = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', {
    targetWorkspaceId: ws2.workspaceId,
    requestedCapabilities: ['VIEW_PROJECT_STATUS'],
  }));
  assert('96. cross-workspace capability blocked', crossTarget.sessionState === 'SESSION_BLOCKED' || crossTarget.blockedCapabilities.length > 0, 'blocked');

  const crossProject = classifyCapability(
    'VIEW_PROJECT_STATUS',
    makeSessionInput(ws1.workspaceId, 'devpulse', { targetProjectId: 'other-project' }),
    true,
  );
  assert('97. cross-project capability blocked', crossProject.allowed === false, crossProject.blockReason);

  const approvalPending = classifyCapability(
    'REQUEST_APPROVAL_DECISION',
    makeSessionInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'PENDING' }),
    false,
  );
  assert('98. approval capability blocked when governance pending', approvalPending.allowed === false, approvalPending.blockReason);

  const security = evaluateSecurity(makeSessionInput(ws1.workspaceId, 'devpulse'));
  assert('99. security evaluation passes', security.blocked === false, security.reason);

  const securityW1 = evaluateSecurity(makeSessionInput(ws1.workspaceId, 'devpulse', {
    cloudExecutionRegion: 'world1/governance',
  }));
  assert('100. World 1 path in cloud region blocked', securityW1.blocked === true, securityW1.reason);

  assert('101. session state includes DEVICE_VALIDATED', sessionStateIncludes(session1.stateSequence, 'DEVICE_VALIDATED'), 'yes');
  assert('102. session state includes OWNERSHIP_VALIDATED', sessionStateIncludes(session1.stateSequence, 'OWNERSHIP_VALIDATED'), 'yes');
  assert('103. session state includes GOVERNANCE_VALIDATED', sessionStateIncludes(session1.stateSequence, 'GOVERNANCE_VALIDATED'), 'yes');
  assert('104. session state includes CLOUD_SESSION_VALIDATED', sessionStateIncludes(session1.stateSequence, 'CLOUD_SESSION_VALIDATED'), 'yes');
  assert('105. session state includes CAPABILITIES_EVALUATED', sessionStateIncludes(session1.stateSequence, 'CAPABILITIES_EVALUATED'), 'yes');

  const reportText = formatMobileCommandReport(mobile.getFoundationState(), session1);
  assert('106. report mobile session id', reportText.includes(`Mobile session ID: ${session1.mobileSessionId}`), 'mobile id');
  assert('107. report allowed count', reportText.includes(`Allowed capability count: ${session1.allowedCapabilities.length}`), 'allowed count');
  assert('108. report no execution', reportText.includes('No execution performed: CONFIRMED'), 'no execution');
  assert('109. report no commands', reportText.includes('No commands executed: CONFIRMED'), 'no commands');
  assert('110. report no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files');
  assert('111. report no code generated', reportText.includes('No code generated: CONFIRMED'), 'no code');
  assert('112. report no deployment', reportText.includes('No deployment performed: CONFIRMED'), 'no deployment');
  assert('113. report no approval self-granted', reportText.includes('No approval self-granted: CONFIRMED'), 'no approval');
  assert('114. report foundation only', reportText.includes('Mobile command foundation only: CONFIRMED'), 'foundation only');

  const moduleDir = join(fileURLToPath(new URL('../src/mobile-command-foundation', import.meta.url)));
  const forbiddenViolations = scanModuleForForbiddenPatterns(moduleDir);
  assert('115. module scan no forbidden patterns', forbiddenViolations.length === 0, forbiddenViolations.join('; ') || 'clean');

  assert('116. duplicate check passes', DevPulseV2MobileCommandFoundation.assertDuplicateCheckPasses(), 'no duplicates');
  assert('117. no forbidden patterns static', DevPulseV2MobileCommandFoundation.assertNoForbiddenExecutionPatterns(), 'clean');

  assert('118. no execution claim in confirmation', session1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('119. no file modification claim', session1.confirmation.noFilesModified === true, 'confirmed');
  assert('120. no code generation claim', session1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('121. no deployment claim', session1.confirmation.noDeploymentPerformed === true, 'confirmed');

  assert('122. report does not claim execution', !reportText.includes('execution performed: YES'), 'no false claim');
  assert('123. report does not claim files modified', !reportText.includes('files modified: YES'), 'no false claim');
  assert('124. report does not claim commands run', !reportText.includes('commands executed: YES'), 'no false claim');
  assert('125. report does not claim code generated', !reportText.includes('code generated: YES'), 'no false claim');
  assert('126. report does not claim deployment', !reportText.includes('deployment performed: YES'), 'no false claim');

  const tablet = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { deviceType: 'TABLET' }));
  assert('127. tablet device support', tablet.sessionState !== 'SESSION_REVOKED', tablet.sessionState);

  const localNet = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { connectionMode: 'LOCAL_NETWORK' }));
  assert('128. local network mode session', localNet.connectionReadiness !== 'NOT_READY' || localNet.sessionState === 'SESSION_BLOCKED', localNet.connectionReadiness);

  const manualCode = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { connectionMode: 'MANUAL_CODE' }));
  assert('129. manual code mode session', manualCode.mobileSessionId.length > 0, manualCode.mobileSessionId);

  const qrPairing = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { connectionMode: 'QR_PAIRING' }));
  assert('130. QR pairing mode session', qrPairing.recommendations.some((r) => r.includes('QR')), 'QR recommendation');

  const degradedCloud = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', {
    cloudConnectionStatus: 'DEGRADED',
  }));
  assert('131. degraded cloud still validates', degradedCloud.cloudSessionReadiness === true, 'degraded ok');

  const offline = establishMobileSession(makeSessionInput(ws1.workspaceId, 'devpulse', { networkStatus: 'OFFLINE' }));
  assert('132. offline network warning', offline.securityWarnings.some((w) => w.includes('offline')), 'offline warning');

  const selfGrant = assertNoApprovalSelfGrant(makeSessionInput(ws1.workspaceId, 'devpulse', {
    requestedCapabilities: ['GRANT_APPROVAL'],
  }));
  assert('133. GRANT_APPROVAL self-grant blocked check', selfGrant === false, 'blocked');

  const w2Mut = assertNoWorld2MutationPath(['EXECUTE_BUILDER', 'MUTATE_WORKSPACE']);
  assert('134. World 2 mutation capabilities path blocked', w2Mut === false, 'blocked');

  const readinessCtx = {
    deviceValid: true,
    ownershipValid: true,
    governanceValid: true,
    cloudValid: true,
    authPassed: true,
    allowedCapabilities: [{ capability: 'VIEW_PROJECT_STATUS', allowed: true, blockReason: '', intentOnly: false }],
  };
  assert('135. determineConnectionReadiness read-only', determineConnectionReadiness(readinessCtx) === 'READY_READ_ONLY', 'read only');

  const intentCtx = {
    ...readinessCtx,
    allowedCapabilities: [{ capability: 'SEND_CHAT_INTENT', allowed: true, blockReason: '', intentOnly: true }],
  };
  assert('136. determineConnectionReadiness command intent', determineConnectionReadiness(intentCtx) === 'READY_COMMAND_INTENT_ONLY', 'intent');

  const getByWs = mobile.getSessionByWorkspace(ws1.workspaceId);
  assert('137. get session by workspace', getByWs !== null && getByWs.workspaceId === ws1.workspaceId, ws1.workspaceId);

  const getByProj = mobile.getSessionByProject('devpulse');
  assert('138. get session by project', getByProj !== null && getByProj.projectId === 'devpulse', 'devpulse');

  const cloudWsMismatch = validateCloudSession(makeSessionInput(ws1.workspaceId, 'devpulse', {
    cloudWorkspaceId: ws2.workspaceId,
  }));
  assert('139. cloud workspace mismatch blocked', cloudWsMismatch.valid === false, cloudWsMismatch.reason);

  const missingWs = validateWorkspaceOwnership(makeSessionInput('', 'devpulse'));
  assert('140. missing workspace blocked', missingWs.valid === false, missingWs.reason);

  const missingProj = validateWorkspaceOwnership(makeSessionInput(ws1.workspaceId, ''));
  assert('141. missing project blocked', missingProj.valid === false, missingProj.reason);

  const govSummary = mobile.getGovernanceSummary();
  assert('142. governance summary present', govSummary.includes('world2_workspace_foundation'), govSummary);

  const crossAccess = mobile.checkCrossWorkspaceSessionAccess(ws1.workspaceId, ws2.workspaceId);
  assert('143. cross-workspace session access denied', crossAccess === false, 'denied');

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('144. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(MOBILE_COMMAND_FOUNDATION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:mobile-command-foundation');
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
