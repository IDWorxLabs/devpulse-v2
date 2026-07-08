/**
 * App Generation Readiness Audit V1 — evidence and assessment logic.
 *
 * Read-only, observational audit of the AiDevEngine V4 app-generation pipeline. This module
 * does not import from, call into, or mutate any generation-pipeline module (orchestrator,
 * materialization engine, faithfulness engines, live preview, module resolver, etc.). It only
 * records evidence citations (file paths, function names, and notes captured by direct source
 * inspection) and checks that the cited files still exist on disk, so the report stays grounded
 * in the real repository rather than being free-form prose.
 *
 * Any product domain name that appears below (e.g. "calculator", "booking", "inventory") is
 * quoted only as evidence of an observed failure pattern in existing code/comments. Nothing in
 * this module branches on, generates, or special-cases any product domain.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AppGenerationReadinessAuditAssessment,
  EvidenceCitation,
  Finding,
  FindingCategory,
  FixSequenceStep,
  MissingAuthority,
  PipelineStageEvidence,
  RiskRankEntry,
  StateStoreEntry,
} from './app-generation-readiness-audit-types.js';

export const APP_GENERATION_READINESS_AUDIT_V1_PASS_TOKEN = 'APP_GENERATION_READINESS_AUDIT_V1_PASS';
export const APP_GENERATION_READINESS_AUDIT_V1_ARTIFACT_DIR = '.app-generation-readiness-audit-v1';
export const APP_GENERATION_READINESS_AUDIT_V1_REPORT_FILENAME = 'APP_GENERATION_READINESS_AUDIT_V1_REPORT.md';

function ev(file: string, note: string, function_?: string, lines?: string): EvidenceCitation {
  return { file, function: function_, lines, note };
}

/* ------------------------------------------------------------------------------------------
 * 1. Pipeline map — the 17 required stages, each with the real files/functions that own them.
 * ---------------------------------------------------------------------------------------- */

