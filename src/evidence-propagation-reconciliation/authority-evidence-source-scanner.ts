/**
 * Authority evidence source scanner — per-authority workspace/run/proof audit (Phase 26.88).
 */

import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import type { RuntimeMaterializationTruthBridgeAssessment } from '../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js';
import type { BuildMaterializationTruthBridgeAssessment } from '../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js';
import type { LaunchReadinessVerdict } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { AuthorityEvidenceSource } from './evidence-propagation-reconciliation-types.js';
import { AUDITED_LAUNCH_AUTHORITIES } from './evidence-propagation-reconciliation-registry.js';

function stageLevelToVerdict(level: string | null | undefined): ConsistencyVerdict {
  if (level === 'PROVEN') return 'PROVEN';
  if (level === 'PARTIAL') return 'PARTIAL';
  if (level === 'NOT_PROVEN') return 'NOT_PROVEN';
  return 'UNKNOWN';
}

function applicationTruthToVerdict(truth: string | null | undefined): ConsistencyVerdict {
  if (truth === 'APPLICATION_PROVEN') return 'PROVEN';
  if (truth === 'APPLICATION_PARTIAL') return 'PARTIAL';
  if (truth === 'APPLICATION_NOT_PROVEN') return 'NOT_PROVEN';
  return 'UNKNOWN';
}

function launchVerdictToApplication(verdict: LaunchReadinessVerdict | null | undefined): ConsistencyVerdict {
  if (verdict === 'LAUNCH_READY' || verdict === 'LAUNCH_READY_WITH_WARNINGS') return 'PROVEN';
  if (verdict === 'NOT_LAUNCH_READY') return 'NOT_PROVEN';
  return 'PARTIAL';
}

