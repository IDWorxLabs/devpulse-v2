/** Production Surface Integration report assembly. */
import { fingerprintBuildContextValue } from '../build-context-integrity/build-context-fingerprint.js';
import type {
  ProductionSurfaceIntegrationFinding,
  ProductionSurfaceIntegrationReport,
} from './production-surface-types.js';
import type { BuildContext, BuildOutcome, BuildStatusProjection } from '../build-context-integrity/build-context-types.js';
import type { ProjectIdentitySurface } from './production-surface-types.js';
import type { NavigationSurface } from './production-surface-types.js';
import type { ProductFaithfulnessSurface } from './production-surface-types.js';
import type { PreviewSurface } from './production-surface-types.js';
import { PRODUCTION_SURFACE_REGISTRY } from './surface-registry.js';

export function surfaceIntegrationFinding(input: {
  diagnosticCode: string;
  severity: ProductionSurfaceIntegrationFinding['severity'];
  surfaceId: string;
  message: string;
}): ProductionSurfaceIntegrationFinding {
  const base = { ...input, findingId: `psi-${input.diagnosticCode}-${input.surfaceId}` };
  return { ...base, fingerprint: fingerprintBuildContextValue(base) };
}

export function buildProductionSurfaceIntegrationReport(input: {
  buildContext: BuildContext;
  buildOutcome: BuildOutcome;
  statusProjection: BuildStatusProjection;
  projectIdentity: ProjectIdentitySurface;
  navigation: NavigationSurface;
  productFaithfulness: ProductFaithfulnessSurface;
  preview: PreviewSurface;
  findings: readonly ProductionSurfaceIntegrationFinding[];
}): ProductionSurfaceIntegrationReport {
  const complianceOutcome =
    input.findings.some((finding) => finding.severity === 'BLOCKER')
      ? 'SURFACE_INTEGRATION_BLOCKED'
      : 'SURFACE_INTEGRATION_COMPLIANT';
  const base = {
    reportId: `production-surface-integration-${input.buildContext.buildContextId}`,
    buildContext: input.buildContext,
    buildOutcome: input.buildOutcome,
    statusProjection: input.statusProjection,
    projectIdentity: input.projectIdentity,
    navigation: input.navigation,
    productFaithfulness: input.productFaithfulness,
    preview: input.preview,
    surfaceCount: PRODUCTION_SURFACE_REGISTRY.length,
    findings: input.findings,
    complianceOutcome,
  };
  return { readOnly: true, ...base, fingerprint: fingerprintBuildContextValue(base) };
}
