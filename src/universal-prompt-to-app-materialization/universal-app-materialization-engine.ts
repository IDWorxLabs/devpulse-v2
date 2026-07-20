/**
 * Universal Prompt-to-App Materialization V1 — workspace file materialization engine.
 */

import type { GeneratedWorkspaceFile, GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { composeGeneratedAppWorkspaceFiles } from '../universal-app-blueprint/universal-app-blueprint-authority.js';
import { mergePackageJsonWithBlueprint } from '../universal-app-blueprint/universal-app-blueprint-generator.js';
import { UNIVERSAL_APP_BLUEPRINT_VERSION } from '../universal-app-blueprint/universal-app-blueprint-types.js';
import {
  buildUniversalFeatureContract,
  buildUniversalFeatureContractJson,
} from '../universal-feature-contract-intelligence/universal-feature-contract-builder.js';
import { buildSharedRuntimeFiles } from '../code-generation-engine/universal-crud-app-generator-shared.js';
import {
  buildInitialGeneratedAppManifest,
  GENERATED_APP_MANIFEST_FILENAME,
  serializeGeneratedAppManifest,
} from './generated-app-manifest.js';
import {
  getProfileFeatureDefinition,
  resolveMaterializationProfile,
  type MaterializationProfile,
} from './profile-feature-map.js';
import { extractPromptAppTitle, summarizePrompt, deriveNeutralAppTagline } from './prompt-app-metadata.js';
import { buildDemoDataTs } from './profile-feature-ui-generator.js';
import {
  buildAllModularFeatureModuleFiles,
  buildFeatureAppRouterCss,
  buildFeatureAppRouterTsx,
  buildModularFeatureRegistryTs,
  buildModularFeatureRoutesTs,
  materializableFeatureModules,
  moduleIdToDisplayName,
} from './modular-feature-module-generator.js';
import { deriveBlueprintContractCopy } from '../universal-app-blueprint/universal-app-blueprint-contract-provenance.js';
import {
  guardPromptBoundedMaterialization,
  applyPromptBoundedPlanToBuildPlan,
} from '../prompt-bounded-materialization/index.js';
import {
  buildPromptFaithfulnessManifestFields,
  resolvePromptFaithfulBuildPlan,
} from '../prompt-faithful-generation/index.js';
import {
  patchRegistryPrimaryRoute,
  resolveDirectFeatureRootMount,
} from '../simple-utility-app/direct-feature-root-mount.js';
import { buildCanonicalProductContract } from '../product-faithfulness-v2/index.js';
import { augmentWorkspaceWithContractToModuleTraceability, resolveMaterializationModuleIdsFromEnvelope } from '../contract-to-module-traceability/index.js';
import { augmentWorkspaceWithBuildContextIntegrity } from '../build-context-integrity/index.js';
import { augmentWorkspaceWithProductionSurfaceIntegration } from '../production-surface-integration/index.js';
import {
  isApprovedProductIdentityValid,
  requireApprovedProductIdentity,
  type ApprovedProductIdentity,
} from '../contract-bound-generation-authority-v4/approved-product-identity.js';
import {
  isApprovedNavigationPlanValid,
  requireApprovedNavigationPlan,
  type ApprovedNavigationPlan,
} from '../contract-bound-generation-authority-v4/approved-navigation-plan.js';
import {
  isApprovedModulePlanValid,
  requireApprovedModulePlan,
  type ApprovedModulePlan,
} from '../contract-bound-generation-authority-v4/approved-module-plan.js';
import {
  isApprovedMetadataPlanValid,
  requireApprovedMetadataPlan,
  type ApprovedMetadataPlan,
} from '../contract-bound-generation-authority-v4/approved-metadata-plan.js';
import {
  isApprovedSampleDataPlanValid,
  requireApprovedSampleDataPlan,
  type ApprovedSampleDataPlan,
} from '../contract-bound-generation-authority-v4/approved-sample-data-plan.js';
import {
  isApprovedProvenancePlanValid,
  requireApprovedProvenancePlan,
  type ApprovedProvenancePlan,
} from '../contract-bound-generation-authority-v4/approved-provenance-plan.js';
import {
  isApprovedRepairRealityPlanValid,
  requireApprovedRepairRealityPlan,
  type ApprovedRepairRealityPlan,
} from '../contract-bound-generation-authority-v4/approved-repair-reality-plan.js';
import {
  isApprovedProductionBuildEnvelopeValid,
  requireApprovedProductionBuildEnvelope,
  constitutionalHandoffsFromApprovedProductionBuildEnvelope,
  type ApprovedProductionBuildEnvelope,
} from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';

function profileSlug(profile: MaterializationProfile): string {
  return profile.toLowerCase().replace(/_/g, '-');
}

export function buildUniversalMaterializedWorkspaceFiles(input: {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  rawPrompt: string;
  profile?: GeneratedAppProfile | null;
  buildRunId?: string;
  faithfulBuildPlan?: import('../prompt-faithful-generation/index.js').ResolvedPromptFaithfulBuildPlan;
  /**
   * Contract-Bound Navigation Shell Fix V1 — the real CBGA-approved navigation plan's labels
   * (`CbgaGenerationReport.navigationPlan.map(item => item.label)`) for this build, threaded
   * through to the blueprint generator so its `AppShell.tsx`/`product-surface.ts` never emit a
   * default-shell navigation item (Activity/Alerts/Profile/Settings/Help/Feedback/Legal) CBGA did
   * not already approve. Optional and additive: omitted callers get the safe default (none emitted).
   */
  approvedNavigationLabels?: readonly string[];
  /**
   * Identity Computation Collapse V1 — the single approved, CBGA-repaired product identity
   * (PPC-1207 No Parallel Truth). When present, `displayName` below is taken directly from it —
   * `extractPromptAppTitle(rawPrompt)` and the Universal Feature Contract's own `productName`
   * never run as a fallback. Optional so pre-CBGA/isolated/test-only callers keep the existing
   * draft-derivation behavior described on `appTitle` below.
   */
  approvedIdentity?: ApprovedProductIdentity | null;
  /**
   * Navigation Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-repaired navigation plan for this build. When present, it is the ONLY source for
   * navigation items rendered by the feature router (`buildFeatureAppRouterTsx`), the blueprint
   * shell's default-shell gating, the Universal Feature Contract's `navigation` field, and
   * generated manifests — none of them independently derive/infer/merge navigation once supplied.
   * Optional so pre-CBGA/isolated/test-only callers keep their existing draft-derivation behavior
   * (plain `approvedNavigationLabels` above, or no gating at all).
   */
  approvedNavigationPlan?: ApprovedNavigationPlan | null;
  /**
   * Module Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-repaired module plan for this build. When present, every module's `displayName`/`route`
   * rendered by the feature registry/router (`buildAllModularFeatureModuleFiles`,
   * `buildFeatureAppRouterTsx`), the blueprint's `coreFeatureLabel`, the Universal Feature
   * Contract's `modules` field, and generated manifests is taken from this plan for the modules it
   * covers — `moduleIdToDisplayName`/`resolveModuleRoute` (independent slug→title-case/positional
   * derivations) never determine a value the plan already approved. Which modules materialize as
   * files at all remains driven by `definition.featureModules` exactly as before (unchanged —
   * that set is owned by prompt-faithful-generation/CBGA repair, not this parameter). Optional so
   * pre-CBGA/isolated/test-only callers keep the existing draft-derivation behavior.
   */
  approvedModulePlan?: ApprovedModulePlan | null;
  /**
   * Metadata Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-composed metadata plan for this build (title, subtitle, description, module/navigation/
   * route counts, summary strings). When present, it is the ONLY source for the application
   * subtitle/tagline passed to the blueprint, the manifest's subtitle/summary fields, and the
   * Universal Feature Contract's `metadata` field — `deriveNeutralAppTagline(displayName)`
   * (an independent per-call computation) never runs once supplied. Optional so pre-CBGA/
   * isolated/test-only callers keep the existing draft-derivation behavior.
   */
  approvedMetadataPlan?: ApprovedMetadataPlan | null;
  /**
   * Sample Data Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-composed sample data plan for this build (collections, cards, statistics, seed definitions,
   * empty states). When present, it is the ONLY source for demo-data.ts, blueprint dashboard/
   * preview seeds, and safe-payment placeholder line items — independent sample/demo/preview
   * generation never runs once supplied. Optional so pre-CBGA/isolated/test-only callers keep
   * existing behavior.
   */
  approvedSampleDataPlan?: ApprovedSampleDataPlan | null;
  /**
   * Provenance Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-composed provenance plan for this build (ancestry chains, artifact entries, vocabularies).
   * When present, it is the ONLY source for manifest provenance fields and the Universal Feature
   * Contract's `provenance` field — independent provenance reconstruction never runs once supplied.
   */
  approvedProvenancePlan?: ApprovedProvenancePlan | null;
  /**
   * Repair Reality Alignment V1 (PPC-1207 No Parallel Truth) — the single approved repair reality
   * plan for this build. When present, manifests and feature contract consume its repairSummary
   * instead of inferring repair classification independently.
   */
  approvedRepairRealityPlan?: ApprovedRepairRealityPlan | null;
  /**
   * Final Immutable Production Pipeline V1 (PPC-1207 No Parallel Truth) — when present, this is the
   * ONLY constitutional source for every handoff below. Individual handoff fields are ignored.
   */
  approvedProductionBuildEnvelope?: ApprovedProductionBuildEnvelope | null;
}): GeneratedWorkspaceFile[] {
  let approvedIdentity = input.approvedIdentity;
  let approvedNavigationPlan = input.approvedNavigationPlan;
  let approvedModulePlan = input.approvedModulePlan;
  let approvedMetadataPlan = input.approvedMetadataPlan;
  let approvedSampleDataPlan = input.approvedSampleDataPlan;
  let approvedProvenancePlan = input.approvedProvenancePlan;
  let approvedRepairRealityPlan = input.approvedRepairRealityPlan;

  if (input.approvedProductionBuildEnvelope !== undefined && input.approvedProductionBuildEnvelope !== null) {
    requireApprovedProductionBuildEnvelope(
      input.approvedProductionBuildEnvelope,
      'buildUniversalMaterializedWorkspaceFiles',
    );
    const handoffs = constitutionalHandoffsFromApprovedProductionBuildEnvelope(input.approvedProductionBuildEnvelope);
    approvedIdentity = handoffs.approvedProductIdentity;
    approvedNavigationPlan = handoffs.approvedNavigationPlan;
    approvedModulePlan = handoffs.approvedModulePlan;
    approvedMetadataPlan = handoffs.approvedMetadataPlan;
    approvedSampleDataPlan = handoffs.approvedSampleDataPlan;
    approvedProvenancePlan = handoffs.approvedProvenancePlan;
    approvedRepairRealityPlan = handoffs.approvedRepairRealityPlan;
  }

  const buildPlan =
    input.faithfulBuildPlan ??
    resolvePromptFaithfulBuildPlan(input.rawPrompt, input.profile ?? null);

  const materializationGuard = guardPromptBoundedMaterialization({
    rawPrompt: input.rawPrompt,
    buildPlan,
  });
  if (!materializationGuard.allowed) {
    throw new Error(
      materializationGuard.blockedReason ??
        'Prompt-Bounded Materialization Guard blocked file generation — no approved modules.',
    );
  }
  const boundedBuildPlan = applyPromptBoundedPlanToBuildPlan(buildPlan, materializationGuard.plan);
  const materializationProfile = boundedBuildPlan.materializationProfile;
  const definition = boundedBuildPlan.definition;
  // Identity Computation Collapse V1 (PPC-1207 No Parallel Truth) — when an approved identity is
  // supplied (the real production path, always downstream of CBGA repair), it is the ONLY source
  // for `displayName`. The two-level "Custom App" sentinel fallback below (raw-prompt
  // `extractPromptAppTitle`, then the independently-built Universal Feature Contract's own
  // `productName`) is preserved ONLY for pre-CBGA/isolated/test-only callers that intentionally
  // omit `approvedIdentity` — it must never run in the real generation path.
  if (approvedIdentity !== undefined && approvedIdentity !== null) {
    requireApprovedProductIdentity(approvedIdentity, 'buildUniversalMaterializedWorkspaceFiles');
  }
  const approvedDisplayName = isApprovedProductIdentityValid(approvedIdentity)
    ? approvedIdentity.displayName
    : null;
  const appTitle = approvedDisplayName ??
    (boundedBuildPlan.extraction.appName !== 'Custom App'
      ? boundedBuildPlan.extraction.appName
      : extractPromptAppTitle(input.rawPrompt));

  // Navigation Computation Collapse V1 (PPC-1207 No Parallel Truth) — when an approved navigation
  // plan is supplied (the real production path, always downstream of CBGA repair), it is the ONLY
  // source for navigation items/labels below. `approvedNavigationLabels` (a plain string array) is
  // preserved ONLY for pre-CBGA/isolated/test-only callers that intentionally omit the structured
  // plan — it must never independently determine navigation once the plan is supplied.
  const suppliedNavigationPlan = approvedNavigationPlan;
  if (suppliedNavigationPlan !== undefined && suppliedNavigationPlan !== null) {
    requireApprovedNavigationPlan(suppliedNavigationPlan, 'buildUniversalMaterializedWorkspaceFiles');
  }
  const approvedNavPlanValid = isApprovedNavigationPlanValid(suppliedNavigationPlan);
  const approvedNavItems = approvedNavPlanValid ? suppliedNavigationPlan.navigationItems : null;
  const approvedNavLabels: readonly string[] = approvedNavPlanValid
    ? suppliedNavigationPlan.productEntries
    : input.approvedNavigationLabels ?? [];

  // Module Computation Collapse V1 (PPC-1207 No Parallel Truth) — when an approved module plan is
  // supplied (the real production path, always downstream of CBGA repair), every module's
  // displayName/route below is taken from it for the modules it covers; `moduleIdToDisplayName`/
  // `resolveModuleRoute` only determine a value for modules the plan does not cover (system-shell
  // modules — see `ApprovedModulePlan.systemShellModuleIds` — and pre-CBGA/isolated/test-only calls).
  const suppliedModulePlan = approvedModulePlan;
  if (suppliedModulePlan !== undefined && suppliedModulePlan !== null) {
    requireApprovedModulePlan(suppliedModulePlan, 'buildUniversalMaterializedWorkspaceFiles');
  }
  const approvedModulePlanValid = isApprovedModulePlanValid(suppliedModulePlan);
  const approvedModuleEntries = approvedModulePlanValid ? suppliedModulePlan.moduleEntries : null;
  const approvedModuleDisplayNameByModuleId = new Map(
    (approvedModuleEntries ?? []).map((entry) => [entry.moduleId, entry.displayName] as const),
  );
  const moduleDisplayNameOf = (moduleId: string): string =>
    approvedModuleDisplayNameByModuleId.get(moduleId) ?? moduleIdToDisplayName(moduleId);

  // Metadata Computation Collapse V1 (PPC-1207 No Parallel Truth) — when an approved metadata plan
  // is supplied (the real production path, always downstream of CBGA approval), its
  // `applicationSubtitle`/summary fields are the ONLY source for the tagline/manifest-subtitle/
  // feature-contract metadata below. `deriveNeutralAppTagline(displayName)` (an independent
  // per-call computation) is preserved ONLY for pre-CBGA/isolated/test-only callers that
  // intentionally omit the approved metadata plan.
  const suppliedMetadataPlan = approvedMetadataPlan;
  if (suppliedMetadataPlan !== undefined && suppliedMetadataPlan !== null) {
    requireApprovedMetadataPlan(suppliedMetadataPlan, 'buildUniversalMaterializedWorkspaceFiles');
  }
  const approvedMetadataPlanValid = isApprovedMetadataPlanValid(suppliedMetadataPlan);
  // Convenience projection consumed by every `buildUniversalFeatureContract`/Json call below —
  // never a second computation, always the same fields off `suppliedMetadataPlan`.
  const approvedMetadataForContract = approvedMetadataPlanValid
    ? {
        applicationTitle: suppliedMetadataPlan.applicationTitle,
        applicationSubtitle: suppliedMetadataPlan.applicationSubtitle,
        approvedModuleCount: suppliedMetadataPlan.approvedModuleCount,
        approvedNavigationCount: suppliedMetadataPlan.approvedNavigationCount,
        approvedRouteCount: suppliedMetadataPlan.approvedRouteCount,
      }
    : null;

  // Sample Data Computation Collapse V1 (PPC-1207 No Parallel Truth) — when an approved sample data
  // plan is supplied (the real production path, always downstream of CBGA approval), its collections/
  // cards/statistics/empty-states are the ONLY source for demo-data.ts, blueprint dashboard/preview
  // seeds, and safe-payment placeholder line items below.
  const suppliedSampleDataPlan = approvedSampleDataPlan;
  if (suppliedSampleDataPlan !== undefined && suppliedSampleDataPlan !== null) {
    requireApprovedSampleDataPlan(suppliedSampleDataPlan, 'buildUniversalMaterializedWorkspaceFiles');
  }
  const approvedSampleDataPlanValid = isApprovedSampleDataPlanValid(suppliedSampleDataPlan);
  const approvedSampleDataForContract = approvedSampleDataPlanValid
    ? {
        approvedSamplesPresent: suppliedSampleDataPlan.approvedSamplesPresent,
        sampleSummary: suppliedSampleDataPlan.sampleSummary,
        approvedEntityTypeCount: suppliedSampleDataPlan.approvedEntityTypes.length,
      }
    : null;

  const suppliedProvenancePlan = approvedProvenancePlan;
  if (suppliedProvenancePlan !== undefined && suppliedProvenancePlan !== null) {
    requireApprovedProvenancePlan(suppliedProvenancePlan, 'buildUniversalMaterializedWorkspaceFiles');
  }
  const approvedProvenancePlanValid = isApprovedProvenancePlanValid(suppliedProvenancePlan);
  const approvedProvenanceForContract = approvedProvenancePlanValid
    ? {
        provenanceSummary: suppliedProvenancePlan.provenanceSummary,
        contractId: suppliedProvenancePlan.contractId,
        ancestryChainCount: suppliedProvenancePlan.ancestryChains.length,
        provenAncestryChainCount: suppliedProvenancePlan.ancestryChains.filter((chain) => chain.proven).length,
      }
    : null;

  const suppliedRepairRealityPlan = approvedRepairRealityPlan;
  if (suppliedRepairRealityPlan !== undefined && suppliedRepairRealityPlan !== null) {
    requireApprovedRepairRealityPlan(suppliedRepairRealityPlan, 'buildUniversalMaterializedWorkspaceFiles');
  }
  const approvedRepairRealityPlanValid = isApprovedRepairRealityPlanValid(suppliedRepairRealityPlan);
  const approvedRepairRealityForContract = approvedRepairRealityPlanValid
    ? {
        repairSummary: suppliedRepairRealityPlan.repairSummary,
        repairEntryCount: suppliedRepairRealityPlan.repairEntries.length,
        workspaceMutationCount: suppliedRepairRealityPlan.repairEntries.filter((entry) => entry.workspaceMutated)
          .length,
      }
    : null;

  const contract = buildUniversalFeatureContract({
    contractId: input.contractId,
    rawPrompt: input.rawPrompt,
    profile: materializationProfile as GeneratedAppProfile,
    approvedProductName: approvedDisplayName,
    approvedNavigationLabels: approvedNavPlanValid ? approvedNavLabels : null,
    approvedModuleIds: approvedModulePlanValid ? suppliedModulePlan.moduleIds : null,
    approvedModuleEntries: approvedModulePlanValid ? suppliedModulePlan.moduleEntries : null,
    approvedCanonicalContract: input.approvedProductionBuildEnvelope?.canonicalProductContract ?? null,
    approvedMetadata: approvedMetadataForContract,
    approvedSampleData: approvedSampleDataForContract,
    approvedProvenance: approvedProvenanceForContract,
    approvedRepairReality: approvedRepairRealityForContract,
  });
  const displayName = approvedDisplayName ?? (appTitle !== 'Custom App' ? appTitle : contract.productName);

  const modular = buildAllModularFeatureModuleFiles(
    displayName,
    definition,
    approvedModuleEntries,
    approvedSampleDataPlanValid ? suppliedSampleDataPlan : null,
    input.approvedProductionBuildEnvelope ?? null,
    input.rawPrompt ?? null,
  );
  const moduleIds =
    input.approvedProductionBuildEnvelope !== undefined && input.approvedProductionBuildEnvelope !== null
      ? resolveMaterializationModuleIdsFromEnvelope(definition, input.approvedProductionBuildEnvelope)
      : materializableFeatureModules(definition);
  const navMaterializedModuleIds =
    approvedNavItems && approvedNavItems.length > 0
      ? [...new Set(approvedNavItems.map((item) => item.moduleId).filter((moduleId) => moduleIds.includes(moduleId)))]
      : moduleIds;
  const featureModuleDirectories = moduleIds.map((moduleId) => `src/features/${moduleId}`);
  const generatedFeatureModuleFiles = modular.files.map((file) => file.relativePath);

  const manifest = buildInitialGeneratedAppManifest({
    projectId: input.contractId,
    projectName: displayName,
    buildRunId: input.buildRunId ?? input.contractId,
    prompt: input.rawPrompt,
    selectedProfile: materializationProfile,
    expectedAppType: definition.expectedAppType,
    promptSummary: summarizePrompt(input.rawPrompt),
    confidence: boundedBuildPlan.ranking.confidence,
    featureModules: moduleIds,
    routes: definition.routes,
    navigationLabels: approvedNavPlanValid ? [...approvedNavLabels] : undefined,
    approvedModuleIds: approvedModulePlanValid ? [...suppliedModulePlan.moduleIds] : undefined,
    approvedApplicationSubtitle: approvedMetadataPlanValid ? suppliedMetadataPlan.applicationSubtitle : undefined,
    approvedMetadataSummary: approvedMetadataPlanValid ? suppliedMetadataPlan.manifestSummary : undefined,
    approvedSampleSummary: approvedSampleDataPlanValid ? suppliedSampleDataPlan.sampleSummary : undefined,
    approvedSamplesPresent: approvedSampleDataPlanValid ? suppliedSampleDataPlan.approvedSamplesPresent : undefined,
    approvedProvenanceSummary: approvedProvenancePlanValid ? suppliedProvenancePlan.provenanceSummary : undefined,
    approvedRepairRealitySummary: approvedRepairRealityPlanValid
      ? suppliedRepairRealityPlan.repairSummary
      : undefined,
    featureModuleDetails: modular.manifestEntries,
    generatedFeatureModuleFiles,
    featureModuleDirectories,
    fallbackUsed: boundedBuildPlan.guardResult.guardApplied,
    promptFaithfulness: buildPromptFaithfulnessManifestFields({
      rawPrompt: input.rawPrompt,
      selectedProfile: String(materializationProfile),
      generatedModules: moduleIds,
      guardResult: boundedBuildPlan.guardResult,
    }),
  });
  manifest.generatedFeatureModulesCount = modular.manifestEntries.length;

  const sharedFiles: GeneratedWorkspaceFile[] = [
    // Metadata Computation Collapse V1 — the runtime shell's document title is the approved
    // metadata plan's `applicationTitle` when supplied (identical value to `displayName` in the
    // real production path, since both trace back to the same `ApprovedProductIdentity`); falls
    // back to `displayName` only for pre-CBGA/isolated/test-only callers.
    ...buildSharedRuntimeFiles(input.contractId, approvedMetadataPlanValid ? suppliedMetadataPlan.applicationTitle : displayName),
    {
      relativePath: 'package.json',
      content: mergePackageJsonWithBlueprint(
        JSON.stringify(
          {
            name: input.contractId,
            version: '0.1.0',
            private: true,
            type: 'module',
            description: `Generated ${displayName} — ${materializationProfile}`,
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview',
              verify: 'node verification/run-verify.mjs',
            },
            dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
            devDependencies: {
              '@types/react': '^18.3.12',
              '@types/react-dom': '^18.3.1',
              '@vitejs/plugin-react': '^4.3.4',
              typescript: '~5.6.3',
              vite: '^5.4.11',
            },
            devpulseGeneratedApp: profileSlug(materializationProfile),
            devpulseCodeGenerationEngine: 'v1',
            devpulseUniversalFeatureContract: 'v1',
            devpulseUniversalMaterialization: 'v1',
            devpulseModularFeatureMaterialization: 'v1',
          },
          null,
          2,
        ) + '\n',
      ),
    },
    {
      relativePath: GENERATED_APP_MANIFEST_FILENAME,
      content: serializeGeneratedAppManifest(manifest),
    },
    {
      relativePath: 'build-manifest.json',
      content: `${JSON.stringify(
        {
          manifestId: `${input.contractId}-manifest`,
          contractId: input.contractId,
          ideaId: input.ideaId,
          generatedAt: new Date().toISOString(),
          materializationSource: 'modular-feature-materialization-v1',
          applicationProfile: materializationProfile,
          universalBlueprintVersion: UNIVERSAL_APP_BLUEPRINT_VERSION,
          universalBlueprintEnabled: true,
          modularFeatureMaterialization: true,
          buildUnits: input.buildUnits,
          runtime: 'vite-react',
          approvedMetadataSummary: approvedMetadataPlanValid ? suppliedMetadataPlan.manifestSummary : null,
          approvedSampleSummary: approvedSampleDataPlanValid ? suppliedSampleDataPlan.sampleSummary : null,
          approvedSamplesPresent: approvedSampleDataPlanValid ? suppliedSampleDataPlan.approvedSamplesPresent : null,
          approvedProvenanceSummary: approvedProvenancePlanValid ? suppliedProvenancePlan.provenanceSummary : null,
          approvedProvenanceSource: approvedProvenancePlanValid ? suppliedProvenancePlan.source : null,
          approvedRepairRealitySummary: approvedRepairRealityPlanValid
            ? suppliedRepairRealityPlan.repairSummary
            : null,
          approvedRepairRealitySource: approvedRepairRealityPlanValid ? suppliedRepairRealityPlan.source : null,
        },
        null,
        2,
      )}\n`,
    },
    {
      relativePath: 'universal-feature-contract.json',
      content: buildUniversalFeatureContractJson({
        contractId: input.contractId,
        rawPrompt: input.rawPrompt,
        profile: input.profile ?? undefined,
        approvedProductName: approvedDisplayName,
        approvedNavigationLabels: approvedNavPlanValid ? approvedNavLabels : null,
        approvedModuleIds: approvedModulePlanValid ? suppliedModulePlan.moduleIds : null,
        approvedModuleEntries: approvedModulePlanValid ? suppliedModulePlan.moduleEntries : null,
        approvedCanonicalContract: input.approvedProductionBuildEnvelope?.canonicalProductContract ?? null,
        approvedMetadata: approvedMetadataForContract,
        approvedSampleData: approvedSampleDataForContract,
        approvedProvenance: approvedProvenanceForContract,
        approvedRepairReality: approvedRepairRealityForContract,
      }),
    },
    {
      relativePath: 'feature-contract.json',
      content: buildUniversalFeatureContractJson({
        contractId: input.contractId,
        rawPrompt: input.rawPrompt,
        profile: input.profile ?? undefined,
        approvedProductName: approvedDisplayName,
        approvedNavigationLabels: approvedNavPlanValid ? approvedNavLabels : null,
        approvedModuleIds: approvedModulePlanValid ? suppliedModulePlan.moduleIds : null,
        approvedModuleEntries: approvedModulePlanValid ? suppliedModulePlan.moduleEntries : null,
        approvedCanonicalContract: input.approvedProductionBuildEnvelope?.canonicalProductContract ?? null,
        approvedMetadata: approvedMetadataForContract,
        approvedSampleData: approvedSampleDataForContract,
        approvedProvenance: approvedProvenanceForContract,
        approvedRepairReality: approvedRepairRealityForContract,
      }),
    },
    {
      relativePath: 'src/styles/global.css',
      content: `:root { font-family: 'Segoe UI', system-ui, sans-serif; }\nbody { margin: 0; }\n`,
    },
    {
      relativePath: 'src/features/registry.ts',
      content: buildModularFeatureRegistryTs(
        modular.manifestEntries,
        (approvedModuleEntries ?? []).find((entry) => entry.route === '/')?.moduleId ??
          (approvedModuleEntries ?? [])[0]?.moduleId ??
          null,
      ),
    },
    {
      relativePath: 'src/features/routes.ts',
      content: buildModularFeatureRoutesTs(),
    },
    {
      relativePath: 'src/features/FeatureAppRouter.tsx',
      content: buildFeatureAppRouterTsx(definition, displayName, approvedNavItems, approvedModuleEntries, navMaterializedModuleIds),
    },
    {
      relativePath: 'src/features/feature-app-router.css',
      content: buildFeatureAppRouterCss(definition),
    },
    {
      relativePath: 'src/data/demo-data.ts',
      content: approvedSampleDataPlanValid
        ? buildDemoDataTs(suppliedSampleDataPlan)
        : buildDemoDataTs(displayName, definition),
    },
    {
      relativePath: 'src/screens/index.ts',
      content: `export { default as FeatureAppRouter } from '../features/FeatureAppRouter';\n`,
    },
  ];

  const featureFiles: GeneratedWorkspaceFile[] = [...modular.files];

  // Blueprint Generator Contract-Bound Replacement V1 — landing/home copy and the main feature
  // nav label are derived from the approved build plan (customDomainCopy, already CBGA-corrected
  // by Production Generator Contract Consumption Fix V1, or the approved module plan) instead of
  // hardcoded literals ("Features", "A modular application shell..."). Never invents content: the
  // only inputs are real, already-approved fields on `definition`/`moduleIds`.
  const blueprintContractCopy = deriveBlueprintContractCopy({
    appName: displayName,
    approvedModuleIds: moduleIds,
    moduleDisplayNameOf,
    customDomainCopy: definition.customDomainCopy
      ? { headline: definition.customDomainCopy.headline, dashboard: definition.customDomainCopy.dashboard }
      : null,
  });

  const composed = composeGeneratedAppWorkspaceFiles({
    blueprint: {
      contractId: input.contractId,
      ideaId: input.ideaId,
      buildUnits: input.buildUnits,
      appName: displayName,
      // Metadata Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved metadata
      // plan's `applicationSubtitle` (composed once by CBGA via the same `deriveNeutralAppTagline`
      // formula) is the ONLY tagline source once supplied; the direct call is preserved ONLY for
      // pre-CBGA/isolated/test-only callers that intentionally omit the approved metadata plan.
      tagline: approvedMetadataPlanValid ? suppliedMetadataPlan.applicationSubtitle : deriveNeutralAppTagline(displayName),
      coreFeatureLabel: blueprintContractCopy.coreFeatureLabel,
      coreFeatureImportPath: '../features/FeatureAppRouter',
      coreFeatureComponentName: 'FeatureAppRouter',
      landingSummary: blueprintContractCopy.landingSummary,
      homeSummary: blueprintContractCopy.homeSummary,
      contractDerivationSource: blueprintContractCopy.source,
      approvedNavigationLabels: approvedNavLabels,
      approvedModuleIds: approvedModulePlanValid ? suppliedModulePlan.moduleIds : [],
      approvedMetadataSummary: approvedMetadataPlanValid ? suppliedMetadataPlan.manifestSummary : null,
      approvedSampleDataPlan: approvedSampleDataPlanValid ? suppliedSampleDataPlan : null,
      approvedProvenancePlan: approvedProvenancePlanValid ? suppliedProvenancePlan : null,
    },
    featureFiles,
    sharedFiles,
  });

  const preferredPrimaryModuleId =
    (approvedModuleEntries ?? []).find((entry) => entry.route === '/')?.moduleId ??
    (approvedModuleEntries ?? [])[0]?.moduleId ??
    null;
  const directMount = resolveDirectFeatureRootMount({
    rawPrompt: input.rawPrompt,
    definition,
    displayName,
    preferredPrimaryModuleId,
  });
  if (process.env.AIDEVENGINE_HOME_DEBUG === '1') {
    // eslint-disable-next-line no-console
    console.log(
      'HOME_DEBUG ' +
        JSON.stringify({
          approvedModuleEntries: (approvedModuleEntries ?? []).map((e) => ({ id: e.moduleId, route: e.route })),
          moduleIds,
          navMaterializedModuleIds,
          materializableFeatureModules: materializableFeatureModules(definition),
          preferredPrimaryModuleId,
          directMountPrimary: directMount?.primaryModuleId ?? null,
          manifestEntries: modular.manifestEntries.map((e) => ({ id: e.id, route: e.route })),
        }),
    );
  }
  if (!directMount) {
    if (input.approvedProductionBuildEnvelope) {
      const canonicalContract = buildCanonicalProductContract({ prompt: input.rawPrompt ?? '' });
      const traceability = augmentWorkspaceWithContractToModuleTraceability(composed, {
        contract: canonicalContract,
        envelope: input.approvedProductionBuildEnvelope,
        proposedModuleIds: moduleIds,
      });
      const withBuildContext = augmentWorkspaceWithBuildContextIntegrity(traceability.workspaceFiles, {
        envelope: input.approvedProductionBuildEnvelope,
        projectId: input.contractId,
        workspaceId: input.buildRunId ?? input.contractId,
        traceabilityFingerprint: traceability.report?.fingerprint ?? null,
      });
      return augmentWorkspaceWithProductionSurfaceIntegration(withBuildContext, {
        contract: canonicalContract,
        envelope: input.approvedProductionBuildEnvelope,
        proposedModuleIds: moduleIds,
        projectId: input.contractId,
        workspaceId: input.buildRunId ?? input.contractId,
      }).workspaceFiles;
    }
    return composed;
  }

  const mounted = composed.map((file) => {
    if (file.relativePath === 'src/App.tsx') {
      return { ...file, content: directMount.appTsx };
    }
    if (directMount.primaryRoute === '/' && file.relativePath === 'src/features/registry.ts') {
      return {
        ...file,
        content: patchRegistryPrimaryRoute(file.content, directMount.primaryModuleId),
      };
    }
    return file;
  });

  if (input.approvedProductionBuildEnvelope) {
    const canonicalContract = buildCanonicalProductContract({ prompt: input.rawPrompt ?? '' });
    const traceability = augmentWorkspaceWithContractToModuleTraceability(mounted, {
      contract: canonicalContract,
      envelope: input.approvedProductionBuildEnvelope,
      proposedModuleIds: moduleIds,
    });
    const withBuildContext = augmentWorkspaceWithBuildContextIntegrity(traceability.workspaceFiles, {
      envelope: input.approvedProductionBuildEnvelope,
      projectId: input.contractId,
      workspaceId: input.buildRunId ?? input.contractId,
      traceabilityFingerprint: traceability.report?.fingerprint ?? null,
    });
    return augmentWorkspaceWithProductionSurfaceIntegration(withBuildContext, {
      contract: canonicalContract,
      envelope: input.approvedProductionBuildEnvelope,
      proposedModuleIds: moduleIds,
      projectId: input.contractId,
      workspaceId: input.buildRunId ?? input.contractId,
    }).workspaceFiles;
  }

  return mounted;
}
