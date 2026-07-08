/**
 * Fresh Build Artifact Isolation reporting — extends build/failure reports with the runtime
 * evidence scope id, purge actions performed, stale artifacts/evidence/unscoped-evidence blocked,
 * previous workspace references blocked, and whether UI state / product faithfulness used only
 * current build evidence.
 */

import {
  type EvidenceKind,
  type FreshBuildArtifactIsolationReportSection,
  type RuntimeEvidenceScope,
  type StaleEvidenceDetection,
  type StalenessCheckResult,
} from './fresh-build-artifact-isolation-types.js';

const ARTIFACT_STALE_KINDS = new Set([
  'STALE_GENERATED_MODULE',
  'STALE_ROUTES_NAVIGATION',
  'STALE_MATERIALIZATION_MANIFEST',
  'PREVIOUS_WORKSPACE_PATH_EVIDENCE',
]);

const EVIDENCE_STALE_KINDS = new Set([
  'UNSCOPED_PREVIEW_DOM_EVIDENCE',
  'UNSCOPED_PRODUCT_FAITHFULNESS_REPORT',
  'STALE_RUNTIME_ACTIVATION_RESULT',
  'STALE_ENGINEERING_REPORT_SUMMARY',
  'STALE_UI_PROJECT_SUMMARY',
  'PREVIOUS_BUILD_ID_EVIDENCE',
  'PREVIOUS_REQUEST_ID_EVIDENCE',
  'PREVIOUS_PROJECT_ID_EVIDENCE',
  'PREVIOUS_PROMPT_HASH_EVIDENCE',
]);

export interface BuildFreshBuildArtifactIsolationReportInput {
  scope: RuntimeEvidenceScope;
  stalenessResult?: StalenessCheckResult | null;
  uiStateClearedForFreshBuild: boolean;
  productFaithfulnessUsedOnlyCurrentBuildEvidence: boolean;
}

export function buildFreshBuildArtifactIsolationReportSection(
  input: BuildFreshBuildArtifactIsolationReportInput,
): FreshBuildArtifactIsolationReportSection {
  const detections: StaleEvidenceDetection[] = [
    ...input.scope.staleEvidenceDetections,
    ...(input.stalenessResult?.detections ?? []),
  ];

  const staleArtifactsBlocked = detections.filter((d) => ARTIFACT_STALE_KINDS.has(d.kind));
  const staleEvidenceBlocked = detections.filter((d) => EVIDENCE_STALE_KINDS.has(d.kind));
  const unscopedEvidenceBlocked = detections.filter((d) => d.kind === 'UNSCOPED_EVIDENCE_MISSING_METADATA');

  const previousWorkspaceReferencesBlocked = detections
    .filter((d) => d.kind === 'PREVIOUS_WORKSPACE_PATH_EVIDENCE')
    .map((d) => d.detail);

  return {
    readOnly: true,
    runtimeEvidenceScopeId: input.scope.runtimeScopeId,
    decision: input.scope.decision,
    purgeActionsPerformed: input.scope.purgeActionsPerformed,
    staleArtifactsBlocked,
    staleEvidenceBlocked,
    unscopedEvidenceBlocked,
    previousWorkspaceReferencesBlocked,
    uiStateClearedForFreshBuild: input.uiStateClearedForFreshBuild,
    productFaithfulnessUsedOnlyCurrentBuildEvidence: input.productFaithfulnessUsedOnlyCurrentBuildEvidence,
  };
}

export function renderFreshBuildArtifactIsolationReportMarkdown(
  section: FreshBuildArtifactIsolationReportSection,
): string {
  const lines: string[] = [];
  lines.push(`# Fresh Build Artifact Isolation Report`);
  lines.push('');
  lines.push(`- Decision: ${section.decision}`);
  lines.push(`- Runtime evidence scope id: ${section.runtimeEvidenceScopeId}`);
  lines.push(`- UI state cleared for fresh build: ${section.uiStateClearedForFreshBuild ? 'yes' : 'no'}`);
  lines.push(
    `- Product faithfulness used only current build evidence: ${section.productFaithfulnessUsedOnlyCurrentBuildEvidence ? 'yes' : 'no'}`,
  );
  lines.push('');
  lines.push(`## Purge actions performed (${section.purgeActionsPerformed.length})`);
  for (const action of section.purgeActionsPerformed) {
    lines.push(`- [${action.purged ? 'x' : ' '}] ${action.category} — ${action.method}: ${action.note}`);
  }
  lines.push('');
  lines.push(`## Stale artifacts blocked (${section.staleArtifactsBlocked.length})`);
  for (const d of section.staleArtifactsBlocked) lines.push(`- ${d.kind}: ${d.detail}`);
  lines.push('');
  lines.push(`## Stale evidence blocked (${section.staleEvidenceBlocked.length})`);
  for (const d of section.staleEvidenceBlocked) lines.push(`- ${d.kind}: ${d.detail}`);
  lines.push('');
  lines.push(`## Unscoped evidence blocked (${section.unscopedEvidenceBlocked.length})`);
  for (const d of section.unscopedEvidenceBlocked) lines.push(`- ${d.kind}: ${d.detail}`);
  lines.push('');
  lines.push(`## Previous workspace references blocked (${section.previousWorkspaceReferencesBlocked.length})`);
  for (const ref of section.previousWorkspaceReferencesBlocked) lines.push(`- ${ref}`);
  return lines.join('\n');
}

export interface FreshBuildArtifactIsolationDiagnostics {
  runtimeEvidenceScopeId: string;
  decision: string;
  purgeActionCount: number;
  staleArtifactCount: number;
  staleEvidenceCount: number;
  unscopedEvidenceCount: number;
  blockedEvidenceKinds: EvidenceKind[];
  uiStateClearedForFreshBuild: boolean;
  productFaithfulnessUsedOnlyCurrentBuildEvidence: boolean;
}

export function buildFreshBuildArtifactIsolationDiagnostics(
  section: FreshBuildArtifactIsolationReportSection,
  stalenessResult?: StalenessCheckResult | null,
): FreshBuildArtifactIsolationDiagnostics {
  return {
    runtimeEvidenceScopeId: section.runtimeEvidenceScopeId,
    decision: section.decision,
    purgeActionCount: section.purgeActionsPerformed.length,
    staleArtifactCount: section.staleArtifactsBlocked.length,
    staleEvidenceCount: section.staleEvidenceBlocked.length,
    unscopedEvidenceCount: section.unscopedEvidenceBlocked.length,
    blockedEvidenceKinds: stalenessResult?.blockedEvidenceKinds ?? [],
    uiStateClearedForFreshBuild: section.uiStateClearedForFreshBuild,
    productFaithfulnessUsedOnlyCurrentBuildEvidence: section.productFaithfulnessUsedOnlyCurrentBuildEvidence,
  };
}
