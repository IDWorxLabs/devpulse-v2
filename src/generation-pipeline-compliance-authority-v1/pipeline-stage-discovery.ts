/**
 * Generation Pipeline Compliance Authority V1 — pipeline stage discovery.
 *
 * Discovers the real generation pipeline's stage descriptors. The *architectural skeleton* below
 * (which stages exist, which real module/function backs each one, what it consumes/produces) is a
 * registry of already-existing code — the same pattern AEO's repair-capability registry uses — and
 * is never a product-domain concept. Every compliance flag on a *discovered* stage is then computed
 * from real per-build evidence (the contract, the CBGA report, and the actual proposed/generated
 * inputs for this build), never fixed — so the same registry produces a different, honest result
 * for every build.
 */

import { CBGA_DEFAULT_SHELL_NAVIGATION_LABELS, CBGA_SYSTEM_SHELL_MODULE_IDS } from '../contract-bound-generation-authority-v4/index.js';
import {
  GPCA_COMPLIANT_STAGE_FLAGS,
  GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES,
  type GpcaPipelineEvidenceInput,
  type GpcaStageComplianceFlags,
  type GpcaStageDescriptor,
  type GpcaStageId,
} from './generation-pipeline-compliance-types.js';

interface GpcaStageBaseline {
  stageId: GpcaStageId;
  stageName: string;
  responsibleModule: string;
  inputObjects: readonly string[];
  outputObjects: readonly string[];
  /** Flags that are structurally always true for this stage, regardless of any single build's evidence. */
  structuralFlags: Partial<GpcaStageComplianceFlags>;
}

/**
 * The real pipeline, discovered once (architecture-level, not per-build). Structural flags here
 * reflect facts already established by direct source inspection of the real generator modules
 * (see contract-bound-generation-authority-v4 exploration + this milestone's own research) — they
 * are honest, current-state facts about the codebase, not assumptions.
 */
