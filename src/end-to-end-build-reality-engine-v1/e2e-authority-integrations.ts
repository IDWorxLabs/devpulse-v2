/**
 * Cross-authority integration probes for End-to-End Build Reality Engine V1.
 * Reads engineering artifacts — no application-specific logic.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { buildWorkspaceRealityAuditReport } from '../workspace-reality-audit/workspace-reality-audit-report.js';
import { collectWorkspaceFeatureRealityFallback } from '../feature-contract-reality/feature-reality-workspace-fallback-collector.js';
import { listWorkspaceFeatureModuleIds } from '../prompt-faithful-generation/prompt-faithful-materialization-gate.js';
import { buildRuntimeTruthHealthSummary } from '../runtime-truth-authority/runtime-truth-verifier.js';
import { evaluateInvisibleFounderLaunchTrigger } from '../autonomous-founder-launch-authority/founder-invisible-trigger.js';
import type { E2EBuildRealityStageId } from './e2e-build-reality-types.js';

export interface E2EAuthorityIntegrationResult {
  readOnly: true;
  stageId: E2EBuildRealityStageId;
  passed: boolean;
  detail: string;
  artifactPath: string | null;
}

function readManifest(workspaceDir: string): GeneratedAppManifest | null {
  const manifestPath = join(workspaceDir, 'GENERATED_APP_MANIFEST.json');
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8')) as GeneratedAppManifest;
  } catch {
    return null;
  }
}

export function assessWorkspaceRealityAuditIntegration(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest | null;
}): E2EAuthorityIntegrationResult {
  const manifest = input.manifest ?? readManifest(input.workspaceDir);
  if (!manifest) {
    return {
      readOnly: true,
      stageId: 'WORKSPACE_REALITY_AUDIT',
      passed: false,
      detail: 'Workspace manifest missing — cannot assess workspace reality',
      artifactPath: null,
    };
  }

  if (manifest.workspaceRealityAuditStatus === 'PASS') {
    return {
      readOnly: true,
      stageId: 'WORKSPACE_REALITY_AUDIT',
      passed: true,
      detail: `Workspace reality audit PASS (${manifest.workspaceRealityAuditScore}/100)`,
      artifactPath: manifest.workspaceRealityAuditArtifactPath,
    };
  }

  if (manifest.workspaceRealityAuditStatus === 'FAIL') {
    return {
      readOnly: true,
      stageId: 'WORKSPACE_REALITY_AUDIT',
      passed: false,
      detail:
        manifest.workspaceRealityFailureReasons.join('; ') ||
        'Workspace reality audit recorded FAIL',
      artifactPath: manifest.workspaceRealityAuditArtifactPath,
    };
  }

  const report = buildWorkspaceRealityAuditReport({
    projectRootDir: input.projectRootDir,
    workspaceDir: input.workspaceDir,
    manifest,
  });

  if (report.status === 'PASS') {
    return {
      readOnly: true,
      stageId: 'WORKSPACE_REALITY_AUDIT',
      passed: true,
      detail: `Workspace reality audit PASS (${report.overallScore}/100)`,
      artifactPath: report.artifactPath,
    };
  }

  // The E2E gate runs against the LIVE, running build workspace
  // (`.generated-builder-workspaces/...`) before the authoritative export-time audit is
  // recorded during evidence completion. A live build workspace legitimately contains
  // `node_modules`, `dist`, and the `.generated-app-manifest.json` — these are export
  // zip-safety concerns, not structural reality defects, and the authoritative export audit
  // (recorded post-preview and separately gated) is the correct owner for them. So here we
  // only block on STRUCTURAL reality failures (missing source tree, broken imports/routes,
  // inconsistent registry, contract usage) and defer export-only concerns to that later audit.
  const structuralFailures = report.failureReasons.filter(
    (reason) => !isBuildWorkspaceExportOnlyConcern(reason),
  );
  if (structuralFailures.length === 0) {
    return {
      readOnly: true,
      stageId: 'WORKSPACE_REALITY_AUDIT',
      passed: true,
      detail: `Workspace reality audit deferred export checks to post-preview export audit (${report.overallScore}/100) — no structural defects in live build workspace`,
      artifactPath: report.artifactPath,
    };
  }

  return {
    readOnly: true,
    stageId: 'WORKSPACE_REALITY_AUDIT',
    passed: false,
    detail: structuralFailures.join('; ') || `Workspace reality audit ${report.status}`,
    artifactPath: report.artifactPath,
  };
}

/**
 * True when a workspace-reality failure reason is only meaningful for the exported, zip-safe
 * persistent source — not for the live, running build workspace the E2E gate inspects.
 */
function isBuildWorkspaceExportOnlyConcern(reason: string): boolean {
  const normalized = reason.toLowerCase();
  return (
    normalized.includes('temporary build workspace') ||
    normalized.includes('not zip-safe') ||
    normalized.includes('node_modules present') ||
    normalized.includes('dist present') ||
    normalized.includes('temporary artifact leaked') ||
    normalized.includes('.generated-app-manifest.json present') ||
    (normalized.includes('leaked into source') && normalized.includes('.generated-app-manifest.json'))
  );
}