function extractWorkspaceFromText(text: string): string | null {
  const match =
    text.match(/build-ready-idea-\d+/i) ??
    text.match(/world2-ws-\d+/i) ??
    text.match(/\.generated-builder-workspaces\/([a-zA-Z0-9_-]+)/);
  return match ? match[0].replace(/^.*\//, '') : null;
}

export function scanAuthorityEvidenceSources(input: {
  rootDir: string;
  runId?: string | null;
  founderTestAssessment?: FounderTestAssessment | null;
  autonomousBuildExecutionProof?: AutonomousBuildExecutionProofReport | null;
  runtimeMaterializationTruthBridge?: RuntimeMaterializationTruthBridgeAssessment | null;
  buildMaterializationTruthBridge?: BuildMaterializationTruthBridgeAssessment | null;
  launchReadinessVerdict?: LaunchReadinessVerdict | null;
  overrides?: AuthorityEvidenceSource[];
}): AuthorityEvidenceSource[] {
  if (input.overrides?.length) return input.overrides;

  const sources: AuthorityEvidenceSource[] = [];
  const runId = input.runId ?? input.founderTestAssessment?.run.runId ?? null;
  const runtimeBridge = input.runtimeMaterializationTruthBridge?.report ?? null;
  const buildBridge = input.buildMaterializationTruthBridge?.report ?? null;
  const autonomous = input.autonomousBuildExecutionProof ?? null;
  const founderTest = input.founderTestAssessment ?? null;

  const authoritativeWorkspace =
    runtimeBridge?.evidence.founderFlowRuntimeProof?.report.workspaceId ??
    runtimeBridge?.evidence.startupProofRepair?.report.entrypoint.workspaceId ??
    (buildBridge?.evidence.snapshot.workspaceExists
      ? extractWorkspaceFromText(
          buildBridge?.evidence.connectedBuild?.workspaceMaterialization.workspacePath ?? '',
        )
      : null) ??
    null;

  const buildStage = autonomous?.stageProofs.find((s) => s.stage === 'BUILD') ?? null;
  const runtimeStage = autonomous?.stageProofs.find((s) => s.stage === 'RUNTIME') ?? null;
  const previewStage = autonomous?.stageProofs.find((s) => s.stage === 'PREVIEW') ?? null;

  const autonomousWorkspace =
    extractWorkspaceFromText(autonomous?.recommendedFix ?? '') ??
    extractWorkspaceFromText(String(autonomous?.firstBrokenStage ?? '')) ??
    null;

  const founderAuthority = founderTest?.run.authorityResults ?? [];
  const livePreview = founderAuthority.find((a) => a.authorityId === 'LIVE_PREVIEW_REALITY');
  const verification = founderAuthority.find((a) => a.authorityId === 'VERIFICATION_REALITY');
  const launchCouncil = founderAuthority.find((a) => a.authorityId === 'LAUNCH_COUNCIL');
  const founderReality = founderAuthority.find((a) => a.authorityId === 'FOUNDER_REALITY');

  const scoreToVerdict = (score: number): ConsistencyVerdict => {
    if (score >= 80) return 'PROVEN';
    if (score >= 50) return 'PARTIAL';
    return 'NOT_PROVEN';
  };

  const runtimeBridgeConsumed = runtimeBridge != null;
  const runtimeAppVerdict = applicationTruthToVerdict(runtimeBridge?.finalApplicationTruth);

  for (const authorityId of AUDITED_LAUNCH_AUTHORITIES) {
    let displayName = authorityId.replace(/_/g, ' ');
    let workspaceId: string | null = authoritativeWorkspace;
    let authorityRunId = runId;
    let buildProofLevel: ConsistencyVerdict = 'UNKNOWN';
    let runtimeProofLevel: ConsistencyVerdict = 'UNKNOWN';
    let previewProofLevel: ConsistencyVerdict = 'UNKNOWN';
    let founderFlowProofLevel: ConsistencyVerdict = 'UNKNOWN';
    let applicationVerdict: ConsistencyVerdict = 'UNKNOWN';
    let consumesRuntimeBridge = false;
    let detail = '';

    switch (authorityId) {
      case 'AUTONOMOUS_BUILD_EXECUTION_PROOF':
        displayName = 'Autonomous Build Execution Proof';
        workspaceId = autonomousWorkspace ?? workspaceId;
        buildProofLevel = stageLevelToVerdict(buildStage?.proofLevel);
        runtimeProofLevel = stageLevelToVerdict(runtimeStage?.proofLevel);
        previewProofLevel = stageLevelToVerdict(previewStage?.proofLevel);
        applicationVerdict =
          buildProofLevel === 'NOT_PROVEN' || runtimeProofLevel === 'NOT_PROVEN' ? 'NOT_PROVEN' : buildProofLevel;
        detail = `chainConnected=${String(autonomous?.chainConnected)}, firstBroken=${autonomous?.firstBrokenStage ?? 'none'}`;
        break;
      case 'FOUNDER_EXECUTION_PROOF':
        displayName = 'Founder Execution Proof';
        applicationVerdict = founderTest?.run.executionChainTruth?.runtimeProven ? 'PROVEN' : 'PARTIAL';
        runtimeProofLevel = applicationVerdict;
        detail = 'derived from execution chain truth';
        break;
      case 'FOUNDER_TRUTH_MATRIX':
        displayName = 'Founder Truth Matrix';
        consumesRuntimeBridge = runtimeBridgeConsumed;
        applicationVerdict = runtimeBridgeConsumed ? runtimeAppVerdict : 'PARTIAL';
        detail = runtimeBridgeConsumed ? 'consumes runtime bridge via claim patches' : 'runtime bridge not injected';
        break;
      case 'LAUNCH_READINESS_PROOF':
        displayName = 'Launch Readiness Proof';
        applicationVerdict = launchVerdictToApplication(input.launchReadinessVerdict);
        consumesRuntimeBridge = runtimeBridgeConsumed;
        detail = `launchVerdict=${input.launchReadinessVerdict ?? 'unknown'}`;
        break;
      case 'LAUNCH_COUNCIL':
        displayName = 'Launch Council';
        applicationVerdict = launchCouncil ? scoreToVerdict(launchCouncil.normalizedScore) : 'UNKNOWN';
        detail = launchCouncil?.blockers.join('; ') || 'no council blockers';
        break;
      case 'FOUNDER_ACCEPTANCE':
        displayName = 'Founder Acceptance';
        applicationVerdict = founderTest?.verdict === 'FOUNDER_READY' ? 'PROVEN' : 'PARTIAL';
        detail = `orchestratorVerdict=${founderTest?.verdict ?? 'unknown'}`;
        break;
      case 'FOUNDER_REALITY':
        displayName = 'Founder Reality';
        applicationVerdict = founderReality ? scoreToVerdict(founderReality.normalizedScore) : 'PARTIAL';
        detail = founderReality?.blockers.join('; ') || 'founder reality surface scan';
        break;
      case 'LIVE_PREVIEW_REALITY':
        displayName = 'Live Preview Reality';
        previewProofLevel = livePreview
          ? scoreToVerdict(livePreview.normalizedScore)
          : stageLevelToVerdict(previewStage?.proofLevel);
        applicationVerdict = previewProofLevel;
        workspaceId =
          extractWorkspaceFromText(livePreview?.blockers.join(' ') ?? '') ?? workspaceId;
        detail = livePreview?.blockers.join('; ') || 'preview authority';
        break;
      case 'VERIFICATION_REALITY':
        displayName = 'Verification Reality';
        applicationVerdict = verification ? scoreToVerdict(verification.normalizedScore) : 'UNKNOWN';
        detail = verification?.blockers.join('; ') || 'verification authority';
        break;
      case 'PRODUCT_READINESS_SIMULATION':
        displayName = 'Product Readiness Simulation';
        applicationVerdict = 'PARTIAL';
        detail = 'simulation layer — partial until runtime bridge consumed';
        consumesRuntimeBridge = runtimeBridgeConsumed;
        break;
      case 'FOUNDER_TEST_INTEGRATION':
        displayName = 'Founder Test Integration';
        authorityRunId = founderTest?.run.runId ?? runId;
        applicationVerdict = founderTest?.verdict === 'FOUNDER_READY' ? 'PROVEN' : 'PARTIAL';
        runtimeProofLevel = founderTest?.run.executionChainTruth?.runtimeProven ? 'PROVEN' : 'NOT_PROVEN';
        detail = `score=${founderTest?.score.overall ?? 'n/a'}`;
        break;
      default:
        break;
    }

    if (runtimeBridge) {
      founderFlowProofLevel = runtimeBridge.evidence.founderFlow.founderFlowProven ? 'PROVEN' : 'NOT_PROVEN';
      if (authorityId === 'FOUNDER_TRUTH_MATRIX' || authorityId === 'LAUNCH_READINESS_PROOF') {
        runtimeProofLevel = runtimeBridge.evidence.proofAnalysis.applicationBoots ? 'PROVEN' : runtimeProofLevel;
      }
    }

    sources.push({
      readOnly: true,
      authorityId,
      displayName,
      workspaceId,
      runId: authorityRunId,
      buildProofLevel,
      runtimeProofLevel,
      previewProofLevel,
      founderFlowProofLevel,
      applicationVerdict,
      consumesRuntimeBridge,
      evidenceStale: false,
      contradictsAuthoritativeRuntime: false,
      detail,
    });
  }

  return sources;
}