const GPCA_STAGE_BASELINE_REGISTRY: readonly GpcaStageBaseline[] = [
  {
    stageId: 'PROMPT_UNDERSTANDING',
    stageName: 'Prompt Understanding',
    responsibleModule: 'src/prompt-faithful-generation/prompt-feature-extractor.ts#extractAppName; src/intent-understanding-engine',
    inputObjects: ['rawPrompt'],
    outputObjects: ['extraction.appName', 'ProductIntelligenceModel'],
    structuralFlags: { usesRegexExtraction: true },
  },
  {
    stageId: 'PLANNING',
    stageName: 'Planning',
    responsibleModule: 'src/prompt-faithful-generation/index.ts#resolvePromptFaithfulBuildPlan',
    inputObjects: ['rawPrompt', 'ProductIntelligenceModel'],
    outputObjects: ['ResolvedPromptFaithfulBuildPlan', 'ProfileFeatureDefinition'],
    structuralFlags: { usesProfileFeatureDefinition: true, usesLegacyPlanner: true },
  },
  {
    stageId: 'ARCHITECTURE',
    stageName: 'Architecture',
    responsibleModule: 'product-intelligence architecture summary (best-effort, non-blocking)',
    inputObjects: ['ProductIntelligenceModel'],
    outputObjects: ['architecture summary'],
    structuralFlags: {},
  },
  {
    stageId: 'CANONICAL_PRODUCT_CONTRACT',
    stageName: 'Canonical Product Contract',
    responsibleModule: 'src/product-faithfulness-v2/canonical-product-contract.ts#buildCanonicalProductContract',
    inputObjects: ['rawPrompt'],
    outputObjects: ['CanonicalProductContract'],
    structuralFlags: { usesCanonicalContract: true },
  },
  {
    stageId: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    stageName: 'Contract-Bound Generation Authority',
    responsibleModule: 'src/contract-bound-generation-authority-v4/contract-bound-generation-authority.ts#runContractBoundGenerationAuthority',
    inputObjects: ['CanonicalProductContract', 'proposed module/route/nav/title inputs'],
    outputObjects: ['CbgaGenerationReport', 'repaired buildPlan.modulePlan / extraction.appName'],
    structuralFlags: { usesCbga: true, usesCanonicalContract: true },
  },
  {
    stageId: 'PROMPT_BOUNDED_MODULE_PLAN',
    stageName: 'Prompt-Bounded Module Plan',
    responsibleModule: 'src/prompt-bounded-materialization/index.ts#guardPromptBoundedMaterialization',
    inputObjects: ['ResolvedPromptFaithfulBuildPlan (post-CBGA)'],
    outputObjects: ['PromptBoundedModulePlan (approvedModuleIds, routes)'],
    structuralFlags: { usesPromptBoundedModulePlan: true },
  },
  {
    stageId: 'MODULE_GENERATOR',
    stageName: 'Module Generator',
    responsibleModule: 'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts#buildAllModularFeatureModuleFiles',
    inputObjects: ['ProfileFeatureDefinition (post-CBGA)', 'appTitle'],
    outputObjects: ['feature module files', 'GeneratedFeatureModuleManifestEntry[]'],
    structuralFlags: { usesProfileFeatureDefinition: true, usesHardcodedTemplate: true },
  },
  {
    stageId: 'ROUTE_GENERATOR',
    stageName: 'Route Generator',
    responsibleModule: 'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts#buildModularFeatureRoutesTs / registry.ts',
    inputObjects: ['FEATURE_REGISTRY (derived from generated modules)'],
    outputObjects: ['src/features/routes.ts'],
    structuralFlags: {},
  },
  {
    stageId: 'NAVIGATION_GENERATOR',
    stageName: 'Navigation Generator',
    responsibleModule:
      'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts#buildFeatureAppRouterTsx; src/universal-app-blueprint/universal-app-blueprint-generator.ts (MOBILE_TABS)',
    inputObjects: ['ProfileFeatureDefinition', 'hardcoded blueprint shell tab list'],
    outputObjects: ['FeatureAppRouter nav buttons', 'blueprint shell tab bar'],
    structuralFlags: { usesBlueprintDefaults: true, usesDefaultNavigation: true, usesHardcodedTemplate: true },
  },
  {
    stageId: 'SURFACE_GENERATOR',
    stageName: 'Surface Generator',
    responsibleModule: 'src/contract-bound-generation-authority-v4/contract-surface-plan.ts (plan only — no dedicated real surface renderer consumes it yet)',
    inputObjects: ['CbgaSurfacePlan'],
    outputObjects: ['(none — CbgaSurfacePlan is not yet rendered into a real UI surface by any generator)'],
    structuralFlags: { usesCbga: true, usesSurfaceOutsideContract: true },
  },
  {
    stageId: 'BLUEPRINT_GENERATOR',
    stageName: 'Blueprint Generator',
    responsibleModule: 'src/universal-app-blueprint/universal-app-blueprint-generator.ts#composeGeneratedAppWorkspaceFiles',
    inputObjects: ['appName', 'coreFeatureLabel (hardcoded "Features")'],
    outputObjects: [
      'src/blueprint/AppShell.tsx, WelcomeScreen.tsx, OnboardingScreen.tsx, AuthScreen.tsx, LaunchScreen.tsx',
      'src/blueprint/pages/{Home,Search,Notifications,Profile,Settings,HelpCenter,Feedback,Legal,About}Page.tsx',
    ],
    structuralFlags: {
      usesBlueprintDefaults: true,
      usesGenericShell: true,
      usesReusableComponentShell: true,
      usesHardcodedTemplate: true,
      usesGenericUiCopy: true,
    },
  },
  {
    stageId: 'UNIVERSAL_FEATURE_CONTRACT',
    stageName: 'Universal Feature Contract',
    responsibleModule: 'src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts#buildUniversalFeatureContract',
    inputObjects: ['rawPrompt', 'profile'],
    outputObjects: ['UniversalFeatureContract (independent productName via extractPromptAppTitle / profile defaults)'],
    structuralFlags: { usesUniversalFeatureContract: true, usesRegexExtraction: true },
  },
  {
    stageId: 'MATERIALIZATION',
    stageName: 'Materialization',
    responsibleModule: 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts#buildUniversalMaterializedWorkspaceFiles',
    inputObjects: ['boundedBuildPlan (post-CBGA)', 'displayName'],
    outputObjects: ['GeneratedWorkspaceFile[]'],
    structuralFlags: { usesCbga: true, usesPromptBoundedModulePlan: true },
  },
  {
    stageId: 'WORKSPACE_GENERATION',
    stageName: 'Workspace Generation',
    responsibleModule: 'src/code-generation-engine/code-generation-engine-authority.ts#materializeGeneratedApplication',
    inputObjects: ['GeneratedWorkspaceFile[]'],
    outputObjects: ['files written to the isolated workspace on disk'],
    structuralFlags: {},
  },
  {
    stageId: 'PREVIEW_GENERATION',
    stageName: 'Preview Generation',
    responsibleModule: 'src/one-prompt-live-preview/generated-dev-server-manager.ts#startGeneratedAppDevServer',
    inputObjects: ['workspaceDir'],
    outputObjects: ['running dev server / preview URL'],
    structuralFlags: {},
  },
  {
    stageId: 'RUNTIME',
    stageName: 'Runtime',
    responsibleModule: 'src/live-preview-runtime/preview-session-manager.ts#createPreviewSession',
    inputObjects: ['preview URL'],
    outputObjects: ['live preview session'],
    structuralFlags: {},
  },
  {
    stageId: 'LIVE_PREVIEW',
    stageName: 'Live Preview',
    responsibleModule: 'src/live-preview-gate/index.ts#evaluateLivePreviewGateForOrchestrator',
    inputObjects: ['dev server state'],
    outputObjects: ['live preview gate verdict'],
    structuralFlags: {},
  },
  {
    stageId: 'PRODUCT_FAITHFULNESS',
    stageName: 'Product Faithfulness',
    responsibleModule: 'src/product-faithfulness-v2/generation-faithfulness-auditor.ts#auditGenerationPipeline',
    inputObjects: ['CanonicalProductContract', 'GenerationStageEvidence'],
    outputObjects: ['GenerationFaithfulnessReport'],
    structuralFlags: { usesCanonicalContract: true },
  },
  {
    stageId: 'LAUNCH',
    stageName: 'Launch',
    responsibleModule: 'aggregate final build result / launch readiness',
    inputObjects: ['all prior stage reports'],
    outputObjects: ['OnePromptLivePreviewBuildResult'],
    structuralFlags: {},
  },
];