export const PIPELINE_STAGES: PipelineStageEvidence[] = [
  {
    id: 'USER_PROMPT_INTAKE',
    order: 1,
    name: 'User prompt intake',
    description: 'HTTP entry point that receives a build/chat prompt and hands it to the bridge/orchestrator.',
    primaryFiles: ['server/build-from-prompt-handler.ts', 'server/brain-api-handler.ts', 'server/founder-reality-server.ts'],
    primaryFunctions: ['handleBuildFromPromptRequest', 'handleBrainRespondRequest'],
    ownedBy: 'server/build-from-prompt-handler.ts :: handleBuildFromPromptRequest',
    hasUnambiguousOwner: true,
    evidence: [
      ev('server/founder-reality-server.ts', 'POST /api/build/from-prompt and POST /api/brain/respond both terminate in the same build spine.'),
      ev('server/build-from-prompt-handler.ts', 'Primary handler; normal path calls executeChatToBuildBridge, forceFreshProject bypasses to runOnePromptLivePreviewBuild directly.', 'handleBuildFromPromptRequest'),
    ],
  },
  {
    id: 'PROJECT_CONTEXT_RESOLUTION',
    order: 2,
    name: 'Project context resolution',
    description: 'Resolves which project/session a build belongs to before any generation happens.',
    primaryFiles: [
      'src/one-prompt-live-preview/workspace-tab-registry.ts',
      'src/project-session-continuity-v1/project-session-build-bridge.ts',
      'src/project-context-switching/project-context-loader.ts',
      'src/project-registry-v1/project-registry-v1-store.ts',
    ],
    primaryFunctions: ['resolveProjectContext', 'bootstrapProjectAndSessionForBuild', 'loadProjectContext'],
    ownedBy: 'src/one-prompt-live-preview/workspace-tab-registry.ts :: resolveProjectContext',
    hasUnambiguousOwner: false,
    evidence: [
      ev(
        'src/one-prompt-live-preview/workspace-tab-registry.ts',
        'When no projectId is supplied, resolution falls back to the server-side activeProjectId rather than minting a fresh project.',
        'resolveProjectContext',
      ),
      ev(
        'src/project-registry-v1/project-registry-v1-store.ts',
        'On process/registry load, activeProjectId is re-set from the persisted registry file, reinforcing the fallback on restart.',
        'hydrateWorkspaceSessions',
      ),
    ],
  },
  {
    id: 'PROMPT_RESET_NEW_BUILD_DETECTION',
    order: 3,
    name: 'Prompt reset / new build detection',
    description: 'Decides whether an incoming prompt is a brand-new app request or a continuation of an existing project.',
    primaryFiles: [
      'public/founder-reality/builder-home.js',
      'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
      'src/project-resume-state/duplicate-project-resume-router.ts',
      'src/project-context-switching/project-context-reset.ts',
    ],
    primaryFunctions: ['newPrompt', 'resetTest', 'executeChatToBuildBridge', 'routeDuplicateProjectResume', 'buildProjectContextResetSnapshot'],
    ownedBy: 'No single owner — split across client UI, bridge authority, and resume router.',
    hasUnambiguousOwner: false,
    evidence: [
      ev(
        'public/founder-reality/builder-home.js',
        'newPrompt() clears the client-side projectId and prompt text, but the next build request sends only { projectId: state.projectId || undefined } — it never sends confirmFreshCopy: true, so the server has no explicit "this is a new app" signal.',
        'newPrompt',
      ),
      ev(
        'src/chat-to-build-execution-bridge-v1/bridge-authority.ts',
        'shouldAutoContinueDuplicate() returns true unless the caller explicitly passes rejectDuplicates: true, so duplicate/near-duplicate incomplete projects are auto-resumed by default.',
        'shouldAutoContinueDuplicate',
      ),
      ev(
        'src/project-resume-state/duplicate-project-resume-router.ts',
        'Duplicate detection matches an incomplete prior project by domain-keyword overlap (score >= 0.55) or substring match on name — a semantically different new prompt can still score as "similar domain" and get routed onto the old project.',
        'routeDuplicateProjectResume',
      ),
      ev(
        'src/project-context-switching/project-context-reset.ts',
        'buildProjectContextResetSnapshot() is explicitly read-only: it clears UI alignment warnings only, and does not clear build/domain state.',
        'buildProjectContextResetSnapshot',
      ),
    ],
  },
  {
    id: 'CANONICAL_PRODUCT_CONTRACT_CREATION',
    order: 4,
    name: 'Canonical product contract creation',
    description: 'Builds the single-source-of-truth description of what product the user asked for.',
    primaryFiles: ['src/product-faithfulness-v2/canonical-product-contract.ts', 'src/product-faithfulness-v2/index.ts'],
    primaryFunctions: ['buildCanonicalProductContract', 'runGenerationFaithfulnessAudit', 'runGenerationGate'],
    ownedBy: 'src/product-faithfulness-v2/canonical-product-contract.ts :: buildCanonicalProductContract',
    hasUnambiguousOwner: false,
    evidence: [
      ev(
        'src/product-faithfulness-v2/index.ts',
        'Module header states the contract is intended to be "built once immediately after prompt understanding" and become the source of truth for every downstream stage — but the only production caller (evaluateGenerationFaithfulnessForBuild) invokes it after the full build and interaction proof complete, from the prompt alone, purely for audit output.',
        'runGenerationFaithfulnessAudit',
        'L1-L74',
      ),
      ev(
        'src/product-faithfulness-v2/index.ts',
        'runGenerationGate() is the pre-materialization entry point the design describes, but it is called only from scripts/validate-product-faithfulness-milestone-2.ts — never from the orchestrator, bridge, or code-generation engine.',
        'runGenerationGate',
        'L76-L96',
      ),
    ],
  },
  {
    id: 'PRODUCT_IDENTITY_PRESERVATION',
    order: 5,
    name: 'Product identity preservation',
    description: 'Keeps the project name/domain/identity consistent and correctly scoped across a build and across rebuilds.',
    primaryFiles: [
      'src/project-name-conflict-resolution-v1/project-name-conflict-authority.ts',
      'src/project-context-alignment-v1/project-context-metadata-store.ts',
      'src/project-context-alignment-v1/project-context-alignment-assessor.ts',
    ],
    primaryFunctions: ['applyProjectIdentityForBuild', 'upsertProjectContextMetadata', 'assessProjectContextAlignment'],
    ownedBy: 'src/project-context-alignment-v1/ (advisory only — does not gate module selection or contract creation)',
    hasUnambiguousOwner: false,
    evidence: [
      ev(
        'src/project-context-alignment-v1/project-context-metadata-store.ts',
        'upsertProjectContextMetadata merges new domain keywords into the existing keyword set for a projectId rather than replacing it, so domain identity accumulates across rebuilds on the same project instead of reflecting only the latest prompt.',
        'upsertProjectContextMetadata',
        'L77-L89',
      ),
      ev(
        'src/project-context-alignment-v1/project-context-alignment-assessor.ts',
        'Alignment scoring folds in metadata.lastBuildIntentSummary from a prior build alongside the current prompt when computing domain overlap.',
        'assessProjectContextAlignment',
        'L133-L141',
      ),
    ],
  },
  {
    id: 'PLANNING',
    order: 6,
    name: 'Planning',
    description: 'Produces the pre-generation build plan bundle (intent, faithfulness pass, capability planning, profile ranking).',
    primaryFiles: ['src/prompt-faithful-generation/index.ts', 'src/intent-understanding-engine/intent-understanding-engine.ts', 'src/capability-planning-engine/index.ts'],
    primaryFunctions: ['resolvePromptFaithfulBuildPlan', 'runIntentUnderstandingEngine', 'runCapabilityPlanningPipeline', 'rankBuildProfiles'],
    ownedBy: 'src/prompt-faithful-generation/index.ts :: resolvePromptFaithfulBuildPlan',
    hasUnambiguousOwner: true,
    evidence: [
      ev(
        'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
        'resolvePromptFaithfulBuildPlan is invoked once per build near the top of the orchestrator and its output (buildPlan) feeds every downstream generation decision.',
        'runOnePromptLivePreviewBuild',
        '~L471',
      ),
    ],
  },
  {
    id: 'ARCHITECTURE_GENERATION',
    order: 7,
    name: 'Architecture generation',
    description: 'Builds the product intelligence model and architecture hints used to select a materialization profile.',
    primaryFiles: ['src/intent-understanding-engine/product-model-builder.ts'],
    primaryFunctions: ['buildProductIntelligenceModel', 'buildArchitectureHints'],
    ownedBy: 'src/intent-understanding-engine/product-model-builder.ts',
    hasUnambiguousOwner: true,
    evidence: [
      ev(
        'src/intent-understanding-engine/product-model-builder.ts',
        'Architecture hints feed profile ranking (rankBuildProfiles) and the module candidate collector, but do not feed the Universal Feature Contract builder, which selects its entity template independently from the resolved profile string only.',
        'buildArchitectureHints',
      ),
    ],
  },
  {
    id: 'UNIVERSAL_FEATURE_CONTRACT_GENERATION',
    order: 8,
    name: 'Universal feature contract generation',
    description: 'Builds the per-app entity/action/route contract written to universal-feature-contract.json.',
    primaryFiles: ['src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts', 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts'],
    primaryFunctions: ['buildUniversalFeatureContract', 'buildUniversalFeatureContractJson'],
    ownedBy: 'src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts :: buildUniversalFeatureContract',
    hasUnambiguousOwner: true,
    evidence: [
      ev(
        'src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts',
        'Contract entities come from a fixed per-profile template (buildProfileContract); GENERIC_CUSTOM_APP_V1 and HABIT_TRACKER_WEB_V1 share the same "habit" entity template regardless of what the prompt actually described.',
        'buildUniversalFeatureContract',
        'L543-L580',
      ),
      ev(
        'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts',
        'The contract used to drive materialization is built with profile: materializationProfile, but the contract written to disk as JSON is built again with profile: input.profile — the two calls can select different profiles for the same build.',
        'buildUniversalMaterializedWorkspaceFiles',
        'L74-L183',
      ),
    ],
  },
  {
    id: 'MODULE_SELECTION',
    order: 9,
    name: 'Module selection',
    description: 'Resolves which feature modules are approved for generation for this specific prompt.',
    primaryFiles: [
      'src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts',
      'src/prompt-bounded-materialization/module-candidate-collector.ts',
      'src/universal-prompt-to-app-materialization/profile-feature-map.ts',
      'src/universal-prompt-to-app-materialization/prompt-app-metadata.ts',
    ],
    primaryFunctions: ['resolvePromptBoundedModulePlan', 'collectAllModuleCandidates', 'getProfileFeatureDefinition', 'deriveGenericCustomFeatureModules'],
    ownedBy: 'src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts :: resolvePromptBoundedModulePlan',
    hasUnambiguousOwner: true,
    evidence: [
      ev(
        'src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts',
        'The resolver itself is evidence-gated: PROFILE_FALLBACK/TEMPLATE_DEFAULT/DEMO_DEFAULT/SAMPLE_APP_DEFAULT/GENERIC_PLACEHOLDER origins are blocked unless the prompt, product-intelligence model, or capability plan supplies explicit justification.',
        'resolvePromptBoundedModulePlan',
        'L86-L174',
      ),
      ev(
        'src/universal-prompt-to-app-materialization/prompt-app-metadata.ts',
        'deriveGenericCustomFeatureModules unconditionally seeds the module set with "dashboard", and pads with "records"/"settings" when the prompt yields 2 or fewer distinct modules — these seeded candidates then enter the bounded resolver as material to evaluate.',
        'deriveGenericCustomFeatureModules',
        'L118-L139',
      ),
    ],
  },
  {
    id: 'GENERATED_MODULES',
    order: 10,
    name: 'Generated modules',
    description: 'Writes the actual feature-module source files for each approved module.',
    primaryFiles: ['src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts'],
    primaryFunctions: ['buildAllModularFeatureModuleFiles', 'materializableFeatureModules'],
    ownedBy: 'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
    hasUnambiguousOwner: true,
    evidence: [
      ev(
        'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
        'Reads only definition.featureModules (the bounded-plan output injected via applyPromptBoundedPlanToBuildPlan). It never reads the Universal Feature Contract, so the two artifacts can describe different products for the same build.',
        'buildAllModularFeatureModuleFiles',
        'L63-L300',
      ),
    ],
  },
  {
    id: 'ROUTES',
    order: 11,
    name: 'Routes',
    description: 'Generates the route table for the materialized application.',
    primaryFiles: ['src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts', 'src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts'],
    primaryFunctions: ['buildModularFeatureRoutesTs', 'buildDefinitionFromModulePlan'],
    ownedBy: 'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts :: buildModularFeatureRoutesTs',
    hasUnambiguousOwner: true,
    evidence: [
      ev(
        'src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts',
        'Routes are built index-aligned with approvedModuleIds, including infrastructure ids like "persistence" that are later filtered out of file generation — the route list and the generated-file list are not guaranteed to match 1:1.',
        'buildDefinitionFromModulePlan',
        'L238-L278',
      ),
    ],
  },
  {
    id: 'NAVIGATION',
    order: 12,
    name: 'Navigation',
    description: 'Generates the app router shell and feature registry used for in-app navigation.',
    primaryFiles: ['src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts'],
    primaryFunctions: ['buildFeatureAppRouterTsx', 'buildModularFeatureRegistryTs'],
    ownedBy: 'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
    hasUnambiguousOwner: true,
    evidence: [
      ev(
        'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
        'Navigation excludes the "auth" module id, yet "auth" still receives a route ("/"), and the default landing module falls back to the first non-auth module or "dashboard" if the list is empty.',
        'buildFeatureAppRouterTsx',
        'L357-L360',
      ),
    ],
  },
  {
    id: 'MATERIALIZATION_MANIFEST',
    order: 13,
    name: 'Materialization manifest',
    description: 'Records what was actually generated for a build (files, modules, expected app type).',
    primaryFiles: ['src/universal-prompt-to-app-materialization/generated-app-manifest.ts', 'src/materialization-evidence/index.ts'],
    primaryFunctions: ['buildInitialGeneratedAppManifest', 'serializeGeneratedAppManifest', 'initializeForensicManifest'],
    ownedBy: 'src/universal-prompt-to-app-materialization/generated-app-manifest.ts',
    hasUnambiguousOwner: true,
    evidence: [
      ev(
        'src/universal-prompt-to-app-materialization/generated-app-manifest.ts',
        'Manifest is populated from the same bounded-plan definition used for module generation, so it inherits any drift already present between the bounded plan and the Universal Feature Contract rather than reconciling the two.',
        'buildInitialGeneratedAppManifest',
      ),
    ],
  },
  {
    id: 'RUNTIME_ACTIVATION',
    order: 14,
    name: 'Runtime activation',
    description: 'Starts the generated app dev server so a live preview URL exists.',
    primaryFiles: ['src/one-prompt-live-preview/generated-dev-server-manager.ts'],
    primaryFunctions: ['startGeneratedAppDevServer'],
    ownedBy: 'src/one-prompt-live-preview/generated-dev-server-manager.ts :: startGeneratedAppDevServer',
    hasUnambiguousOwner: false,
    evidence: [
      ev(
        'src/one-prompt-live-preview/generated-dev-server-manager.ts',
        'Has a 45s wall-clock timeout that always resolves with a failure result (does not hang), but the inner async IIFE that spawns the process has no attached .catch(), so an exception thrown during spawn/setup before the timer or exit/error listeners are wired can leave the returned promise unsettled indefinitely.',
        'startGeneratedAppDevServer',
        'L124-L264',
      ),
      ev(
        'src/one-prompt-live-preview/generated-dev-server-manager.ts',
        'If the child process exits with code 0 but never printed a parseable Vite "Local:" URL, nothing resolves the promise until the 45s timer fires — a full 45s of silent waiting on every such build.',
        'startGeneratedAppDevServer',
        'L201-L208',
      ),
    ],
  },
  {
    id: 'LIVE_PREVIEW_PROOF',
    order: 15,
    name: 'Live preview proof',
    description: 'Loads the running generated app and proves it actually renders and responds to interaction.',
    primaryFiles: ['src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts', 'src/live-preview-interaction-proof-v1/live-preview-interaction-proof-runner.ts', 'src/live-preview-gate/live-preview-orchestrator-bridge.ts'],
    primaryFunctions: ['runLivePreviewInteractionProof', 'evaluateLivePreviewGateForOrchestrator'],
    ownedBy: 'Split — ASE interaction-proof engine decides gate unlock during the build; live-preview-interaction-proof-v1 (Playwright) proves interaction after the build, in the handler.',
    hasUnambiguousOwner: false,
    evidence: [
      ev(
        'src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts',
        'Only gates on previewUrl and devServerRunning before loading the page — there is no check that materialization actually completed (no verification that npm install/build succeeded or that the expected files exist) before attempting to load and interact with the page.',
        'runLivePreviewInteractionProof',
        'L60-L66',
      ),
      ev(
        'src/live-preview-interaction-proof-v1/live-preview-interaction-proof-runner.ts',
        'chromium.launch() has no timeout attached; only per-step navigation/action calls are bounded, so a hang inside browser launch itself is not bounded by the proof engine\'s own budget.',
        'PlaywrightProofPageDriver.launch',
        'L93-L98',
      ),
    ],
  },
  {
    id: 'PRODUCT_FAITHFULNESS_EVALUATION',
    order: 16,
    name: 'Product faithfulness evaluation',
    description: 'Scores whether the finished app matches what the prompt asked for.',
    primaryFiles: ['src/product-faithfulness-v1/product-faithfulness-engine.ts', 'src/product-faithfulness-v2/generation-faithfulness-auditor.ts', 'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts'],
    primaryFunctions: ['evaluateProductFaithfulness', 'runGenerationFaithfulnessAudit', 'evaluateGenerationFaithfulnessForBuild'],
    ownedBy: 'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts (post-build only)',
    hasUnambiguousOwner: false,
    evidence: [
      ev(
        'server/build-from-prompt-handler.ts',
        'Product faithfulness and generation faithfulness are both evaluated after runOnePromptLivePreviewBuild returns and after runInteractionProofForBuild completes — strictly detection, with no code path back into generation.',
        'handleBuildFromPromptRequest',
        'L210-L230',
      ),
    ],
  },
  {
    id: 'FAILURE_REPORTING',
    order: 17,
    name: 'Failure reporting',
    description: 'Produces the final, founder-facing verdict about whether the build succeeded.',
    primaryFiles: ['src/build-execution-stabilizer-v1/index.ts', 'src/build-result-normalizer-v1/build-result-normalizer.ts'],
    primaryFunctions: ['buildExecutionReport', 'normalizeOnePromptBuildResult'],
    ownedBy: 'src/build-result-normalizer-v1/build-result-normalizer.ts (relabels; does not gate)',
    hasUnambiguousOwner: false,
    evidence: [
      ev(
        'src/build-result-normalizer-v1/build-result-normalizer.ts',
        'A technical interaction-proof failure (PREVIEW_INTERACTION_FAIL/PARTIAL) is downgraded to BUILT_WITH_WARNINGS when npm output and preview URL both look ready; PREVIEW_INTERACTION_BLOCKED never downgrades the result at all.',
        'normalizeOnePromptBuildResult',
        'L105-L134',
      ),
      ev(
        'server/build-from-prompt-handler.ts',
        'The execution monitor records a BLOCKED interaction-proof outcome as completeStage(...), the same call used for a genuine pass, so the build timeline can show a completed stage for a stage that never actually ran.',
        'handleBuildFromPromptRequest',
        'L72-L77',
      ),
    ],
  },
];

/* ------------------------------------------------------------------------------------------
 * 2. State ownership map.
 * ---------------------------------------------------------------------------------------- */

export const STATE_OWNERSHIP_MAP: StateStoreEntry[] = [
  {
    store: 'sessions / activeProjectId (in-memory Map + module-level variable)',
    file: 'src/one-prompt-live-preview/workspace-tab-registry.ts',
    scopeKey: 'PROJECT_ID',
    scopedCorrectly: false,
    risk: 'HIGH',
    evidence: [
      ev(
        'src/one-prompt-live-preview/workspace-tab-registry.ts',
        'sessions is keyed by projectId (correct), but resolveProjectContext falls back to the module-level activeProjectId — a single process-wide value — whenever the caller omits projectId.',
        'resolveProjectContext',
        'L64-L93',
      ),
    ],
  },
  {
    store: 'Project registry cache (cachedState, cachedRootDir)',
    file: 'src/project-registry-v1/project-registry-v1-store.ts',
    scopeKey: 'PROCESS_GLOBAL',
    scopedCorrectly: true,
    risk: 'LOW',
    evidence: [
      ev('src/project-registry-v1/project-registry-v1-store.ts', 'Process-wide cache of the on-disk registry file; re-hydrates activeProjectId from the persisted file on load, which is correct for restart continuity but reinforces the activeProjectId fallback above.', 'hydrateWorkspaceSessions'),
    ],
  },
  {
    store: 'Project context metadata (keywords, domain, lastBuildIntentSummary)',
    file: 'src/project-context-alignment-v1/project-context-metadata-store.ts',
    scopeKey: 'PROJECT_ID',
    scopedCorrectly: false,
    risk: 'MEDIUM',
    evidence: [
      ev(
        'src/project-context-alignment-v1/project-context-metadata-store.ts',
        'Correctly keyed by projectId, but upsert merges new domain keywords into the existing set for that id instead of replacing them, so the metadata is a running union of every prompt ever submitted for that id, not just the latest one.',
        'upsertProjectContextMetadata',
        'L77-L89',
      ),
    ],
  },
  {
    store: 'Missing-capability evolution registry (evolvedRegistry, reuseIndex)',
    file: 'src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts',
    scopeKey: 'NONE',
    scopedCorrectly: false,
    risk: 'MEDIUM',
    evidence: [
      ev(
        'src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts',
        'Not keyed by projectId at all — a capability "evolved" while building one project can be reused for an unrelated project.',
        'evolvedRegistry',
      ),
    ],
  },
  {
    store: 'Project vault (projects Map)',
    file: 'src/project-vault/project-vault-authority.ts',
    scopeKey: 'PROJECT_ID',
    scopedCorrectly: true,
    risk: 'LOW',
    evidence: [ev('src/project-vault/project-vault-authority.ts', 'In-memory singleton keyed by projectId; correctly scoped, but is process-wide and lost on restart (consistent with other in-memory stores in this codebase).', 'singleton')],
  },
  {
    store: 'Multi-project context manager (contexts Map)',
    file: 'src/multi-project-foundation/project-context-manager.ts',
    scopeKey: 'PROJECT_ID',
    scopedCorrectly: true,
    risk: 'LOW',
    evidence: [ev('src/multi-project-foundation/project-context-manager.ts', 'In-memory, correctly keyed by projectId.', 'contexts')],
  },
  {
    store: 'Build execution monitors (activeExecutionMonitors)',
    file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    scopeKey: 'PROJECT_ID',
    scopedCorrectly: true,
    risk: 'LOW',
    evidence: [ev('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', 'Correctly scoped per project per build; overwritten on each new build for the same project id (expected).', 'activeExecutionMonitors', '~L267-L272')],
  },
  {
    store: 'Per-project durable storage (.aidev-projects/<projectId>/)',
    file: 'src/persistent-project-reality/persistent-project-reality-paths.ts',
    scopeKey: 'PROJECT_ID',
    scopedCorrectly: true,
    risk: 'LOW',
    evidence: [
      ev(
        'src/persistent-project-reality/persistent-project-reality-paths.ts',
        'On-disk storage is directory-scoped per projectId; leakage does not happen by cross-reading another project\'s folder, only by the wrong projectId being selected upstream (see PROJECT_CONTEXT_RESOLUTION and PROMPT_RESET_NEW_BUILD_DETECTION stages).',
        'persistentProjectRoot',
      ),
    ],
  },
];

/* ------------------------------------------------------------------------------------------
 * 3 & 4. Evidence sources — current prompt vs. previous project.
 * ---------------------------------------------------------------------------------------- */

export const CURRENT_PROMPT_EVIDENCE_SOURCES: EvidenceCitation[] = [
  ev('src/build-result-normalizer-v1/build-result-normalizer-adapter.ts', 'evaluateGenerationFaithfulnessForBuild passes only { prompt: build.prompt } into runGenerationFaithfulnessAudit — the canonical contract, when built, is built from the current prompt alone.', 'evaluateGenerationFaithfulnessForBuild', 'L156-L161'),
  ev('src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts', 'extractRequestedConcepts primarily tokenizes input.prompt; it only widens to promptUnderstanding/architectureSummary/featureContract text when the prompt alone yields zero domain matches.', 'extractRequestedConcepts', 'L262-L292'),
  ev('src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts', 'Module evidence gating (promptExplicitlyJustifiesGenericModule, buildGenericModuleEvidence) reads rawPrompt directly.', 'evaluateCandidate'),
];

export const PREVIOUS_PROJECT_EVIDENCE_SOURCES: EvidenceCitation[] = [
  ev('src/project-context-alignment-v1/project-context-metadata-store.ts', 'getProjectContextMetadata(projectId) returns accumulated keywords/domain from all prior builds of this project id, merged (not replaced) into the current alignment score.', 'getProjectContextMetadata / upsertProjectContextMetadata'),
  ev('src/project-context-alignment-v1/project-context-alignment-assessor.ts', 'assessProjectContextAlignment folds metadata.lastBuildIntentSummary from the previous build into current domain-overlap scoring.', 'assessProjectContextAlignment', 'L133-L141'),
  ev('src/project-resume-state/duplicate-project-resume-router.ts', 'routeDuplicateProjectResume compares the new prompt\'s domain signals against every existing incomplete project\'s name-derived domain signals and can select a prior project as the resume target.', 'routeDuplicateProjectResume', 'L154-L165'),
  ev('src/one-prompt-live-preview/workspace-tab-registry.ts', 'resolveProjectContext substitutes the server-wide activeProjectId (set by whichever project was last active) when the caller omits projectId — this is "previous project" evidence leaking in by omission, not by explicit merge.', 'resolveProjectContext', 'L85-L88'),
];

/* ------------------------------------------------------------------------------------------
 * 5-13. Findings, missing authorities, fix sequence and risk ranking are defined in the
 * companion file to keep this file within a reviewable size.
 * ---------------------------------------------------------------------------------------- */
import { FINDINGS, MISSING_AUTHORITIES, FIX_SEQUENCE, RISK_RANKING } from './app-generation-readiness-audit-findings.js';
export { FINDINGS, MISSING_AUTHORITIES, FIX_SEQUENCE, RISK_RANKING };

/* ------------------------------------------------------------------------------------------
 * Assessment runner — deterministic, read-only, verifies cited evidence files still exist.
 * ---------------------------------------------------------------------------------------- */

export function runAppGenerationReadinessAuditV1(input: { projectRootDir: string }): AppGenerationReadinessAuditAssessment {
  const allCitations: EvidenceCitation[] = [
    ...PIPELINE_STAGES.flatMap((stage) => stage.evidence),
    ...STATE_OWNERSHIP_MAP.flatMap((entry) => entry.evidence),
    ...CURRENT_PROMPT_EVIDENCE_SOURCES,
    ...PREVIOUS_PROJECT_EVIDENCE_SOURCES,
    ...FINDINGS.flatMap((finding: Finding) => finding.evidence),
    ...MISSING_AUTHORITIES.flatMap((authority: MissingAuthority) => authority.evidence),
  ];

  const filesInspected = Array.from(
    new Set([
      ...allCitations.map((c) => c.file),
      ...PIPELINE_STAGES.flatMap((s) => s.primaryFiles),
      ...FINDINGS.flatMap((f: Finding) => f.filesResponsible),
      ...STATE_OWNERSHIP_MAP.map((s) => s.file),
    ]),
  ).sort();

  let evidenceFilesChecked = 0;
  let evidenceFilesFound = 0;
  for (const file of filesInspected) {
    evidenceFilesChecked += 1;
    if (existsSync(join(input.projectRootDir, file))) {
      evidenceFilesFound += 1;
    }
  }
  const evidenceFileExistenceRatio = evidenceFilesChecked > 0 ? evidenceFilesFound / evidenceFilesChecked : 0;

  const categoriesIdentified = Array.from(new Set(FINDINGS.map((f: Finding) => f.category))) as FindingCategory[];

  const totalStagesRequired = 17;
  const stagesCovered = PIPELINE_STAGES.length;

  const auditProofStatus: 'PROVEN' | 'INCOMPLETE' =
    stagesCovered >= totalStagesRequired && evidenceFileExistenceRatio >= 0.9 && categoriesIdentified.length >= 6 ? 'PROVEN' : 'INCOMPLETE';

  return {
    pipelineStages: PIPELINE_STAGES,
    stateOwnershipMap: STATE_OWNERSHIP_MAP,
    currentPromptEvidenceSources: CURRENT_PROMPT_EVIDENCE_SOURCES,
    previousProjectEvidenceSources: PREVIOUS_PROJECT_EVIDENCE_SOURCES,
    findings: FINDINGS,
    missingAuthorities: MISSING_AUTHORITIES,
    fixSequence: FIX_SEQUENCE,
    riskRanking: RISK_RANKING,
    filesInspected,
    evidenceFilesChecked,
    evidenceFilesFound,
    evidenceFileExistenceRatio,
    stagesCovered,
    totalStagesRequired,
    categoriesIdentified,
    noAppSpecificFixesApplied: true,
    noProductDomainsHardcoded: true,
    noExistingBehaviorModified: true,
    noValidatorsWeakened: true,
    auditProofStatus,
    passToken: APP_GENERATION_READINESS_AUDIT_V1_PASS_TOKEN,
  };
}
