/** Production Surface Integration Cleanup V1 — main evaluator. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ContractToModuleTraceabilityReport } from '../contract-to-module-traceability/contract-to-module-traceability-types.js';
import { createProductionBuildContext } from '../build-context-integrity/build-context.js';
import { validateProjectIdentityPurity } from './project-identity-surface.js';
import { resolveProjectIdentityFromBuildContext } from './project-identity-surface.js';
import { navigationContainsUnapprovedTemplateLabels, resolveNavigationFromCbgaPlan } from './navigation-surface.js';
import { buildProductFaithfulnessSurface, productFaithfulnessFindingsAreUnique } from './product-faithfulness-surface.js';
import { projectProductionSurfaceStatus, resolveProductionSurfaceBuildOutcome } from './status-surface.js';
import { previewCannotClaimReadinessWhileBlocked, resolvePreviewSurface } from './preview-surface.js';
import { buildProductionSurfaceIntegrationReport, surfaceIntegrationFinding } from './surface-integration-report.js';
import type { ProductionSurfaceIntegrationReport } from './production-surface-types.js';
import { PRODUCTION_SURFACE_INTEGRATION_VERSION } from './production-surface-types.js';

function extractNavLabels(files: readonly GeneratedWorkspaceFile[]): string[] {
  const router = files.find((file) => file.relativePath === 'src/features/FeatureAppRouter.tsx')?.content ?? '';
  return [...router.matchAll(/>\s*([^<{][^<]*?)\s*<\/button>/g)].map((match) => match[1]?.trim() ?? '').filter(Boolean);
}

export function evaluateProductionSurfaceIntegration(input: {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly workspaceFiles: readonly GeneratedWorkspaceFile[];
  readonly traceabilityReport: ContractToModuleTraceabilityReport;
  readonly projectId?: string | null;
  readonly workspaceId?: string | null;
  readonly previousProductIdentities?: readonly string[];
  readonly gpcaBlocked?: boolean;
}): ProductionSurfaceIntegrationReport {
  const buildContext = createProductionBuildContext({
    envelope: input.envelope,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    traceabilityFingerprint: input.traceabilityReport.fingerprint,
  });
  const buildOutcome = resolveProductionSurfaceBuildOutcome({
    gpcaBlocked: input.gpcaBlocked,
    traceabilityReport: input.traceabilityReport,
  });
  const statusProjection = projectProductionSurfaceStatus(buildOutcome);
  const projectIdentity = resolveProjectIdentityFromBuildContext(buildContext, input.envelope);
  const navigation = resolveNavigationFromCbgaPlan(input.envelope);
  const productFaithfulness = buildProductFaithfulnessSurface(input.traceabilityReport);
  const preview = resolvePreviewSurface(buildContext, buildOutcome);
  const workspaceText = input.workspaceFiles.map((file) => file.content).join('\n');

  const findings = [
    ...validateProjectIdentityPurity({
      identity: projectIdentity,
      renderedText: [workspaceText],
      previousIdentities: input.previousProductIdentities,
    }).map((message) =>
      surfaceIntegrationFinding({
        diagnosticCode: 'previous_project_identity_contamination',
        severity: 'BLOCKER',
        surfaceId: 'builder.header.projectTitle',
        message,
      }),
    ),
    ...navigationContainsUnapprovedTemplateLabels(extractNavLabels(input.workspaceFiles), input.envelope).map((label) =>
      surfaceIntegrationFinding({
        diagnosticCode: 'template_navigation_injection',
        severity: 'BLOCKER',
        surfaceId: 'workspace.navigation',
        message: `Unapproved template navigation label rendered: ${label}`,
      }),
    ),
    ...(productFaithfulnessFindingsAreUnique(productFaithfulness.findings)
      ? []
      : [
          surfaceIntegrationFinding({
            diagnosticCode: 'duplicate_product_faithfulness_provider',
            severity: 'BLOCKER',
            surfaceId: 'productFaithfulness.report',
            message: 'Duplicate missing-concept reports detected.',
          }),
        ]),
    ...(previewCannotClaimReadinessWhileBlocked(preview)
      ? []
      : [
          surfaceIntegrationFinding({
            diagnosticCode: 'preview_readiness_while_blocked',
            severity: 'BLOCKER',
            surfaceId: 'preview.availability',
            message: 'Preview claimed readiness while BuildOutcome is blocked.',
          }),
        ]),
  ];

  return buildProductionSurfaceIntegrationReport({
    buildContext,
    buildOutcome,
    statusProjection,
    projectIdentity,
    navigation,
    productFaithfulness,
    preview,
    findings,
  });
}

export function productionSurfaceIntegrationWorkspaceArtifacts(
  report: ProductionSurfaceIntegrationReport,
): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: 'src/production-surface-integration/production-surface-integration-report.json',
      content: `${JSON.stringify(report, null, 2)}\n`,
    },
    {
      relativePath: 'src/production-surface-integration/production-surface-integration-marker.ts',
      content: `/** Production surface integration marker — not product evidence. */\nexport const PRODUCTION_SURFACE_INTEGRATION_VERSION = ${JSON.stringify(PRODUCTION_SURFACE_INTEGRATION_VERSION)};\nexport const PRODUCTION_SURFACE_BUILD_CONTEXT_ID = ${JSON.stringify(report.buildContext.buildContextId)};\nexport const PRODUCTION_SURFACE_BUILD_OUTCOME = ${JSON.stringify(report.buildOutcome)};\n`,
    },
  ];
}
