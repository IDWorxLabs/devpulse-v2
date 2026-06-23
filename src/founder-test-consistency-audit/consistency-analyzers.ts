/**
 * Phase 26.70 — Consistency analyzers and root-cause assignment (V1).
 */

import type { EvidenceLevel } from '../promise-reality-engine/promise-reality-engine-types.js';
import type { CollectedConsistencyEvidence } from './claim-evidence-collector.js';
import { booleanToConsistencyVerdict, scoreToConsistencyVerdict } from './claim-evidence-collector.js';
import {
  authoritativeOverridesStaleVerdict,
  shouldSuppressMisreportTokens,
  type ConsistencyAuthoritativeEvidence,
} from './resolve-consistency-authoritative-evidence.js';
import {
  AUDITED_CLAIM_DEFINITIONS,
  FOUNDER_TEST_CONSISTENCY_AUDIT_CORE_QUESTION,
  PARTIAL_SCORE_THRESHOLD,
} from './founder-test-consistency-audit-registry.js';
import type {
  AuditedClaimId,
  AuthorityVerdictRecord,
  ConsistencyAuditSections,
  ConsistencyClaimAudit,
  ConsistencyFailureKind,
  ConsistencyRootCause,
  ConsistencyVerdict,
  FounderTruthMatrix,
  FounderTruthMatrixRow,
} from './founder-test-consistency-audit-types.js';

function evidenceLevelToVerdict(level: EvidenceLevel | string | undefined): ConsistencyVerdict {
  switch (level) {
    case 'PROVEN':
      return 'PROVEN';
    case 'PARTIALLY_PROVEN':
      return 'PARTIAL';
    case 'UNPROVEN':
    case 'CONTRADICTED':
      return 'NOT_PROVEN';
    default:
      return 'UNKNOWN';
  }
}

function capabilityLevelToVerdict(level: string | undefined): ConsistencyVerdict {
  switch (level) {
    case 'PROVEN':
      return 'PROVEN';
    case 'PARTIALLY_PROVEN':
      return 'PARTIAL';
    case 'NOT_PROVEN':
      return 'NOT_PROVEN';
    default:
      return 'UNKNOWN';
  }
}

function normalizeVerdicts(verdicts: ConsistencyVerdict[]): ConsistencyVerdict[] {
  return verdicts.filter((v) => v !== 'UNKNOWN');
}

function hasVerdictDisagreement(verdicts: ConsistencyVerdict[]): boolean {
  return [...new Set(normalizeVerdicts(verdicts))].length > 1;
}

function selectFinalTruth(verdicts: ConsistencyVerdict[]): ConsistencyVerdict {
  const normalized = normalizeVerdicts(verdicts);
  if (normalized.length === 0) return 'UNKNOWN';
  if (normalized.every((v) => v === 'PROVEN')) return 'PROVEN';
  if (normalized.every((v) => v === 'NOT_PROVEN')) return 'NOT_PROVEN';
  if (normalized.includes('NOT_PROVEN') && !normalized.includes('PROVEN')) return 'NOT_PROVEN';
  if (normalized.includes('PROVEN') && normalized.includes('NOT_PROVEN')) return 'PARTIAL';
  if (normalized.includes('PARTIAL')) return 'PARTIAL';
  return normalized[0] ?? 'UNKNOWN';
}

function computeConfidence(input: {
  verdicts: ConsistencyVerdict[];
  contradictionDetected: boolean;
  rootCause: ConsistencyRootCause;
}): number {
  const normalized = normalizeVerdicts(input.verdicts);
  let confidence = normalized.length <= 1 ? 90 : normalized.length === 2 ? 65 : 45;
  if (input.contradictionDetected) confidence -= 20;
  if (input.rootCause === 'SCORING_DEFECT') confidence -= 10;
  if (input.rootCause === 'UNKNOWN') confidence -= 15;
  if (input.rootCause === 'REAL_PRODUCT_GAP' && normalized.includes('NOT_PROVEN')) confidence += 10;
  return Math.max(0, Math.min(100, Math.round(confidence)));
}

