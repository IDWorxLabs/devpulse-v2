/**
 * Verification context builder — aggregates registry, orchestration, evidence, reporting state.
 */

import type { RoutedVerificationSubsystems } from './verification-request-router.js';
import type { VerificationContext } from './unified-verification-types.js';

export function buildVerificationContext(routed: RoutedVerificationSubsystems): VerificationContext {
  return {
    registryTargetCount: routed.registry.verificationTargets.length,
    orchestrationId: routed.orchestration.orchestrationReport.orchestrationId,
    evidenceCount: routed.evidence.evidenceRecords.length,
    reportCount: routed.reporting.reports.length,
    historyEntryCount: routed.reporting.historyEntries.length,
    orchestrationState: routed.orchestration.orchestrationReport.orchestrationState,
    evidenceAuthorityId: routed.evidence.evidenceSummaryReport.authorityId,
    reportingAuthorityId: routed.reporting.reportingAuthorityId,
    targets: routed.registry.verificationTargets.map((t) => t.verificationTargetId),
    blockedTargets: routed.orchestration.blockedTargets,
  };
}
