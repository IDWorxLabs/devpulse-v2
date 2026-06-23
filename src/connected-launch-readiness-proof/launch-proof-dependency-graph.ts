/**
 * Launch Proof Dependency Graph — exact launch blockers and dependency trace (Phase 26.85).
 */

import { runExecutionReadinessGate } from '../execution-readiness-gate/index.js';
import { resolveExecutionChainStageContext } from '../founder-test-integration/connected-execution-chain-stage-resolver.js';
import { CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE } from '../founder-test-integration/connected-execution-chain-truth.js';
import { getLatestFounderTestAssessment } from '../founder-test-integration/founder-test-integration-history.js';
import { getLatestProductReadinessHistoryEntry } from '../founder-test-product-readiness/product-readiness-history.js';
import { assessMobileRuntimeExperienceReality } from '../mobile-runtime-experience-reality/index.js';
import {
  assessRepositoryTypecheckReality,
  getLatestRepositoryTypecheckBaseline,
} from '../repository-typecheck-reality/index.js';
import { assessConnectedLaunchReadinessProof } from './connected-launch-readiness-proof-authority.js';
import { isAcceptanceRejected } from './launch-acceptance-analyzer.js';
import { hasCriticalBlockers } from './launch-blocker-analyzer.js';
import { hasCriticalClaimViolations } from './launch-claim-reality-analyzer.js';
import { isLaunchReadyState } from './launch-readiness-analyzer.js';
import { detectLaunchProofContradictions } from './launch-proof-contradiction-detector.js';
import type {
  BuildLaunchProofDependencyGraphInput,
  FirstLaunchBlockerResolution,
  LaunchBlockerSeverity,
  LaunchNotProvenExplanation,
  LaunchProofDependencyEntry,
  LaunchProofDependencyGraph,
  LaunchProofDependencyProofLevel,
  LaunchProofLevel,
  LaunchReadinessProofReport,
} from './connected-launch-readiness-proof-types.js';

function proofFromBoolean(proven: boolean): LaunchProofDependencyProofLevel {
  return proven ? 'PROVEN' : 'NOT_PROVEN';
}

function entry(
  dependencyId: string,
  dependencyName: string,
  status: string,
  source: string,
  proofLevel: LaunchProofDependencyProofLevel,
  blocksLaunch: boolean,
  reason: string,
): LaunchProofDependencyEntry {
  return {
    readOnly: true,
    dependencyId,
    dependencyName,
    status,
    source,
    proofLevel,
    blocksLaunch,
    reason,
  };
}

function severityRank(severity: LaunchBlockerSeverity): number {
  switch (severity) {
    case 'CRITICAL':
      return 4;
    case 'HIGH':
      return 3;
    case 'MEDIUM':
      return 2;
    default:
      return 1;
  }
}