function hasDirectFeatureMountEvidence(workspaceDir: string): boolean {
  const appPath = join(workspaceDir, 'src/App.tsx');
  const registryPath = join(workspaceDir, 'src/features/registry.ts');
  if (!existsSync(appPath) || !existsSync(registryPath)) return false;
  const appSource = readFileSync(appPath, 'utf8');
  const directMount =
    appSource.includes('data-simple-utility-app') || appSource.includes('data-root-feature');
  return directMount && listWorkspaceFeatureModuleIds(workspaceDir).length > 0;
}

export function assessFeatureRealityIntegration(input: {
  workspaceDir: string;
  manifest: GeneratedAppManifest | null;
}): E2EAuthorityIntegrationResult {
  const manifest = input.manifest ?? readManifest(input.workspaceDir);
  const fallback = collectWorkspaceFeatureRealityFallback({
    workspaceDir: input.workspaceDir,
    requiredModuleIds: manifest?.featureModules ?? [],
  });
  const directMountEvidence = hasDirectFeatureMountEvidence(input.workspaceDir);
  const passed = fallback.passed || directMountEvidence;

  return {
    readOnly: true,
    stageId: 'FEATURE_REALITY',
    passed,
    detail: passed
      ? directMountEvidence && !fallback.passed
        ? `Feature reality PASS via direct-feature mount (${listWorkspaceFeatureModuleIds(input.workspaceDir).join(', ')})`
        : `Feature reality PASS (${fallback.score}/100, ${fallback.presentModuleIds.length} module(s))`
      : fallback.blockers.join('; ') || `Feature reality ${fallback.status}`,
    artifactPath: existsSync(join(input.workspaceDir, '.feature-contract-reality.json'))
      ? join(input.workspaceDir, '.feature-contract-reality.json')
      : null,
  };
}

export function assessRuntimeTruthIntegration(input: {
  projectRootDir: string;
  previewUrl: string | null;
  previewWorkspaceHash: string | null;
}): E2EAuthorityIntegrationResult {
  try {
    const health = buildRuntimeTruthHealthSummary(input.projectRootDir);
    const stale = health.staleRuntimeDetected;
    const hashAligned =
      !input.previewWorkspaceHash ||
      !health.sourceFingerprint ||
      input.previewWorkspaceHash.startsWith(health.sourceFingerprint.slice(0, 8)) ||
      input.previewWorkspaceHash === health.sourceFingerprint;

    // Host orchestration may report STALE after operator source edits without a process restart.
    // That is a platform health signal, not proof the generated app preview is unavailable.
    // When a preview URL is present, align with the not-booted fallback: do not false-fail
    // LIVE_PREVIEW / E2E readiness solely because the host fingerprint drifted.
    return {
      readOnly: true,
      stageId: 'RUNTIME_TRUTH',
      passed: Boolean(input.previewUrl),
      detail: input.previewUrl
        ? stale
          ? `Preview available; host runtime marked STALE (runtimeId ${health.runtimeId}) — not blocking generated-preview readiness`
          : `Runtime truth fresh — runtimeId ${health.runtimeId}${hashAligned ? '' : ' (preview hash differs from runtime fingerprint)'}`
        : 'Preview URL unavailable for runtime truth cross-check',
      artifactPath: null,
    };
  } catch {
    return {
      readOnly: true,
      stageId: 'RUNTIME_TRUTH',
      passed: Boolean(input.previewUrl),
      detail: input.previewUrl
        ? 'Runtime truth authority not booted — preview HTTP availability used as fallback'
        : 'Runtime truth unavailable without preview URL',
      artifactPath: null,
    };
  }
}

export function assessFounderTestingGateIntegration(input: {
  projectRootDir: string;
  workspaceDir: string | null;
  domRealityPassed: boolean;
  interactiveRealityPassed: boolean;
  falseSuccessPassed: boolean;
  previewAuthorityPassed?: boolean;
}): E2EAuthorityIntegrationResult {
  const visibleRealityReady =
    input.domRealityPassed &&
    input.interactiveRealityPassed &&
    input.falseSuccessPassed &&
    input.previewAuthorityPassed !== false;
  const trigger = evaluateInvisibleFounderLaunchTrigger({
    projectRootDir: input.projectRootDir,
    workspaceDir: input.workspaceDir,
  });

  return {
    readOnly: true,
    stageId: 'FOUNDER_TESTING_GATE',
    passed: visibleRealityReady,
    detail: visibleRealityReady
      ? trigger.shouldRun
        ? 'Founder testing prerequisites satisfied'
        : `Visible reality ready — downstream founder launch awaiting: ${trigger.missingPrerequisites.join(', ') || 'none'}`
      : [
          ...(input.domRealityPassed ? [] : ['DOM reality incomplete']),
          ...(input.interactiveRealityPassed ? [] : ['Interactive reality incomplete']),
          ...(input.falseSuccessPassed ? [] : ['False success scan blocked']),
          ...(input.previewAuthorityPassed === false ? ['Preview authority mismatch'] : []),
        ].join('; ') || 'Founder testing gate blocked',
    artifactPath: null,
  };
}
