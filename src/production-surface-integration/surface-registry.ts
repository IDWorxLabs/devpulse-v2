/** Canonical registry of every production surface and its single authority source. */
import { fingerprintBuildContextValue } from '../build-context-integrity/build-context-fingerprint.js';
import type { ProductionSurfaceDeclaration } from './production-surface-types.js';

function surface(
  surfaceId: string,
  ownerAuthority: ProductionSurfaceDeclaration['ownerAuthority'],
  canonicalSource: ProductionSurfaceDeclaration['canonicalSource'],
  allowedInputs: readonly string[],
  buildContextOwned: boolean,
): ProductionSurfaceDeclaration {
  const base = { surfaceId, ownerAuthority, canonicalSource, allowedInputs, buildContextOwned };
  return { ...base, fingerprint: fingerprintBuildContextValue(base) };
}

export const PRODUCTION_SURFACE_REGISTRY: readonly ProductionSurfaceDeclaration[] = [
  surface('builder.header.projectTitle', 'BUILD_CONTEXT', 'BuildContext.projectId', ['BuildContext', 'Canonical Product Contract'], true),
  surface('builder.header.projectDescription', 'BUILD_CONTEXT', 'Canonical Product Contract', ['BuildContext', 'Canonical Product Contract'], true),
  surface('builder.summary', 'BUILD_CONTEXT', 'Current BuildContext', ['BuildContext'], true),
  surface('builder.retrySummary', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('builder.recentBuildSummary', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome', 'BuildContext'], true),
  surface('builder.diagnostics', 'BUILD_CONTEXT', 'Current BuildContext', ['BuildContext'], true),
  surface('builder.history', 'BUILD_CONTEXT', 'Current BuildContext', ['BuildContext'], true),
  surface('workspace.title', 'BUILD_CONTEXT', 'BuildContext.projectId', ['BuildContext'], true),
  surface('workspace.metadata', 'BUILD_CONTEXT', 'Current BuildContext', ['BuildContext'], true),
  surface('workspace.manifest', 'BUILD_CONTEXT', 'Current BuildContext', ['BuildContext', 'ApprovedProductionBuildEnvelope'], true),
  surface('workspace.routes', 'CBGA', 'ApprovedProductionBuildEnvelope', ['ApprovedProductionBuildEnvelope'], true),
  surface('workspace.navigation', 'CBGA', 'CBGA Approved Navigation Plan', ['CBGA Approved Navigation Plan'], true),
  surface('workspace.generatedModules', 'APPROVED_PRODUCTION_BUILD_ENVELOPE', 'ApprovedProductionBuildEnvelope', ['ApprovedProductionBuildEnvelope'], true),
  surface('preview.ui', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome', 'BuildContext'], true),
  surface('preview.proof', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('preview.summary', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome', 'BuildContext'], true),
  surface('preview.availability', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('runtime.registrations', 'APPROVED_PRODUCTION_BUILD_ENVELOPE', 'ApprovedProductionBuildEnvelope', ['ApprovedProductionBuildEnvelope', 'BuildContext'], true),
  surface('engineering.report', 'BUILD_CONTEXT', 'Current BuildContext', ['BuildContext'], true),
  surface('engineering.buildSummary', 'BUILD_CONTEXT', 'Current BuildContext', ['BuildContext'], true),
  surface('engineering.traceability', 'CONTRACT_TO_MODULE_TRACEABILITY', 'Contract-to-Module Traceability findings', ['Contract-to-Module Traceability findings'], true),
  surface('engineering.gpca', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('engineering.cbga', 'APPROVED_PRODUCTION_BUILD_ENVELOPE', 'ApprovedProductionBuildEnvelope', ['ApprovedProductionBuildEnvelope'], true),
  surface('engineering.buildContext', 'BUILD_CONTEXT', 'Current BuildContext', ['BuildContext'], true),
  surface('productFaithfulness.report', 'CONTRACT_TO_MODULE_TRACEABILITY', 'Contract-to-Module Traceability findings', ['Contract-to-Module Traceability findings'], true),
  surface('status.build', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('status.execution', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('status.currentStage', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('status.heartbeat', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('status.successBanner', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('status.progressTracker', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('status.footer', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
  surface('status.buttons', 'BUILD_OUTCOME', 'Canonical BuildOutcome', ['BuildOutcome'], false),
] as const;

export function surfaceRegistryById(surfaceId: string): ProductionSurfaceDeclaration | null {
  return PRODUCTION_SURFACE_REGISTRY.find((entry) => entry.surfaceId === surfaceId) ?? null;
}

export function validateSurfaceRegistryIntegrity(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const entry of PRODUCTION_SURFACE_REGISTRY) {
    if (ids.has(entry.surfaceId)) errors.push(`duplicate surfaceId: ${entry.surfaceId}`);
    ids.add(entry.surfaceId);
    if (entry.allowedInputs.length === 0) errors.push(`empty allowedInputs: ${entry.surfaceId}`);
    if (entry.allowedInputs.length > 2) errors.push(`multiple canonical sources: ${entry.surfaceId}`);
  }
  return errors;
}
