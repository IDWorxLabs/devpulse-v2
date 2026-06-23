/**
 * Launch Blocker Board V1 — collects blockers from existing Founder Test outputs.
 */

import type { FounderTestLaunchReadinessReport } from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import type { FounderSimulationDegradationRootCauseAssessment } from '../founder-simulation-degradation-root-cause-repair/founder-simulation-degradation-root-cause-types.js';
import {
  classifyLaunchBlockerBucket,
  deriveDisposition,
  deriveLaunchImpact,
  entryFromLaunchBlocker,
  sortLaunchBlockerEntries,
} from './launch-blocker-board-classifier.js';
import { CANONICAL_LAUNCH_BLOCKER_IDS } from './launch-blocker-board-registry.js';
import type { LaunchBlockerBoardEntry, LaunchBlockerSeverity } from './launch-blocker-board-types.js';

function authoritySummary(
  report: FounderTestLaunchReadinessReport,
  authorityId: string,
): { available: boolean; score: number; blockers: string[] } {
  const summary = report.inputSnapshot.authoritySummaries.find(
    (entry) => entry.authorityId === authorityId,
  );
  return {
    available: summary?.available ?? false,
    score: summary?.score ?? 0,
    blockers: summary?.blockers ?? [],
  };
}

function severityFromScore(score: number, hasBlockers: boolean): LaunchBlockerSeverity {
  if (!hasBlockers && score >= 75) return 'LOW';
  if (score >= 70 && !hasBlockers) return 'MEDIUM';
  if (score >= 50) return 'HIGH';
  return 'CRITICAL';
}

function buildCanonicalEntry(input: {
  blockerId: (typeof CANONICAL_LAUNCH_BLOCKER_IDS)[number];
  blockerName: string;
  active: boolean;
  bucket: LaunchBlockerBoardEntry['bucket'];
  severity: LaunchBlockerSeverity;
  userImpact: string;
  fixRequired: string;
  sourceAuthority: string;
  rank: number;
}): LaunchBlockerBoardEntry | null {
  if (!input.active) return null;
  return {
    readOnly: true,
    blockerId: input.blockerId,
    blockerName: input.blockerName,
    bucket: input.bucket,
    severity: input.severity,
    userImpact: input.userImpact,
    fixRequired: input.fixRequired,
    launchImpact: deriveLaunchImpact(input.bucket, input.severity),
    disposition: deriveDisposition(input.bucket, input.severity),
    sourceAuthority: input.sourceAuthority,
    rank: input.rank,
  };
}