type GpcaMutableFlags = { -readonly [K in keyof GpcaStageComplianceFlags]?: boolean };

function isNavLabelJustifiedByContract(label: string, evidence: GpcaPipelineEvidenceInput): boolean {
  const normalized = label.toLowerCase();
  const haystack = [
    ...evidence.contract.navigationExpectations,
    ...evidence.contract.majorFeatureGroups,
    ...evidence.contract.allConceptNames,
    ...evidence.contract.businessConcepts,
  ].map((c) => c.toLowerCase());
  return haystack.some((c) => c === normalized || c.includes(normalized) || normalized.includes(c));
}

/** True once real post-materialization file evidence has been supplied for this build. */
function hasRealFileEvidence(evidence: GpcaPipelineEvidenceInput): boolean {
  return evidence.proposed.generatedFilePaths.length > 0;
}

function computeDynamicFlags(baseline: GpcaStageBaseline, evidence: GpcaPipelineEvidenceInput): GpcaMutableFlags {
  const cbga = evidence.cbgaReport;
  const dynamic: GpcaMutableFlags = {};

  switch (baseline.stageId) {
    case 'PROMPT_UNDERSTANDING': {
      dynamic.usesTitleOutsideContract = evidence.proposed.appTitle !== evidence.contract.productIdentity;
      break;
    }
    case 'PLANNING': {
      dynamic.usesFallbackModules = evidence.proposed.moduleIds.some((m) =>
        (cbga?.modulePlan ?? []).every((entry) => entry.moduleId !== m) && !cbga,
      );
      break;
    }
    case 'CONTRACT_BOUND_GENERATION_AUTHORITY': {
      const consistent = cbga !== null && cbga.finalGateOutcome === 'GENERATION_ALLOWED';
      dynamic.usesModuleOutsideContract = !consistent;
      dynamic.usesRouteOutsideContract = !consistent;
      dynamic.usesNavigationOutsideContract = !consistent;
      dynamic.usesSurfaceOutsideContract = !consistent;
      dynamic.usesTitleOutsideContract = !consistent;
      break;
    }
    case 'PROMPT_BOUNDED_MODULE_PLAN': {
      dynamic.usesCbga = cbga !== null;
      break;
    }
    case 'MODULE_GENERATOR': {
      const approvedIds = new Set([
        ...(cbga?.modulePlan ?? []).filter((m) => m.generationAllowed).map((m) => m.moduleId),
        ...CBGA_SYSTEM_SHELL_MODULE_IDS,
      ]);
      dynamic.usesCbga = cbga !== null;
      dynamic.usesModuleOutsideContract =
        cbga !== null && evidence.proposed.moduleIds.some((m) => !approvedIds.has(m));
      break;
    }
    case 'ROUTE_GENERATOR': {
      const approvedRoutes = new Set((cbga?.routePlan ?? []).map((r) => r.path));
      dynamic.usesCbga = cbga !== null;
      dynamic.usesRouteOutsideContract =
        cbga !== null && evidence.proposed.routes.some((r) => !approvedRoutes.has(r));
      break;
    }
    case 'NAVIGATION_GENERATOR': {
      const unjustifiedDefaults = evidence.proposed.navigationLabels.filter(
        (label) => CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.includes(label) && !isNavLabelJustifiedByContract(label, evidence),
      );
      dynamic.usesCbga = cbga !== null;
      dynamic.usesNavigationOutsideContract = unjustifiedDefaults.length > 0;
      break;
    }
    case 'BLUEPRINT_GENERATOR': {
      if (hasRealFileEvidence(evidence)) {
        const unjustifiedPages = GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES.filter(
          (page) =>
            evidence.proposed.generatedFilePaths.includes(page.path) &&
            (page.navLabel === null || !isNavLabelJustifiedByContract(page.navLabel, evidence)),
        );
        dynamic.usesSurfaceOutsideContract = unjustifiedPages.length > 0;
        dynamic.usesNavigationOutsideContract = unjustifiedPages.some((p) => p.navLabel !== null);
      }
      break;
    }
    case 'UNIVERSAL_FEATURE_CONTRACT': {
      dynamic.usesTitleOutsideContract = true;
      break;
    }
    case 'MATERIALIZATION': {
      dynamic.usesCbga = cbga !== null;
      dynamic.usesTitleOutsideContract = evidence.proposed.appTitle !== evidence.contract.productIdentity;
      break;
    }
    default:
      break;
  }

  return dynamic;
}

/**
 * Discovers the complete generation pipeline for this build: the architectural skeleton (stable,
 * registry-backed) merged with dynamic compliance flags computed from this build's real evidence.
 * Deterministic — the same evidence always produces the same descriptors, in the same order.
 */
export function discoverGenerationPipelineStages(evidence: GpcaPipelineEvidenceInput): GpcaStageDescriptor[] {
  return GPCA_STAGE_BASELINE_REGISTRY.map((baseline) => {
    const dynamic = computeDynamicFlags(baseline, evidence);
    const flags: GpcaStageComplianceFlags = {
      ...GPCA_COMPLIANT_STAGE_FLAGS,
      ...baseline.structuralFlags,
      ...dynamic,
    };
    return {
      readOnly: true,
      stageId: baseline.stageId,
      stageName: baseline.stageName,
      responsibleModule: baseline.responsibleModule,
      inputObjects: baseline.inputObjects,
      outputObjects: baseline.outputObjects,
      flags,
    };
  });
}

export function getStageBaselineIds(): readonly GpcaStageId[] {
  return GPCA_STAGE_BASELINE_REGISTRY.map((b) => b.stageId);
}
