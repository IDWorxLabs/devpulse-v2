/**
 * Validation Runtime Governance V1 — duplicate validation prevention.
 */

import type { ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/index.js';
import { resolveReusableArtifact } from './artifact-reuse-registry.js';
import { resolveBuildOutput, shouldRebuild } from './build-output-cache.js';
import { getExistingPreviewRuntime } from './preview-runtime-pool.js';
import type { DuplicatePreventionRule } from './validation-runtime-governance-v1-types.js';

export function buildDuplicatePreventionRules(
  metrics: readonly ValidatorRuntimeMetric[],
): readonly DuplicatePreventionRule[] {
  const countWith = (predicate: (m: ValidatorRuntimeMetric) => boolean): number =>
    metrics.filter((m) => m.registeredInPackageJson && predicate(m)).length;

  return [
    {
      operation: 'Repeated npm install',
      blockWhenReusableEvidenceExists: true,
      affectedValidatorCount: countWith((m) => m.workPatterns.npmInstallCount > 0),
    },
    {
      operation: 'Repeated npm build',
      blockWhenReusableEvidenceExists: true,
      affectedValidatorCount: countWith((m) => m.workPatterns.npmBuildCount > 0),
    },
    {
      operation: 'Repeated preview startup',
      blockWhenReusableEvidenceExists: true,
      affectedValidatorCount: countWith((m) => m.workPatterns.previewServerCount > 0),
    },
    {
      operation: 'Repeated UVL execution',
      blockWhenReusableEvidenceExists: true,
      affectedValidatorCount: countWith((m) => m.workPatterns.uvlExecutionCount > 0),
    },
    {
      operation: 'Repeated AFLA execution',
      blockWhenReusableEvidenceExists: true,
      affectedValidatorCount: countWith((m) => m.workPatterns.aflaExecutionCount > 0),
    },
    {
      operation: 'Repeated Playwright execution',
      blockWhenReusableEvidenceExists: true,
      affectedValidatorCount: countWith((m) => m.workPatterns.playwrightExecutionCount > 0),
    },
  ];
}

export interface DuplicateCheckResult {
  blocked: boolean;
  operation: string;
  reason: string;
  reuseEvidence: string | null;
}

export function checkDuplicateOperation(input: {
  operation: 'npm_install' | 'npm_build' | 'preview_startup' | 'uvl' | 'afla' | 'playwright';
  workspaceKey: string;
  fingerprint: string;
  artifactType?: 'EXECUTION_PROOF' | 'VERIFICATION_PROOF' | 'BUILD_PROOF' | 'BLUEPRINT_PROOF' | 'AFLA_ASSESSMENT';
}): DuplicateCheckResult {
  switch (input.operation) {
    case 'npm_build': {
      if (!shouldRebuild({ workspaceKey: input.workspaceKey, currentFingerprint: input.fingerprint })) {
        const cached = resolveBuildOutput({
          workspaceKey: input.workspaceKey,
          workspaceFingerprint: input.fingerprint,
          distPath: '',
        });
        if (cached.hit) {
          return {
            blocked: true,
            operation: 'npm_build',
            reason: 'Build output cache hit — inputs unchanged',
            reuseEvidence: cached.buildHash,
          };
        }
      }
      break;
    }
    case 'preview_startup': {
      const existing = getExistingPreviewRuntime(input.workspaceKey);
      if (existing) {
        return {
          blocked: true,
          operation: 'preview_startup',
          reason: 'Preview runtime pool has active server for workspace',
          reuseEvidence: existing.url,
        };
      }
      break;
    }
    case 'uvl':
    case 'afla':
    case 'playwright': {
      if (input.artifactType) {
        const artifact = resolveReusableArtifact({
          artifactType: input.artifactType,
          artifactKey: input.workspaceKey,
          currentFingerprint: input.fingerprint,
        });
        if (artifact.reusable) {
          return {
            blocked: true,
            operation: input.operation,
            reason: `Reusable ${input.artifactType} artifact still valid`,
            reuseEvidence: artifact.entry?.fingerprint ?? null,
          };
        }
      }
      break;
    }
    default:
      break;
  }

  return { blocked: false, operation: input.operation, reason: 'No reusable evidence', reuseEvidence: null };
}