function collectCanonicalBlockers(report: FounderTestLaunchReadinessReport): LaunchBlockerBoardEntry[] {
  const livePreview = authoritySummary(report, 'LIVE_PREVIEW_REALITY');
  const mobileRuntime = authoritySummary(report, 'MOBILE_RUNTIME_REALITY');
  const entries: LaunchBlockerBoardEntry[] = [];

  const connectedActive =
    !report.executionChainConnected ||
    report.executionChainBlocksLaunch ||
    Boolean(report.firstBrokenExecutionStage);
  const connectedEntry = buildCanonicalEntry({
      blockerId: 'connected-execution-proof',
      blockerName: 'Connected execution proof',
      active: connectedActive,
      bucket: 'REAL_PRODUCT_GAP',
      severity: report.executionChainBlocksLaunch ? 'CRITICAL' : 'HIGH',
      userImpact:
        report.connectedLaunchReadinessProofSummary ??
        'End-to-end build → runtime → preview → verification proof chain is not fully connected.',
      fixRequired:
        report.firstBrokenExecutionStage != null
          ? `Repair first broken execution stage: ${report.firstBrokenExecutionStage}.`
          : 'Prove connected build, runtime activation, preview, verification, and launch readiness with live artifacts.',
      sourceAuthority: 'CONNECTED_LAUNCH_READINESS_PROOF',
      rank: 1,
    });
  if (connectedEntry) entries.push(connectedEntry);

  const livePreviewActive =
    !livePreview.available || livePreview.blockers.length > 0 || livePreview.score < 70;
  const livePreviewEntry = buildCanonicalEntry({
      blockerId: 'live-preview-proof',
      blockerName: 'Live Preview proof',
      active: livePreviewActive,
      bucket: 'REAL_PRODUCT_GAP',
      severity: severityFromScore(livePreview.score, livePreview.blockers.length > 0),
      userImpact:
        report.livePreviewSummary ??
        'Founders cannot trust that Live Preview reflects real product behavior.',
      fixRequired:
        livePreview.blockers[0] ??
        'Run connected preview experience proof and surface a founder-visible live preview verdict.',
      sourceAuthority: 'LIVE_PREVIEW_REALITY',
      rank: 2,
    });
  if (livePreviewEntry) entries.push(livePreviewEntry);

  const mobileActive =
    !mobileRuntime.available || mobileRuntime.blockers.length > 0 || mobileRuntime.score < 70;
  const mobileEntry = buildCanonicalEntry({
      blockerId: 'mobile-runtime-proof',
      blockerName: 'Mobile runtime proof',
      active: mobileActive,
      bucket: 'REAL_PRODUCT_GAP',
      severity: severityFromScore(mobileRuntime.score, mobileRuntime.blockers.length > 0),
      userImpact:
        report.mobileRuntimeSummary ??
        'Mobile runtime behavior is not proven for customer-facing launch readiness.',
      fixRequired:
        mobileRuntime.blockers[0] ??
        'Prove mobile runtime activation and capture founder-visible mobile runtime evidence.',
      sourceAuthority: 'MOBILE_RUNTIME_REALITY',
      rank: 3,
    });
  if (mobileEntry) entries.push(mobileEntry);

  const claimMismatchActive =
    report.launchBlockersAuthorityDisagreement.length > 0 ||
    (report.founderTruthSummary?.authorityDisagreements.length ?? 0) > 0 ||
    (report.truthMatrixReconciliation?.authorityDisagreementCount ?? 0) > 0;
  const claimEntry = buildCanonicalEntry({
      blockerId: 'promise-claim-mismatch',
      blockerName: 'Promise/claim mismatch',
      active: claimMismatchActive,
      bucket: 'CLAIM_WORDING_GAP',
      severity: claimMismatchActive ? 'HIGH' : 'LOW',
      userImpact:
        report.founderTruthSummary?.authorityDisagreements[0] ??
        report.founderTruthSummary?.productGaps[0] ??
        'Product promises and authority verdicts disagree — founders may over-trust unproven claims.',
      fixRequired:
        report.launchBlockersAuthorityDisagreement[0]?.recommendedAction ??
        'Reconcile promise/claim wording with connected execution proof before launch messaging.',
      sourceAuthority: 'FOUNDER_TRUTH_MATRIX',
      rank: 4,
    });
  if (claimEntry) entries.push(claimEntry);

  const copyReportActive =
    report.launchBlockersTesting.some((blocker) =>
      /copy report|clipboard|report delivery/i.test(`${blocker.explanation} ${blocker.recommendedAction}`),
    ) ||
    report.topBlockers.some((blocker) =>
      /copy report|clipboard|report delivery/i.test(`${blocker.explanation} ${blocker.recommendedAction}`),
    ) ||
    report.launchBlockersProduct.some((blocker) =>
      /copy report|copy-founder-test-report|clipboard/i.test(
        `${blocker.explanation} ${blocker.recommendedAction}`,
      ),
    );
  const copyReportEntry = buildCanonicalEntry({
      blockerId: 'copy-report-ui',
      blockerName: 'Copy Report UI bug',
      active: copyReportActive,
      bucket: 'UI_UX_GAP',
      severity: copyReportActive ? 'MEDIUM' : 'LOW',
      userImpact: 'Founders may be unable to copy the full report from the Founder Reality UI.',
      fixRequired: 'Fix Copy Report button behavior and clipboard handoff in Founder Reality.',
      sourceAuthority: 'FOUNDER_REALITY_UI',
      rank: 5,
    });
  if (copyReportEntry) entries.push(copyReportEntry);

  return entries;
}

function collectCategorizedBlockers(report: FounderTestLaunchReadinessReport): LaunchBlockerBoardEntry[] {
  const entries: LaunchBlockerBoardEntry[] = [];
  let rank = 10;

  for (const blocker of report.launchBlockersProduct) {
    entries.push(
      entryFromLaunchBlocker(blocker, `product-${rank}`, blocker.explanation.slice(0, 80), rank, 'REAL_PRODUCT_GAP'),
    );
    rank += 1;
  }
  for (const blocker of report.launchBlockersAuthorityDisagreement) {
    entries.push(
      entryFromLaunchBlocker(
        blocker,
        `claim-${rank}`,
        blocker.explanation.slice(0, 80),
        rank,
        'CLAIM_WORDING_GAP',
      ),
    );
    rank += 1;
  }
  for (const blocker of report.launchBlockersTesting) {
    entries.push(
      entryFromLaunchBlocker(
        blocker,
        `noise-${rank}`,
        blocker.explanation.slice(0, 80),
        rank,
        'FOUNDER_TEST_NOISE',
      ),
    );
    rank += 1;
  }
  for (const blocker of report.topBlockers) {
    const bucket = classifyLaunchBlockerBucket({
      text: `${blocker.explanation} ${blocker.recommendedAction}`,
      sourceAuthority: blocker.sourceAuthority,
    });
    if (entries.some((entry) => entry.userImpact === blocker.explanation)) continue;
    entries.push(entryFromLaunchBlocker(blocker, `top-${rank}`, blocker.explanation.slice(0, 80), rank, bucket));
    rank += 1;
  }

  return entries;
}

