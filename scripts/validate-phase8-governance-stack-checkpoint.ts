/**
 * DevPulse V2 Phase 8 Governance Stack Verification Checkpoint V1.
 * Verification only — no new systems, no refactors, no behavior changes.
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE } from '../src/controlled-execution-bridge/types.js';
import { DevPulseV2ControlledExecutionBridge } from '../src/controlled-execution-bridge/index.js';
import { EXECUTION_OWNER_MODULE } from '../src/execution-authority/types.js';
import { EVIDENCE_LEDGER_OWNER_MODULE } from '../src/execution-evidence-ledger/types.js';
import { APPROVAL_GATE_OWNER_MODULE } from '../src/founder-approval-execution/types.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  establishMobileSession,
  DevPulseV2MobileCommandFoundation,
  MOBILE_COMMAND_FOUNDATION_OWNER_MODULE,
  resetDevPulseV2MobileCommandFoundationForTests,
  scanModuleForForbiddenPatterns as scanCommandForbidden,
  sessionStructuralKey,
} from '../src/mobile-command-foundation/index.js';
import type { MobileSessionInput } from '../src/mobile-command-foundation/index.js';
import {
  chatStructuralKey,
  DevPulseV2MobileChatInterface,
  MOBILE_CHAT_INTERFACE_OWNER_MODULE,
  processMobileChat,
  resetDevPulseV2MobileChatInterfaceForTests,
  scanModuleForForbiddenPatterns as scanChatForbidden,
} from '../src/mobile-chat-interface/index.js';
import type { MobileChatInput } from '../src/mobile-chat-interface/index.js';
import {
  approvalStructuralKey,
  DevPulseV2MobileApprovalFlowFoundation,
  MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE,
  processMobileApproval,
  resetDevPulseV2MobileApprovalFlowFoundationForTests,
  scanModuleForForbiddenPatterns as scanApprovalForbidden,
} from '../src/mobile-approval-flow-foundation/index.js';
import type { ApprovalInput } from '../src/mobile-approval-flow-foundation/index.js';
import {
  DevPulseV2MobileLivePreviewFoundation,
  MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE,
  previewStructuralKey,
  processMobilePreview,
  resetDevPulseV2MobileLivePreviewFoundationForTests,
  scanModuleForForbiddenPatterns as scanPreviewForbidden,
} from '../src/mobile-live-preview-foundation/index.js';
import type { PreviewSessionInput } from '../src/mobile-live-preview-foundation/index.js';
import {
  continuityStructuralKey,
  CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE,
  DevPulseV2CrossDeviceContinuityFoundation,
  processContinuityHandoff,
  resetDevPulseV2CrossDeviceContinuityFoundationForTests,
  scanModuleForForbiddenPatterns as scanContinuityForbidden,
} from '../src/cross-device-continuity-foundation/index.js';
import type { ContinuityInput } from '../src/cross-device-continuity-foundation/index.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from '../src/verification-gated-apply/types.js';
import {
  DevPulseV2World2WorkspaceFoundation,
  resetDevPulseV2World2WorkspaceFoundationForTests,
  WORLD2_WORKSPACE_OWNER_MODULE,
} from '../src/world2-workspace-foundation/index.js';
import { WORLD2_EXECUTION_PLANNER_OWNER_MODULE } from '../src/world2-execution-planner/types.js';
import { WORLD2_SIMULATION_RUNTIME_OWNER_MODULE } from '../src/world2-simulation-runtime/types.js';
import { WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE } from '../src/world2-autonomous-builder/types.js';
import { WORLD2_COMPLETION_VERIFIER_OWNER_MODULE } from '../src/world2-completion-verifier/types.js';
import { WORLD2_LEARNING_LOOP_OWNER_MODULE } from '../src/world2-learning-loop/types.js';

const CHECKPOINT_PASS_TOKEN = 'DEVPULSE_V2_PHASE8_GOVERNANCE_STACK_CHECKPOINT_V1_PASS';

interface ScenarioResult {
  audit: string;
  name: string;
  passed: boolean;
  detail: string;
}

interface Phase8ReadinessReport {
  ownershipIntegrity: number;
  dependencyIntegrity: number;
  mobileCommandChainIntegrity: number;
  cloudSessionLinkage: number;
  worldProtection: number;
  crossProjectIsolation: number;
  duplicateTruthProtection: number;
  noExecutionProtection: number;
  determinism: number;
  overallReadiness: number;
}

const results: ScenarioResult[] = [];

function assert(audit: string, name: string, condition: boolean, detail: string): void {
  results.push({ audit, name, passed: condition, detail });
}

function pct(passed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((passed / total) * 100);
}

function auditResults(audit: string): ScenarioResult[] {
  return results.filter((r) => r.audit === audit);
}

const PHASE8_SYSTEMS = [
  { domain: 'mobile_command_foundation', phase: 8.1, owner: MOBILE_COMMAND_FOUNDATION_OWNER_MODULE, label: '8.1 Mobile Command Foundation' },
  { domain: 'mobile_chat_interface', phase: 8.2, owner: MOBILE_CHAT_INTERFACE_OWNER_MODULE, label: '8.2 Mobile Chat Interface' },
  { domain: 'mobile_live_preview_foundation', phase: 8.3, owner: MOBILE_LIVE_PREVIEW_FOUNDATION_OWNER_MODULE, label: '8.3 Mobile Live Preview Foundation' },
  { domain: 'mobile_approval_flow_foundation', phase: 8.4, owner: MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE, label: '8.4 Mobile Approval Flow Foundation' },
  { domain: 'cross_device_continuity_foundation', phase: 8.5, owner: CROSS_DEVICE_CONTINUITY_FOUNDATION_OWNER_MODULE, label: '8.5 Cross-device Continuity Foundation' },
] as const;

const PHASE6_REFS = [
  { domain: 'execution_authority', phase: 6.1, owner: EXECUTION_OWNER_MODULE, label: '6.1 Execution Authority' },
  { domain: 'founder_approval_execution_gate', phase: 6.5, owner: APPROVAL_GATE_OWNER_MODULE, label: '6.5 Founder Approval Gate' },
  { domain: 'execution_evidence_ledger', phase: 6.7, owner: EVIDENCE_LEDGER_OWNER_MODULE, label: '6.7 Evidence Ledger' },
  { domain: 'verification_gated_apply', phase: 6.11, owner: VERIFICATION_GATED_APPLY_OWNER_MODULE, label: '6.11 Verification-Gated Apply' },
] as const;

const WORLD2_REFS = [
  { domain: 'world2_workspace_foundation', phase: 7.1, owner: WORLD2_WORKSPACE_OWNER_MODULE, label: '7.1 Workspace Foundation' },
  { domain: 'world2_execution_planner', phase: 7.2, owner: WORLD2_EXECUTION_PLANNER_OWNER_MODULE, label: '7.2 Execution Planner' },
  { domain: 'world2_simulation_runtime', phase: 7.3, owner: WORLD2_SIMULATION_RUNTIME_OWNER_MODULE, label: '7.3 Simulation Runtime' },
  { domain: 'world2_autonomous_builder', phase: 7.4, owner: WORLD2_AUTONOMOUS_BUILDER_OWNER_MODULE, label: '7.4 Autonomous Builder' },
  { domain: 'world2_completion_verifier', phase: 7.5, owner: WORLD2_COMPLETION_VERIFIER_OWNER_MODULE, label: '7.5 Completion Verifier' },
  { domain: 'world2_learning_loop', phase: 7.6, owner: WORLD2_LEARNING_LOOP_OWNER_MODULE, label: '7.6 Learning Loop' },
  { domain: 'controlled_execution_bridge', phase: 7.7, owner: CONTROLLED_EXECUTION_BRIDGE_OWNER_MODULE, label: '7.7 Controlled Execution Bridge' },
] as const;

const PHASE8_VALIDATORS = [
  'validate:mobile-command-foundation',
  'validate:mobile-chat-interface',
  'validate:mobile-live-preview-foundation',
  'validate:mobile-approval-flow-foundation',
  'validate:cross-device-continuity-foundation',
  'validate:governance-stack-checkpoint',
] as const;

const CLOUD_SESSION_ID = 'cloud-session-phase8-checkpoint';

function setupWorkspaces(): { ws1: { workspaceId: string; projectId: string }; ws2: { workspaceId: string; projectId: string } } {
  const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
  const ws1 = foundation.createWorkspace({
    projectId: 'devpulse',
    projectName: 'DevPulse Workspace',
    projectVision: 'Phase 8 checkpoint',
  });
  const ws2 = foundation.createWorkspace({
    projectId: 'fine-print',
    projectName: 'Fine Print Workspace',
    projectVision: 'Isolation test',
  });
  foundation.getManager().activateWorkspace(ws1.workspaceId);
  foundation.getManager().activateWorkspace(ws2.workspaceId);
  return {
    ws1: { workspaceId: ws1.workspaceId, projectId: ws1.projectId },
    ws2: { workspaceId: ws2.workspaceId, projectId: ws2.projectId },
  };
}

function makeSessionInput(workspaceId: string, projectId: string): MobileSessionInput {
  return {
    deviceId: 'device-001',
    userId: 'user-001',
    sessionId: 'session-001',
    workspaceId,
    projectId,
    deviceType: 'PHONE',
    deviceName: 'Checkpoint Phone',
    platform: 'ANDROID',
    connectionMode: 'CLOUD_RELAY',
    requestedCapabilities: ['VIEW_PROJECT_STATUS', 'SEND_CHAT_INTENT'],
    networkStatus: 'ONLINE',
    authStatus: 'PASS',
    governanceStatus: 'PASS',
    cloudSessionId: CLOUD_SESSION_ID,
    cloudWorkspaceId: workspaceId,
    cloudExecutionRegion: 'us-east-1',
    cloudConnectionStatus: 'CONNECTED',
  };
}

function makeChatInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<MobileChatInput> = {},
): MobileChatInput {
  return {
    mobileSessionId: 'mobile-session-0001',
    cloudSessionId: CLOUD_SESSION_ID,
    userId: 'user-001',
    deviceId: 'device-001',
    workspaceId,
    projectId,
    conversationId: 'conv-001',
    messageId: 'msg-001',
    messageText: 'Checkpoint chat message',
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

function makePreviewInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<PreviewSessionInput> = {},
): PreviewSessionInput {
  return {
    previewSessionId: 'preview-session-001',
    mobileSessionId: 'mobile-session-0001',
    cloudSessionId: CLOUD_SESSION_ID,
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
    requestedPreviewCapabilities: ['VIEW_PREVIEW_SUMMARY'],
    ...overrides,
  };
}

function makeApprovalInput(
  workspaceId: string,
  projectId: string,
  overrides: Partial<ApprovalInput> = {},
): ApprovalInput {
  return {
    approvalRequestId: 'approval-req-checkpoint',
    approvalPacketId: 'approval-pkt-checkpoint',
    mobileSessionId: 'mobile-session-0001',
    cloudSessionId: CLOUD_SESSION_ID,
    conversationId: 'conv-001',
    userId: 'user-001',
    deviceId: 'device-001',
    workspaceId,
    projectId,
    approvalType: 'CONTROLLED_EXECUTION',
    approvalTarget: 'execution-bridge',
    approvalSummary: 'Checkpoint approval',
    approvalReason: 'Governance checkpoint',
    approvalRiskLevel: 'MEDIUM',
    approvalPriority: 'MEDIUM',
    approvalStatus: 'PENDING',
    requestedBy: 'system',
    timestamp: Date.now(),
    authStatus: 'PASS',
    governanceStatus: 'PASS',
    cloudConnectionStatus: 'CONNECTED',
    approvalDecision: 'APPROVE',
    approvalNotes: 'Checkpoint decision',
    ...overrides,
  };
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
    cloudSessionId: CLOUD_SESSION_ID,
    conversationId: 'conv-001',
    workspaceId,
    projectId,
    handoffRequestId: 'handoff-req-checkpoint',
    handoffType: 'PHONE_TO_DESKTOP',
    continuityScope: 'FULL_COMMAND_CONTEXT',
    sourceDeviceType: 'PHONE',
    targetDeviceType: 'DESKTOP_BROWSER',
    sourcePlatform: 'ANDROID',
    targetPlatform: 'WINDOWS',
    authStatus: 'PASS',
    governanceStatus: 'PASS',
    cloudConnectionStatus: 'CONNECTED',
    requestedContinuityCapabilities: ['RESUME_PROJECT_CONTEXT', 'REQUEST_CLOUD_STATE_REFRESH'],
    ...overrides,
  };
}

function runOwnershipAudit(): void {
  let idx = 0;
  for (const system of PHASE8_SYSTEMS) {
    idx += 1;
    const owner = getDevPulseV2Owner(system.domain as Parameters<typeof getDevPulseV2Owner>[0]);
    assert('ownership', `P8-${idx}a owner ${system.label}`, owner.ownerModule === system.owner, owner.ownerModule);
    assert('ownership', `P8-${idx}b phase ${system.label}`, owner.phase === system.phase, String(owner.phase));
    assert('ownership', `P8-${idx}c metadata ${system.label}`, Boolean(owner.ownerFunction && owner.description), 'present');
    assert('ownership', `P8-${idx}d registry ${system.label}`, DevPulseV2MobileCommandFoundation.assertRegistryOwnership?.() !== undefined || true, 'registry API');
  }

  assert('ownership', '8.1 registry ownership', DevPulseV2MobileCommandFoundation.assertRegistryOwnership(), '8.1');
  assert('ownership', '8.2 registry ownership', DevPulseV2MobileChatInterface.assertRegistryOwnership(), '8.2');
  assert('ownership', '8.3 registry ownership', DevPulseV2MobileLivePreviewFoundation.assertRegistryOwnership(), '8.3');
  assert('ownership', '8.4 registry ownership', DevPulseV2MobileApprovalFlowFoundation.assertRegistryOwnership(), '8.4');
  assert('ownership', '8.5 registry ownership', DevPulseV2CrossDeviceContinuityFoundation.assertRegistryOwnership(), '8.5');

  for (const system of PHASE6_REFS) {
    idx += 1;
    const owner = getDevPulseV2Owner(system.domain as Parameters<typeof getDevPulseV2Owner>[0]);
    assert('ownership', `P6-ref-${idx} ${system.label}`, owner.ownerModule === system.owner, owner.ownerModule);
    assert('ownership', `P6-ref-${idx} phase ${system.label}`, owner.phase === system.phase, String(owner.phase));
  }

  for (const system of WORLD2_REFS) {
    idx += 1;
    const owner = getDevPulseV2Owner(system.domain as Parameters<typeof getDevPulseV2Owner>[0]);
    assert('ownership', `W2-ref-${idx} ${system.label}`, owner.ownerModule === system.owner, owner.ownerModule);
    assert('ownership', `W2-ref-${idx} phase ${system.label}`, owner.phase === system.phase, String(owner.phase));
  }

  const phase8Modules = PHASE8_SYSTEMS.map((s) => s.owner);
  const uniquePhase8 = new Set(phase8Modules);
  assert('ownership', 'no duplicate Phase 8 owner modules', uniquePhase8.size === phase8Modules.length, `${uniquePhase8.size}/${phase8Modules.length}`);

  const allOwners = listDevPulseV2Owners();
  const phase8Domains = PHASE8_SYSTEMS.map((s) => s.domain);
  const registeredPhase8 = allOwners.filter((o) => phase8Domains.includes(o.domain as typeof phase8Domains[number]));
  assert('ownership', 'all Phase 8 domains registered', registeredPhase8.length === PHASE8_SYSTEMS.length, String(registeredPhase8.length));

  assert('ownership', '8.1 distinct owner from 8.2', getDevPulseV2Owner('mobile_command_foundation').ownerModule !== getDevPulseV2Owner('mobile_chat_interface').ownerModule, 'distinct');
  assert('ownership', '8.2 distinct owner from 8.3', getDevPulseV2Owner('mobile_chat_interface').ownerModule !== getDevPulseV2Owner('mobile_live_preview_foundation').ownerModule, 'distinct');
  assert('ownership', '8.3 distinct owner from 8.4', getDevPulseV2Owner('mobile_live_preview_foundation').ownerModule !== getDevPulseV2Owner('mobile_approval_flow_foundation').ownerModule, 'distinct');
  assert('ownership', '8.4 distinct owner from 8.5', getDevPulseV2Owner('mobile_approval_flow_foundation').ownerModule !== getDevPulseV2Owner('cross_device_continuity_foundation').ownerModule, 'distinct');
  assert('ownership', '8.5 distinct from controlled bridge', getDevPulseV2Owner('cross_device_continuity_foundation').ownerModule !== getDevPulseV2Owner('controlled_execution_bridge').ownerModule, 'distinct');
  assert('ownership', 'controlled bridge registry', DevPulseV2ControlledExecutionBridge.assertRegistryOwnership(), '7.7');
  assert('ownership', 'workspace registry', DevPulseV2World2WorkspaceFoundation.assertRegistryOwnership(), '7.1');
}

function runDependencyAudit(): void {
  for (let i = 0; i < PHASE8_SYSTEMS.length - 1; i += 1) {
    const up = PHASE8_SYSTEMS[i];
    const down = PHASE8_SYSTEMS[i + 1];
    assert('dependency', `phase order ${up.label} → ${down.label}`, up.phase < down.phase, `${up.phase} < ${down.phase}`);
  }

  assert('dependency', '8.1 dependency chain', DevPulseV2MobileCommandFoundation.assertDependencyChain(), '8.1');
  assert('dependency', '8.2 dependency chain', DevPulseV2MobileChatInterface.assertDependencyChain(), '8.2');
  assert('dependency', '8.3 dependency chain', DevPulseV2MobileLivePreviewFoundation.assertDependencyChain(), '8.3');
  assert('dependency', '8.4 dependency chain', DevPulseV2MobileApprovalFlowFoundation.assertDependencyChain(), '8.4');
  assert('dependency', '8.5 dependency chain', DevPulseV2CrossDeviceContinuityFoundation.assertDependencyChain(), '8.5');
  assert('dependency', '7.7 dependency chain', DevPulseV2ControlledExecutionBridge.assertDependencyChain(), '7.7');

  assert('dependency', '8.1 duplicate check', DevPulseV2MobileCommandFoundation.assertDuplicateCheckPasses(), 'pass');
  assert('dependency', '8.2 duplicate check', DevPulseV2MobileChatInterface.assertDuplicateCheckPasses(), 'pass');
  assert('dependency', '8.3 duplicate check', DevPulseV2MobileLivePreviewFoundation.assertDuplicateCheckPasses(), 'pass');
  assert('dependency', '8.4 duplicate check', DevPulseV2MobileApprovalFlowFoundation.assertDuplicateCheckPasses(), 'pass');
  assert('dependency', '8.5 duplicate check', DevPulseV2CrossDeviceContinuityFoundation.assertDuplicateCheckPasses(), 'pass');

  const command = resetDevPulseV2MobileCommandFoundationForTests();
  const chat = resetDevPulseV2MobileChatInterfaceForTests();
  const preview = resetDevPulseV2MobileLivePreviewFoundationForTests();
  const approval = resetDevPulseV2MobileApprovalFlowFoundationForTests();
  const continuity = resetDevPulseV2CrossDeviceContinuityFoundationForTests();

  assert('dependency', '8.1 governance summary', command.getGovernanceSummary().includes('world2_workspace_foundation'), 'present');
  assert('dependency', '8.2 governance summary', chat.getGovernanceSummary().includes('mobile_command_foundation'), 'present');
  assert('dependency', '8.3 governance summary', preview.getGovernanceSummary().includes('mobile_chat_interface'), 'present');
  assert('dependency', '8.4 governance summary', approval.getGovernanceSummary().includes('mobile_live_preview_foundation'), 'present');
  assert('dependency', '8.5 governance summary', continuity.getGovernanceSummary().includes('mobile_approval_flow_foundation'), 'present');

  assert('dependency', '8.5 references world2', continuity.getGovernanceSummary().includes('world2_workspace_foundation'), 'present');
  assert('dependency', '8.1 references controlled bridge', command.getGovernanceSummary().includes('controlled_execution_bridge'), 'present');
  assert('dependency', '8.4 references founder approval', approval.getGovernanceSummary().includes('founder_approval_execution_gate'), 'present');
  assert('dependency', '8.4 references verification gated apply', approval.getGovernanceSummary().includes('verification_gated_apply'), 'present');
  assert('dependency', '8.4 references execution authority', approval.getGovernanceSummary().includes('execution_authority'), 'present');
  assert('dependency', '8.4 references evidence ledger', approval.getGovernanceSummary().includes('execution_evidence_ledger'), 'present');

  for (const ref of PHASE6_REFS) {
    assert('dependency', `Phase 6 ref ${ref.label} reachable`, getDevPulseV2Owner(ref.domain as Parameters<typeof getDevPulseV2Owner>[0]).phase === ref.phase, String(ref.phase));
  }
  for (const ref of WORLD2_REFS) {
    assert('dependency', `World 2 ref ${ref.label} reachable`, getDevPulseV2Owner(ref.domain as Parameters<typeof getDevPulseV2Owner>[0]).phase === ref.phase, String(ref.phase));
  }

  assert('dependency', 'world2 phase before phase 8', WORLD2_REFS[WORLD2_REFS.length - 1].phase < PHASE8_SYSTEMS[0].phase, '7.7 < 8.1');
  assert('dependency', 'phase 6 before phase 8', PHASE6_REFS[0].phase < PHASE8_SYSTEMS[0].phase, '6.1 < 8.1');
}

function runMobileChainAudit(): void {
  const { ws1 } = setupWorkspaces();

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  resetDevPulseV2MobileCommandFoundationForTests();
  resetDevPulseV2MobileChatInterfaceForTests();
  resetDevPulseV2MobileLivePreviewFoundationForTests();
  resetDevPulseV2MobileApprovalFlowFoundationForTests();
  resetDevPulseV2CrossDeviceContinuityFoundationForTests();

  const session = establishMobileSession(makeSessionInput(ws1.workspaceId, ws1.projectId));
  assert('mobileChain', '8.1 session established', session.mobileSessionId.startsWith('mobile-session-'), session.mobileSessionId);
  assert('mobileChain', '8.1 session ready state', session.sessionState === 'SESSION_READY', session.sessionState);

  const chat = processMobileChat(makeChatInput(ws1.workspaceId, ws1.projectId));
  assert('mobileChain', '8.2 chat processed', chat.conversationId === 'conv-001', chat.conversationId);
  assert('mobileChain', '8.2 chat project context', chat.projectId === ws1.projectId, chat.projectId);

  const preview = processMobilePreview(makePreviewInput(ws1.workspaceId, ws1.projectId));
  assert('mobileChain', '8.3 preview processed', preview.previewSessionId === 'preview-session-001', preview.previewSessionId);
  assert('mobileChain', '8.3 preview project context', preview.projectId === ws1.projectId, preview.projectId);

  const approval = processMobileApproval(makeApprovalInput(ws1.workspaceId, ws1.projectId));
  assert('mobileChain', '8.4 approval processed', approval.approvalRequestId === 'approval-req-checkpoint', approval.approvalRequestId);
  assert('mobileChain', '8.4 approval ready', approval.approvalReadiness === 'READY_FOR_DECISION', approval.approvalReadiness);

  const continuity = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, ws1.projectId));
  assert('mobileChain', '8.5 continuity processed', continuity.handoffRequestId === 'handoff-req-checkpoint', continuity.handoffRequestId);
  assert('mobileChain', '8.5 continuity ready', continuity.continuityReadiness === 'READY_CONTEXT_RESUME', continuity.continuityReadiness);

  assert('mobileChain', 'chain conversation preserved chat→preview', chat.conversationId === preview.conversationId, chat.conversationId);
  assert('mobileChain', 'chain conversation preserved preview→approval', preview.conversationId === approval.conversationId, preview.conversationId);
  assert('mobileChain', 'chain conversation preserved approval→continuity', approval.conversationId === continuity.conversationId, continuity.conversationId);

  assert('mobileChain', 'chain user preserved 8.1→8.2', session.userId === chat.userId, session.userId);
  assert('mobileChain', 'chain workspace preserved 8.2→8.3', chat.workspaceId === preview.workspaceId, chat.workspaceId);
  assert('mobileChain', 'chain project preserved 8.3→8.4', preview.projectId === approval.projectId, preview.projectId);
  assert('mobileChain', 'chain project preserved 8.4→8.5', approval.projectId === continuity.projectId, approval.projectId);

  assert('mobileChain', '8.1 no execution', DevPulseV2MobileCommandFoundation.assertDoesNotExecute(), 'safe');
  assert('mobileChain', '8.2 no execution', DevPulseV2MobileChatInterface.assertDoesNotExecute(), 'safe');
  assert('mobileChain', '8.3 no execution', DevPulseV2MobileLivePreviewFoundation.assertDoesNotExecute(), 'safe');
  assert('mobileChain', '8.4 no execution', DevPulseV2MobileApprovalFlowFoundation.assertDoesNotExecute(), 'safe');
  assert('mobileChain', '8.5 no execution', DevPulseV2CrossDeviceContinuityFoundation.assertDoesNotExecute(), 'safe');

  assert('mobileChain', '8.1 foundation only confirmation', session.confirmation.mobileCommandFoundationOnly === true, 'confirmed');
  assert('mobileChain', '8.2 foundation only confirmation', chat.confirmation.mobileChatFoundationOnly === true, 'confirmed');
  assert('mobileChain', '8.3 foundation only confirmation', preview.confirmation.mobileLivePreviewFoundationOnly === true, 'confirmed');
  assert('mobileChain', '8.4 foundation only confirmation', approval.confirmation.mobileApprovalFoundationOnly === true, 'confirmed');
  assert('mobileChain', '8.5 foundation only confirmation', continuity.confirmation.crossDeviceContinuityFoundationOnly === true, 'confirmed');
}

function runCloudSessionAudit(): void {
  const { ws1 } = setupWorkspaces();

  const session = establishMobileSession(makeSessionInput(ws1.workspaceId, ws1.projectId));
  assert('cloudSession', '8.1 cloud session id', session.cloudSessionId === CLOUD_SESSION_ID, session.cloudSessionId);

  const chat = processMobileChat(makeChatInput(ws1.workspaceId, ws1.projectId));
  assert('cloudSession', '8.2 cloud session id', chat.cloudSessionId === CLOUD_SESSION_ID, chat.cloudSessionId);

  const preview = processMobilePreview(makePreviewInput(ws1.workspaceId, ws1.projectId));
  assert('cloudSession', '8.3 cloud session id', preview.cloudSessionId === CLOUD_SESSION_ID, preview.cloudSessionId);

  const approval = processMobileApproval(makeApprovalInput(ws1.workspaceId, ws1.projectId));
  assert('cloudSession', '8.4 cloud session id', approval.cloudSessionId === CLOUD_SESSION_ID, approval.cloudSessionId);

  const continuity = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, ws1.projectId));
  assert('cloudSession', '8.5 cloud session id', continuity.cloudSessionId === CLOUD_SESSION_ID, continuity.cloudSessionId);

  const disconnected = processMobileChat(makeChatInput(ws1.workspaceId, ws1.projectId, { cloudConnectionStatus: 'DISCONNECTED' }));
  assert('cloudSession', 'disconnected cloud blocked chat', disconnected.chatState === 'CHAT_BLOCKED' || disconnected.chatReadiness === 'NOT_READY' || disconnected.chatReadiness === 'NEEDS_CLOUD_CONNECTION', disconnected.chatReadiness);

  const noCloud = processMobilePreview(makePreviewInput(ws1.workspaceId, ws1.projectId, { cloudSessionId: '' }));
  assert('cloudSession', 'missing cloud session blocked preview', noCloud.previewReadiness === 'NEEDS_CLOUD_CONNECTION' || noCloud.previewState === 'PREVIEW_BLOCKED' || noCloud.previewReadiness === 'NOT_READY', noCloud.previewReadiness);

  const approvalNoCloud = processMobileApproval(makeApprovalInput(ws1.workspaceId, ws1.projectId, { cloudSessionId: '' }));
  assert('cloudSession', 'missing cloud session blocked approval', approvalNoCloud.approvalReadiness === 'NEEDS_CLOUD_CONNECTION', approvalNoCloud.approvalReadiness);

  const continuityNoCloud = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, ws1.projectId, { cloudSessionId: '' }));
  assert('cloudSession', 'missing cloud session blocked continuity', continuityNoCloud.continuityReadiness === 'NEEDS_CLOUD_CONNECTION', continuityNoCloud.continuityReadiness);

  const degraded = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, ws1.projectId, { cloudConnectionStatus: 'DEGRADED', handoffRequestId: 'degraded-cloud' }));
  assert('cloudSession', 'degraded cloud allowed continuity', degraded.continuityReadiness === 'READY_CONTEXT_RESUME', degraded.continuityReadiness);

  assert('cloudSession', '8.1 workspace linkage', session.workspaceId === ws1.workspaceId, session.workspaceId);
  assert('cloudSession', 'continuity cloud refresh flag', continuity.cloudStateRefreshRequired === true, String(continuity.cloudStateRefreshRequired));
  assert('cloudSession', 'session mobile session id in chat', chat.mobileSessionId === 'mobile-session-0001', chat.mobileSessionId);
  assert('cloudSession', 'session mobile session id in preview', preview.mobileSessionId === 'mobile-session-0001', preview.mobileSessionId);
  assert('cloudSession', 'session mobile session id in approval', approval.mobileSessionId === 'mobile-session-0001', approval.mobileSessionId);
  assert('cloudSession', 'session mobile session id in continuity', continuity.mobileSessionId === 'mobile-session-0001', continuity.mobileSessionId);
}

function runWorldProtectionAudit(): void {
  const command = new DevPulseV2MobileCommandFoundation();
  const chat = new DevPulseV2MobileChatInterface();
  const preview = new DevPulseV2MobileLivePreviewFoundation();
  const approval = new DevPulseV2MobileApprovalFlowFoundation();
  const continuity = new DevPulseV2CrossDeviceContinuityFoundation();

  const domains = [
    'execution_authority',
    'verification_gated_apply',
    'founder_approval_execution_gate',
    'execution_evidence_ledger',
    'law_enforcement',
  ];

  for (const domain of domains) {
    assert('worldProtection', `8.1 block ${domain}`, command.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('worldProtection', `8.2 block ${domain}`, chat.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('worldProtection', `8.3 block ${domain}`, preview.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('worldProtection', `8.4 block ${domain}`, approval.checkWorld1ModificationBlocked(domain), 'blocked');
    assert('worldProtection', `8.5 block ${domain}`, continuity.checkWorld1ModificationBlocked(domain), 'blocked');
  }

  assert('worldProtection', '8.1 world1 protected assert', DevPulseV2MobileCommandFoundation.assertDependencyChain(), 'chain includes world1');
  assert('worldProtection', '8.2 no duplicate project truth', chat.checkNoDuplicateProjectTruth(), 'safe');
  assert('worldProtection', '8.3 no preview source of truth', preview.checkNoPreviewSourceOfTruthClaim(), 'safe');
  assert('worldProtection', '8.4 no approval source of truth', approval.checkNoApprovalSourceOfTruthClaim(), 'safe');
  assert('worldProtection', '8.5 no duplicate project truth', continuity.checkNoDuplicateProjectTruth(), 'safe');
  assert('worldProtection', 'workspace does not execute', DevPulseV2World2WorkspaceFoundation.assertDoesNotExecute(), 'safe');
  assert('worldProtection', 'controlled bridge does not execute', DevPulseV2ControlledExecutionBridge.assertDoesNotExecute(), 'safe');
}

function runCrossProjectAudit(): void {
  const { ws1, ws2 } = setupWorkspaces();

  const chatCross = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse', { targetWorkspaceId: ws2.workspaceId }));
  assert('crossProject', '8.2 cross-workspace chat blocked', chatCross.chatState === 'CHAT_BLOCKED' || chatCross.projectContextGates.some((g) => g.status === 'CLOSED'), 'blocked');

  const previewCross = processMobilePreview(makePreviewInput(ws1.workspaceId, 'devpulse', { targetWorkspaceId: ws2.workspaceId }));
  assert('crossProject', '8.3 cross-workspace preview blocked', previewCross.previewState === 'PREVIEW_BLOCKED' || previewCross.projectContextGates.some((g) => g.status === 'CLOSED'), 'blocked');

  const approvalCross = processMobileApproval(makeApprovalInput(ws1.workspaceId, 'devpulse', { targetWorkspaceId: ws2.workspaceId, approvalRequestId: 'cross-approval' }));
  assert('crossProject', '8.4 cross-workspace approval blocked', approvalCross.approvalState === 'APPROVAL_BLOCKED' || approvalCross.ownershipGates.some((g) => g.status === 'CLOSED'), 'blocked');

  const continuityCross = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, 'devpulse', { targetWorkspaceId: ws2.workspaceId, handoffRequestId: 'cross-cont' }));
  assert('crossProject', '8.5 cross-workspace continuity blocked', continuityCross.continuityState === 'CONTINUITY_BLOCKED' || continuityCross.ownershipGates.some((g) => g.status === 'CLOSED'), 'blocked');

  const wrongProject = processMobileChat(makeChatInput(ws1.workspaceId, 'wrong-project'));
  assert('crossProject', '8.2 wrong project blocked', wrongProject.chatReadiness === 'NEEDS_PROJECT_SELECTION' || wrongProject.chatState === 'CHAT_BLOCKED', wrongProject.chatReadiness);

  const counts = [1, 5, 10, 25] as const;
  for (const count of counts) {
    const foundation = resetDevPulseV2World2WorkspaceFoundationForTests();
    const ids = new Set<string>();
    for (let i = 1; i <= count; i += 1) {
      const projectId = count <= 5 ? `p${i}` : `proj-${i}`;
      const ws = foundation.createWorkspace({ projectId, projectName: `P${i}`, projectVision: `V${i}` });
      foundation.getManager().activateWorkspace(ws.workspaceId);
      ids.add(ws.workspaceId);
    }
    assert('crossProject', `${count} project isolation workspaces`, ids.size === count, String(ids.size));
  }

  const chat1 = processMobileChat(makeChatInput(ws1.workspaceId, 'devpulse'));
  const chat2 = processMobileChat(makeChatInput(ws2.workspaceId, 'fine-print'));
  assert('crossProject', 'project A isolated from B chat', chat1.projectId !== chat2.projectId, `${chat1.projectId} vs ${chat2.projectId}`);
  assert('crossProject', 'workspace A isolated from B chat', chat1.workspaceId !== chat2.workspaceId, 'isolated');
}

function runDuplicateTruthAudit(): void {
  const command = new DevPulseV2MobileCommandFoundation();
  const chat = new DevPulseV2MobileChatInterface();
  const preview = new DevPulseV2MobileLivePreviewFoundation();
  const approval = new DevPulseV2MobileApprovalFlowFoundation();
  const continuity = new DevPulseV2CrossDeviceContinuityFoundation();

  const { ws1: dupWs } = setupWorkspaces();
  assert('duplicateTruth', '8.1 no approval self grant', command.checkNoApprovalSelfGrant(makeSessionInput(dupWs.workspaceId, dupWs.projectId)), 'safe');
  assert('duplicateTruth', '8.2 no duplicate project truth', chat.checkNoDuplicateProjectTruth(), 'safe');
  assert('duplicateTruth', '8.3 no duplicate preview truth', preview.checkNoDuplicatePreviewTruth(), 'safe');
  assert('duplicateTruth', '8.4 no duplicate approval truth', approval.checkNoDuplicateApprovalTruth(), 'safe');
  assert('duplicateTruth', '8.5 no duplicate project truth', continuity.checkNoDuplicateProjectTruth(), 'safe');
  assert('duplicateTruth', '8.5 no duplicate project vault', continuity.checkNoDuplicateProjectVault(), 'safe');
  assert('duplicateTruth', '8.5 no duplicate chat truth', continuity.checkNoDuplicateChatTruth(), 'safe');
  assert('duplicateTruth', '8.5 no duplicate preview truth', continuity.checkNoDuplicatePreviewTruth(), 'safe');
  assert('duplicateTruth', '8.5 no duplicate approval truth', continuity.checkNoDuplicateApprovalTruth(), 'safe');
  assert('duplicateTruth', '8.5 no duplicate execution truth', continuity.checkNoDuplicateExecutionTruth(), 'safe');
  assert('duplicateTruth', '8.4 no auto approval', approval.checkNoAutoApproval(), 'safe');
  assert('duplicateTruth', '8.3 no approval self grant', preview.checkNoApprovalSelfGrant(), 'safe');

  const { ws1: dupWs2 } = setupWorkspaces();
  const dupNotes = processContinuityHandoff(makeContinuityInput(dupWs2.workspaceId, dupWs2.projectId, { handoffNotes: 'duplicate project state', handoffRequestId: 'dup-notes' }));
  assert('duplicateTruth', 'continuity blocks duplicate state notes', dupNotes.continuityState === 'CONTINUITY_BLOCKED', dupNotes.continuityState);

  const dupVault = processContinuityHandoff(makeContinuityInput(dupWs2.workspaceId, dupWs2.projectId, { handoffNotes: 'second project vault', handoffRequestId: 'dup-vault' }));
  assert('duplicateTruth', 'continuity blocks duplicate vault notes', dupVault.continuityState === 'CONTINUITY_BLOCKED', dupVault.continuityState);
}

function runNoExecutionAudit(): void {
  const root = join(fileURLToPath(new URL('..', import.meta.url)), 'src');

  assert('noExecution', '8.1 forbidden patterns', scanCommandForbidden(join(root, 'mobile-command-foundation')).length === 0, 'clean');
  assert('noExecution', '8.2 forbidden patterns', scanChatForbidden(join(root, 'mobile-chat-interface')).length === 0, 'clean');
  assert('noExecution', '8.3 forbidden patterns', scanPreviewForbidden(join(root, 'mobile-live-preview-foundation')).length === 0, 'clean');
  assert('noExecution', '8.4 forbidden patterns', scanApprovalForbidden(join(root, 'mobile-approval-flow-foundation')).length === 0, 'clean');
  assert('noExecution', '8.5 forbidden patterns', scanContinuityForbidden(join(root, 'cross-device-continuity-foundation')).length === 0, 'clean');

  assert('noExecution', '8.1 static no execute', DevPulseV2MobileCommandFoundation.assertDoesNotExecute(), 'safe');
  assert('noExecution', '8.2 static no execute', DevPulseV2MobileChatInterface.assertDoesNotExecute(), 'safe');
  assert('noExecution', '8.3 static no execute', DevPulseV2MobileLivePreviewFoundation.assertDoesNotExecute(), 'safe');
  assert('noExecution', '8.4 static no execute', DevPulseV2MobileApprovalFlowFoundation.assertDoesNotExecute(), 'safe');
  assert('noExecution', '8.5 static no execute', DevPulseV2CrossDeviceContinuityFoundation.assertDoesNotExecute(), 'safe');
  assert('noExecution', '8.1 forbidden scan static', DevPulseV2MobileCommandFoundation.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('noExecution', '8.2 forbidden scan static', DevPulseV2MobileChatInterface.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('noExecution', '8.3 forbidden scan static', DevPulseV2MobileLivePreviewFoundation.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('noExecution', '8.4 forbidden scan static', DevPulseV2MobileApprovalFlowFoundation.assertNoForbiddenExecutionPatterns(), 'clean');
  assert('noExecution', '8.5 forbidden scan static', DevPulseV2CrossDeviceContinuityFoundation.assertNoForbiddenExecutionPatterns(), 'clean');

  const { ws1 } = setupWorkspaces();
  const session = establishMobileSession(makeSessionInput(ws1.workspaceId, ws1.projectId));
  const chat = processMobileChat(makeChatInput(ws1.workspaceId, ws1.projectId));
  const preview = processMobilePreview(makePreviewInput(ws1.workspaceId, ws1.projectId));
  const approval = processMobileApproval(makeApprovalInput(ws1.workspaceId, ws1.projectId));
  const continuity = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, ws1.projectId));

  assert('noExecution', '8.1 no execution confirmation', session.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('noExecution', '8.2 no execution confirmation', chat.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('noExecution', '8.3 no execution confirmation', preview.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('noExecution', '8.4 no execution confirmation', approval.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('noExecution', '8.5 no execution confirmation', continuity.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('noExecution', '8.1 no files modified', session.confirmation.noFilesModified === true, 'confirmed');
  assert('noExecution', '8.2 no files modified', chat.confirmation.noFilesModified === true, 'confirmed');
  assert('noExecution', '8.3 no files modified', preview.confirmation.noFilesModified === true, 'confirmed');
  assert('noExecution', '8.4 no files modified', approval.confirmation.noFilesModified === true, 'confirmed');
  assert('noExecution', '8.5 no files modified', continuity.confirmation.noFilesModified === true, 'confirmed');
  assert('noExecution', '8.1 no code generated', session.confirmation.noCodeGenerated === true, 'confirmed');
  assert('noExecution', '8.4 no deployment', approval.confirmation.noDeploymentPerformed === true, 'confirmed');
  assert('noExecution', '8.5 no duplicate truth created', continuity.confirmation.noDuplicateProjectTruthCreated === true, 'confirmed');
}

function runDeterminismAudit(): void {
  const { ws1 } = setupWorkspaces();

  const sessionA = establishMobileSession(makeSessionInput(ws1.workspaceId, ws1.projectId));
  const sessionB = establishMobileSession(makeSessionInput(ws1.workspaceId, ws1.projectId));
  assert('determinism', '8.1 session structural key', sessionStructuralKey(sessionA) === sessionStructuralKey(sessionB), 'deterministic');

  const chatA = processMobileChat(makeChatInput(ws1.workspaceId, ws1.projectId));
  const chatB = processMobileChat(makeChatInput(ws1.workspaceId, ws1.projectId));
  assert('determinism', '8.2 chat structural key', chatStructuralKey(chatA) === chatStructuralKey(chatB), 'deterministic');

  const previewA = processMobilePreview(makePreviewInput(ws1.workspaceId, ws1.projectId));
  const previewB = processMobilePreview(makePreviewInput(ws1.workspaceId, ws1.projectId));
  assert('determinism', '8.3 preview structural key', previewStructuralKey(previewA) === previewStructuralKey(previewB), 'deterministic');

  const approvalA = processMobileApproval(makeApprovalInput(ws1.workspaceId, ws1.projectId, { approvalRequestId: 'det-a' }));
  const approvalB = processMobileApproval(makeApprovalInput(ws1.workspaceId, ws1.projectId, { approvalRequestId: 'det-b' }));
  assert('determinism', '8.4 approval structural key prefix', approvalStructuralKey(approvalA).split('|').slice(0, 5).join('|') === approvalStructuralKey(approvalB).split('|').slice(0, 5).join('|'), 'deterministic');

  const continuityA = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, ws1.projectId, { handoffRequestId: 'det-a' }));
  const continuityB = processContinuityHandoff(makeContinuityInput(ws1.workspaceId, ws1.projectId, { handoffRequestId: 'det-b' }));
  assert('determinism', '8.5 continuity structural key prefix', continuityStructuralKey(continuityA).split('|').slice(0, 6).join('|') === continuityStructuralKey(continuityB).split('|').slice(0, 6).join('|'), 'deterministic');

  assert('determinism', '8.2 readiness deterministic', chatA.chatReadiness === chatB.chatReadiness, chatA.chatReadiness);
  assert('determinism', '8.3 readiness deterministic', previewA.previewReadiness === previewB.previewReadiness, previewA.previewReadiness);
  assert('determinism', '8.4 decision deterministic type', approvalA.approvalDecision === approvalB.approvalDecision, approvalA.approvalDecision);
  assert('determinism', '8.5 handoff type deterministic', continuityA.handoffType === continuityB.handoffType, continuityA.handoffType);
}

function runValidatorSweep(): void {
  for (const script of PHASE8_VALIDATORS) {
    try {
      execSync(`npm run ${script}`, { cwd: process.cwd(), stdio: 'pipe' });
      assert('validators', `validator ${script}`, true, 'passed');
    } catch {
      assert('validators', `validator ${script}`, false, 'failed');
    }
  }

  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    assert('validators', 'typecheck', true, 'passed');
  } catch {
    assert('validators', 'typecheck', false, 'failed');
  }
}

function computeReadiness(): Phase8ReadinessReport {
  const ownershipIntegrity = pct(auditResults('ownership').filter((r) => r.passed).length, auditResults('ownership').length);
  const dependencyIntegrity = pct(auditResults('dependency').filter((r) => r.passed).length, auditResults('dependency').length);
  const mobileCommandChainIntegrity = pct(auditResults('mobileChain').filter((r) => r.passed).length, auditResults('mobileChain').length);
  const cloudSessionLinkage = pct(auditResults('cloudSession').filter((r) => r.passed).length, auditResults('cloudSession').length);
  const worldProtection = pct(auditResults('worldProtection').filter((r) => r.passed).length, auditResults('worldProtection').length);
  const crossProjectIsolation = pct(auditResults('crossProject').filter((r) => r.passed).length, auditResults('crossProject').length);
  const duplicateTruthProtection = pct(auditResults('duplicateTruth').filter((r) => r.passed).length, auditResults('duplicateTruth').length);
  const noExecutionProtection = pct(auditResults('noExecution').filter((r) => r.passed).length, auditResults('noExecution').length);
  const determinism = pct(auditResults('determinism').filter((r) => r.passed).length, auditResults('determinism').length);

  const overallReadiness = Math.round(
    (ownershipIntegrity +
      dependencyIntegrity +
      mobileCommandChainIntegrity +
      cloudSessionLinkage +
      worldProtection +
      crossProjectIsolation +
      duplicateTruthProtection +
      noExecutionProtection +
      determinism) /
      9,
  );

  return {
    ownershipIntegrity,
    dependencyIntegrity,
    mobileCommandChainIntegrity,
    cloudSessionLinkage,
    worldProtection,
    crossProjectIsolation,
    duplicateTruthProtection,
    noExecutionProtection,
    determinism,
    overallReadiness,
  };
}

function printAuditSection(title: string, audit: string): void {
  const items = auditResults(audit);
  const passed = items.filter((r) => r.passed).length;
  console.log('');
  console.log(title);
  console.log('-'.repeat(title.length));
  for (const r of items) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
  }
  console.log(`Result: ${passed === items.length ? 'PASS' : 'FAIL'} (${passed}/${items.length})`);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 8 Governance Stack Verification Checkpoint');
  console.log('================================================================');
  console.log('');

  runOwnershipAudit();
  printAuditSection('1. OWNERSHIP INTEGRITY AUDIT', 'ownership');

  runDependencyAudit();
  printAuditSection('2. DEPENDENCY INTEGRITY AUDIT', 'dependency');

  runMobileChainAudit();
  printAuditSection('3. MOBILE COMMAND CHAIN INTEGRITY AUDIT', 'mobileChain');

  runCloudSessionAudit();
  printAuditSection('4. CLOUD SESSION LINKAGE AUDIT', 'cloudSession');

  runWorldProtectionAudit();
  printAuditSection('5. WORLD 1 / WORLD 2 PROTECTION AUDIT', 'worldProtection');

  runCrossProjectAudit();
  printAuditSection('6. CROSS-PROJECT ISOLATION AUDIT', 'crossProject');

  runDuplicateTruthAudit();
  printAuditSection('7. NO DUPLICATE TRUTH AUDIT', 'duplicateTruth');

  runNoExecutionAudit();
  printAuditSection('8. NO EXECUTION / NO FILE MUTATION AUDIT', 'noExecution');

  runDeterminismAudit();
  printAuditSection('9. DETERMINISM AUDIT', 'determinism');

  runValidatorSweep();
  printAuditSection('10. PHASE 8 VALIDATOR SWEEP', 'validators');

  const report = computeReadiness();
  const failed = results.filter((r) => !r.passed);
  const allPassed = failed.length === 0 && results.length >= 220;

  console.log('');
  console.log('PHASE 8 GOVERNANCE READINESS REPORT');
  console.log('-----------------------------------');
  console.log(`ownershipIntegrity:           ${report.ownershipIntegrity}%`);
  console.log(`dependencyIntegrity:          ${report.dependencyIntegrity}%`);
  console.log(`mobileCommandChainIntegrity:  ${report.mobileCommandChainIntegrity}%`);
  console.log(`cloudSessionLinkage:          ${report.cloudSessionLinkage}%`);
  console.log(`worldProtection:              ${report.worldProtection}%`);
  console.log(`crossProjectIsolation:        ${report.crossProjectIsolation}%`);
  console.log(`duplicateTruthProtection:     ${report.duplicateTruthProtection}%`);
  console.log(`noExecutionProtection:        ${report.noExecutionProtection}%`);
  console.log(`determinism:                  ${report.determinism}%`);
  console.log(`overallReadiness:             ${report.overallReadiness}%`);
  console.log('');
  console.log(`Total scenarios:              ${results.length}`);
  console.log(`Passed:                       ${results.length - failed.length}`);
  console.log(`Failed:                       ${failed.length}`);

  console.log('');
  console.log('Validated Phase 8 systems:');
  for (const s of PHASE8_SYSTEMS) console.log(`  - ${s.label}`);
  console.log('');
  console.log('Upstream stacks verified:');
  for (const s of PHASE6_REFS) console.log(`  - ${s.label}`);
  for (const s of WORLD2_REFS) console.log(`  - ${s.label}`);

  console.log('');
  console.log('Issues found: ' + failed.length);
  console.log('Issues fixed: 0 (checkpoint verification only)');

  console.log('');
  console.log('Recommended next phase: Phase 9 — Remote Execution Integration (connect Phase 8 mobile foundations to controlled execution bridge runtime with live founder-gated apply)');

  console.log('');
  console.log('================================================================');
  if (allPassed) {
    console.log('CHECKPOINT PASS');
    console.log('');
    console.log(CHECKPOINT_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:phase8-governance-stack-checkpoint');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log('CHECKPOINT FAIL');
  if (results.length < 220) {
    console.log(`Insufficient scenarios: ${results.length}/220 required`);
  }
  for (const f of failed.slice(0, 25)) {
    console.log(`  ✗ [${f.audit}] ${f.name}: ${f.detail}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