function assignRootCause(input: {
  failureKinds: ConsistencyFailureKind[];
  executionProofStale: boolean;
  evidenceExistsButUnused: boolean;
  questionScopeDiffers: boolean;
}): ConsistencyRootCause {
  if (input.failureKinds.includes('SCORING_DEFECT')) return 'SCORING_DEFECT';
  if (input.executionProofStale) return 'STALE_EVIDENCE';
  if (input.failureKinds.includes('EVIDENCE_PROPAGATION_FAILURE') || input.evidenceExistsButUnused) {
    return 'EVIDENCE_PROPAGATION_FAILURE';
  }
  if (input.failureKinds.includes('AUTHORITY_DISAGREEMENT') || input.questionScopeDiffers) {
    return 'AUTHORITY_DISAGREEMENT';
  }
  if (input.failureKinds.includes('REAL_PRODUCT_GAP')) return 'REAL_PRODUCT_GAP';
  if (input.failureKinds.includes('CONSISTENCY_FAILURE')) return 'AUTHORITY_DISAGREEMENT';
  return 'UNKNOWN';
}

function applyAuthoritativeVerdict(
  authoritative: ConsistencyAuthoritativeEvidence,
  dimension: 'build' | 'runtime' | 'preview' | 'launch',
  staleVerdict: ConsistencyVerdict,
): ConsistencyVerdict {
  if (!authoritative.authoritativeActive) return staleVerdict;
  const authoritativeVerdict =
    dimension === 'build'
      ? authoritative.buildVerdict
      : dimension === 'runtime'
        ? authoritative.runtimeVerdict
        : dimension === 'preview'
          ? authoritative.previewVerdict
          : authoritative.launchVerdict;
  if (authoritativeOverridesStaleVerdict(authoritative, dimension, staleVerdict)) {
    return authoritativeVerdict;
  }
  if (authoritativeVerdict !== 'UNKNOWN') return authoritativeVerdict;
  return staleVerdict;
}

function pushAuthoritativeEvidence(
  pushAuthority: (
    authorityId: string,
    displayName: string,
    verdict: ConsistencyVerdict,
    score: number | null,
    detail: string,
    evidenceSource: string,
  ) => void,
  authoritative: ConsistencyAuthoritativeEvidence,
  dimension: 'build' | 'runtime' | 'preview' | 'launch',
): void {
  if (!authoritative.authoritativeActive) return;
  const verdict =
    dimension === 'build'
      ? authoritative.buildVerdict
      : dimension === 'runtime'
        ? authoritative.runtimeVerdict
        : dimension === 'preview'
          ? authoritative.previewVerdict
          : authoritative.launchVerdict;
  pushAuthority(
    'authoritative-post-convergence-evidence',
    'Authoritative Post-Convergence Evidence',
    verdict,
    null,
    `workspace=${authoritative.workspaceId ?? 'n/a'} runId=${authoritative.runId ?? 'n/a'} manifest=${authoritative.manifestId ?? 'n/a'} missingArtifacts=${authoritative.missingArtifacts}`,
    authoritative.evidenceSource,
  );
}

