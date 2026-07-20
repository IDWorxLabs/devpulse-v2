/**
 * AiDevEngine Universal App Blueprint v1.0 — public API.
 */

export {
  UNIVERSAL_APP_BLUEPRINT_PASS_TOKEN,
  UNIVERSAL_APP_BLUEPRINT_OWNER_MODULE,
  UNIVERSAL_APP_BLUEPRINT_PHASE,
  UNIVERSAL_APP_BLUEPRINT_REQUIRED_ARTIFACTS,
  UNIVERSAL_APP_BLUEPRINT_CONTENT_MARKERS,
} from './universal-app-blueprint-registry.js';

export {
  UNIVERSAL_APP_BLUEPRINT_VERSION,
  type UniversalBlueprintBuildInput,
  type UniversalBlueprintInspectionResult,
  type UniversalBlueprintWorkspaceFile,
} from './universal-app-blueprint-types.js';

export {
  buildUniversalBlueprintWorkspaceFiles,
  buildUniversalBlueprintAppTsx,
  buildUniversalBlueprintPackageJsonMarkers,
  mergePackageJsonWithBlueprint,
} from './universal-app-blueprint-generator.js';

export {
  inspectUniversalAppBlueprint,
  assertUniversalAppBlueprint,
} from './universal-app-blueprint-inspector.js';

export {
  UNIVERSAL_APP_BLUEPRINT_PLANNING_QUESTIONS,
  UNIVERSAL_APP_BLUEPRINT_DEFAULTS,
} from './universal-app-blueprint-planning-rule.js';

export { composeGeneratedAppWorkspaceFiles } from './universal-app-blueprint-authority.js';

export {
  deriveBlueprintContractCopy,
  findArtifactProvenance,
  runBlueprintTemplateEliminationAudit,
  UNIVERSAL_APP_BLUEPRINT_ARTIFACT_PROVENANCE,
  type BlueprintContractDerivedCopy,
  type BlueprintContractDerivationInput,
  type BlueprintArtifactProvenance,
  type BlueprintArtifactProvenanceKind,
  type BlueprintTemplateEliminationAuditReport,
} from './universal-app-blueprint-contract-provenance.js';

export {
  buildBlueprintProductSurface,
  buildBlueprintProductSurfaceTs,
  type BlueprintContentOrigin,
  type BlueprintProductSurface,
  type BlueprintProductSurfaceContent,
  type BlueprintProductSurfaceInput,
  type BlueprintProductSurfaceNavItem,
  type BlueprintProductSurfaceProvenance,
} from './universal-app-blueprint-product-surface.js';

export type { InfrastructureNavigationItem, InfrastructureNavigationKind } from '../infrastructure-product-boundary-authority-v1/infrastructure-navigation-model.js';