export function resolveFirstLaunchBlocker(input: {
  launchReport: LaunchReadinessProofReport | null;
  launchProofLevel: LaunchProofLevel;
  launchProven: boolean;
  dependencies: readonly LaunchProofDependencyEntry[];
}): FirstLaunchBlockerResolution | null {
  if (input.launchProven) return null;

  const report = input.launchReport;
  if (!report) {
    const unproven = input.dependencies.find((d) => d.blocksLaunch && d.proofLevel !== 'PROVEN');
    if (unproven) {
      return {
        readOnly: true,
        blockerId: unproven.dependencyId,
        blockerName: unproven.dependencyName,
        authority: unproven.source,
        proofSource: unproven.source,
        reason: unproven.reason,
        severity: 'CRITICAL',
      };
    }
    return {
      readOnly: true,
      blockerId: 'launch-proof-not-assessed',
      blockerName: 'Launch readiness proof not assessed',
      authority: 'connected-launch-readiness-proof',
      proofSource: 'connected-launch-readiness-proof',
      reason: 'Connected launch readiness proof has not been resolved for this chain context',
      severity: 'CRITICAL',
    };
  }

  if (isAcceptanceRejected(report.acceptance.acceptanceState)) {
    return {
      readOnly: true,
      blockerId: 'launch-acceptance-rejected',
      blockerName: 'Launch acceptance rejected',
      authority: 'launch-acceptance-analyzer',
      proofSource: report.acceptance.acceptanceReasons[0] ?? 'launch-acceptance-analyzer',
      reason: report.acceptance.acceptanceReasons.join('; ') || `Acceptance state: ${report.acceptance.acceptanceState}`,
      severity: 'CRITICAL',
    };
  }

  if (!report.launchCriteriaSatisfied) {
    const evidence = report.evidence;
    const stages: Array<[string, boolean]> = [
      ['Requirements', evidence.requirementsProven],
      ['Plan', evidence.planProven],
      ['Build', evidence.buildProven],
      ['Runtime', evidence.runtimeProven],
      ['Preview', evidence.previewProven],
      ['Verification', evidence.verificationProven],
    ];
    const broken = stages.find(([, proven]) => !proven);
    return {
      readOnly: true,
      blockerId: 'launch-criteria-unsatisfied',
      blockerName: broken ? `${broken[0]} not proven` : 'Launch criteria unsatisfied',
      authority: 'launch-proof-chain-resolver',
      proofSource: 'launch-proof-chain-resolver',
      reason: broken
        ? `${broken[0]} execution proof is not PROVEN — launch criteria require all upstream stages`
        : 'Launch criteria not satisfied by connected execution evidence',
      severity: 'CRITICAL',
    };
  }

  if (!report.verificationProven) {
    return {
      readOnly: true,
      blockerId: 'verification-not-proven',
      blockerName: 'Verification not proven',
      authority: 'connected-verification-execution-proof',
      proofSource: 'connected-verification-execution-proof',
      reason: 'Verification execution proof level is not PROVEN',
      severity: 'CRITICAL',
    };
  }

  if (!report.executionChainConnected) {
    return {
      readOnly: true,
      blockerId: 'execution-chain-disconnected',
      blockerName: 'Execution chain disconnected',
      authority: 'connected-execution-chain-stage-resolver',
      proofSource: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
      reason: 'Core execution chain is not connected through VERIFY',
      severity: 'CRITICAL',
    };
  }

  if (hasCriticalBlockers(report.blockers) && report.blockers.blockers[0]) {
    const blocker = report.blockers.blockers[0];
    return {
      readOnly: true,
      blockerId: blocker.blockerId,
      blockerName: blocker.blockerTitle,
      authority: blocker.sourceAuthority,
      proofSource: blocker.sourceAuthority,
      reason: blocker.blockerReason,
      severity: blocker.severity,
    };
  }

  if (hasCriticalClaimViolations(report.claimReality) && report.claimReality.violations[0]) {
    const violation = report.claimReality.violations.find((v) => v.severity === 'CRITICAL') ??
      report.claimReality.violations[0];
    return {
      readOnly: true,
      blockerId: violation.violationId,
      blockerName: 'Claim vs reality violation',
      authority: violation.sourceAuthority,
      proofSource: violation.sourceAuthority,
      reason: `${violation.claim} — reality: ${violation.reality}`,
      severity: violation.severity,
    };
  }

  if (!report.linkage.launchLinkageConnected) {
    return {
      readOnly: true,
      blockerId: 'launch-linkage-broken',
      blockerName: 'Launch linkage broken',
      authority: 'launch-linkage-analyzer',
      proofSource: 'launch-linkage-analyzer',
      reason:
        report.linkage.firstBrokenLaunchLink != null
          ? `Broken launch link: ${report.linkage.firstBrokenLaunchLink}`
          : report.linkage.missingLinks[0] ?? 'Launch evidence linkage not connected',
      severity: 'HIGH',
    };
  }

  if (!isLaunchReadyState(report.readiness.readinessState)) {
    return {
      readOnly: true,
      blockerId: 'launch-readiness-not-ready',
      blockerName: 'Launch readiness not ready',
      authority: 'launch-readiness-analyzer',
      proofSource: 'launch-readiness-analyzer',
      reason: `Launch readiness state: ${report.readiness.readinessState} (score ${report.readiness.readinessScore})`,
      severity: report.readiness.readinessState === 'BLOCKED' ? 'CRITICAL' : 'HIGH',
    };
  }

  if (report.launchProofLevel === 'PARTIAL' && report.blockers.blockers[0]) {
    const blocker = [...report.blockers.blockers].sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity),
    )[0];
    return {
      readOnly: true,
      blockerId: blocker.blockerId,
      blockerName: blocker.blockerTitle,
      authority: blocker.sourceAuthority,
      proofSource: blocker.sourceAuthority,
      reason: blocker.blockerReason,
      severity: blocker.severity,
    };
  }

  const blockingDep = input.dependencies.find((d) => d.blocksLaunch);
  if (blockingDep) {
    return {
      readOnly: true,
      blockerId: blockingDep.dependencyId,
      blockerName: blockingDep.dependencyName,
      authority: blockingDep.source,
      proofSource: blockingDep.source,
      reason: blockingDep.reason,
      severity: 'HIGH',
    };
  }

  return {
    readOnly: true,
    blockerId: 'launch-proof-partial',
    blockerName: 'Launch proof incomplete',
    authority: 'connected-launch-readiness-proof',
    proofSource: 'connected-launch-readiness-proof',
    reason: `Launch proof level is ${input.launchProofLevel} — connected launch readiness proof did not reach PROVEN`,
    severity: 'HIGH',
  };
}