function buildClaimAudit(claimId: AuditedClaimId, evidence: CollectedConsistencyEvidence): ConsistencyClaimAudit {
  const definition = AUDITED_CLAIM_DEFINITIONS.find((entry) => entry.claimId === claimId)!;
  const { input } = evidence;
  const authoritative = input.authoritative;
  const authoritativeActive = authoritative.authoritativeActive;
  const suppressMisreport = shouldSuppressMisreportTokens(authoritative);
  const founderReport = input.founderExecutionProof.report;
  const launchReport = input.launchReadiness.report;
  const buildProof = input.autonomousBuildExecutionProof;

  const authorityVerdicts: AuthorityVerdictRecord[] = [];
  const evidenceSources: string[] = [];
  const failureKinds: ConsistencyFailureKind[] = [];

  const pushAuthority = (
    authorityId: string,
    displayName: string,
    verdict: ConsistencyVerdict,
    score: number | null,
    detail: string,
    evidenceSource: string,
  ) => {
    authorityVerdicts.push({
      readOnly: true,
      authorityId,
      displayName,
      verdict,
      score,
      detail,
      evidenceSource,
    });
    if (!evidenceSources.includes(evidenceSource)) evidenceSources.push(evidenceSource);
  };

  let chatVerdict: ConsistencyVerdict = 'UNKNOWN';
  let founderTestVerdict: ConsistencyVerdict = 'UNKNOWN';
  let contradictionReason = '';
  let questionScopeDiffers = false;
  let evidenceExistsButUnused = false;
  let executionProofStale = false;

  const findAuthority = (authorityId: string) =>
    input.founderTestAssessment.run.authorityResults.find((entry) => entry.authorityId === authorityId);

  switch (claimId) {
    case 'AIDEVENGINE_BUILDS_APPLICATIONS': {
      const req = findAuthority('REQUIREMENT_REALITY');
      const buildEntry = input.capabilityTruthRegistry.entries.find((e) => e.capabilityId === 'build_materialization');
      const staleFounderVerdict = scoreToConsistencyVerdict(req?.normalizedScore ?? null);
      founderTestVerdict = applyAuthoritativeVerdict(authoritative, 'build', staleFounderVerdict);
      chatVerdict = authoritativeActive
        ? authoritative.buildVerdict
        : capabilityLevelToVerdict(buildEntry?.truthLevel);
      pushAuthoritativeEvidence(pushAuthority, authoritative, 'build');
      pushAuthority('capability-truth-registry', 'Capability Truth Registry', chatVerdict, null, buildEntry?.detail ?? 'n/a', 'capability-truth-registry');
      if (req) {
        pushAuthority(
          req.authorityId,
          req.displayName,
          staleFounderVerdict,
          req.normalizedScore,
          authoritativeActive ? `${req.blockers[0] ?? 'assessed'} (superseded by authoritative bridge)` : req.blockers[0] ?? 'assessed',
          req.sourceModule,
        );
      }
      pushAuthority(
        'autonomous-build-execution-proof',
        'Autonomous Build Execution Proof',
        authoritativeActive
          ? authoritative.buildVerdict
          : booleanToConsistencyVerdict(buildProof.founderQuestions.canActuallyBuildSoftware),
        buildProof.stageProofs.find((s) => s.stage === 'BUILD')?.score ?? null,
        buildProof.recommendedFix,
        'autonomous-build-execution-proof',
      );
      pushAuthority(
        'connected-execution-chain-truth',
        'Connected Execution Chain Truth',
        booleanToConsistencyVerdict(input.executionChainTruth.buildProven),
        null,
        `buildProven=${input.executionChainTruth.buildProven}`,
        'connected-execution-chain-truth',
      );
      if (
        input.executionChainTruth.buildProven &&
        staleFounderVerdict === 'NOT_PROVEN' &&
        !authoritativeOverridesStaleVerdict(authoritative, 'build', staleFounderVerdict)
      ) {
        executionProofStale = true;
        failureKinds.push('CONSISTENCY_FAILURE');
      }
      if (!input.executionChainTruth.buildProven && !authoritativeActive) failureKinds.push('REAL_PRODUCT_GAP');
      break;
    }
    case 'WORLD2_EXECUTES_PLANS': {
      const exec = findAuthority('EXECUTION_PROOF_EVOLUTION');
      const staleFounderVerdict = scoreToConsistencyVerdict(exec?.normalizedScore ?? null);
      founderTestVerdict = applyAuthoritativeVerdict(authoritative, 'runtime', staleFounderVerdict);
      chatVerdict = booleanToConsistencyVerdict(input.executionChainTruth.planProven);
      pushAuthoritativeEvidence(pushAuthority, authoritative, 'runtime');
      pushAuthority('connected-execution-chain-truth', 'Connected Execution Chain Truth', chatVerdict, null, `planProven=${input.executionChainTruth.planProven}`, 'connected-execution-chain-truth');
      if (exec) pushAuthority(exec.authorityId, exec.displayName, staleFounderVerdict, exec.normalizedScore, exec.warnings[0] ?? 'assessed', exec.sourceModule);
      pushAuthority('founder-execution-proof', 'Founder Execution Proof', founderReport.founderExecutionState.includes('PROVEN') ? 'PROVEN' : 'NOT_PROVEN', founderReport.founderExecutionScore, founderReport.founderExecutionState, 'founder-execution-proof');
      if (
        input.executionChainTruth.planProven &&
        staleFounderVerdict === 'NOT_PROVEN' &&
        !authoritativeOverridesStaleVerdict(authoritative, 'runtime', staleFounderVerdict)
      ) {
        executionProofStale = true;
        failureKinds.push('CONSISTENCY_FAILURE');
      }
      questionScopeDiffers =
        !authoritativeActive &&
        input.executionChainTruth.planProven !== (exec?.normalizedScore ?? 0 >= 70);
      break;
    }
    case 'LIVE_PREVIEW_RUNS_APPLICATIONS': {
      const preview = findAuthority('LIVE_PREVIEW_REALITY');
      const staleFounderVerdict = scoreToConsistencyVerdict(preview?.normalizedScore ?? null);
      founderTestVerdict = applyAuthoritativeVerdict(authoritative, 'preview', staleFounderVerdict);
      chatVerdict = authoritativeActive
        ? authoritative.previewVerdict
        : booleanToConsistencyVerdict(input.executionChainTruth.previewProven);
      pushAuthoritativeEvidence(pushAuthority, authoritative, 'preview');
      pushAuthority('connected-execution-chain-truth', 'Connected Execution Chain Truth', booleanToConsistencyVerdict(input.executionChainTruth.previewProven), null, `previewProven=${input.executionChainTruth.previewProven}`, 'connected-execution-chain-truth');
      if (preview) {
        pushAuthority(
          preview.authorityId,
          preview.displayName,
          staleFounderVerdict,
          preview.normalizedScore,
          authoritativeActive ? `${preview.blockers[0] ?? 'assessed'} (superseded by authoritative bridge)` : preview.blockers[0] ?? 'assessed',
          preview.sourceModule,
        );
      }
      if (!input.executionChainTruth.previewProven && !authoritativeActive) failureKinds.push('REAL_PRODUCT_GAP');
      break;
    }
    case 'APPLICATION_WORKS':
    case 'APPLICATION_RUNS':
    case 'APPLICATION_REACHABLE':
    case 'FOUNDER_CAN_USE_APPLICATION': {
      const preview = findAuthority('LIVE_PREVIEW_REALITY');
      const mobile = findAuthority('MOBILE_RUNTIME_REALITY');
      const staleFounderVerdict = scoreToConsistencyVerdict(preview?.normalizedScore ?? mobile?.normalizedScore ?? null);
      founderTestVerdict = applyAuthoritativeVerdict(authoritative, 'runtime', staleFounderVerdict);
      chatVerdict = authoritativeActive
        ? authoritative.runtimeVerdict
        : booleanToConsistencyVerdict(input.executionChainTruth.runtimeProven || input.executionChainTruth.previewProven);
      pushAuthoritativeEvidence(pushAuthority, authoritative, 'runtime');
      pushAuthority('connected-execution-chain-truth', 'Connected Execution Chain Truth', booleanToConsistencyVerdict(input.executionChainTruth.runtimeProven), null, `runtimeProven=${input.executionChainTruth.runtimeProven}`, 'connected-execution-chain-truth');
      pushAuthority('connected-execution-chain-truth-preview', 'Connected Execution Chain Truth (preview)', booleanToConsistencyVerdict(input.executionChainTruth.previewProven), null, `previewProven=${input.executionChainTruth.previewProven}`, 'connected-execution-chain-truth');
      if (preview) {
        pushAuthority(
          preview.authorityId,
          preview.displayName,
          scoreToConsistencyVerdict(preview.normalizedScore),
          preview.normalizedScore,
          authoritativeActive ? `${preview.blockers[0] ?? 'assessed'} (superseded by authoritative bridge)` : preview.blockers[0] ?? 'assessed',
          preview.sourceModule,
        );
      }
      if (
        input.executionChainTruth.runtimeProven &&
        staleFounderVerdict === 'NOT_PROVEN' &&
        !authoritativeOverridesStaleVerdict(authoritative, 'runtime', staleFounderVerdict)
      ) {
        executionProofStale = true;
        failureKinds.push('EVIDENCE_PROPAGATION_FAILURE');
      }
      break;
    }
    case 'VERIFICATION_PROVES_READINESS': {
      const verify = findAuthority('VERIFICATION_REALITY');
      founderTestVerdict = scoreToConsistencyVerdict(verify?.normalizedScore ?? null);
      chatVerdict = booleanToConsistencyVerdict(input.executionChainTruth.verificationProven);
      pushAuthority('connected-execution-chain-truth', 'Connected Execution Chain Truth', chatVerdict, null, `verificationProven=${input.executionChainTruth.verificationProven}`, 'connected-execution-chain-truth');
      if (verify) pushAuthority(verify.authorityId, verify.displayName, founderTestVerdict, verify.normalizedScore, verify.blockers[0] ?? 'assessed', verify.sourceModule);
      if (!input.executionChainTruth.verificationProven) failureKinds.push('REAL_PRODUCT_GAP');
      break;
    }
    case 'IDEA_TO_LAUNCH': {
      const staleFounderVerdict = scoreToConsistencyVerdict(input.founderTestAssessment.score.overall);
      founderTestVerdict = applyAuthoritativeVerdict(authoritative, 'launch', staleFounderVerdict);
      chatVerdict = authoritativeActive
        ? authoritative.launchVerdict
        : booleanToConsistencyVerdict(input.executionChainTruth.launchProven);
      pushAuthoritativeEvidence(pushAuthority, authoritative, 'launch');
      pushAuthority('founder-execution-proof', 'Founder Execution Proof', founderReport.launchRecommendation.includes('RECOMMEND') ? 'PROVEN' : 'NOT_PROVEN', founderReport.executionCompleteness.overallFounderProofPercent, founderReport.launchRecommendation, 'founder-execution-proof');
      pushAuthority('founder-test-integration', 'Founder Test Integration', staleFounderVerdict, input.founderTestAssessment.score.overall, input.founderTestAssessment.verdict, 'founder-test-integration');
      pushAuthority('launch-readiness', 'Launch Readiness', launchReport.launchReadinessVerdict === 'LAUNCH_READY' ? 'PROVEN' : 'PARTIAL', launchReport.founderReadinessScore, launchReport.launchReadinessVerdict, 'founder-test-launch-readiness');
      if (input.promiseRealityEngine && input.promiseRealityEngine.claimsEvaluated > 0) {
        evidenceExistsButUnused = !input.promiseRealityEngine;
      }
      questionScopeDiffers =
        !authoritativeActive &&
        input.executionChainTruth.launchProven !== (launchReport.launchReadinessVerdict === 'LAUNCH_READY');
      break;
    }
    case 'CHAT_INTELLIGENCE_READINESS': {
      const chat = input.chatIntelligenceReality;
      founderTestVerdict = scoreToConsistencyVerdict(chat.chatIntelligenceScore);
      chatVerdict = chat.blocksLaunchReadiness ? 'NOT_PROVEN' : founderTestVerdict;
      pushAuthority('chat-intelligence-reality', 'Chat Intelligence Reality', founderTestVerdict, chat.chatIntelligenceScore, `${chat.scenariosPassed}/${chat.scenariosRun} passed`, 'chat-intelligence-reality');
      if (input.chatStressSimulation) {
        const stress = input.chatStressSimulation;
        pushAuthority('chat-stress-simulation', 'Chat Stress Simulation', scoreToConsistencyVerdict(stress.overallScore), stress.overallScore, `${stress.passedCount}/${stress.totalScenarios} passed`, 'founder-test-chat-stress-simulation');
        if ((chat.chatIntelligenceScore === 0 || chat.chatIntelligenceScore < PARTIAL_SCORE_THRESHOLD) && stress.passedCount === stress.totalScenarios && stress.totalScenarios > 0) {
          failureKinds.push('SCORING_DEFECT');
          contradictionReason = `Chat Intelligence score=${chat.chatIntelligenceScore} but chat stress passed ${stress.passedCount}/${stress.totalScenarios}`;
        }
        if ((chat.chatIntelligenceScore === 0 || chat.chatIntelligenceScore < PARTIAL_SCORE_THRESHOLD) && chat.scenariosPassed === chat.scenariosRun && chat.scenariosRun > 0) {
          failureKinds.push('SCORING_DEFECT');
          contradictionReason = `Chat Intelligence score=${chat.chatIntelligenceScore} but bounded scenarios passed ${chat.scenariosPassed}/${chat.scenariosRun}`;
        }
      }
      break;
    }
    case 'LAUNCH_DAY_READINESS': {
      const launchDay = input.productReadiness?.simulations.find((s) => s.id === 'LAUNCH_DAY');
      founderTestVerdict = scoreToConsistencyVerdict(launchDay?.score ?? null);
      chatVerdict = founderTestVerdict;
      if (launchDay) {
        pushAuthority('product-readiness', 'Product Readiness — Launch Day', scoreToConsistencyVerdict(launchDay.score), launchDay.score, launchDay.verdict, 'founder-test-product-readiness');
        if (launchDay.verdict === 'LAUNCH_BLOCKED' && launchDay.score >= 70) {
          failureKinds.push('SCORING_DEFECT');
          contradictionReason = `Launch Day score=${launchDay.score} but verdict=${launchDay.verdict}`;
        }
        if (launchDay.verdict === 'LAUNCH_READY' && launchDay.score < 65) {
          failureKinds.push('AUTHORITY_DISAGREEMENT');
          contradictionReason = `Launch Day verdict=${launchDay.verdict} vs score=${launchDay.score}`;
        }
      }
      pushAuthority('launch-readiness', 'Launch Readiness', launchReport.launchReadinessVerdict === 'LAUNCH_READY' ? 'PROVEN' : 'NOT_PROVEN', launchReport.founderReadinessScore, launchReport.launchReadinessVerdict, 'founder-test-launch-readiness');
      break;
    }
    case 'AUTONOMOUS_BUILD_EXECUTION_PROOF': {
      const staleFounderVerdict = booleanToConsistencyVerdict(buildProof.chainConnected);
      founderTestVerdict = applyAuthoritativeVerdict(authoritative, 'build', staleFounderVerdict);
      chatVerdict = authoritativeActive
        ? authoritative.buildVerdict
        : booleanToConsistencyVerdict(buildProof.founderQuestions.canActuallyBuildSoftware);
      pushAuthoritativeEvidence(pushAuthority, authoritative, 'build');
      pushAuthority('execution-proof-contradiction-elimination', 'Execution Proof Contradiction Elimination', authoritative.contradictionEliminationPassed ? 'PROVEN' : 'PARTIAL', null, `eliminationPassed=${authoritative.contradictionEliminationPassed}`, 'execution-proof-contradiction-elimination');
      pushAuthority('autonomous-build-execution-proof', 'Autonomous Build Execution Proof', staleFounderVerdict, buildProof.stageProofs.find((s) => s.stage === 'BUILD')?.score ?? null, buildProof.recommendedFix, 'autonomous-build-execution-proof');
      pushAuthority('connected-execution-chain-truth', 'Connected Execution Chain Truth', booleanToConsistencyVerdict(input.executionChainTruth.buildProven), null, `buildProven=${input.executionChainTruth.buildProven}`, 'connected-execution-chain-truth');
      pushAuthority('founder-execution-proof', 'Founder Execution Proof — Build', booleanToConsistencyVerdict(founderReport.proofBundle.buildEvidence.proven), founderReport.proofBundle.buildEvidence.proofPercent, founderReport.proofBundle.buildEvidence.evidenceSummary, 'founder-execution-proof');
      if (
        input.executionChainTruth.buildProven &&
        !buildProof.chainConnected &&
        !authoritativeActive &&
        !suppressMisreport
      ) {
        failureKinds.push('EVIDENCE_PROPAGATION_FAILURE');
        evidenceExistsButUnused = true;
      }
      if (!buildProof.chainConnected && !input.executionChainTruth.buildProven && !authoritativeActive) {
        failureKinds.push('REAL_PRODUCT_GAP');
      }
      break;
    }
    case 'LAUNCH_READINESS_VERDICT': {
      founderTestVerdict = scoreToConsistencyVerdict(launchReport.founderReadinessScore);
      chatVerdict = launchReport.launchReadinessVerdict === 'LAUNCH_READY' ? 'PROVEN' : launchReport.launchReadinessVerdict === 'LAUNCH_READY_WITH_WARNINGS' ? 'PARTIAL' : 'NOT_PROVEN';
      pushAuthority('founder-test-launch-readiness', 'Founder Test Launch Readiness', chatVerdict, launchReport.founderReadinessScore, launchReport.launchReadinessVerdict, 'founder-test-launch-readiness');
      pushAuthority('founder-test-integration', 'Founder Test Integration', scoreToConsistencyVerdict(input.founderTestAssessment.score.overall), input.founderTestAssessment.score.overall, input.founderTestAssessment.verdict, 'founder-test-integration');
      if (input.productReadiness) {
        pushAuthority('product-readiness', 'Product Readiness', input.productReadiness.verdict === 'LAUNCH_READY' ? 'PROVEN' : 'NOT_PROVEN', input.productReadiness.readinessScore, input.productReadiness.verdict, 'founder-test-product-readiness');
        if (input.productReadiness.verdict === 'LAUNCH_BLOCKED' && launchReport.launchReadinessVerdict === 'LAUNCH_READY') {
          failureKinds.push('AUTHORITY_DISAGREEMENT');
          contradictionReason = `Product readiness ${input.productReadiness.verdict} vs launch readiness ${launchReport.launchReadinessVerdict}`;
        }
      }
      break;
    }
  }

  if (input.executionProofSync.contradictionCount > 0 && !authoritativeActive) {
    executionProofStale = true;
    failureKinds.push('CONSISTENCY_FAILURE');
    if (!contradictionReason) {
      contradictionReason = `${input.executionProofSync.contradictionCount} execution proof contradiction(s) from stale authority text`;
    }
  }

  if (authoritativeActive && suppressMisreport) {
    const misreportIndex = failureKinds.indexOf('EVIDENCE_PROPAGATION_FAILURE');
    if (misreportIndex >= 0 && authoritative.buildMaterializationProven) {
      failureKinds.splice(misreportIndex, 1);
    }
    executionProofStale = false;
  }

  const allVerdicts = [chatVerdict, founderTestVerdict, ...authorityVerdicts.map((a) => a.verdict)];
  const contradictionDetected = hasVerdictDisagreement(allVerdicts) || failureKinds.length > 0;
  if (contradictionDetected && !contradictionReason) {
    contradictionReason = `Verdict spread: ${[...new Set(normalizeVerdicts(allVerdicts))].join(' vs ')}`;
  }
  if (hasVerdictDisagreement(allVerdicts) && !failureKinds.includes('CONSISTENCY_FAILURE')) {
    failureKinds.push('CONSISTENCY_FAILURE');
  }

  const rootCause = assignRootCause({ failureKinds, executionProofStale, evidenceExistsButUnused, questionScopeDiffers });

  return {
    readOnly: true,
    claimId,
    claim: definition.claim,
    chatVerdict,
    founderTestVerdict,
    authorityVerdicts,
    evidenceSources,
    contradictionDetected,
    contradictionReason,
    rootCause,
    finalTruth: selectFinalTruth(allVerdicts),
    confidence: computeConfidence({ verdicts: allVerdicts, contradictionDetected, rootCause }),
    failureKinds,
  };
}

