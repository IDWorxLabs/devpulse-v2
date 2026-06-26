/**
 * Workspace Reality Audit V1 — report aggregator.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { auditAssetReality } from './workspace-asset-checker.js';
import { auditContractUsage } from './workspace-contract-usage-checker.js';
import { auditExportSafety } from './workspace-export-safety-checker.js';
import { auditImportGraphReality } from './workspace-import-graph-checker.js';
import { auditMetadataConsistency } from './workspace-metadata-consistency-checker.js';
import { auditOrphanAndLeakage } from './workspace-orphan-file-detector.js';
import { auditRegistryConsistency } from './workspace-registry-consistency-checker.js';
import { auditRouteGraphReality } from './workspace-route-graph-checker.js';
import { auditSourceTreeReality, resolveAuditSourceRoot } from './workspace-reality-source-scanner.js';
import type { WorkspaceRealityAuditResult } from './workspace-reality-audit-types.js';

export function buildWorkspaceRealityAuditReport(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
  artifactPath?: string | null;
  reportPath?: string | null;
  persistentArtifactPath?: string | null;
  persistentReportPath?: string | null;
}): WorkspaceRealityAuditResult {
  const sourceRoot = resolveAuditSourceRoot({
    workspaceDir: input.workspaceDir,
    projectRootDir: input.projectRootDir,
    persistentProjectSourceRoot: input.manifest.persistentProjectSourceRoot,
    promotionStatus: input.manifest.promotionStatus,
  });

  const sourceTree = auditSourceTreeReality(sourceRoot);
  const importGraph = auditImportGraphReality(sourceRoot);
  const routeGraph = auditRouteGraphReality(sourceRoot);
  const registry = auditRegistryConsistency(sourceRoot);
  const contractUsage = auditContractUsage({ sourceRoot, manifest: input.manifest });
  const assets = auditAssetReality(sourceRoot);
  const metadata = auditMetadataConsistency({
    projectRootDir: input.projectRootDir,
    manifest: input.manifest,
  });
  const orphanLeakage = auditOrphanAndLeakage(sourceRoot);
  const exportSafety = auditExportSafety({
    sourceRoot,
    projectRootDir: input.projectRootDir,
    manifest: input.manifest,
  });

  const dimensions = [
    sourceTree,
    importGraph.dimension,
    routeGraph.dimension,
    registry.dimension,
    contractUsage,
    assets.dimension,
    metadata.dimension,
    orphanLeakage.dimension,
    exportSafety.dimension,
  ];

  const failureReasons = [
    ...sourceTree.failureReasons,
    ...importGraph.dimension.failureReasons,
    ...routeGraph.dimension.failureReasons,
    ...registry.dimension.failureReasons,
    ...contractUsage.failureReasons,
    ...assets.dimension.failureReasons,
    ...metadata.dimension.failureReasons,
    ...orphanLeakage.dimension.failureReasons,
    ...exportSafety.dimension.failureReasons,
  ];

  const hasFail = dimensions.some((dimension) => dimension.status === 'FAIL');
  const hasWarn = dimensions.some((dimension) => dimension.status === 'WARN');
  const status = hasFail ? 'FAIL' : hasWarn ? 'WARN' : 'PASS';
  const score =
    dimensions.length > 0
      ? Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length)
      : 0;

  const evidencePaths = [
    ...new Set(dimensions.flatMap((dimension) => dimension.evidencePaths)),
    sourceRoot.replace(/\\/g, '/'),
  ];

  const recordedAt = new Date().toISOString();

  return {
    readOnly: true,
    status,
    score,
    dimensions,
    orphanFiles: orphanLeakage.orphanFiles,
    duplicateModules: registry.duplicateModules,
    missingImports: importGraph.missingImports,
    brokenRoutes: routeGraph.brokenRoutes,
    missingAssets: assets.missingAssets,
    staleMetadata: metadata.staleMetadata,
    temporaryArtifactLeaks: orphanLeakage.temporaryArtifactLeaks,
    exportSafetyIssues: exportSafety.exportSafetyIssues,
    evidencePaths,
    failureReasons,
    auditedSourceRoot: sourceRoot.replace(/\\/g, '/'),
    recordedAt,
    buildRunId: input.manifest.buildRunId,
    projectId: input.manifest.projectId,
    artifactPath: input.artifactPath ?? null,
    reportPath: input.reportPath ?? null,
    persistentArtifactPath: input.persistentArtifactPath ?? null,
    persistentReportPath: input.persistentReportPath ?? null,
  };
}

export function buildWorkspaceRealityAuditChatSummary(result: WorkspaceRealityAuditResult): string {
  if (result.status === 'PASS') {
    return [
      'Workspace Reality Audit passed.',
      'The persistent source tree is export-safe, registry/routes are consistent, and no temporary artifacts leaked into the project source.',
      'No orphan files or broken imports were found.',
    ].join('\n\n');
  }

  if (result.status === 'WARN') {
    return [
      'Workspace Reality Audit completed with warnings.',
      `${result.failureReasons.length} structural issues and ${result.orphanFiles.length} potential orphan files were noted.`,
      result.failureReasons.slice(0, 3).join('; ') || 'Review workspace-reality-audit.json for details.',
    ].join('\n\n');
  }

  return [
    'Workspace Reality Audit failed.',
    result.failureReasons.slice(0, 4).join('; ') || 'Structural contradictions detected in the workspace.',
    'The project source may not be export-safe until these issues are resolved.',
  ].join('\n\n');
}

export function buildWorkspaceRealityAuditMarkdown(result: WorkspaceRealityAuditResult): string {
  const lines = [
    '# Workspace Reality Report',
    '',
    `**Status:** ${result.status}`,
    `**Score:** ${result.score}/100`,
    `**Audited source:** ${result.auditedSourceRoot}`,
    `**Recorded at:** ${result.recordedAt}`,
    '',
    '## Dimensions',
    '',
    ...result.dimensions.map(
      (dimension) =>
        `- **${dimension.label}** — ${dimension.status} (${dimension.score}/100)`,
    ),
    '',
  ];

  if (result.failureReasons.length > 0) {
    lines.push('## Failure Reasons', '', ...result.failureReasons.map((reason) => `- ${reason}`), '');
  }
  if (result.missingImports.length > 0) {
    lines.push('## Missing Imports', '', ...result.missingImports.slice(0, 20).map((item) => `- ${item}`), '');
  }
  if (result.brokenRoutes.length > 0) {
    lines.push('## Broken Routes', '', ...result.brokenRoutes.map((item) => `- ${item}`), '');
  }
  if (result.temporaryArtifactLeaks.length > 0) {
    lines.push(
      '## Temporary Artifact Leaks',
      '',
      ...result.temporaryArtifactLeaks.map((item) => `- ${item}`),
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}