export function buildLaunchNotProvenExplanation(input: {
  launchReport: LaunchReadinessProofReport | null;
  launchProofLevel: LaunchProofLevel;
  primaryBlocker: FirstLaunchBlockerResolution | null;
  dependencies: readonly LaunchProofDependencyEntry[];
}): LaunchNotProvenExplanation {
  const conditions: string[] = [];

  if (!input.launchReport) {
    conditions.push('Connected launch readiness proof has not been assessed for this execution chain');
    for (const dep of input.dependencies.filter((d) => d.blocksLaunch)) {
      conditions.push(`${dep.dependencyName}: ${dep.reason}`);
    }
  } else {
    const report = input.launchReport;
    if (isAcceptanceRejected(report.acceptance.acceptanceState)) {
      conditions.push(`Launch acceptance is ${report.acceptance.acceptanceState}: ${report.acceptance.acceptanceReasons.join('; ')}`);
    }
    if (!report.launchCriteriaSatisfied) {
      conditions.push('Launch criteria not satisfied — upstream execution chain evidence incomplete');
    }
    if (!report.verificationProven) {
      conditions.push('Verification execution is not PROVEN');
    }
    if (!report.executionChainConnected) {
      conditions.push('Core execution chain is not connected through VERIFY');
    }
    if (!report.linkage.launchLinkageConnected) {
      conditions.push(
        report.linkage.firstBrokenLaunchLink
          ? `Launch linkage broken at ${report.linkage.firstBrokenLaunchLink}`
          : 'Launch evidence linkage is not fully connected',
      );
    }
    if (!isLaunchReadyState(report.readiness.readinessState)) {
      conditions.push(
        `Launch readiness state is ${report.readiness.readinessState} (score ${report.readiness.readinessScore})`,
      );
    }
    for (const blocker of report.blockers.blockers) {
      conditions.push(`[${blocker.severity}] ${blocker.blockerTitle}: ${blocker.blockerReason}`);
    }
    for (const violation of report.claimReality.violations) {
      conditions.push(`[${violation.severity}] Claim violation: ${violation.claim} — ${violation.reality}`);
    }
    if (report.missingEvidence.length > 0) {
      for (const missing of report.missingEvidence.slice(0, 4)) {
        if (!conditions.some((c) => c.includes(missing))) conditions.push(missing);
      }
    }
    if (report.launchProofLevel === 'PARTIAL') {
      conditions.push(`Launch proof level is PARTIAL — not all launch gates passed (${report.recommendedFix})`);
    }
  }

  if (conditions.length === 0 && input.primaryBlocker) {
    conditions.push(input.primaryBlocker.reason);
  }

  return {
    readOnly: true,
    launchProven: false,
    launchProofLevel: input.launchProofLevel,
    conditions: [...new Set(conditions)],
    primaryBlocker: input.primaryBlocker,
  };
}

