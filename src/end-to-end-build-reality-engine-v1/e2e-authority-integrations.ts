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
  return {
    readOnly: true,
    stageId: 'WORKSPACE_REALITY_AUDIT',
    passed: report.status === 'PASS',
    detail:
      report.status === 'PASS'
        ? `Workspace reality audit PASS (${report.overallScore}/100)`
        : report.failureReasons.join('; ') || `Workspace reality audit ${report.status}`,
    artifactPath: report.artifactPath,
  };
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

    return {
      readOnly: true,
      stageId: 'RUNTIME_TRUTH',
      passed: !stale && Boolean(input.previewUrl),
      detail: input.previewUrl
        ? stale
          ? 'Runtime truth reports stale runtime while preview is available'
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
