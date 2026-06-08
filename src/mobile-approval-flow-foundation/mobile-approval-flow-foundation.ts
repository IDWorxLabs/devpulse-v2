/**
 * DevPulse V2 Mobile Approval Flow Foundation — Phase 8.4.
 * Decision interface only. Records governed approval decisions. Does NOT execute.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import { auditKey, createApprovalAuditRecord } from './approval-audit-engine.js';
import { classifyApproval, classificationKey, requiresFounderReview } from './approval-classification-engine.js';
import { decisionKey, routeDecision, validateDecision } from './approval-decision-engine.js';
import {
  approvalRequestKey,
  validateApprovalRequest,
  validateCloudApprovalSession,
  validateMobileApprovalSession,
} from './approval-request-engine.js';
import {
  createApprovalResponseId,
  createApprovalResponsePacket,
  responsePacketKey,
} from './approval-response-engine.js';
import {
  assertDistinctFromMobileLivePreviewFoundation,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getMobileApprovalGovernanceSummary,
  governanceGatesKey,
  validateApprovalGovernance,
} from './mobile-approval-governance-bridge.js';
import { buildMobileApprovalReport, formatMobileApprovalReport } from './mobile-approval-report.js';
import {
  assertNoApprovalSourceOfTruthClaim,
  assertNoAutoApproval,
  assertNoDuplicateApprovalTruth,
  evaluateApprovalSecurity,
} from './mobile-approval-security-engine.js';
import type {
  ApprovalInput,
  ApprovalReadiness,
  ApprovalState,
  MobileApprovalFlowFoundationState,
  MobileApprovalResult,
} from './types.js';
import {
  APPROVAL_STATE_SEQUENCE,
  DUPLICATE_PATTERNS,
  MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE,
  MOBILE_APPROVAL_FLOW_FOUNDATION_PASS_TOKEN,
} from './types.js';

function getForbiddenExecutionPatterns(): string[] {
  return [
    'fs' + '.writeFileSync',
    'fs' + '.rmSync',
    'fs' + '.unlinkSync',
    'child' + '_process',
    'exec' + '(',
    'spawn' + '(',
    'eval' + '(',
  ];
}

let singleton: DevPulseV2MobileApprovalFlowFoundation | null = null;

function createFoundationId(): string {
  return `mobile-approval-flow-foundation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function determineApprovalReadiness(
  securityBlocked: boolean,
  mobileValid: boolean,
  cloudValid: boolean,
  projectValid: boolean,
  governanceValid: boolean,
  decisionValid: boolean,
  authStatus: ApprovalInput['authStatus'],
  cloudConnectionStatus: ApprovalInput['cloudConnectionStatus'],
  missingCloudSession: boolean,
): ApprovalReadiness {
  if (securityBlocked) {
    if (authStatus === 'FAIL') return 'NEEDS_AUTH';
    if (cloudConnectionStatus === 'DISCONNECTED' || missingCloudSession) return 'NEEDS_CLOUD_CONNECTION';
    if (!mobileValid) return 'NEEDS_MOBILE_SESSION';
    return 'NOT_READY';
  }
  if (!mobileValid) return 'NEEDS_MOBILE_SESSION';
  if (!cloudValid) return 'NEEDS_CLOUD_CONNECTION';
  if (!projectValid || !governanceValid) return 'NEEDS_PROJECT_CONTEXT';
  if (!decisionValid) return 'NOT_READY';
  return 'READY_FOR_DECISION';
}

function buildStateSequence(
  securityBlocked: boolean,
  mobileValid: boolean,
  cloudValid: boolean,
  projectValid: boolean,
  classified: boolean,
  decisionRecorded: boolean,
  packetCreated: boolean,
  readiness: ApprovalReadiness,
): ApprovalState[] {
  if (securityBlocked || !mobileValid) return ['APPROVAL_REQUEST_RECEIVED', 'APPROVAL_BLOCKED'];

  const sequence: ApprovalState[] = ['APPROVAL_REQUEST_RECEIVED', 'MOBILE_SESSION_VALIDATED'];
  if (cloudValid) sequence.push('CLOUD_SESSION_VALIDATED');
  if (projectValid) sequence.push('PROJECT_CONTEXT_VALIDATED');
  if (classified) sequence.push('APPROVAL_CLASSIFIED');
  if (decisionRecorded) sequence.push('DECISION_RECORDED');
  if (packetCreated) sequence.push('APPROVAL_RESPONSE_PACKET_CREATED');

  if (readiness === 'READY_FOR_DECISION') {
    sequence.push('APPROVAL_READY');
  } else {
    sequence.push('APPROVAL_BLOCKED');
  }

  return sequence;
}

function compileRecommendations(
  input: ApprovalInput,
  readiness: ApprovalReadiness,
  founderReview: boolean,
): string[] {
  const recommendations: string[] = [
    'Mobile Approval Flow Foundation V1 — decision interface only. Founder approval systems own approval truth.',
  ];

  if (readiness === 'NEEDS_AUTH') recommendations.push('Authenticate before recording approval decisions.');
  if (readiness === 'NEEDS_CLOUD_CONNECTION') recommendations.push('Establish cloud connection before approval.');
  if (readiness === 'NEEDS_MOBILE_SESSION') recommendations.push('Valid mobile session required for approval.');
  if (readiness === 'NEEDS_PROJECT_CONTEXT') recommendations.push('Valid project context required for approval.');
  if (founderReview) recommendations.push(`Founder review recommended for ${input.approvalType} approval.`);
  if (readiness === 'READY_FOR_DECISION') {
    recommendations.push(`Decision ${input.approvalDecision} recorded — execution deferred to governed systems.`);
  }

  return recommendations;
}

function cloneApprovalResult(result: MobileApprovalResult): MobileApprovalResult {
  return {
    ...result,
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    cloudGates: result.cloudGates.map((g) => ({ ...g })),
    approvalGates: result.approvalGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
    approvalAuditRecord: result.approvalAuditRecord ? { ...result.approvalAuditRecord } : null,
    approvalResponsePacket: result.approvalResponsePacket ? { ...result.approvalResponsePacket } : null,
  };
}

export function processMobileApproval(input: ApprovalInput): MobileApprovalResult {
  const security = evaluateApprovalSecurity(input);
  const request = validateApprovalRequest(input);
  const mobileSession = validateMobileApprovalSession(input);
  const cloudSession = validateCloudApprovalSession(input);
  const governance = validateApprovalGovernance(input);
  const classification = classifyApproval(input);
  const decision = validateDecision(input);

  const mobileValid = mobileSession.valid && request.valid && !security.blocked;
  const cloudValid = cloudSession.valid;
  const projectValid = classification.valid;
  const governanceValid = governance.valid;
  const decisionValid = decision.valid;

  const founderReview = requiresFounderReview(input.approvalType);

  const allWarnings = [...security.warnings];

  const missingCloudSession = !input.cloudSessionId?.trim();

  const approvalReadiness = determineApprovalReadiness(
    security.blocked,
    mobileValid,
    cloudValid,
    projectValid,
    governanceValid,
    decisionValid,
    input.authStatus,
    input.cloudConnectionStatus,
    missingCloudSession,
  );

  const readyForPacket =
    approvalReadiness === 'READY_FOR_DECISION' &&
    mobileValid &&
    cloudValid &&
    projectValid &&
    governanceValid &&
    decisionValid;

  const approvalResponseId = readyForPacket ? createApprovalResponseId() : '';
  const decisionTimestamp = readyForPacket ? Date.now() : 0;

  const approvalResponsePacket = readyForPacket
    ? createApprovalResponsePacket(input, decision.decision)
    : null;

  const approvalAuditRecord = readyForPacket
    ? createApprovalAuditRecord(input, approvalResponseId, decision.decision, decisionTimestamp)
    : null;

  const stateSequence = buildStateSequence(
    security.blocked,
    mobileValid,
    cloudValid,
    projectValid,
    classification.valid,
    readyForPacket,
    readyForPacket,
    approvalReadiness,
  );

  const approvalState = stateSequence[stateSequence.length - 1] ?? 'APPROVAL_BLOCKED';

  const ownershipGates = [...classification.gates];
  const cloudGates = [...mobileSession.gates, ...cloudSession.gates];
  const approvalGates = [...request.gates, ...decision.gates];

  return {
    approvalResponseId,
    approvalRequestId: input.approvalRequestId,
    approvalPacketId: input.approvalPacketId,
    mobileSessionId: input.mobileSessionId,
    cloudSessionId: input.cloudSessionId,
    conversationId: input.conversationId,
    userId: input.userId,
    workspaceId: classification.effectiveWorkspaceId || input.workspaceId,
    projectId: classification.effectiveProjectId || input.projectId,
    approvalType: classification.approvalType,
    approvalDecision: decision.decision,
    approvalState,
    approvalReason: input.approvalReason,
    approvalNotes: input.approvalNotes,
    decisionTimestamp,
    approvalReadiness,
    approvalAuditRecord,
    approvalResponsePacket,
    ownershipGates,
    governanceGates: governance.gates,
    cloudGates,
    approvalGates,
    securityWarnings: allWarnings,
    recommendations: compileRecommendations(input, approvalReadiness, founderReview),
    confirmation: {
      mobileApprovalFoundationOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noApprovalSelfGranted: true,
      noApprovalSourceOfTruthClaim: true,
    },
    stateSequence,
    createdAt: Date.now(),
  };
}

export function approvalStructuralKey(result: MobileApprovalResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.approvalState,
    result.approvalReadiness,
    result.approvalType,
    classificationKey(result.approvalType, result.ownershipGates.some((g) => g.status === 'OPEN')),
    decisionKey(result.approvalDecision, result.approvalGates.some((g) => g.gateType === 'DECISION_RECORDED')),
    governanceGatesKey(result.governanceGates),
    auditKey(result.approvalAuditRecord),
    responsePacketKey(result.approvalResponsePacket),
  ].join('|');
}

export function approvalStateIncludes(states: ApprovalState[], target: ApprovalState): boolean {
  return states.includes(target);
}

export function scanModuleForForbiddenPatterns(moduleDir: string): string[] {
  const violations: string[] = [];

  function scanDir(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.ts')) continue;

      const content = readFileSync(fullPath, 'utf8');
      for (const pattern of getForbiddenExecutionPatterns()) {
        if (content.includes(pattern)) {
          violations.push(`${fullPath}: contains forbidden pattern "${pattern}"`);
        }
      }
    }
  }

  scanDir(moduleDir);
  return violations;
}

export class DevPulseV2MobileApprovalFlowFoundation {
  private readonly foundationId = createFoundationId();
  private readonly approvalResponses: MobileApprovalResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 8.4 Mobile Approval Flow Foundation V1 — decision interface only.',
    'No execution, commands, file modification, code generation, or deployment.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE;
  static readonly ownerDomain = 'mobile_approval_flow_foundation' as const;
  static readonly passToken = MOBILE_APPROVAL_FLOW_FOUNDATION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('mobile_approval_flow_foundation');
    return owner.ownerModule === MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE && owner.phase === 8.4;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const approvalOwner = getDevPulseV2Owner('mobile_approval_flow_foundation').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== approvalOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromMobileLivePreviewFoundation();
  }

  static assertDoesNotExecute(): boolean {
    const foundation = new DevPulseV2MobileApprovalFlowFoundation();
    return (
      typeof (foundation as { execute?: unknown }).execute === 'undefined' &&
      typeof (foundation as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (foundation as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (foundation as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (foundation as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (foundation as { autoApprove?: unknown }).autoApprove === 'undefined' &&
      typeof (foundation as { applyAction?: unknown }).applyAction === 'undefined'
    );
  }

  static assertNoForbiddenExecutionPatterns(): boolean {
    const moduleDir = join(fileURLToPath(new URL('.', import.meta.url)));
    return scanModuleForForbiddenPatterns(moduleDir).length === 0;
  }

  static assertDependencyChain(): boolean {
    return (
      assertGovernanceDependenciesPresent() &&
      assertNoGovernanceBypass() &&
      assertWorld1Protected() &&
      assertNoRegistryRuntimeMutation() &&
      getDevPulseV2Owner('mobile_command_foundation').phase === 8.1 &&
      getDevPulseV2Owner('mobile_chat_interface').phase === 8.2 &&
      getDevPulseV2Owner('mobile_live_preview_foundation').phase === 8.3 &&
      getDevPulseV2Owner('mobile_approval_flow_foundation').phase === 8.4
    );
  }

  processApproval(input: ApprovalInput): MobileApprovalResult {
    const result = processMobileApproval(input);
    this.approvalResponses.push(cloneApprovalResult(result));
    this.publishSummary(result);
    return cloneApprovalResult(result);
  }

  getApprovalResponses(): MobileApprovalResult[] {
    return this.approvalResponses.map(cloneApprovalResult);
  }

  getApprovalByRequest(approvalRequestId: string): MobileApprovalResult | null {
    const result = this.approvalResponses.find((r) => r.approvalRequestId === approvalRequestId);
    return result ? cloneApprovalResult(result) : null;
  }

  getApprovalByProject(projectId: string): MobileApprovalResult | null {
    const result = this.approvalResponses.find((r) => r.projectId === projectId);
    return result ? cloneApprovalResult(result) : null;
  }

  getFoundationState(): MobileApprovalFlowFoundationState {
    return {
      foundationId: this.foundationId,
      approvalResponseCount: this.approvalResponses.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: MobileApprovalResult, input: ApprovalInput) {
    return buildMobileApprovalReport(this.getFoundationState(), result, input);
  }

  formatReport(result: MobileApprovalResult, input: ApprovalInput): string {
    return formatMobileApprovalReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getMobileApprovalGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoDuplicateApprovalTruth(): boolean {
    return assertNoDuplicateApprovalTruth();
  }

  checkNoApprovalSourceOfTruthClaim(): boolean {
    return assertNoApprovalSourceOfTruthClaim();
  }

  checkNoAutoApproval(): boolean {
    return assertNoAutoApproval();
  }

  private publishSummary(result: MobileApprovalResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Mobile approval response: ${result.approvalResponseId || result.approvalRequestId}`,
      summary: `Approval ${result.approvalType} — ${result.approvalDecision}, ${result.approvalReadiness}. Decision only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.approvalResponseId || result.approvalRequestId,
      status: 'INFO',
      warnings: ['Mobile approval flow foundation only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2MobileApprovalFlowFoundation(): DevPulseV2MobileApprovalFlowFoundation {
  singleton = new DevPulseV2MobileApprovalFlowFoundation();
  return singleton;
}

export function getDevPulseV2MobileApprovalFlowFoundation(): DevPulseV2MobileApprovalFlowFoundation {
  if (!singleton) {
    singleton = new DevPulseV2MobileApprovalFlowFoundation();
  }
  return singleton;
}

export function resetDevPulseV2MobileApprovalFlowFoundationForTests(): DevPulseV2MobileApprovalFlowFoundation {
  singleton = new DevPulseV2MobileApprovalFlowFoundation();
  return singleton;
}

export {
  approvalRequestKey,
  governanceGatesKey,
  APPROVAL_STATE_SEQUENCE,
  MOBILE_APPROVAL_FLOW_FOUNDATION_OWNER_MODULE,
  MOBILE_APPROVAL_FLOW_FOUNDATION_PASS_TOKEN,
};