function resolveLaunchReport(
  rootDir: string,
  input: BuildLaunchProofDependencyGraphInput,
  chainContext: ReturnType<typeof resolveExecutionChainStageContext>,
): LaunchReadinessProofReport | null {
  if (input.launchReport) return input.launchReport;
  if (input.skipLaunchProofAssessment) return chainContext.launchReadinessProof;

  if (chainContext.launchReadinessProof) return chainContext.launchReadinessProof;

  if (!chainContext.verificationProven) return null;

  const founderTest = getLatestFounderTestAssessment();
  return assessConnectedLaunchReadinessProof({
    rootDir,
    verificationExecutionProof: chainContext.verificationExecutionProof,
    buildMaterializationReport: chainContext.buildMaterializationReport ?? undefined,
    founderTestAssessment: founderTest ?? undefined,
    skipFounderTestReassessment: true,
  }).report;
}

export function buildLaunchProofDependencyGraph(
  input: BuildLaunchProofDependencyGraphInput = {},
): LaunchProofDependencyGraph {
  const rootDir = input.rootDir ?? process.cwd();
  const generatedAt = new Date().toISOString();
  const chainContext = resolveExecutionChainStageContext(rootDir);
  const launchReport = resolveLaunchReport(rootDir, input, chainContext);
  const launchProofLevel = launchReport?.launchProofLevel ?? 'NOT_PROVEN';
  const launchProven = launchProofLevel === 'PROVEN';
  const evidence = launchReport?.evidence;
  const dependencies: LaunchProofDependencyEntry[] = [];

  dependencies.push(
    entry(
      'build',
      'Build',
      evidence?.buildProven ? 'PROVEN' : chainContext.buildMaterializationProven ? 'PROVEN' : 'NOT_PROVEN',
      'connected-build-execution',
      proofFromBoolean(evidence?.buildProven ?? chainContext.buildMaterializationProven),
      !(evidence?.buildProven ?? chainContext.buildMaterializationProven),
      evidence?.buildProven ?? chainContext.buildMaterializationProven
        ? 'Build materialization proven on disk'
        : 'Build materialization not proven',
    ),
    entry(
      'runtime',
      'Runtime',
      evidence?.runtimeProven ?? chainContext.runtimeProven ? 'PROVEN' : 'NOT_PROVEN',
      'connected-runtime-activation-proof',
      proofFromBoolean(evidence?.runtimeProven ?? chainContext.runtimeProven),
      !(evidence?.runtimeProven ?? chainContext.runtimeProven),
      evidence?.runtimeProven ?? chainContext.runtimeProven
        ? 'Runtime activation proven'
        : 'Runtime activation not proven',
    ),
    entry(
      'preview',
      'Preview',
      evidence?.previewProven ?? chainContext.previewProven ? 'PROVEN' : 'NOT_PROVEN',
      'connected-preview-experience-proof',
      proofFromBoolean(evidence?.previewProven ?? chainContext.previewProven),
      !(evidence?.previewProven ?? chainContext.previewProven),
      evidence?.previewProven ?? chainContext.previewProven
        ? 'Preview experience proven'
        : 'Preview experience not proven',
    ),
    entry(
      'verification',
      'Verification',
      evidence?.verificationProven ?? chainContext.verificationProven ? 'PROVEN' : 'NOT_PROVEN',
      'connected-verification-execution-proof',
      proofFromBoolean(evidence?.verificationProven ?? chainContext.verificationProven),
      !(evidence?.verificationProven ?? chainContext.verificationProven),
      evidence?.verificationProven ?? chainContext.verificationProven
        ? 'Verification execution proven'
        : 'Verification execution not proven',
    ),
  );

  if (launchReport) {
    dependencies.push(
      entry(
        'founder-acceptance',
        'Founder Acceptance',
        launchReport.acceptance.acceptanceState,
        'founder-acceptance-gate',
        launchReport.acceptance.acceptanceState === 'ACCEPTED'
          ? 'PROVEN'
          : launchReport.acceptance.acceptanceState === 'CONDITIONAL'
            ? 'PARTIAL'
            : 'NOT_PROVEN',
        isAcceptanceRejected(launchReport.acceptance.acceptanceState),
        launchReport.acceptance.acceptanceReasons.join('; ') || launchReport.acceptance.acceptanceState,
      ),
      entry(
        'product-readiness',
        'Product Readiness',
        launchReport.simulation.simulationCoverage > 0
          ? `score ${launchReport.simulation.simulationScore}`
          : 'NOT_ASSESSED',
        'founder-test-product-readiness',
        launchReport.simulation.simulationCoverage > 0
          ? launchReport.blockers.blockers.some((b) => b.blockerId === 'product-readiness-blocked')
            ? 'NOT_PROVEN'
            : launchReport.simulation.simulationScore >= 85
              ? 'PROVEN'
              : 'PARTIAL'
          : 'NOT_ASSESSED',
        launchReport.blockers.blockers.some((b) => b.blockerId === 'product-readiness-blocked'),
        launchReport.blockers.blockers.find((b) => b.blockerId === 'product-readiness-blocked')?.blockerReason ??
          (launchReport.simulation.simulationCoverage > 0
            ? `Simulation score ${launchReport.simulation.simulationScore}`
            : 'Product readiness simulation not run in this launch proof assessment'),
      ),
      entry(
        'chat-stress',
        'Chat Stress',
        launchReport.simulation.simulationCoverage > 0 ? `score ${launchReport.simulation.simulationScore}` : 'NOT_ASSESSED',
        'founder-test-chat-stress-simulation',
        launchReport.blockers.blockers.some((b) => b.blockerId === 'chat-stress-blocks-launch')
          ? 'NOT_PROVEN'
          : launchReport.simulation.topFailures.some((f) => f.startsWith('Chat stress'))
            ? 'PARTIAL'
            : launchReport.simulation.simulationCoverage > 0
              ? 'PROVEN'
              : 'NOT_ASSESSED',
        launchReport.blockers.blockers.some((b) => b.blockerId === 'chat-stress-blocks-launch'),
        launchReport.blockers.blockers.find((b) => b.blockerId === 'chat-stress-blocks-launch')?.blockerReason ??
          (launchReport.simulation.topFailures.find((f) => f.startsWith('Chat stress')) ??
            'Chat stress simulation not run in this launch proof assessment'),
      ),
      entry(
        'launch-council',
        'Launch Council',
        launchReport.blockers.blockers.some((b) => b.blockerId === 'launch-council-blockers')
          ? 'BLOCKED'
          : launchReport.acceptance.acceptanceReasons.some((r) => r.includes('Launch Council'))
            ? 'CAUTION'
            : 'CLEAR',
        'launch-council',
        launchReport.blockers.blockers.some((b) => b.blockerId === 'launch-council-blockers')
          ? 'NOT_PROVEN'
          : launchReport.acceptance.acceptanceReasons.some((r) => r.includes('Launch Council: CAUTION'))
            ? 'PARTIAL'
            : 'PROVEN',
        launchReport.blockers.blockers.some((b) => b.blockerId === 'launch-council-blockers'),
        launchReport.blockers.blockers.find((b) => b.blockerId === 'launch-council-blockers')?.blockerReason ??
          'Launch Council has no recorded blockers in this assessment',
      ),
      entry(
        'launch-linkage',
        'Launch Linkage',
        launchReport.linkage.launchLinkageConnected ? 'CONNECTED' : 'BROKEN',
        'launch-linkage-analyzer',
        launchReport.linkage.launchLinkageConnected ? 'PROVEN' : 'NOT_PROVEN',
        !launchReport.linkage.launchLinkageConnected,
        launchReport.linkage.firstBrokenLaunchLink
          ? `Broken link: ${launchReport.linkage.firstBrokenLaunchLink}`
          : launchReport.linkage.launchLinkageConnected
            ? 'All req→plan→build→runtime→preview→verify→launch links connected'
            : launchReport.linkage.missingLinks[0] ?? 'Launch linkage incomplete',
      ),
      entry(
        'launch-readiness-state',
        'Launch Readiness State',
        launchReport.readiness.readinessState,
        'launch-readiness-analyzer',
        isLaunchReadyState(launchReport.readiness.readinessState)
          ? launchReport.readiness.readinessState === 'READY_WITH_WARNINGS'
            ? 'PARTIAL'
            : 'PROVEN'
          : 'NOT_PROVEN',
        !isLaunchReadyState(launchReport.readiness.readinessState),
        `Readiness ${launchReport.readiness.readinessState} — score ${launchReport.readiness.readinessScore}`,
      ),
      entry(
        'claim-reality',
        'Claim vs Reality',
        launchReport.claimReality.violations.length === 0
          ? 'CLEAN'
          : `${launchReport.claimReality.violations.length} violation(s)`,
        'launch-claim-reality-analyzer',
        launchReport.claimReality.criticalViolations > 0
          ? 'NOT_PROVEN'
          : launchReport.claimReality.violations.length > 0
            ? 'PARTIAL'
            : 'PROVEN',
        hasCriticalClaimViolations(launchReport.claimReality),
        launchReport.claimReality.violations[0]
          ? `${launchReport.claimReality.violations[0].claim} — ${launchReport.claimReality.violations[0].reality}`
          : 'No claim vs reality violations',
      ),
    );
  } else {
    const productHistory = getLatestProductReadinessHistoryEntry();
    dependencies.push(
      entry(
        'founder-acceptance',
        'Founder Acceptance',
        'NOT_ASSESSED',
        'founder-acceptance-gate',
        'NOT_ASSESSED',
        false,
        'Launch proof not assessed — founder acceptance not resolved in graph',
      ),
      entry(
        'product-readiness',
        'Product Readiness',
        productHistory ? `${productHistory.verdict} (${productHistory.readinessScore})` : 'NOT_ASSESSED',
        'founder-test-product-readiness',
        productHistory
          ? productHistory.launchBlocked
            ? 'NOT_PROVEN'
            : productHistory.readinessScore >= 85
              ? 'PROVEN'
              : 'PARTIAL'
          : 'NOT_ASSESSED',
        productHistory?.launchBlocked ?? false,
        productHistory
          ? productHistory.launchBlocked
            ? `Product readiness launch blocked — verdict ${productHistory.verdict}`
            : `Latest product readiness score ${productHistory.readinessScore}`
          : 'Product readiness simulation not recorded',
      ),
    );
  }

  const typecheck =
    getLatestRepositoryTypecheckBaseline() ?? assessRepositoryTypecheckReality({ source: 'NOT_RUN' });
  dependencies.push(
    entry(
      'typecheck-reality',
      'Typecheck Reality',
      typecheck.readinessState,
      'repository-typecheck-reality',
      typecheck.typecheckClean ? 'PROVEN' : typecheck.readinessState === 'TYPECHECK_NOT_RUN' ? 'NOT_ASSESSED' : 'NOT_PROVEN',
      typecheck.blocksLaunchReadiness,
      typecheck.blocksLaunchReadiness
        ? `Repository typecheck ${typecheck.readinessState}`
        : `Typecheck ${typecheck.readinessState}`,
    ),
  );

  const executionGate = runExecutionReadinessGate({ skipHistoryRecording: true });
  const gateDecision = executionGate.analysis?.executionGateDecision ?? 'NOT_ASSESSED';
  dependencies.push(
    entry(
      'execution-readiness-gate',
      'Execution Readiness Gate',
      gateDecision,
      'execution-readiness-gate',
      executionGate.analysis
        ? executionGate.analysis.executionGateDecision === 'ALLOW_EXECUTION'
          ? 'PROVEN'
          : executionGate.analysis.executionGateDecision === 'ALLOW_EXECUTION_PREPARATION'
            ? 'PARTIAL'
            : 'NOT_PROVEN'
        : 'NOT_ASSESSED',
      executionGate.analysis?.executionGateDecision === 'REJECT_EXECUTION',
      executionGate.analysis?.blockerSummary.blockers[0]?.explanation ??
        executionGate.failureReason ??
        'Execution readiness gate not assessed or insufficient evidence',
    ),
  );

  const mobileRuntime = assessMobileRuntimeExperienceReality(rootDir);
  const mobileCritical = mobileRuntime.mobileRuntimeBlockers.some((b) => b.severity === 'CRITICAL');
  dependencies.push(
    entry(
      'mobile-runtime-reality',
      'Mobile Runtime Reality',
      `${mobileRuntime.mobileRuntimeExperienceScore}/100`,
      'mobile-runtime-experience-reality',
      mobileRuntime.mobileRuntimeExperienceScore >= 80
        ? 'PROVEN'
        : mobileRuntime.mobileRuntimeExperienceScore >= 50
          ? 'PARTIAL'
          : 'NOT_PROVEN',
      mobileCritical,
      mobileRuntime.mobileRuntimeBlockers[0]?.explanation ??
        `Mobile runtime experience score ${mobileRuntime.mobileRuntimeExperienceScore}`,
    ),
  );

  const uiBlocker = launchReport?.blockers.blockers.find((b) => b.sourceAuthority === 'ui-reviewer-authority');
  dependencies.push(
    entry(
      'ui-readiness-reality',
      'UI Readiness Reality',
      uiBlocker ? 'BLOCKED' : 'NOT_ASSESSED',
      'ui-reviewer-authority',
      uiBlocker ? 'NOT_PROVEN' : 'NOT_ASSESSED',
      uiBlocker != null,
      uiBlocker?.blockerReason ?? 'UI reviewer authority not run in this launch proof assessment',
    ),
  );

  const firstLaunchBlocker = resolveFirstLaunchBlocker({
    launchReport,
    launchProofLevel,
    launchProven,
    dependencies,
  });

  const notProvenExplanation = launchProven
    ? null
    : buildLaunchNotProvenExplanation({
        launchReport,
        launchProofLevel,
        primaryBlocker: firstLaunchBlocker,
        dependencies,
      });

  const graphWithoutContradictions: LaunchProofDependencyGraph = {
    readOnly: true,
    generatedAt,
    launchTruthGeneratedAt: launchReport?.generatedAt ?? chainContext.resolvedAt,
    launchProven,
    launchProofLevel,
    executionTruthSource: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
    dependencies,
    launchDependencyCount: dependencies.length,
    launchBlockingDependencyCount: dependencies.filter((d) => d.blocksLaunch).length,
    firstLaunchBlocker,
    notProvenExplanation,
    contradictions: [],
    contradictionCount: 0,
    launchReport,
  };

  const contradictions = detectLaunchProofContradictions(graphWithoutContradictions);
  return {
    ...graphWithoutContradictions,
    contradictions,
    contradictionCount: contradictions.length,
  };
}