export function analyzeAllConsistencyClaims(evidence: CollectedConsistencyEvidence): ConsistencyClaimAudit[] {
  return AUDITED_CLAIM_DEFINITIONS.map((d) => buildClaimAudit(d.claimId, evidence));
}

export function buildFounderTruthMatrix(claimAudits: ConsistencyClaimAudit[]): FounderTruthMatrix {
  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    coreQuestion: FOUNDER_TEST_CONSISTENCY_AUDIT_CORE_QUESTION,
    rows: claimAudits.map((audit) => ({
      readOnly: true,
      claim: audit.claim,
      claimId: audit.claimId,
      finalTruth: audit.finalTruth,
      rootCause: audit.rootCause,
      confidence: audit.confidence,
      contradictionDetected: audit.contradictionDetected,
    })),
    authoritativeNote:
      'FOUNDER_TRUTH_MATRIX — authoritative reconciliation input for Founder Testing before future launch verdicts.',
  };
}

export function buildConsistencyAuditSections(claimAudits: ConsistencyClaimAudit[]): ConsistencyAuditSections {
  const sections: ConsistencyAuditSections = {
    readOnly: true,
    contradictionsDetected: [],
    scoringDefects: [],
    evidencePropagationFailures: [],
    authorityDisagreements: [],
    realProductGaps: [],
    singleSourceOfTruth: [],
  };
  for (const audit of claimAudits) {
    sections.singleSourceOfTruth.push(`${audit.claim}: final=${audit.finalTruth} (${audit.rootCause}, confidence=${audit.confidence})`);
    if (audit.contradictionDetected) sections.contradictionsDetected.push(`${audit.claim} — ${audit.contradictionReason}`);
    if (audit.failureKinds.includes('SCORING_DEFECT')) sections.scoringDefects.push(`${audit.claim} — ${audit.contradictionReason || audit.rootCause}`);
    if (audit.rootCause === 'EVIDENCE_PROPAGATION_FAILURE') sections.evidencePropagationFailures.push(`${audit.claim} — evidence existed but downstream authority did not consume it`);
    if (audit.rootCause === 'AUTHORITY_DISAGREEMENT') sections.authorityDisagreements.push(`${audit.claim} — authorities evaluated different questions or verdicts diverged`);
    if (audit.rootCause === 'REAL_PRODUCT_GAP') sections.realProductGaps.push(`${audit.claim} — evidence genuinely missing across chain`);
  }
  return sections;
}

