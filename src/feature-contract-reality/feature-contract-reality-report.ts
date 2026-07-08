/**
 * Feature Contract Reality V1 — aggregate report builder.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { buildFeatureRealityRecords } from './feature-reality-mapper.js';
import { isInformationalFeatureModule } from './feature-interaction-reality-checker.js';
import type {
  FeatureContractRealityReport,
  FeatureContractRealityStatus,
  FeatureRealityRecord,
} from './feature-contract-reality-types.js';

export function buildFeatureContractRealityReport(input: {
  workspaceDir: string;
  manifest: GeneratedAppManifest;
  artifactPath?: string | null;
  persistentArtifactPath?: string | null;
}): FeatureContractRealityReport {
  const records = buildFeatureRealityRecords(input);
  const plannedFeatureCount = records.length;
  const provenFeatureCount = records.filter((record) => record.score >= 90).length;
  const overallScore =
    records.length > 0
      ? Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length)
      : 0;

  const failureReasons = records.flatMap((record) => record.failureReasons);
  const status = resolveStatus(input.manifest, records, overallScore);
  const now = new Date().toISOString();

  return {
    readOnly: true,
    status,
    overallScore,
    plannedFeatureCount,
    provenFeatureCount,
    featureRealityRecords: records,
    failureReasons: [...new Set(failureReasons)],
    informationalFeatureIds: records.filter((record) => record.informationalOnly).map((record) => record.featureId),
    interactiveFeatureIds: records.filter((record) => !record.informationalOnly).map((record) => record.featureId),
    recordedAt: now,
    buildRunId: input.manifest.buildRunId,
    projectId: input.manifest.projectId,
    contractPath: '.generated-builder-workspaces/.../universal-feature-contract.json',
    artifactPath: input.artifactPath ?? null,
    persistentArtifactPath: input.persistentArtifactPath ?? null,
  };
}

function resolveStatus(
  manifest: GeneratedAppManifest,
  records: FeatureRealityRecord[],
  overallScore: number,
): FeatureContractRealityStatus {
  if (records.length === 0) return manifest.generatedFilesCount > 0 ? 'PARTIAL' : 'FAIL';
  const allModulesPresent = records.every(
    (record) => record.filesPresent && record.registryEntryPresent,
  );
  if (allModulesPresent && manifest.npmBuildDurationMs <= 0) {
    return 'DEGRADED_WITH_WORKSPACE_EVIDENCE';
  }
  if (manifest.status === 'FAIL' || manifest.status === 'ABORTED') {
    return allModulesPresent ? 'DEGRADED_WITH_WORKSPACE_EVIDENCE' : 'FAIL';
  }
  if (records.some((record) => !record.filesPresent || !record.registryEntryPresent)) return 'FAIL';
  if (overallScore >= 85 && records.every((record) => record.score >= 70)) return 'PASS';
  if (overallScore >= 50) return 'PARTIAL';
  return allModulesPresent ? 'DEGRADED_WITH_WORKSPACE_EVIDENCE' : 'FAIL';
}

export function buildFeatureContractRealityChatSummary(report: FeatureContractRealityReport): string {
  const statusLabel = report.status === 'PASS' ? 'passed' : report.status === 'PARTIAL' ? 'partially passed' : 'failed';
  const informational = report.informationalFeatureIds.length
    ? `${report.informationalFeatureIds.map((id) => id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(' and ')} are marked informational`
    : 'no informational-only features detected';
  const interactive = report.interactiveFeatureIds.length
    ? `${report.interactiveFeatureIds.slice(0, 3).map((id) => id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(', ')} expose interaction controls`
    : 'interaction controls not detected';

  return [
    `Feature Contract Reality ${statusLabel}.`,
    `${report.provenFeatureCount}/${report.plannedFeatureCount} features were generated, routed, reachable, and validated.`,
    `${informational}, while ${interactive}.`,
  ].join('\n\n');
}
