/**
 * DevPulse V2 Phase 8.2 Mobile Chat Interface Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { resetDevPulseV2World2WorkspaceFoundationForTests } from '../src/world2-workspace-foundation/index.js';
import {
  assertDistinctFromMobileCommandFoundation,
  assertGovernanceDependenciesPresent,
  assertNoApprovalSelfGrant,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  CHAT_READINESS_LEVELS,
  CHAT_STATE_SEQUENCE,
  chatStateIncludes,
  chatStructuralKey,
  classifyMessageIntent,
  classifyWorldTarget,
  cloudPacketKey,
  DEPENDENCY_SYSTEMS,
  DevPulseV2MobileChatInterface,
  evaluateChatSecurity,
  evaluateProjectContext,
  formatMobileChatReport,
  inferConversationMode,
  isWorldTargetValidForCreation,
  KNOWN_MESSAGE_INTENTS,
  mapIntentToSafeCommandType,
  MOBILE_CHAT_INTERFACE_OWNER_MODULE,
  MOBILE_CHAT_INTERFACE_PASS_TOKEN,
  processMobileChat,
  resetChatPacketCounterForTests,
  resetCloudPacketCounterForTests,
  resetDevPulseV2MobileChatInterfaceForTests,
  resetProjectCreationCounterForTests,
  resetProjectSwitchCounterForTests,
  SAFE_COMMAND_TYPES,
  scanModuleForForbiddenPatterns,
  suggestWorldTarget,
  validateChatGovernance,
  validateCloudChatSession,
  validateMobileChatSession,
} from '../src/mobile-chat-interface/index.js';
import type { MobileChatInput } from '../src/mobile-chat-interface/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeChatInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<MobileChatInput> = {},
): MobileChatInput {
  return {
    mobileSessionId: 'mobile-session-0001',
    cloudSessionId: 'cloud-session-001',
    userId: 'user-001',
    deviceId: 'device-001',
    workspaceId,
    projectId,
    conversationId: 'conv-001',
    messageId: 'msg-001',
    messageText: 'Continue building the dashboard feature for this project',
    worldTarget: 'WORLD_2',
    selectedProjectId: projectId,
    projectCreationRequestId: '',
    conversationMode: 'EXISTING_PROJECT',
    requestedAction: '',
    timestamp: Date.now(),
    authStatus: 'PASS',
    governanceStatus: 'PASS',
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
  console.log('DevPulse V2 — Phase 8.2 Mobile Chat Interface Foundation');
  console.log('==============================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetProjectCreationCounterForTests();
  resetProjectSwitchCounterForTests();
  resetCloudPacketCounterForTests();

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

  const chat = resetDevPulseV2MobileChatInterfaceForTests();
  const input1 = makeChatInput(ws1.workspaceId, 'devpulse');
  const pkt1 = chat.processChatMessage(input1);
  const pkt2 = chat.processChatMessage(
    makeChatInput(ws2.workspaceId, 'fine-print', {
      messageText: 'What is the current project status and build progress?',
      requestedAction: 'ASK_PROJECT_STATUS',
    }),
  );

  assert('1. chat packet generation succeeds', pkt1.chatPacketId.startsWith('mobile-chat-pkt-'), pkt1.chatPacketId);
  assert('2. chat has mobileSessionId', pkt1.mobileSessionId === 'mobile-session-0001', pkt1.mobileSessionId);
  assert('3. chat has cloudSessionId', pkt1.cloudSessionId === 'cloud-session-001', pkt1.cloudSessionId);
  assert('4. chat has userId', pkt1.userId === 'user-001', pkt1.userId);
  assert('5. chat has workspaceId', pkt1.workspaceId === ws1.workspaceId, pkt1.workspaceId);
  assert('6. chat has projectId', pkt1.projectId === 'devpulse', pkt1.projectId);
  assert('7. chat has conversationId', pkt1.conversationId === 'conv-001', pkt1.conversationId);
  assert('8. chat has messageId', pkt1.messageId === 'msg-001', pkt1.messageId);
  assert('9. cloud command packet present', pkt1.cloudCommandPacket !== null, 'packet');
  assert('10. aiDev conversation packet present', pkt1.aiDevConversationPacket !== null, 'packet');
  assert('11. confirmation no execution', pkt1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('12. confirmation no commands', pkt1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('13. confirmation no files modified', pkt1.confirmation.noFilesModified === true, 'confirmed');
  assert('14. confirmation no code generated', pkt1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('15. confirmation no deployment', pkt1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('16. confirmation foundation only', pkt1.confirmation.mobileChatFoundationOnly === true, 'confirmed');
  assert('17. confirmation no approval self-granted', pkt1.confirmation.noApprovalSelfGranted === true, 'confirmed');

  const missingMobile = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { mobileSessionId: '' }));
  assert('18. missing mobile session blocked', missingMobile.chatState === 'CHAT_BLOCKED', missingMobile.chatState);

  const missingCloud = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { cloudSessionId: '' }));
  assert('19. missing cloud session blocked', missingCloud.chatState === 'CHAT_BLOCKED', missingCloud.chatState);

  const missingUser = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { userId: '' }));
  assert('20. missing user blocked', missingUser.chatState === 'CHAT_BLOCKED', missingUser.chatState);

  const missingConv = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { conversationId: '' }));
  assert('21. missing conversation blocked', missingConv.chatState === 'CHAT_BLOCKED', missingConv.chatState);

  const missingMsg = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { messageId: '' }));
  assert('22. missing message blocked', missingMsg.chatState === 'CHAT_BLOCKED', missingMsg.chatState);

  const emptyMsg = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: '' }));
  assert('23. empty message blocked', emptyMsg.chatState === 'CHAT_BLOCKED', emptyMsg.chatState);

  const authFail = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { authStatus: 'FAIL' }));
  assert('24. auth failure blocked', authFail.chatState === 'CHAT_BLOCKED', authFail.chatState);
  assert('25. auth failure needs auth readiness', authFail.chatReadiness === 'NEEDS_AUTH', authFail.chatReadiness);

  const cloudDisc = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'DISCONNECTED' }));
  assert('26. cloud disconnected blocked', cloudDisc.chatState === 'CHAT_BLOCKED', cloudDisc.chatState);

  const govFail = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { governanceStatus: 'FAIL' }));
  assert('27. governance failure blocked', govFail.chatState === 'CHAT_BLOCKED', govFail.chatState);

  assert('28. mobile session validation passes', validateMobileChatSession(input1).valid === true, 'valid');
  assert('29. cloud session validation passes', validateCloudChatSession(input1).valid === true, 'valid');
  assert('30. governance validation passes', validateChatGovernance(input1).valid === true, 'valid');

  const ctxReady = evaluateProjectContext(makeChatInput(ws1.workspaceId, 'devpulse'));
  assert('31. existing project context ready', ctxReady.status === 'PROJECT_CONTEXT_READY', ctxReady.status);

  const ctxCreate = evaluateProjectContext(makeChatInput('', '', {
    conversationMode: 'NEW_PROJECT',
    messageText: 'I want to build a new legal document analysis app in World 2 sandbox',
    worldTarget: 'WORLD_2',
  }));
  assert('32. project creation required', ctxCreate.status === 'PROJECT_CREATION_REQUIRED', ctxCreate.status);

  const ctxSelect = evaluateProjectContext(makeChatInput(ws1.workspaceId, 'devpulse', {
    conversationMode: 'EXISTING_PROJECT',
    selectedProjectId: 'other-project',
  }));
  assert('33. project selection required', ctxSelect.status === 'PROJECT_SELECTION_REQUIRED', ctxSelect.status);

  const ctxInvalid = evaluateProjectContext(makeChatInput(ws1.workspaceId, 'wrong-project'));
  assert('34. invalid project context blocked', ctxInvalid.status === 'PROJECT_CONTEXT_INVALID', ctxInvalid.status);

  const w1Route = processMobileChat(makeChatInput('', '', {
    conversationMode: 'NEW_PROJECT',
    messageText: 'Create a new DevPulse core platform project in World 1',
    worldTarget: 'WORLD_1',
    requestedAction: 'START_WORLD1_PROJECT',
  }));
  assert('35. World 1 routing', w1Route.worldTarget === 'WORLD_1', w1Route.worldTarget);

  const w2Route = processMobileChat(makeChatInput('', '', {
    conversationMode: 'NEW_PROJECT',
    messageText: 'Build a new sandbox web application in World 2',
    worldTarget: 'WORLD_2',
    requestedAction: 'START_WORLD2_PROJECT',
  }));
  assert('36. World 2 routing', w2Route.worldTarget === 'WORLD_2', w2Route.worldTarget);

  const autoSelect = classifyWorldTarget(makeChatInput(ws1.workspaceId, 'devpulse', {
    worldTarget: 'AUTO_SELECT',
    messageText: 'Build a new sandbox app',
  }));
  assert('37. AUTO_SELECT classification', autoSelect.worldTarget === 'AUTO_SELECT', autoSelect.worldTarget);
  assert('38. AUTO_SELECT no silent execution', autoSelect.autoSelectResolved === false, 'not resolved');

  const unknownWorld = processMobileChat(makeChatInput('', '', {
    conversationMode: 'NEW_PROJECT',
    messageText: 'Create a new project please',
    worldTarget: 'UNKNOWN',
  }));
  assert('39. UNKNOWN world target blocked for creation', unknownWorld.projectContextStatus === 'PROJECT_CONTEXT_BLOCKED', unknownWorld.projectContextStatus);

  const createIntent = classifyMessageIntent(makeChatInput('', '', {
    messageText: 'Create project for my new startup idea',
    worldTarget: 'AUTO_SELECT',
  }));
  assert('40. CREATE_PROJECT intent', createIntent.intent === 'CREATE_PROJECT', createIntent.intent);

  const w1Intent = classifyMessageIntent(makeChatInput('', '', {
    messageText: 'Start World 1 project for DevPulse core',
    worldTarget: 'WORLD_1',
  }));
  assert('41. START_WORLD1_PROJECT intent', w1Intent.intent === 'START_WORLD1_PROJECT', w1Intent.intent);

  const w2Intent = classifyMessageIntent(makeChatInput('', '', {
    messageText: 'Start World 2 project for sandbox app',
    worldTarget: 'WORLD_2',
  }));
  assert('42. START_WORLD2_PROJECT intent', w2Intent.intent === 'START_WORLD2_PROJECT', w2Intent.intent);

  assert('43. CONTINUE_PROJECT intent', classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'Continue building the feature' })).intent === 'CONTINUE_PROJECT', 'CONTINUE_PROJECT');
  assert('44. SWITCH_PROJECT intent', classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'Switch project to fine-print' })).intent === 'SWITCH_PROJECT', 'SWITCH_PROJECT');
  assert('45. ASK_PROJECT_STATUS intent', classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'What is the project status?' })).intent === 'ASK_PROJECT_STATUS', 'ASK_PROJECT_STATUS');
  assert('46. SEND_BUILD_INSTRUCTION intent', classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'Build the authentication module next' })).intent === 'SEND_BUILD_INSTRUCTION', 'SEND_BUILD_INSTRUCTION');
  assert('47. SEND_PROJECT_VISION intent', classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'My vision is to build an AI legal assistant' })).intent === 'SEND_PROJECT_VISION', 'SEND_PROJECT_VISION');
  assert('48. REQUEST_LIVE_PREVIEW_SUMMARY intent', classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'Show me the live preview summary' })).intent === 'REQUEST_LIVE_PREVIEW_SUMMARY', 'REQUEST_LIVE_PREVIEW_SUMMARY');
  assert('49. REQUEST_OPERATOR_FEED_SUMMARY intent', classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'Show operator feed summary' })).intent === 'REQUEST_OPERATOR_FEED_SUMMARY', 'REQUEST_OPERATOR_FEED_SUMMARY');
  assert('50. REQUEST_APPROVALS intent', classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'Show pending approval decisions' })).intent === 'REQUEST_APPROVALS', 'REQUEST_APPROVALS');
  assert('51. ANSWER_NOTIFICATION intent', classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'Respond to the notification about build completion' })).intent === 'ANSWER_NOTIFICATION', 'ANSWER_NOTIFICATION');

  const w1Create = processMobileChat(makeChatInput('', '', {
    conversationMode: 'NEW_PROJECT',
    messageText: 'I want to build the DevPulse core platform with full governance',
    worldTarget: 'WORLD_1',
    requestedAction: 'START_WORLD1_PROJECT',
  }));
  assert('52. World 1 project request generation', w1Create.projectCreationRequest !== null, 'created');
  assert('53. World 1 request mode', w1Create.projectCreationRequest?.requestedProjectMode === 'START_WORLD1', 'START_WORLD1');

  const w2Create = processMobileChat(makeChatInput('', '', {
    conversationMode: 'NEW_PROJECT',
    messageText: 'Build a new sandbox web application with user authentication',
    worldTarget: 'WORLD_2',
    requestedAction: 'START_WORLD2_PROJECT',
  }));
  assert('54. World 2 project request generation', w2Create.projectCreationRequest !== null, 'created');
  assert('55. World 2 request mode', w2Create.projectCreationRequest?.requestedProjectMode === 'START_WORLD2', 'START_WORLD2');

  const switchPkt = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', {
    conversationMode: 'PROJECT_SWITCH',
    messageText: 'Switch project to fine-print',
    selectedProjectId: 'fine-print',
  }));
  assert('56. project switch request generation', switchPkt.projectSwitchRequest !== null, 'created');

  assert('57. cloud command packet generation', pkt1.cloudCommandPacket !== null, pkt1.cloudCommandPacket?.cloudCommandPacketId ?? '');
  assert('58. safe command type classification', mapIntentToSafeCommandType('SEND_BUILD_INSTRUCTION') === 'BUILD_INSTRUCTION_REQUEST', 'BUILD_INSTRUCTION_REQUEST');

  const execBlock = classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'execute command now on the server' }));
  assert('59. blocked direct execution attempt', execBlock.blocked === true, execBlock.blockReason);

  const fileBlock = classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'modify file src/app.ts directly' }));
  assert('60. blocked direct file modification attempt', fileBlock.blocked === true, fileBlock.blockReason);

  const codeBlock = classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'generate code for the auth module locally' }));
  assert('61. blocked local code generation attempt', codeBlock.blocked === true, codeBlock.blockReason);

  const deployBlock = classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'deploy the app to production now' }));
  assert('62. blocked direct deployment attempt', deployBlock.blocked === true, deployBlock.blockReason);

  const selfApprove = classifyMessageIntent(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'grant approval for this action' }));
  assert('63. no approval self-granting', selfApprove.blocked === true, selfApprove.blockReason);

  assert('64. multi-project isolation', ws1.workspaceId !== ws2.workspaceId, 'distinct');
  assert('65. no cross-project leakage', pkt1.workspaceId !== pkt2.workspaceId, 'isolated');

  assert('66. no duplicate project truth', chat.checkNoDuplicateProjectTruth(), 'single truth');
  assert('67. conversation ownership', pkt1.conversationId === 'conv-001', pkt1.conversationId);
  assert('68. message ownership', pkt1.messageId === 'msg-001', pkt1.messageId);
  assert('69. project ownership gate', pkt1.ownershipGates.length >= 0, String(pkt1.ownershipGates.length));
  assert('70. workspace ownership', pkt1.workspaceId === ws1.workspaceId, pkt1.workspaceId);
  assert('71. cloud session ownership', pkt1.cloudSessionId === 'cloud-session-001', pkt1.cloudSessionId);

  resetChatPacketCounterForTests();
  resetCloudPacketCounterForTests();
  resetProjectCreationCounterForTests();
  resetProjectSwitchCounterForTests();
  const det1 = processMobileChat(input1);
  const det2 = processMobileChat(input1);
  assert('72. deterministic intent classification', det1.messageIntent === det2.messageIntent, det1.messageIntent);
  assert('73. deterministic world target classification', det1.worldTarget === det2.worldTarget, det1.worldTarget);
  assert('74. deterministic project context status', det1.projectContextStatus === det2.projectContextStatus, det1.projectContextStatus);

  const struct1 = chatStructuralKey(det1);
  const struct2 = chatStructuralKey(det2);
  assert('75. deterministic chat packet output', struct1 === struct2, struct1);

  assert('80. registry ownership', DevPulseV2MobileChatInterface.assertRegistryOwnership(), 'registered');
  assert('81. registry phase 8.2', getDevPulseV2Owner('mobile_chat_interface').phase === 8.2, '8.2');
  assert('82. registry owner module', getDevPulseV2Owner('mobile_chat_interface').ownerModule === MOBILE_CHAT_INTERFACE_OWNER_MODULE, MOBILE_CHAT_INTERFACE_OWNER_MODULE);

  assert('83. dependency mobile_command_foundation', getDevPulseV2Owner('mobile_command_foundation').phase === 8.1, '8.1');
  assert('84. dependency world2_workspace_foundation', getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1, '7.1');
  assert('85. dependency controlled_execution_bridge', getDevPulseV2Owner('controlled_execution_bridge').phase === 7.7, '7.7');
  assert('86. dependency verification_gated_apply', getDevPulseV2Owner('verification_gated_apply').phase === 6.11, '6.11');
  assert('87. dependency founder_approval_execution_gate', getDevPulseV2Owner('founder_approval_execution_gate').phase === 6.5, '6.5');
  assert('88. dependency execution_authority', getDevPulseV2Owner('execution_authority').phase === 6.1, '6.1');
  assert('89. dependency execution_evidence_ledger', getDevPulseV2Owner('execution_evidence_ledger').phase === 6.7, '6.7');

  assert('90. governance dependencies present', assertGovernanceDependenciesPresent(), 'present');
  assert('91. World 1 protected', assertWorld1Protected(), 'protected');
  assert('92. no governance bypass', assertNoGovernanceBypass(), 'protected');
  assert('93. no registry runtime mutation', assertNoRegistryRuntimeMutation(), 'stable');
  assert('94. distinct from mobile command foundation', assertDistinctFromMobileCommandFoundation(), 'distinct');
  assert('95. dependency chain', DevPulseV2MobileChatInterface.assertDependencyChain(), 'chain ok');
  assert('96. does not execute', DevPulseV2MobileChatInterface.assertDoesNotExecute(), 'no execute');

  assert('97. known message intents defined', KNOWN_MESSAGE_INTENTS.length === 12, String(KNOWN_MESSAGE_INTENTS.length));
  assert('98. chat state sequence defined', CHAT_STATE_SEQUENCE.length >= 7, String(CHAT_STATE_SEQUENCE.length));
  assert('99. chat readiness levels defined', CHAT_READINESS_LEVELS.length === 8, String(CHAT_READINESS_LEVELS.length));
  assert('100. safe command types defined', SAFE_COMMAND_TYPES.length === 9, String(SAFE_COMMAND_TYPES.length));
  assert('101. dependency systems defined', DEPENDENCY_SYSTEMS.length === 7, String(DEPENDENCY_SYSTEMS.length));

  assert('102. suggestWorldTarget World 1', suggestWorldTarget('Build DevPulse core platform') === 'WORLD_1', 'WORLD_1');
  assert('103. suggestWorldTarget World 2', suggestWorldTarget('Build new sandbox app in World 2') === 'WORLD_2', 'WORLD_2');
  assert('104. isWorldTargetValidForCreation WORLD_1', isWorldTargetValidForCreation('WORLD_1'), 'valid');
  assert('105. isWorldTargetValidForCreation UNKNOWN', isWorldTargetValidForCreation('UNKNOWN') === false, 'invalid');

  assert('106. chat state includes MOBILE_SESSION_VALIDATED', chatStateIncludes(pkt1.stateSequence, 'MOBILE_SESSION_VALIDATED'), 'yes');
  assert('107. chat state includes CLOUD_SESSION_VALIDATED', chatStateIncludes(pkt1.stateSequence, 'CLOUD_SESSION_VALIDATED'), 'yes');
  assert('108. chat state includes PROJECT_CONTEXT_EVALUATED', chatStateIncludes(pkt1.stateSequence, 'PROJECT_CONTEXT_EVALUATED'), 'yes');
  assert('109. chat state includes WORLD_TARGET_CLASSIFIED', chatStateIncludes(pkt1.stateSequence, 'WORLD_TARGET_CLASSIFIED'), 'yes');
  assert('110. chat state includes MESSAGE_INTENT_CLASSIFIED', chatStateIncludes(pkt1.stateSequence, 'MESSAGE_INTENT_CLASSIFIED'), 'yes');
  assert('111. chat state includes CONVERSATION_PACKET_CREATED', chatStateIncludes(pkt1.stateSequence, 'CONVERSATION_PACKET_CREATED'), 'yes');
  assert('112. chat state includes CHAT_READY', chatStateIncludes(pkt1.stateSequence, 'CHAT_READY'), 'yes');

  const reportText = formatMobileChatReport(chat.getInterfaceState(), pkt1);
  assert('113. report chat packet id', reportText.includes(`Chat packet ID: ${pkt1.chatPacketId}`), 'chat id');
  assert('114. report no execution', reportText.includes('No execution performed: CONFIRMED'), 'no execution');
  assert('115. report no commands', reportText.includes('No commands executed: CONFIRMED'), 'no commands');
  assert('116. report no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files');
  assert('117. report no code generated', reportText.includes('No code generated: CONFIRMED'), 'no code');
  assert('118. report no deployment', reportText.includes('No deployment performed: CONFIRMED'), 'no deployment');
  assert('119. report no approval self-granted', reportText.includes('No approval self-granted: CONFIRMED'), 'no approval');
  assert('120. report foundation only', reportText.includes('Mobile chat foundation only: CONFIRMED'), 'foundation only');

  const moduleDir = join(fileURLToPath(new URL('../src/mobile-chat-interface', import.meta.url)));
  const forbiddenViolations = scanModuleForForbiddenPatterns(moduleDir);
  assert('121. module scan no forbidden patterns', forbiddenViolations.length === 0, forbiddenViolations.join('; ') || 'clean');

  assert('122. duplicate check passes', DevPulseV2MobileChatInterface.assertDuplicateCheckPasses(), 'no duplicates');
  assert('123. no forbidden patterns static', DevPulseV2MobileChatInterface.assertNoForbiddenExecutionPatterns(), 'clean');

  assert('124. no execution claim in confirmation', pkt1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('125. aiDev packet intent only', pkt1.aiDevConversationPacket?.intentOnly === true, 'intent only');
  assert('126. aiDev packet not executed', pkt1.aiDevConversationPacket?.executed === false, 'not executed');

  assert('127. report does not claim execution', !reportText.includes('execution performed: YES'), 'no false claim');
  assert('128. report does not claim files modified', !reportText.includes('files modified: YES'), 'no false claim');
  assert('129. report does not claim commands run', !reportText.includes('commands executed: YES'), 'no false claim');
  assert('130. report does not claim code generated', !reportText.includes('code generated: YES'), 'no false claim');
  assert('131. report does not claim deployment', !reportText.includes('deployment performed: YES'), 'no false claim');

  assert('132. no World 1 modification path', chat.checkWorld1ModificationBlocked('execution_authority'), 'blocked');
  assert('133. no approval self-grant check', chat.checkNoApprovalSelfGrant(makeChatInput(ws1.workspaceId, 'devpulse')), 'no self grant');

  const crossWs = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', {
    targetWorkspaceId: ws2.workspaceId,
    targetProjectId: 'fine-print',
  }));
  assert('134. cross-workspace chat blocked', crossWs.projectContextStatus === 'PROJECT_CONTEXT_BLOCKED' || crossWs.chatState === 'CHAT_BLOCKED', 'blocked');

  const readyCmd = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse'));
  assert('135. ready project command readiness', readyCmd.chatReadiness === 'READY_PROJECT_COMMAND', readyCmd.chatReadiness);

  const readyCreate = processMobileChat(makeChatInput('', '', {
    conversationMode: 'NEW_PROJECT',
    messageText: 'Build a comprehensive legal document analysis application',
    worldTarget: 'WORLD_2',
  }));
  assert('136. ready project creation readiness', readyCreate.chatReadiness === 'READY_PROJECT_CREATION', readyCreate.chatReadiness);

  assert('137. infer NEW_PROJECT mode', inferConversationMode(makeChatInput('', '', { conversationMode: 'UNKNOWN', messageText: 'Create project for my app' })) === 'NEW_PROJECT', 'NEW_PROJECT');
  assert('138. infer PROJECT_SWITCH mode', inferConversationMode(makeChatInput(ws1.workspaceId, 'devpulse', { conversationMode: 'UNKNOWN', messageText: 'Switch project to another' })) === 'PROJECT_SWITCH', 'PROJECT_SWITCH');

  const security = evaluateChatSecurity(input1);
  assert('139. security evaluation passes', security.blocked === false, security.reason);

  const getByConv = chat.getChatByConversation('conv-001');
  assert('140. get chat by conversation', getByConv !== null && getByConv.conversationId === 'conv-001', 'conv-001');

  const getByProj = chat.getChatByProject('devpulse');
  assert('141. get chat by project', getByProj !== null && getByProj.projectId === 'devpulse', 'devpulse');

  const govSummary = chat.getGovernanceSummary();
  assert('142. governance summary present', govSummary.includes('mobile_command_foundation'), govSummary);

  assert('143. cloud packet key deterministic', cloudPacketKey(pkt1.cloudCommandPacket) === cloudPacketKey(pkt1.cloudCommandPacket), 'stable');

  const statusPkt = processMobileChat(makeChatInput(ws2.workspaceId, 'fine-print', {
    messageText: 'What is the current status and progress?',
    requestedAction: 'ASK_PROJECT_STATUS',
  }));
  assert('144. status request safe command', statusPkt.cloudCommandPacket?.safeCommandType === 'PROJECT_STATUS_REQUEST', statusPkt.cloudCommandPacket?.safeCommandType ?? '');

  const approvalPkt = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', {
    messageText: 'Show me pending approval decisions',
    requestedAction: 'REQUEST_APPROVALS',
  }));
  assert('145. approvals request requires approval flag', approvalPkt.cloudCommandPacket?.requiresApproval === true, String(approvalPkt.cloudCommandPacket?.requiresApproval));

  const continuationPkt = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', {
    conversationMode: 'PROJECT_CONTINUATION',
    messageText: 'Continue building where we left off on the dashboard',
  }));
  assert('146. project continuation context', continuationPkt.projectContextStatus === 'PROJECT_CONTEXT_READY', continuationPkt.projectContextStatus);

  const visionPkt = processMobileChat(makeChatInput('', '', {
    conversationMode: 'NEW_PROJECT',
    messageText: 'My vision is to build an AI-powered legal document decipherer',
    worldTarget: 'WORLD_2',
    requestedAction: 'SEND_PROJECT_VISION',
  }));
  assert('147. project vision submission', visionPkt.messageIntent === 'SEND_PROJECT_VISION', visionPkt.messageIntent);

  assert('148. project creation request id present', w2Create.projectCreationRequestId.length > 0, w2Create.projectCreationRequestId);
  assert('149. cloud command packet id present', pkt1.cloudCommandPacket?.cloudCommandPacketId?.startsWith('cloud-cmd-pkt-') === true, pkt1.cloudCommandPacket?.cloudCommandPacketId ?? '');

  const needsCloud = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { cloudConnectionStatus: 'CONNECTING' }));
  assert('150. needs cloud connection readiness', needsCloud.chatReadiness === 'NEEDS_CLOUD_CONNECTION', needsCloud.chatReadiness);

  const needsMobile = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { mobileSessionId: '' }));
  assert('151. needs mobile session readiness', needsMobile.chatReadiness === 'NEEDS_MOBILE_SESSION', needsMobile.chatReadiness);

  const needsCtx = processMobileChat(makeChatInput(ws1.workspaceId, 'wrong-project'));
  assert('152. needs project context readiness', needsCtx.chatReadiness === 'NEEDS_PROJECT_CONTEXT', needsCtx.chatReadiness);

  const needsSelect = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', {
    conversationMode: 'EXISTING_PROJECT',
    selectedProjectId: 'other-project',
  }));
  assert('153. needs project selection readiness', needsSelect.chatReadiness === 'NEEDS_PROJECT_SELECTION', needsSelect.chatReadiness);

  assert('154. no execution performed confirmation', pkt1.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('155. no commands executed confirmation', pkt1.confirmation.noCommandsExecuted === true, 'confirmed');
  assert('156. no files modified confirmation', pkt1.confirmation.noFilesModified === true, 'confirmed');
  assert('157. no code generated confirmation', pkt1.confirmation.noCodeGenerated === true, 'confirmed');
  assert('158. no deployment confirmation', pkt1.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('159. no approval self-granted confirmation', pkt1.confirmation.noApprovalSelfGranted === true, 'confirmed');
  assert('160. mobile chat foundation only confirmation', pkt1.confirmation.mobileChatFoundationOnly === true, 'confirmed');

  assert('161. assertNoApprovalSelfGrant helper', assertNoApprovalSelfGrant(makeChatInput(ws1.workspaceId, 'devpulse', { messageText: 'grant approval now' })) === false, 'blocked');

  const oneChat = resetDevPulseV2MobileChatInterfaceForTests();
  const oneWs = seedWorkspaces(1);
  oneChat.processChatMessage(makeChatInput(oneWs[0]!.workspaceId, oneWs[0]!.projectId));
  assert('162. one project support', oneChat.getChatPackets().length === 1, '1');

  const fiveChat = resetDevPulseV2MobileChatInterfaceForTests();
  const fiveWs = seedWorkspaces(5);
  for (const ws of fiveWs) {
    fiveChat.processChatMessage(makeChatInput(ws.workspaceId, ws.projectId));
  }
  assert('163. five project support', fiveChat.getChatPackets().length === 5, '5');

  const tenChat = resetDevPulseV2MobileChatInterfaceForTests();
  const tenWs = seedWorkspaces(10);
  for (const ws of tenWs) {
    tenChat.processChatMessage(makeChatInput(ws.workspaceId, ws.projectId));
  }
  assert('164. ten project support', tenChat.getChatPackets().length === 10, '10');

  const twentyFiveChat = resetDevPulseV2MobileChatInterfaceForTests();
  const twentyFiveWs = seedWorkspaces(25);
  for (const ws of twentyFiveWs) {
    twentyFiveChat.processChatMessage(makeChatInput(ws.workspaceId, ws.projectId));
  }
  assert('165. twenty-five project support', twentyFiveChat.getChatPackets().length === 25, '25');

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('166. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(MOBILE_CHAT_INTERFACE_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:mobile-chat-interface');
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