export function buildFounderAnswerSummary(claimAudits: ConsistencyClaimAudit[]) {
  const proven = claimAudits.filter((a) => a.finalTruth === 'PROVEN').map((a) => a.claim);
  const broken = claimAudits.filter((a) => a.finalTruth === 'NOT_PROVEN').map((a) => a.claim);
  const contradictions = claimAudits.filter((a) => a.contradictionDetected);
  const productGaps = claimAudits.filter((a) => a.rootCause === 'REAL_PRODUCT_GAP');
  const testingGaps = claimAudits.filter((a) => ['SCORING_DEFECT', 'STALE_EVIDENCE', 'EVIDENCE_PROPAGATION_FAILURE'].includes(a.rootCause));
  return {
    whatIsTrueNow: proven.length ? `Currently proven or partially supported: ${proven.join('; ')}.` : 'No audited claims reach PROVEN final truth right now.',
    whatIsBrokenNow: broken.length ? `Currently not proven: ${broken.join('; ')}.` : 'No audited claims are fully NOT_PROVEN.',
    wrongAuthorityWhenDisagree: contradictions.length
      ? contradictions.map((a) => `${a.claim}: prefer finalTruth=${a.finalTruth}`).slice(0, 3).join(' | ')
      : 'No major cross-authority disagreement requiring override.',
    productGapVsTestingGap: testingGaps.length >= productGaps.length
      ? `Testing-system gap dominant (${testingGaps.length} vs ${productGaps.length} product gaps).`
      : `Product gap dominant (${productGaps.length} vs ${testingGaps.length} testing-system issues).`,
  };
}
