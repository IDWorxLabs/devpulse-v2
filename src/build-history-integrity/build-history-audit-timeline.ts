/**
 * Build History Integrity V1 — audit timeline per build.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { BuildHistoryAuditTimelineEvent } from './build-history-types.js';

function stageStatus(
  condition: boolean,
  pending = false,
): BuildHistoryAuditTimelineEvent['status'] {
  if (pending) return 'PENDING';
  return condition ? 'PASS' : 'FAIL';
}

export function buildAuditTimeline(input: {
  manifest: GeneratedAppManifest;
  recordDirRelative: string;
  manifestSnapshotRelative: string;
  productionValidationSnapshotRelative: string | null;
}): BuildHistoryAuditTimelineEvent[] {
  const { manifest } = input;
  const ts = manifest.createdAt;
  const completed = manifest.completedAt ?? ts;
  let step = 0;

  const events: BuildHistoryAuditTimelineEvent[] = [
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: ts,
      stage: 'Build requested',
      status: 'INFO',
      evidencePath: null,
      evidenceSummary: `prompt length=${manifest.prompt.length}`,
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: ts,
      stage: 'Profile selected',
      status: 'INFO',
      evidencePath: null,
      evidenceSummary: String(manifest.selectedProfile),
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: completed,
      stage: 'Workspace generated',
      status: stageStatus(manifest.generatedFilesCount > 0),
      evidencePath: manifest.workspacePath,
      evidenceSummary: `${manifest.generatedFilesCount} files, ${manifest.generatedDirectoriesCount} directories`,
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: completed,
      stage: 'Manifest written',
      status: stageStatus(Boolean(manifest.manifestHash)),
      evidencePath: `${manifest.workspacePath ?? ''}/${GENERATED_APP_MANIFEST_FILENAME}`.replace(/\/+/g, '/'),
      evidenceSummary: `manifestHash=${manifest.manifestHash.slice(0, 12)}…`,
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: completed,
      stage: 'Feature modules generated',
      status: stageStatus(manifest.featureModulesPresent && manifest.generatedFeatureModulesCount > 0),
      evidencePath: null,
      evidenceSummary: `${manifest.generatedFeatureModulesCount} modules`,
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: completed,
      stage: 'Build executed',
      status: stageStatus(manifest.npmBuildDurationMs > 0 || manifest.status === 'PASS'),
      evidencePath: null,
      evidenceSummary: `npmBuildDurationMs=${manifest.npmBuildDurationMs}`,
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: completed,
      stage: 'Preview verified',
      status: stageStatus(manifest.previewVerified, manifest.previewVerified === false && manifest.previewUrl === null),
      evidencePath: manifest.previewUrl,
      evidenceSummary: manifest.previewUrl ?? 'no preview URL recorded',
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: completed,
      stage: 'Production validation completed',
      status:
        manifest.productionValidationStatus === 'PENDING'
          ? 'PENDING'
          : stageStatus(manifest.productionValidationStatus === 'PASS'),
      evidencePath: input.productionValidationSnapshotRelative,
      evidenceSummary: manifest.productionValidationStatus,
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: completed,
      stage: 'Blueprint purity checked',
      status:
        manifest.blueprintPurityStatus === 'PENDING'
          ? 'PENDING'
          : stageStatus(manifest.blueprintPurityStatus === 'PASS'),
      evidencePath: input.manifestSnapshotRelative,
      evidenceSummary: `${manifest.blueprintPurityStatus} — ${manifest.blueprintPurityViolationCount} violations`,
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: completed,
      stage: 'Build history record persisted',
      status: 'PASS',
      evidencePath: input.recordDirRelative,
      evidenceSummary: 'Immutable build history artifacts written',
    },
    {
      readOnly: true,
      eventId: `audit-${++step}`,
      timestamp: completed,
      stage: 'Build finalized',
      status: stageStatus(manifest.status === 'PASS' || manifest.status === 'FAIL' || manifest.status === 'PARTIAL'),
      evidencePath: input.manifestSnapshotRelative,
      evidenceSummary: `status=${manifest.status} validation=${manifest.validationStatus}`,
    },
  ];

  return events;
}