export function buildLaunchNotProvenAnswer(graph: LaunchProofDependencyGraph): string {
  if (graph.launchProven) {
    return [
      'Launch is PROVEN in synchronized connected execution chain truth.',
      `Truth source: ${graph.executionTruthSource}.`,
      `Launch proof generated: ${graph.launchTruthGeneratedAt}.`,
    ].join('\n');
  }

  const explanation = graph.notProvenExplanation;
  const lines = [
    'Launch is NOT_PROVEN because:',
    '',
    ...(explanation?.conditions ?? ['Connected launch readiness proof did not reach PROVEN']).map(
      (c) => `• ${c}`,
    ),
    '',
    graph.firstLaunchBlocker
      ? [
          'Primary launch blocker:',
          `• ${graph.firstLaunchBlocker.blockerName} (${graph.firstLaunchBlocker.severity})`,
          `  Authority: ${graph.firstLaunchBlocker.authority}`,
          `  Proof source: ${graph.firstLaunchBlocker.proofSource}`,
          `  Reason: ${graph.firstLaunchBlocker.reason}`,
        ].join('\n')
      : '',
    '',
    'Launch dependency summary:',
    ...graph.dependencies.map(
      (d) =>
        `• ${d.dependencyName}: ${d.proofLevel}${d.blocksLaunch ? ' — BLOCKS LAUNCH' : ''} (${d.source})`,
    ),
    '',
    `Launch proof level: ${graph.launchProofLevel}.`,
    `Truth source: ${graph.executionTruthSource}.`,
    `Generated: ${graph.launchTruthGeneratedAt}.`,
  ];

  return lines.filter(Boolean).join('\n');
}

export function getLaunchProofDiagnostics(rootDir?: string) {
  const graph = buildLaunchProofDependencyGraph({ rootDir });
  return {
    readOnly: true as const,
    launchDependencyCount: graph.launchDependencyCount,
    launchBlockingDependencyCount: graph.launchBlockingDependencyCount,
    firstLaunchBlocker: graph.firstLaunchBlocker,
    launchTruthGeneratedAt: graph.launchTruthGeneratedAt,
    launchProven: graph.launchProven,
    launchProofLevel: graph.launchProofLevel,
    contradictionCount: graph.contradictionCount,
  };
}
