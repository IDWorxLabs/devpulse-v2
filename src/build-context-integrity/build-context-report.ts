/** Build-context integrity report composition. */
import { fingerprintBuildContextValue } from './build-context-fingerprint.js';
import { resolveBuildContextOutcome } from './build-outcome.js';
import type {
  BuildContext,
  BuildContextArtifact,
  BuildContextIntegrityFinding,
  BuildContextIntegrityReport,
  BuildContextNavigationEntry,
} from './build-context-types.js';

export function generateBuildContextIntegrityReport(input: {
  readonly buildContext: BuildContext;
  readonly findings: readonly BuildContextIntegrityFinding[];
  readonly artifacts?: readonly BuildContextArtifact[];
  readonly navigationEntries?: readonly BuildContextNavigationEntry[];
}): BuildContextIntegrityReport {
  const complianceOutcome: BuildContextIntegrityReport['complianceOutcome'] = input.findings.some((finding) => finding.severity === 'BLOCKER')
    ? 'BUILD_CONTEXT_BLOCKED'
    : 'BUILD_CONTEXT_COMPLIANT';
  const base = {
    reportId: `pbci-report-${input.buildContext.buildContextId}`,
    buildContext: input.buildContext,
    findings: [...input.findings].sort((a, b) => a.findingId.localeCompare(b.findingId)),
    navigationEntries: [...(input.navigationEntries ?? [])].sort((a, b) => a.navigationId.localeCompare(b.navigationId)),
    artifactCount: input.artifacts?.length ?? 0,
    complianceOutcome,
    buildOutcome: resolveBuildContextOutcome({
      buildContextReport: { complianceOutcome },
      previewBlocked: complianceOutcome === 'BUILD_CONTEXT_BLOCKED',
    }),
    readOnly: true as const,
  };
  return { ...base, fingerprint: fingerprintBuildContextValue(base) };
}