function collectDegradationNoise(input: {
  simulationDegraded?: boolean;
  simulationElapsedMs?: number | null;
  simulationDiagnosticMarkdown?: string | null;
  degradationAssessment?: FounderSimulationDegradationRootCauseAssessment | null;
}): LaunchBlockerBoardEntry[] {
  if (!input.simulationDegraded && !input.degradationAssessment?.report.degraded) return [];

  const payloadRepairs =
    input.simulationDiagnosticMarkdown?.match(/Missing fields repaired:\s*(\d+)/i)?.[1] ?? '0';
  const patchApplied = /Patch applied:\s*yes/i.test(input.simulationDiagnosticMarkdown ?? '');

  if (payloadRepairs === '0' && !patchApplied) {
    return [
      {
        readOnly: true,
        blockerId: 'simulation-runtime-duration',
        blockerName: 'Degraded simulation runtime duration',
        bucket: 'FOUNDER_TEST_NOISE',
        severity: 'MEDIUM',
        userImpact:
          input.degradationAssessment?.report.findings[0]?.impact ??
          `Founder Simulation completed with warnings after ${input.simulationElapsedMs ?? 'unknown'}ms — testing overhead, not a product crash.`,
        fixRequired:
          'Track on Launch Blocker Board as testing noise. Do not open a new repair phase unless report generation or runtime crashes.',
        launchImpact: 'NONE',
        disposition: 'IGNORE',
        sourceAuthority: 'FOUNDER_SIMULATION_DEGRADATION',
        rank: 100,
      },
    ];
  }

  return [];
}

function collectUnifiedBlockers(unifiedLaunchBlockers: readonly string[] | undefined): LaunchBlockerBoardEntry[] {
  if (!unifiedLaunchBlockers?.length) return [];
  return unifiedLaunchBlockers.slice(0, 5).map((text, index) => {
    const bucket = classifyLaunchBlockerBucket({ text, sourceAuthority: 'V5_UNIFIED_SUMMARY' });
    const severity: LaunchBlockerSeverity =
      bucket === 'FOUNDER_TEST_NOISE' ? 'LOW' : bucket === 'REAL_PRODUCT_GAP' ? 'HIGH' : 'MEDIUM';
    return {
      readOnly: true,
      blockerId: `unified-${index + 1}`,
      blockerName: text.slice(0, 80),
      bucket,
      severity,
      userImpact: text,
      fixRequired: 'Address on Launch Blocker Board — do not spawn a new Founder Test repair phase.',
      launchImpact: deriveLaunchImpact(bucket, severity),
      disposition: deriveDisposition(bucket, severity),
      sourceAuthority: 'V5_UNIFIED_SUMMARY',
      rank: 20 + index,
    };
  });
}

function dedupeEntries(entries: LaunchBlockerBoardEntry[]): LaunchBlockerBoardEntry[] {
  const seen = new Set<string>();
  const out: LaunchBlockerBoardEntry[] = [];
  for (const entry of sortLaunchBlockerEntries(entries)) {
    const key = `${entry.blockerId}|${entry.blockerName}|${entry.userImpact.slice(0, 120)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

export function collectLaunchBlockerBoardEntries(input: {
  launchReadiness: FounderTestLaunchReadinessReport;
  simulationElapsedMs?: number | null;
  simulationDegraded?: boolean;
  simulationDiagnosticMarkdown?: string | null;
  degradationAssessment?: FounderSimulationDegradationRootCauseAssessment | null;
  unifiedLaunchBlockers?: readonly string[];
}): LaunchBlockerBoardEntry[] {
  const canonical = collectCanonicalBlockers(input.launchReadiness);
  const categorized = collectCategorizedBlockers(input.launchReadiness);
  const degradation = collectDegradationNoise(input);
  const unified = collectUnifiedBlockers(input.unifiedLaunchBlockers);
  return dedupeEntries([...canonical, ...categorized, ...degradation, ...unified]);
}
