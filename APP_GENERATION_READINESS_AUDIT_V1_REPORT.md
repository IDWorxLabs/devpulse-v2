# AiDevEngine V4 App Generation Readiness Audit V1



This is an audit-only report. No generation behavior, validators, or product-specific logic were changed to produce it. Every finding below cites a specific file/function pair inspected directly in this repository; this report also verifies those files still exist on disk at audit time (see summary table).



## Summary



| Metric | Value |
|---|---|
| Stages covered | 17 / 17 |
| Findings recorded | 19 |
| Finding categories identified | PROJECT_CONTEXT_ISOLATION, STALE_CONTEXT_CONTAMINATION, FALLBACK_MODULE_CONTAMINATION, CONTRACT_DRIFT, FAITHFULNESS_LATE_DETECTION, REPAIR_LIMITATION, RUNTIME_FAILURE_OWNERSHIP |
| Missing authorities identified | 5 |
| Fix sequence steps | 9 |
| Files cited | 52 |
| Evidence files found on disk | 52 / 52 (100.0%) |
| Audit proof status | PROVEN |



## 1. Pipeline Map

| # | Stage | Owner | Unambiguous owner? | Primary files |
|---|---|---|---|---|
| 1 | User prompt intake | server/build-from-prompt-handler.ts :: handleBuildFromPromptRequest | Yes | `server/build-from-prompt-handler.ts`, `server/brain-api-handler.ts`, `server/founder-reality-server.ts` |
| 2 | Project context resolution | src/one-prompt-live-preview/workspace-tab-registry.ts :: resolveProjectContext | No | `src/one-prompt-live-preview/workspace-tab-registry.ts`, `src/project-session-continuity-v1/project-session-build-bridge.ts`, `src/project-context-switching/project-context-loader.ts`, `src/project-registry-v1/project-registry-v1-store.ts` |
| 3 | Prompt reset / new build detection | No single owner — split across client UI, bridge authority, and resume router. | No | `public/founder-reality/builder-home.js`, `src/chat-to-build-execution-bridge-v1/bridge-authority.ts`, `src/project-resume-state/duplicate-project-resume-router.ts`, `src/project-context-switching/project-context-reset.ts` |
| 4 | Canonical product contract creation | src/product-faithfulness-v2/canonical-product-contract.ts :: buildCanonicalProductContract | No | `src/product-faithfulness-v2/canonical-product-contract.ts`, `src/product-faithfulness-v2/index.ts` |
| 5 | Product identity preservation | src/project-context-alignment-v1/ (advisory only — does not gate module selection or contract creation) | No | `src/project-name-conflict-resolution-v1/project-name-conflict-authority.ts`, `src/project-context-alignment-v1/project-context-metadata-store.ts`, `src/project-context-alignment-v1/project-context-alignment-assessor.ts` |
| 6 | Planning | src/prompt-faithful-generation/index.ts :: resolvePromptFaithfulBuildPlan | Yes | `src/prompt-faithful-generation/index.ts`, `src/intent-understanding-engine/intent-understanding-engine.ts`, `src/capability-planning-engine/index.ts` |
| 7 | Architecture generation | src/intent-understanding-engine/product-model-builder.ts | Yes | `src/intent-understanding-engine/product-model-builder.ts` |
| 8 | Universal feature contract generation | src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts :: buildUniversalFeatureContract | Yes | `src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts`, `src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts` |
| 9 | Module selection | src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts :: resolvePromptBoundedModulePlan | Yes | `src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts`, `src/prompt-bounded-materialization/module-candidate-collector.ts`, `src/universal-prompt-to-app-materialization/profile-feature-map.ts`, `src/universal-prompt-to-app-materialization/prompt-app-metadata.ts` |
| 10 | Generated modules | src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts | Yes | `src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts` |
| 11 | Routes | src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts :: buildModularFeatureRoutesTs | Yes | `src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts`, `src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts` |
| 12 | Navigation | src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts | Yes | `src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts` |
| 13 | Materialization manifest | src/universal-prompt-to-app-materialization/generated-app-manifest.ts | Yes | `src/universal-prompt-to-app-materialization/generated-app-manifest.ts`, `src/materialization-evidence/index.ts` |
| 14 | Runtime activation | src/one-prompt-live-preview/generated-dev-server-manager.ts :: startGeneratedAppDevServer | No | `src/one-prompt-live-preview/generated-dev-server-manager.ts` |
| 15 | Live preview proof | Split — ASE interaction-proof engine decides gate unlock during the build; live-preview-interaction-proof-v1 (Playwright) proves interaction after the build, in the handler. | No | `src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts`, `src/live-preview-interaction-proof-v1/live-preview-interaction-proof-runner.ts`, `src/live-preview-gate/live-preview-orchestrator-bridge.ts` |
| 16 | Product faithfulness evaluation | src/build-result-normalizer-v1/build-result-normalizer-adapter.ts (post-build only) | No | `src/product-faithfulness-v1/product-faithfulness-engine.ts`, `src/product-faithfulness-v2/generation-faithfulness-auditor.ts`, `src/build-result-normalizer-v1/build-result-normalizer-adapter.ts` |
| 17 | Failure reporting | src/build-result-normalizer-v1/build-result-normalizer.ts (relabels; does not gate) | No | `src/build-execution-stabilizer-v1/index.ts`, `src/build-result-normalizer-v1/build-result-normalizer.ts` |

### 1. User prompt intake

HTTP entry point that receives a build/chat prompt and hands it to the bridge/orchestrator.

- Primary functions: `handleBuildFromPromptRequest`, `handleBrainRespondRequest`

**Evidence:**

  - `server/founder-reality-server.ts` — POST /api/build/from-prompt and POST /api/brain/respond both terminate in the same build spine.
  - `server/build-from-prompt-handler.ts` `handleBuildFromPromptRequest` — Primary handler; normal path calls executeChatToBuildBridge, forceFreshProject bypasses to runOnePromptLivePreviewBuild directly.

### 2. Project context resolution

Resolves which project/session a build belongs to before any generation happens.

- Primary functions: `resolveProjectContext`, `bootstrapProjectAndSessionForBuild`, `loadProjectContext`

**Evidence:**

  - `src/one-prompt-live-preview/workspace-tab-registry.ts` `resolveProjectContext` — When no projectId is supplied, resolution falls back to the server-side activeProjectId rather than minting a fresh project.
  - `src/project-registry-v1/project-registry-v1-store.ts` `hydrateWorkspaceSessions` — On process/registry load, activeProjectId is re-set from the persisted registry file, reinforcing the fallback on restart.

### 3. Prompt reset / new build detection

Decides whether an incoming prompt is a brand-new app request or a continuation of an existing project.

- Primary functions: `newPrompt`, `resetTest`, `executeChatToBuildBridge`, `routeDuplicateProjectResume`, `buildProjectContextResetSnapshot`

**Evidence:**

  - `public/founder-reality/builder-home.js` `newPrompt` — newPrompt() clears the client-side projectId and prompt text, but the next build request sends only { projectId: state.projectId || undefined } — it never sends confirmFreshCopy: true, so the server has no explicit "this is a new app" signal.
  - `src/chat-to-build-execution-bridge-v1/bridge-authority.ts` `shouldAutoContinueDuplicate` — shouldAutoContinueDuplicate() returns true unless the caller explicitly passes rejectDuplicates: true, so duplicate/near-duplicate incomplete projects are auto-resumed by default.
  - `src/project-resume-state/duplicate-project-resume-router.ts` `routeDuplicateProjectResume` — Duplicate detection matches an incomplete prior project by domain-keyword overlap (score >= 0.55) or substring match on name — a semantically different new prompt can still score as "similar domain" and get routed onto the old project.
  - `src/project-context-switching/project-context-reset.ts` `buildProjectContextResetSnapshot` — buildProjectContextResetSnapshot() is explicitly read-only: it clears UI alignment warnings only, and does not clear build/domain state.

### 4. Canonical product contract creation

Builds the single-source-of-truth description of what product the user asked for.

- Primary functions: `buildCanonicalProductContract`, `runGenerationFaithfulnessAudit`, `runGenerationGate`

**Evidence:**

  - `src/product-faithfulness-v2/index.ts` `runGenerationFaithfulnessAudit` (L1-L74) — Module header states the contract is intended to be "built once immediately after prompt understanding" and become the source of truth for every downstream stage — but the only production caller (evaluateGenerationFaithfulnessForBuild) invokes it after the full build and interaction proof complete, from the prompt alone, purely for audit output.
  - `src/product-faithfulness-v2/index.ts` `runGenerationGate` (L76-L96) — runGenerationGate() is the pre-materialization entry point the design describes, but it is called only from scripts/validate-product-faithfulness-milestone-2.ts — never from the orchestrator, bridge, or code-generation engine.

### 5. Product identity preservation

Keeps the project name/domain/identity consistent and correctly scoped across a build and across rebuilds.

- Primary functions: `applyProjectIdentityForBuild`, `upsertProjectContextMetadata`, `assessProjectContextAlignment`

**Evidence:**

  - `src/project-context-alignment-v1/project-context-metadata-store.ts` `upsertProjectContextMetadata` (L77-L89) — upsertProjectContextMetadata merges new domain keywords into the existing keyword set for a projectId rather than replacing it, so domain identity accumulates across rebuilds on the same project instead of reflecting only the latest prompt.
  - `src/project-context-alignment-v1/project-context-alignment-assessor.ts` `assessProjectContextAlignment` (L133-L141) — Alignment scoring folds in metadata.lastBuildIntentSummary from a prior build alongside the current prompt when computing domain overlap.

### 6. Planning

Produces the pre-generation build plan bundle (intent, faithfulness pass, capability planning, profile ranking).

- Primary functions: `resolvePromptFaithfulBuildPlan`, `runIntentUnderstandingEngine`, `runCapabilityPlanningPipeline`, `rankBuildProfiles`

**Evidence:**

  - `src/one-prompt-live-preview/one-prompt-build-orchestrator.ts` `runOnePromptLivePreviewBuild` (~L471) — resolvePromptFaithfulBuildPlan is invoked once per build near the top of the orchestrator and its output (buildPlan) feeds every downstream generation decision.

### 7. Architecture generation

Builds the product intelligence model and architecture hints used to select a materialization profile.

- Primary functions: `buildProductIntelligenceModel`, `buildArchitectureHints`

**Evidence:**

  - `src/intent-understanding-engine/product-model-builder.ts` `buildArchitectureHints` — Architecture hints feed profile ranking (rankBuildProfiles) and the module candidate collector, but do not feed the Universal Feature Contract builder, which selects its entity template independently from the resolved profile string only.

### 8. Universal feature contract generation

Builds the per-app entity/action/route contract written to universal-feature-contract.json.

- Primary functions: `buildUniversalFeatureContract`, `buildUniversalFeatureContractJson`

**Evidence:**

  - `src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts` `buildUniversalFeatureContract` (L543-L580) — Contract entities come from a fixed per-profile template (buildProfileContract); GENERIC_CUSTOM_APP_V1 and HABIT_TRACKER_WEB_V1 share the same "habit" entity template regardless of what the prompt actually described.
  - `src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts` `buildUniversalMaterializedWorkspaceFiles` (L74-L183) — The contract used to drive materialization is built with profile: materializationProfile, but the contract written to disk as JSON is built again with profile: input.profile — the two calls can select different profiles for the same build.

### 9. Module selection

Resolves which feature modules are approved for generation for this specific prompt.

- Primary functions: `resolvePromptBoundedModulePlan`, `collectAllModuleCandidates`, `getProfileFeatureDefinition`, `deriveGenericCustomFeatureModules`

**Evidence:**

  - `src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts` `resolvePromptBoundedModulePlan` (L86-L174) — The resolver itself is evidence-gated: PROFILE_FALLBACK/TEMPLATE_DEFAULT/DEMO_DEFAULT/SAMPLE_APP_DEFAULT/GENERIC_PLACEHOLDER origins are blocked unless the prompt, product-intelligence model, or capability plan supplies explicit justification.
  - `src/universal-prompt-to-app-materialization/prompt-app-metadata.ts` `deriveGenericCustomFeatureModules` (L118-L139) — deriveGenericCustomFeatureModules unconditionally seeds the module set with "dashboard", and pads with "records"/"settings" when the prompt yields 2 or fewer distinct modules — these seeded candidates then enter the bounded resolver as material to evaluate.

### 10. Generated modules

Writes the actual feature-module source files for each approved module.

- Primary functions: `buildAllModularFeatureModuleFiles`, `materializableFeatureModules`

**Evidence:**

  - `src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts` `buildAllModularFeatureModuleFiles` (L63-L300) — Reads only definition.featureModules (the bounded-plan output injected via applyPromptBoundedPlanToBuildPlan). It never reads the Universal Feature Contract, so the two artifacts can describe different products for the same build.

### 11. Routes

Generates the route table for the materialized application.

- Primary functions: `buildModularFeatureRoutesTs`, `buildDefinitionFromModulePlan`

**Evidence:**

  - `src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts` `buildDefinitionFromModulePlan` (L238-L278) — Routes are built index-aligned with approvedModuleIds, including infrastructure ids like "persistence" that are later filtered out of file generation — the route list and the generated-file list are not guaranteed to match 1:1.

### 12. Navigation

Generates the app router shell and feature registry used for in-app navigation.

- Primary functions: `buildFeatureAppRouterTsx`, `buildModularFeatureRegistryTs`

**Evidence:**

  - `src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts` `buildFeatureAppRouterTsx` (L357-L360) — Navigation excludes the "auth" module id, yet "auth" still receives a route ("/"), and the default landing module falls back to the first non-auth module or "dashboard" if the list is empty.

### 13. Materialization manifest

Records what was actually generated for a build (files, modules, expected app type).

- Primary functions: `buildInitialGeneratedAppManifest`, `serializeGeneratedAppManifest`, `initializeForensicManifest`

**Evidence:**

  - `src/universal-prompt-to-app-materialization/generated-app-manifest.ts` `buildInitialGeneratedAppManifest` — Manifest is populated from the same bounded-plan definition used for module generation, so it inherits any drift already present between the bounded plan and the Universal Feature Contract rather than reconciling the two.

### 14. Runtime activation

Starts the generated app dev server so a live preview URL exists.

- Primary functions: `startGeneratedAppDevServer`

**Evidence:**

  - `src/one-prompt-live-preview/generated-dev-server-manager.ts` `startGeneratedAppDevServer` (L124-L264) — Has a 45s wall-clock timeout that always resolves with a failure result (does not hang), but the inner async IIFE that spawns the process has no attached .catch(), so an exception thrown during spawn/setup before the timer or exit/error listeners are wired can leave the returned promise unsettled indefinitely.
  - `src/one-prompt-live-preview/generated-dev-server-manager.ts` `startGeneratedAppDevServer` (L201-L208) — If the child process exits with code 0 but never printed a parseable Vite "Local:" URL, nothing resolves the promise until the 45s timer fires — a full 45s of silent waiting on every such build.

### 15. Live preview proof

Loads the running generated app and proves it actually renders and responds to interaction.

- Primary functions: `runLivePreviewInteractionProof`, `evaluateLivePreviewGateForOrchestrator`

**Evidence:**

  - `src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts` `runLivePreviewInteractionProof` (L60-L66) — Only gates on previewUrl and devServerRunning before loading the page — there is no check that materialization actually completed (no verification that npm install/build succeeded or that the expected files exist) before attempting to load and interact with the page.
  - `src/live-preview-interaction-proof-v1/live-preview-interaction-proof-runner.ts` `PlaywrightProofPageDriver.launch` (L93-L98) — chromium.launch() has no timeout attached; only per-step navigation/action calls are bounded, so a hang inside browser launch itself is not bounded by the proof engine's own budget.

### 16. Product faithfulness evaluation

Scores whether the finished app matches what the prompt asked for.

- Primary functions: `evaluateProductFaithfulness`, `runGenerationFaithfulnessAudit`, `evaluateGenerationFaithfulnessForBuild`

**Evidence:**

  - `server/build-from-prompt-handler.ts` `handleBuildFromPromptRequest` (L210-L230) — Product faithfulness and generation faithfulness are both evaluated after runOnePromptLivePreviewBuild returns and after runInteractionProofForBuild completes — strictly detection, with no code path back into generation.

### 17. Failure reporting

Produces the final, founder-facing verdict about whether the build succeeded.

- Primary functions: `buildExecutionReport`, `normalizeOnePromptBuildResult`

**Evidence:**

  - `src/build-result-normalizer-v1/build-result-normalizer.ts` `normalizeOnePromptBuildResult` (L105-L134) — A technical interaction-proof failure (PREVIEW_INTERACTION_FAIL/PARTIAL) is downgraded to BUILT_WITH_WARNINGS when npm output and preview URL both look ready; PREVIEW_INTERACTION_BLOCKED never downgrades the result at all.
  - `server/build-from-prompt-handler.ts` `handleBuildFromPromptRequest` (L72-L77) — The execution monitor records a BLOCKED interaction-proof outcome as completeStage(...), the same call used for a genuine pass, so the build timeline can show a completed stage for a stage that never actually ran.

## 2. State Ownership Map

| Store | File | Scope key | Correctly scoped? | Risk |
|---|---|---|---|---|
| sessions / activeProjectId (in-memory Map + module-level variable) | `src/one-prompt-live-preview/workspace-tab-registry.ts` | PROJECT_ID | No | HIGH |
| Project registry cache (cachedState, cachedRootDir) | `src/project-registry-v1/project-registry-v1-store.ts` | PROCESS_GLOBAL | Yes | LOW |
| Project context metadata (keywords, domain, lastBuildIntentSummary) | `src/project-context-alignment-v1/project-context-metadata-store.ts` | PROJECT_ID | No | MEDIUM |
| Missing-capability evolution registry (evolvedRegistry, reuseIndex) | `src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts` | NONE | No | MEDIUM |
| Project vault (projects Map) | `src/project-vault/project-vault-authority.ts` | PROJECT_ID | Yes | LOW |
| Multi-project context manager (contexts Map) | `src/multi-project-foundation/project-context-manager.ts` | PROJECT_ID | Yes | LOW |
| Build execution monitors (activeExecutionMonitors) | `src/one-prompt-live-preview/one-prompt-build-orchestrator.ts` | PROJECT_ID | Yes | LOW |
| Per-project durable storage (.aidev-projects/<projectId>/) | `src/persistent-project-reality/persistent-project-reality-paths.ts` | PROJECT_ID | Yes | LOW |

**sessions / activeProjectId (in-memory Map + module-level variable)**

  - `src/one-prompt-live-preview/workspace-tab-registry.ts` `resolveProjectContext` (L64-L93) — sessions is keyed by projectId (correct), but resolveProjectContext falls back to the module-level activeProjectId — a single process-wide value — whenever the caller omits projectId.

**Project registry cache (cachedState, cachedRootDir)**

  - `src/project-registry-v1/project-registry-v1-store.ts` `hydrateWorkspaceSessions` — Process-wide cache of the on-disk registry file; re-hydrates activeProjectId from the persisted file on load, which is correct for restart continuity but reinforces the activeProjectId fallback above.

**Project context metadata (keywords, domain, lastBuildIntentSummary)**

  - `src/project-context-alignment-v1/project-context-metadata-store.ts` `upsertProjectContextMetadata` (L77-L89) — Correctly keyed by projectId, but upsert merges new domain keywords into the existing set for that id instead of replacing them, so the metadata is a running union of every prompt ever submitted for that id, not just the latest one.

**Missing-capability evolution registry (evolvedRegistry, reuseIndex)**

  - `src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts` `evolvedRegistry` — Not keyed by projectId at all — a capability "evolved" while building one project can be reused for an unrelated project.

**Project vault (projects Map)**

  - `src/project-vault/project-vault-authority.ts` `singleton` — In-memory singleton keyed by projectId; correctly scoped, but is process-wide and lost on restart (consistent with other in-memory stores in this codebase).

**Multi-project context manager (contexts Map)**

  - `src/multi-project-foundation/project-context-manager.ts` `contexts` — In-memory, correctly keyed by projectId.

**Build execution monitors (activeExecutionMonitors)**

  - `src/one-prompt-live-preview/one-prompt-build-orchestrator.ts` `activeExecutionMonitors` (~L267-L272) — Correctly scoped per project per build; overwritten on each new build for the same project id (expected).

**Per-project durable storage (.aidev-projects/<projectId>/)**

  - `src/persistent-project-reality/persistent-project-reality-paths.ts` `persistentProjectRoot` — On-disk storage is directory-scoped per projectId; leakage does not happen by cross-reading another project's folder, only by the wrong projectId being selected upstream (see PROJECT_CONTEXT_RESOLUTION and PROMPT_RESET_NEW_BUILD_DETECTION stages).

## 3. Current Prompt Evidence Sources

  - `src/build-result-normalizer-v1/build-result-normalizer-adapter.ts` `evaluateGenerationFaithfulnessForBuild` (L156-L161) — evaluateGenerationFaithfulnessForBuild passes only { prompt: build.prompt } into runGenerationFaithfulnessAudit — the canonical contract, when built, is built from the current prompt alone.
  - `src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts` `extractRequestedConcepts` (L262-L292) — extractRequestedConcepts primarily tokenizes input.prompt; it only widens to promptUnderstanding/architectureSummary/featureContract text when the prompt alone yields zero domain matches.
  - `src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts` `evaluateCandidate` — Module evidence gating (promptExplicitlyJustifiesGenericModule, buildGenericModuleEvidence) reads rawPrompt directly.

## 4. Previous Project Evidence Sources

  - `src/project-context-alignment-v1/project-context-metadata-store.ts` `getProjectContextMetadata / upsertProjectContextMetadata` — getProjectContextMetadata(projectId) returns accumulated keywords/domain from all prior builds of this project id, merged (not replaced) into the current alignment score.
  - `src/project-context-alignment-v1/project-context-alignment-assessor.ts` `assessProjectContextAlignment` (L133-L141) — assessProjectContextAlignment folds metadata.lastBuildIntentSummary from the previous build into current domain-overlap scoring.
  - `src/project-resume-state/duplicate-project-resume-router.ts` `routeDuplicateProjectResume` (L154-L165) — routeDuplicateProjectResume compares the new prompt's domain signals against every existing incomplete project's name-derived domain signals and can select a prior project as the resume target.
  - `src/one-prompt-live-preview/workspace-tab-registry.ts` `resolveProjectContext` (L85-L88) — resolveProjectContext substitutes the server-wide activeProjectId (set by whichever project was last active) when the caller omits projectId — this is "previous project" evidence leaking in by omission, not by explicit merge.

## 5. Places Where Stale Context Can Leak (includes project context isolation failures)

### F01-ACTIVE-PROJECT-FALLBACK — Project context resolution falls back to a process-wide "active project" when a request omits projectId (CRITICAL)

resolveProjectContext() only mints a fresh project when the caller supplies neither a known projectId nor a still-registered activeProjectId. Any client call that omits projectId (which the "new prompt" UI flow does) is silently attached to whatever project happened to be active last, in this process, for any user of this server instance.

**Related stages:** PROJECT_CONTEXT_RESOLUTION, PROMPT_RESET_NEW_BUILD_DETECTION

**Files responsible:** `src/one-prompt-live-preview/workspace-tab-registry.ts`, `src/project-registry-v1/project-registry-v1-store.ts`

**Functions responsible:** `resolveProjectContext`, `hydrateWorkspaceSessions`, `setActiveProjectId`

**Evidence:**

  - `src/one-prompt-live-preview/workspace-tab-registry.ts` `resolveProjectContext` (L64-L93) — requestedId is checked first; if absent, activeProjectId (a single module-level variable) is reused if it still has a session.
  - `src/project-registry-v1/project-registry-v1-store.ts` `hydrateWorkspaceSessions` (L199-L207) — activeProjectId is also re-set from disk on registry hydration, so this fallback persists across server restarts, not just within one process lifetime.

### F02-NEW-PROMPT-NO-FRESH-SIGNAL — "New prompt" in the client UI does not tell the server to start a fresh project (CRITICAL)

The builder UI's newPrompt() handler clears local state and prompt text, and its own comment claims it starts a "fresh project on next build" — but the next build request it sends carries no confirmFreshCopy flag and no explicit signal distinguishing "new app" from "continue previous app". The server has no way to tell these two intents apart from this call alone.

**Related stages:** PROMPT_RESET_NEW_BUILD_DETECTION, PROJECT_CONTEXT_RESOLUTION

**Files responsible:** `public/founder-reality/builder-home.js`, `src/chat-to-build-execution-bridge-v1/bridge-authority.ts`

**Functions responsible:** `newPrompt`, `executeChatToBuildBridge`

**Evidence:**

  - `public/founder-reality/builder-home.js` `newPrompt` (L1110-L1135) — newPrompt() clears projectId client-side; the click handler then calls runBuild(prompt, { projectId: state.projectId || undefined }) with no other flags.
  - `src/chat-to-build-execution-bridge-v1/bridge-authority.ts` `executeChatToBuildBridge` — confirmFreshCopy is a recognized bridge input, but nothing in the "new prompt" client path ever sets it to true.

### F03-AUTO-RESUME-DUPLICATE-DEFAULT-ON — Duplicate/near-duplicate project auto-resume is on by default and matches on loose domain overlap (HIGH)

shouldAutoContinueDuplicate() treats every request as eligible for silent resume unless the caller explicitly opts out with rejectDuplicates: true, which the primary UI flow does not do. The resume router matches an incomplete prior project whenever a domain-overlap score of 0.55+ is reached (or a name substring match), which is loose enough that a genuinely different new prompt sharing a few domain keywords with an old, unfinished project can be silently routed onto that old project's workspace, contract, and generated files.

**Related stages:** PROMPT_RESET_NEW_BUILD_DETECTION, PROJECT_CONTEXT_RESOLUTION, PRODUCT_IDENTITY_PRESERVATION

**Files responsible:** `src/chat-to-build-execution-bridge-v1/bridge-authority.ts`, `src/project-resume-state/duplicate-project-resume-router.ts`

**Functions responsible:** `shouldAutoContinueDuplicate`, `executeChatToBuildBridge`, `routeDuplicateProjectResume`

**Evidence:**

  - `src/chat-to-build-execution-bridge-v1/bridge-authority.ts` `shouldAutoContinueDuplicate` (L134-L136) — shouldAutoContinueDuplicate returns input.rejectDuplicates !== true — default is to auto-continue.
  - `src/chat-to-build-execution-bridge-v1/bridge-authority.ts` `executeChatToBuildBridge` (L268-L270) — effectiveProjectId is overwritten with resumeRoute.resumingProjectId whenever auto-continue is allowed and the router flags a block.
  - `src/project-resume-state/duplicate-project-resume-router.ts` `routeDuplicateProjectResume` (L154-L165) — domainScore >= 0.55 (or a name-substring match) is sufficient to classify a candidate as SIMILAR_DOMAIN and route to it.

### F04-METADATA-KEYWORD-ACCUMULATION — Project context metadata merges keywords across builds instead of replacing them per prompt (MEDIUM)

upsertProjectContextMetadata unions new domain keywords into the existing keyword array for a projectId rather than replacing the array with the current prompt's signals. Alignment scoring then reads this accumulated superset, so a project's "domain identity" is effectively the union of every prompt ever submitted under that id, including domains the user has since moved away from.

**Related stages:** PRODUCT_IDENTITY_PRESERVATION, PROJECT_CONTEXT_RESOLUTION

**Files responsible:** `src/project-context-alignment-v1/project-context-metadata-store.ts`

**Functions responsible:** `upsertProjectContextMetadata`, `getProjectContextMetadata`

**Evidence:**

  - `src/project-context-alignment-v1/project-context-metadata-store.ts` `upsertProjectContextMetadata` (L77-L89) — domainIds = [...new Set([...(existing?.keywords ?? []), ...nameSignals.domainIds, ...(promptSignals?.domainIds ?? [])])] — existing keywords are always kept.

### F05-EVOLUTION-REGISTRY-NOT-PROJECT-SCOPED — Missing-capability evolution registry is process-global, not project-scoped (MEDIUM)

evolvedRegistry/reuseIndex in the missing-capability evolution engine are not keyed by projectId. A capability "evolved" for one product can be silently reused while building a completely unrelated product in the same process lifetime.

**Related stages:** PLANNING

**Files responsible:** `src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts`

**Functions responsible:** `evolvedRegistry`, `reuseIndex`

**Evidence:**

  - `src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts` `evolvedRegistry` — Registry map has no projectId key in its type or lookup path.

## 6. Places Where Fallback Modules Can Be Appended

### F06-UNCONDITIONAL-DASHBOARD-SEED — Generic custom-app module derivation unconditionally seeds "dashboard" (and pads with "records"/"settings") (HIGH)

deriveGenericCustomFeatureModules starts every custom-domain build's candidate set with "dashboard" unconditionally, and adds "records" and "settings" whenever the prompt yields two or fewer distinct modules. These are candidates fed into the evidence-gated resolver, but the seeding itself has no prompt-evidence requirement — it happens before the gate runs, so the gate's exemptions (e.g. treating "dashboard"/"settings" as allowed infrastructure ids in prompt-module-name-normalizer.ts) let them straight through even for prompts that never mentioned a dashboard.

**Related stages:** MODULE_SELECTION

**Files responsible:** `src/universal-prompt-to-app-materialization/prompt-app-metadata.ts`, `src/prompt-faithful-generation/prompt-module-name-normalizer.ts`

**Functions responsible:** `deriveGenericCustomFeatureModules`, `sanitizeModuleIds`

**Evidence:**

  - `src/universal-prompt-to-app-materialization/prompt-app-metadata.ts` `deriveGenericCustomFeatureModules` (L118-L139) — const modules = new Set<string>(["dashboard"]); — added before any prompt-term evaluation.
  - `src/prompt-faithful-generation/prompt-module-name-normalizer.ts` `sanitizeModuleIds` (L177) — allowInfrastructure defaults to ["auth", "dashboard", "settings", "persistence"], so these ids bypass BANNED_FALLBACK_MODULES rejection during sanitization.

### F07-PROFILE-MAP-FIXED-LISTS — Fixed per-profile module lists (PROFILE_FEATURE_MAP) enter the candidate pool as PROFILE_FALLBACK, and some profiles auto-allow a subset (MEDIUM)

Every non-GENERIC_CUSTOM/HABIT_TRACKER profile returns its complete, hardcoded featureModules array from PROFILE_FEATURE_MAP. These become PROFILE_FALLBACK-origin candidates, which the resolver blocks by default — but PROJECT_MANAGEMENT_WEB_V1 has an explicit auto-allow path (projectManagementProfileAllowsModule) that lets a fixed subset through without prompt evidence. Wrong profile selection upstream (architecture/profile ranking) therefore has an outsized effect: it changes which fixed module list even enters consideration.

**Related stages:** MODULE_SELECTION, ARCHITECTURE_GENERATION

**Files responsible:** `src/universal-prompt-to-app-materialization/profile-feature-map.ts`, `src/prompt-bounded-materialization/module-candidate-collector.ts`

**Functions responsible:** `getProfileFeatureDefinition`, `collectProfileModuleCandidates`, `projectManagementProfileAllowsModule`

**Evidence:**

  - `src/universal-prompt-to-app-materialization/profile-feature-map.ts` `PROFILE_FEATURE_MAP` (L51-L107) — PROFILE_FEATURE_MAP contains a full hardcoded featureModules array per profile (e.g. TASK_TRACKER_WEB_V1: auth, dashboard, tasks, projects, labels, calendar, reports, settings, persistence).
  - `src/prompt-bounded-materialization/module-candidate-collector.ts` `collectProfileModuleCandidates` (L53-L73) — collectProfileModuleCandidates maps every profile module id to a PROFILE_FALLBACK-origin candidate unconditionally.

### F08-PERSISTENCE-ALWAYS-ON — System-shell candidate collector always adds "persistence" for non-utility prompts (LOW)

collectSystemShellCandidates adds "persistence" unconditionally for any prompt not classified as a simple utility app, and adds "auth" only when the prompt explicitly requires login. "persistence" is infrastructure, not a user-visible concept, so this is lower risk than F06/F07, but it does mean the route/definition list always contains at least one entry ("persistence") with no corresponding generated feature folder (see F09).

**Related stages:** MODULE_SELECTION

**Files responsible:** `src/prompt-bounded-materialization/module-candidate-collector.ts`

**Functions responsible:** `collectSystemShellCandidates`

**Evidence:**

  - `src/prompt-bounded-materialization/module-candidate-collector.ts` `collectSystemShellCandidates` (L124-L131) — const modules: string[] = ["persistence"]; unshift("auth") only if promptExplicitlyRequiresAuth.

## 7. Places Where Generated Modules Can Drift From the Canonical Product Contract

### F09-CONTRACT-INDEPENDENT-OF-MODULE-PLAN — Universal Feature Contract is built from a fixed profile template, independent of the approved module plan (CRITICAL)

buildUniversalFeatureContract selects its entity/action template purely from the resolved profile string (via buildProfileContract), not from definition.featureModules / the bounded module plan that actually drives buildAllModularFeatureModuleFiles. The two systems can therefore describe different products for the same build: the contract can list entities (e.g. "habit") that no generated module implements, or omit entities for modules that were generated. Because buildAllModularFeatureModuleFiles never reads the contract (see F10), there is no reconciliation step anywhere in the pipeline.

**Related stages:** UNIVERSAL_FEATURE_CONTRACT_GENERATION, MODULE_SELECTION, GENERATED_MODULES

**Files responsible:** `src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts`, `src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts`

**Functions responsible:** `buildUniversalFeatureContract`, `buildProfileContract`, `buildUniversalMaterializedWorkspaceFiles`

**Evidence:**

  - `src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts` `buildUniversalFeatureContract` (L543-L580) — buildProfileContract keyed only on profile; GENERIC_CUSTOM_APP_V1 and HABIT_TRACKER_WEB_V1 both produce the same "habit" entity/action set regardless of the prompt.
  - `src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts` `buildUniversalMaterializedWorkspaceFiles` (L74-L87) — Contract build call and module-generator call are two separate, unlinked steps in the same function.

### F10-GENERATOR-IGNORES-CONTRACT — Feature-module code generation never reads the Universal Feature Contract (HIGH)

buildAllModularFeatureModuleFiles takes a ProfileFeatureDefinition (module id list + routes) and never receives or reads the UniversalFeatureContract object at all. The contract is written to universal-feature-contract.json purely as a side artifact of the materialization engine, with no code path feeding it back into what gets generated.

**Related stages:** GENERATED_MODULES, UNIVERSAL_FEATURE_CONTRACT_GENERATION

**Files responsible:** `src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts`

**Functions responsible:** `buildAllModularFeatureModuleFiles`

**Evidence:**

  - `src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts` `buildAllModularFeatureModuleFiles` (L286-L300) — Function signature is (appTitle: string, definition: ProfileFeatureDefinition) — no contract parameter.

### F11-CONTRACT-PROFILE-MISMATCH — The contract used for generation and the contract written to disk can be built from different profile values (MEDIUM)

Inside buildUniversalMaterializedWorkspaceFiles, the in-memory contract used elsewhere in materialization is built with profile: materializationProfile, while the JSON file written to the workspace (universal-feature-contract.json) is built with profile: input.profile ?? undefined — a second, independent call that is not guaranteed to resolve to the same profile.

**Related stages:** UNIVERSAL_FEATURE_CONTRACT_GENERATION, MATERIALIZATION_MANIFEST

**Files responsible:** `src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts`

**Functions responsible:** `buildUniversalMaterializedWorkspaceFiles`

**Evidence:**

  - `src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts` `buildUniversalMaterializedWorkspaceFiles` (L74-L183) — Two separate buildUniversalFeatureContract(...)/buildUniversalFeatureContractJson(...) calls with independently-sourced profile values.

## 8. Places Where Faithfulness Detects Failure Too Late

### F12-FAITHFULNESS-POST-BUILD-ONLY — Product/generation faithfulness evaluation runs only after the build and interaction proof complete (CRITICAL)

evaluateProductFaithfulness and runGenerationFaithfulnessAudit (via evaluateProductFaithfulnessForBuild / evaluateGenerationFaithfulnessForBuild) are called from server/build-from-prompt-handler.ts strictly after runOnePromptLivePreviewBuild returns and after runInteractionProofForBuild finishes. Neither function, nor any function that calls them, is invoked anywhere inside one-prompt-build-orchestrator.ts, the code-generation engine, or the module resolver. By the time a mismatch is detected, the app has already been fully materialized, npm-installed, built, and preview-activated.

**Related stages:** PRODUCT_FAITHFULNESS_EVALUATION, CANONICAL_PRODUCT_CONTRACT_CREATION

**Files responsible:** `server/build-from-prompt-handler.ts`, `src/build-result-normalizer-v1/build-result-normalizer-adapter.ts`

**Functions responsible:** `handleBuildFromPromptRequest`, `evaluateProductFaithfulnessForBuild`, `evaluateGenerationFaithfulnessForBuild`

**Evidence:**

  - `server/build-from-prompt-handler.ts` `handleBuildFromPromptRequest` (L210-L230) — Evaluation calls occur after "const livePreviewInteractionProof = await runInteractionProofForBuild(result);" in the same function body.
  - `src/build-result-normalizer-v1/build-result-normalizer-adapter.ts` `evaluateGenerationFaithfulnessForBuild` (L32-L36) — Module comment: "Builds the Product Faithfulness evidence bundle from real, already-computed build evidence only."

### F13-GENERATION-GATE-UNWIRED — The one function explicitly designed to run before materialization (runGenerationGate) is never called by the production pipeline (HIGH)

runGenerationGate's own doc comment states it is "intended to run before materialization begins." A repository-wide search shows its only caller is scripts/validate-product-faithfulness-milestone-2.ts. It is not called from the orchestrator, the bridge, or the materialization/code-generation engines. The preventive mechanism exists as an API surface, but production traffic never reaches it.

**Related stages:** PRODUCT_FAITHFULNESS_EVALUATION, CANONICAL_PRODUCT_CONTRACT_CREATION, MODULE_SELECTION

**Files responsible:** `src/product-faithfulness-v2/index.ts`

**Functions responsible:** `runGenerationGate`

**Evidence:**

  - `src/product-faithfulness-v2/index.ts` `runGenerationGate` (L76-L96) — proceed: boolean output is never consumed by any generation-path caller.

## 9. Places Where Repair Is Only Reported But Not Applied

### F14-REPAIR-IS-IN-MEMORY-ONLY — Generation-faithfulness "repair" patches in-memory evidence and re-audits; it never regenerates a file (CRITICAL)

generation-faithfulness-repair.ts's own header states it "never invokes a code-generation engine or LLM." When a concept is missing, applyMinimalRepairs either finds evidence for it elsewhere in already-collected stage evidence (a bookkeeping fix, not a code change) or records a REGENERATE_FEATURE_MODULE action with applied: false and a detail string admitting the module was not actually regenerated. repairAndReaudit re-runs the audit against this patched evidence purely in memory. No repair-path code calls materializeGeneratedApplication or buildAllModularFeatureModuleFiles again.

**Related stages:** PRODUCT_FAITHFULNESS_EVALUATION, GENERATED_MODULES

**Files responsible:** `src/product-faithfulness-v2/generation-faithfulness-repair.ts`

**Functions responsible:** `applyMinimalRepairs`, `repairAndReaudit`

**Evidence:**

  - `src/product-faithfulness-v2/generation-faithfulness-repair.ts` `module header` (L1-L13) — Header: "this module never invokes a code-generation engine or LLM — so it is recorded as a planned-but-not-applied 'regenerate feature module' action instead of a fake success."
  - `src/product-faithfulness-v2/generation-faithfulness-repair.ts` `applyMinimalRepairs` (L68-L92) — applied: false branch explicitly states the concept "would require regenerating its feature module — not applied by this evaluation-time repair."

### F15-REPAIR-RELABELS-NOT-RETRIES — A successful in-memory "repair" only changes the result label on an already-finished build (HIGH)

When any in-memory repair action has applied: true, build-result-normalizer.ts relabels the finished build's normalized result as BUILT_AFTER_FAITHFULNESS_REPAIR. The app itself — the files on disk, the running dev server, the live preview — is completely unchanged by this relabeling. Separately, isSeriousFaithfulnessProblem (v1) is exported but has zero callers anywhere in the repository, so a "serious" verdict has no wired consequence.

**Related stages:** PRODUCT_FAITHFULNESS_EVALUATION, FAILURE_REPORTING

**Files responsible:** `src/build-result-normalizer-v1/build-result-normalizer.ts`, `src/product-faithfulness-v1/product-faithfulness-verdict.ts`

**Functions responsible:** `normalizeOnePromptBuildResult`, `isSeriousFaithfulnessProblem`

**Evidence:**

  - `src/build-result-normalizer-v1/build-result-normalizer.ts` `normalizeOnePromptBuildResult` (L158-L165) — genRepairsApplied -> result = "BUILT_AFTER_FAITHFULNESS_REPAIR" with no accompanying regeneration step.
  - `src/product-faithfulness-v1/product-faithfulness-verdict.ts` `isSeriousFaithfulnessProblem` (L10-L20) — isSeriousFaithfulnessProblem is exported but has no callers in the codebase.

## 10. Places Where Runtime/Live Preview Can Stop Responding

### F16-DEV-SERVER-UNCAUGHT-ASYNC — Dev server startup has an unguarded async IIFE that can leave its promise unsettled (HIGH)

startGeneratedAppDevServer wraps its spawn logic in `void (async () => { ... })()` with no attached .catch(). A synchronous throw or rejected await inside that IIFE (e.g. during stopGeneratedDevServerByKey for a pre-existing server) is not converted into a resolved { ok: false } result and is not caught by the 45s timer, which is armed after the async setup runs. This is the clearest single "silently stops responding" path found in the runtime-activation stage.

**Related stages:** RUNTIME_ACTIVATION

**Files responsible:** `src/one-prompt-live-preview/generated-dev-server-manager.ts`

**Functions responsible:** `startGeneratedAppDevServer`

**Evidence:**

  - `src/one-prompt-live-preview/generated-dev-server-manager.ts` `startGeneratedAppDevServer` (L236-L264) — return new Promise((resolve) => { void (async () => { ... })(); }); — inner IIFE has no .catch(), no try/catch wrapping stopGeneratedDevServerByKey + spawn + bindStartupListeners.

### F17-INTERACTION-PROOF-NO-MATERIALIZATION-PRECHECK — Live preview interaction proof does not verify materialization completeness before loading the page (MEDIUM)

runLivePreviewInteractionProof only checks input.previewUrl and input.devServerRunning before calling chromium and navigating. It has no check that npm install/build actually succeeded or that the expected files/modules exist on disk. If the app is only partially materialized, the proof engine discovers this by loading a broken page and classifying the failure after the fact, inside a 30s total budget, rather than short-circuiting immediately with a clear "materialization incomplete" verdict.

**Related stages:** LIVE_PREVIEW_PROOF, MATERIALIZATION_MANIFEST

**Files responsible:** `src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts`

**Functions responsible:** `runLivePreviewInteractionProof`

**Evidence:**

  - `src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts` `runLivePreviewInteractionProof` (L60-L66) — Gate condition is `if (!input.previewUrl || !input.devServerRunning)` only; materializationManifestHints is used solely to derive search terms, not to gate.

### F18-STABILIZER-TIMEOUTS-NOT-ENFORCED-IN-PRODUCTION — The build-execution-stabilizer's stall/timeout policy is defined but not wired into the production orchestrator (HIGH)

DEFAULT_STAGE_STALL_CONFIG defines per-stage stall and total timeouts (including a dedicated PREVIEW_STARTUP: 40s and INTERACTION_PROOF: 30s budget), and runMonitoredCommand/runMonitoredPoll in build-execution-stabilizer.ts implement real stall detection with process-kill-and-fail semantics. But one-prompt-build-orchestrator.ts does not call runMonitoredCommand/runMonitoredPoll anywhere — it uses raw execSync(..., { timeout }) for npm steps and generated-dev-server-manager's own independent 45s timer for preview startup (which does not match the stabilizer's stated 40s budget). BuildExecutionMonitor itself is explicitly documented as a passive state container with "no timers."

**Related stages:** RUNTIME_ACTIVATION, LIVE_PREVIEW_PROOF, FAILURE_REPORTING

**Files responsible:** `src/build-execution-stabilizer-v1/build-execution-timeouts.ts`, `src/build-execution-stabilizer-v1/build-execution-stabilizer.ts`, `src/one-prompt-live-preview/one-prompt-build-orchestrator.ts`

**Functions responsible:** `runMonitoredCommand`, `runMonitoredPoll`, `runOnePromptLivePreviewBuild`

**Evidence:**

  - `src/build-execution-stabilizer-v1/build-execution-timeouts.ts` `DEFAULT_STAGE_STALL_CONFIG` (L10-L20) — DEFAULT_STAGE_STALL_CONFIG.PREVIEW_STARTUP = { stallTimeoutMs: 20_000, totalTimeoutMs: 40_000 } vs. dev-server-manager's own 45_000ms default — the two numbers disagree and only one of them is actually enforced.
  - `src/build-execution-stabilizer-v1/build-execution-monitor.ts` `module header` (L4-L8) — "Pure state container — no process management, no timers." by design; enforcement lives only in build-execution-stabilizer.ts, which the orchestrator does not call.

### F19-FRAGMENTED-PREVIEW-VERDICTS — At least five modules each hold a partial, potentially conflicting verdict on whether the preview is actually working, with no single arbiter (HIGH)

The ASE interaction-proof engine decides live-preview-gate unlock during the build; AEE's preview contract can override that gate to UNLOCKED purely on an HTTP route probe passing, even when interaction verification failed (downgrading only to DEGRADED); the post-build Playwright interaction proof runs afterward and cannot affect the gate decision already baked into the build result; build-result-normalizer.ts downgrades a technical proof failure to BUILT_WITH_WARNINGS; and the handler's execution monitor records a BLOCKED proof outcome with the same completeStage(...) call used for a genuine pass. No module reconciles these into one authoritative pass/fail.

**Related stages:** LIVE_PREVIEW_PROOF, RUNTIME_ACTIVATION, FAILURE_REPORTING

**Files responsible:** `src/autonomous-engineering-executive/aee-preview-contract.ts`, `src/build-result-normalizer-v1/build-result-normalizer.ts`, `server/build-from-prompt-handler.ts`, `src/live-preview-gate/live-preview-orchestrator-bridge.ts`

**Functions responsible:** `resolveAeePreviewContract`, `normalizeOnePromptBuildResult`, `handleBuildFromPromptRequest`, `evaluateLivePreviewGateForOrchestrator`

**Evidence:**

  - `src/autonomous-engineering-executive/aee-preview-contract.ts` `resolveAeePreviewContract` (L168-L178) — routeProbe.ok true -> previewStatus = "UNLOCKED" (or "DEGRADED" if interactionVerificationFailed), synthesizing a gate override.
  - `src/build-result-normalizer-v1/build-result-normalizer.ts` `normalizeOnePromptBuildResult` (L107-L134) — interactionProofFoundAProblem -> result = "BUILT_WITH_WARNINGS" rather than a failed/blocked classification.
  - `server/build-from-prompt-handler.ts` `handleBuildFromPromptRequest` (L72-L77) — PREVIEW_INTERACTION_BLOCKED is routed through monitor.completeStage(...), identical call path to a real pass.

## 11. Missing Engine Authorities

### MA01-NO-EXPLICIT-NEW-BUILD-SIGNAL — No explicit, unambiguous "this is a new build" signal or function exists

A repository-wide search for isNewBuild/detectNewBuild/clearContext-style symbols returns nothing. Fresh-build semantics are expressed indirectly through confirmFreshCopy, forceFreshProject, and confirmProjectResume flags that different callers set (or fail to set) inconsistently. There is no single authority function whose job is to answer "is this prompt starting a new app, or continuing an existing one?" and whose answer every downstream stage is required to honor.

**Evidence:**

  - `src/chat-to-build-execution-bridge-v1/bridge-authority.ts` `executeChatToBuildBridge` — confirmFreshCopy, forceFreshProject, confirmProjectResume are all recognized but are optional inputs the bridge trusts callers to set correctly; none is derived by the bridge itself from prompt content.

### MA02-NO-CONTRACT-TO-GENERATOR-ENFORCEMENT — No authority enforces that generated modules/routes/contract stay consistent with each other

There is no module whose job is to take the Universal Feature Contract and the approved module plan and either reconcile them or fail the build if they diverge. post-generation-contamination-validator.ts checks generated workspace folders against the approved module plan, but does not compare either of those against the Universal Feature Contract's entities/actions.

**Evidence:**

  - `src/prompt-bounded-materialization/post-generation-contamination-validator.ts` `validatePostGenerationContamination` (L37-L41) — Validates workspace folders vs. plan.approvedModuleIds only; contract entities are out of scope for this validator.

### MA03-NO-PRE-MATERIALIZATION-FAITHFULNESS-AUTHORITY — No production authority runs faithfulness/contract checks before materialization, despite one being designed

runGenerationGate exists specifically to run before materialization and can return proceed: false, but nothing in the production build path calls it (see F13). There is no pre-materialization checkpoint at all between "module plan resolved" and "files written to disk."

**Evidence:**

  - `src/product-faithfulness-v2/index.ts` `runGenerationGate` (L76-L96) — runGenerationGate has zero production callers; only a validation script invokes it.

### MA04-NO-SINGLE-FAILURE-ARBITER — No single module owns the final pass/fail verdict for a build

BuildExecutionMonitor is a passive recorder. The build-execution-stabilizer's enforcement functions are unused in production. ASE, AEE, the live-preview gate, and the post-build normalizer each hold a partial, independently-computed opinion about success, and at least one (AEE's preview contract) can override another (the live-preview gate) using different evidence (a route probe vs. interaction/visual proof). No module sits above all of them to produce one authoritative, non-overridable verdict.

**Evidence:**

  - `src/autonomous-engineering-executive/aee-preview-contract.ts` `resolveAeePreviewContract` (L168-L178) — Can synthesize a gate override (synthesizeGateForUnlock) rather than deferring to the gate's own blocked state.

### MA05-NO-ACTIVITY-BASED-STALL-DETECTION-IN-RUNTIME-ACTIVATION — No activity-based (only wall-clock) stall detection for dev-server startup and browser-based proof

startGeneratedAppDevServer's only failure-by-time mechanism is a flat 45s timer; there is no "no stdout activity for N seconds" stall detector of the kind build-execution-stabilizer.ts implements elsewhere (and does not wire in here). chromium.launch() in the Playwright proof runner has no timeout at all. Both are single points where a hang can consume the full available time budget (or more) before any failure is reported.

**Evidence:**

  - `src/one-prompt-live-preview/generated-dev-server-manager.ts` `startGeneratedAppDevServer` (L174-L179) — Single setTimeout(..., input.timeoutMs) is the only time-based failure path; no lastActivity/stall tracking like build-execution-stabilizer.ts has.

## 12. Recommended Fix Sequence

This audit does not implement any of the following. Sequencing rationale only.

1. **Establish one explicit, mandatory new-build-vs-continuation decision authority**
   - Rationale: Every other stale-context finding (F01-F04) is downstream of the fact that "is this a new app?" is currently inferred inconsistently by several independent call sites instead of decided once, explicitly, by one authority that all callers must consult.
   - Addresses: F01-ACTIVE-PROJECT-FALLBACK, F02-NEW-PROMPT-NO-FRESH-SIGNAL, F03-AUTO-RESUME-DUPLICATE-DEFAULT-ON

2. **Remove the activeProjectId fallback from project context resolution (require an explicit id or explicit fresh-build intent)**
   - Rationale: Directly closes the highest-severity isolation gap: a request with no projectId should never silently attach to whichever project was last active in the process.
   - Addresses: F01-ACTIVE-PROJECT-FALLBACK

3. **Replace keyword/metadata accumulation with per-build replacement, scoped strictly to the current prompt**
   - Rationale: F04 and F05 both stem from the same anti-pattern (union/merge instead of replace, or missing scoping). Fixing the merge semantics once, as a shared rule, prevents both.
   - Addresses: F04-METADATA-KEYWORD-ACCUMULATION, F05-EVOLUTION-REGISTRY-NOT-PROJECT-SCOPED

4. **Wire the canonical product contract into module selection and require the module generator to consume it**
   - Rationale: This is the structural fix for contract drift (F09-F11): make the contract and the generator share one source of truth instead of two independently-derived artifacts.
   - Addresses: F09-CONTRACT-INDEPENDENT-OF-MODULE-PLAN, F10-GENERATOR-IGNORES-CONTRACT, F11-CONTRACT-PROFILE-MISMATCH

5. **Require prompt-derived evidence for every candidate before it is added to the module pool, not just before it is approved**
   - Rationale: F06-F08 show that unconditional seeding happens upstream of the (already evidence-gated) resolver. Moving the evidence requirement earlier — into the collectors themselves — removes the need to rely on the resolver to catch every case.
   - Addresses: F06-UNCONDITIONAL-DASHBOARD-SEED, F07-PROFILE-MAP-FIXED-LISTS, F08-PERSISTENCE-ALWAYS-ON

6. **Wire runGenerationGate (or an equivalent pre-materialization contract check) into the real build path**
   - Rationale: Converts faithfulness from purely detective (F12, F13) to preventive, using code that already exists but is currently unreachable from production traffic.
   - Addresses: F12-FAITHFULNESS-POST-BUILD-ONLY, F13-GENERATION-GATE-UNWIRED

7. **Give "repair" a real regeneration path, or rename/relabel it so it is not mistaken for one**
   - Rationale: F14/F15 show repair is currently cosmetic. Either connect REGENERATE_FEATURE_MODULE actions to an actual regeneration call, or stop calling the outcome "repair" in user-facing labels until it can perform one.
   - Addresses: F14-REPAIR-IS-IN-MEMORY-ONLY, F15-REPAIR-RELABELS-NOT-RETRIES

8. **Wire the existing build-execution-stabilizer enforcement into the orchestrator's actual npm/dev-server/proof calls, and add a .catch() to the dev-server startup IIFE**
   - Rationale: F16-F18 are all "policy exists, enforcement does not reach production." This is the lowest-risk, highest-clarity fix in the runtime-activation area because the enforcement code (runMonitoredCommand/runMonitoredPoll) already exists and is already tested elsewhere.
   - Addresses: F16-DEV-SERVER-UNCAUGHT-ASYNC, F17-INTERACTION-PROOF-NO-MATERIALIZATION-PRECHECK, F18-STABILIZER-TIMEOUTS-NOT-ENFORCED-IN-PRODUCTION

9. **Designate one module as the final, non-overridable build-success arbiter and make every other verdict advisory input to it**
   - Rationale: Without this, fixing individual verdict-producers (steps 1-8) will keep leaving room for a different module to silently override or contradict the fix. This should be the last step so it can take the corrected verdict sources from steps 1-8 as its inputs.
   - Addresses: F19-FRAGMENTED-PREVIEW-VERDICTS

## 13. Risk Ranking

| Finding | Risk | Justification |
|---|---|---|
| F01-ACTIVE-PROJECT-FALLBACK | CRITICAL | Silently attaches a request with no projectId to an unrelated prior project; affects every "new app, no id supplied" request path. |
| F02-NEW-PROMPT-NO-FRESH-SIGNAL | CRITICAL | The primary user-facing "start a new app" affordance does not actually assert freshness to the server; this is the most direct explanation for the reported symptom. |
| F09-CONTRACT-INDEPENDENT-OF-MODULE-PLAN | CRITICAL | Guarantees the two artifacts meant to describe "what this app is" (contract vs. generated modules) can disagree on every custom-domain build, with no detection until post-build faithfulness audit runs. |
| F12-FAITHFULNESS-POST-BUILD-ONLY | CRITICAL | The one system designed to catch product mismatch runs only after all generation work (and cost) has already been spent, and has no path back into generation. |
| F14-REPAIR-IS-IN-MEMORY-ONLY | CRITICAL | "Repair" is the term most likely to be trusted by an operator watching a build; discovering it never touches files undermines confidence in every reported repair outcome. |
| F03-AUTO-RESUME-DUPLICATE-DEFAULT-ON | HIGH | Loose domain-overlap matching (>=0.55) plus default-on auto-resume is a second, independent path to the same stale-concept symptom, even when F01/F02 are fixed. |
| F06-UNCONDITIONAL-DASHBOARD-SEED | HIGH | Unconditional seeding happens before the evidence gate, meaning the gate is trusted to catch 100% of cases with no defense in depth. |
| F10-GENERATOR-IGNORES-CONTRACT | HIGH | Removes any possibility of the generator self-correcting toward the contract even if the contract were fixed first; both sides of F09 must be fixed together. |
| F13-GENERATION-GATE-UNWIRED | HIGH | A preventive mechanism already built and tested (in isolation) sits unused; wiring it is lower-risk than building new prevention from scratch. |
| F15-REPAIR-RELABELS-NOT-RETRIES | HIGH | Produces a user-facing label ("repaired") that overstates what happened, which can suppress legitimate follow-up investigation. |
| F16-DEV-SERVER-UNCAUGHT-ASYNC | HIGH | A genuine unbounded-hang path in the runtime-activation stage, distinct from the (bounded) 45s timeout path. |
| F18-STABILIZER-TIMEOUTS-NOT-ENFORCED-IN-PRODUCTION | HIGH | Existing, tested enforcement code is not reachable from the production orchestrator, so timeout policy documented in one file does not match behavior in another. |
| F19-FRAGMENTED-PREVIEW-VERDICTS | HIGH | Multiple authorities can each declare a different "did the preview work" answer for the same build, with an override path that favors the weaker (route-probe-only) evidence. |
| F04-METADATA-KEYWORD-ACCUMULATION | MEDIUM | Contributes to identity drift over multiple rebuilds of the same project id, slower-acting than F01-F03. |
| F05-EVOLUTION-REGISTRY-NOT-PROJECT-SCOPED | MEDIUM | Cross-project capability reuse without project scoping; likely lower frequency than context/module findings but same category of isolation gap. |
| F07-PROFILE-MAP-FIXED-LISTS | MEDIUM | Mitigated somewhat by the evidence gate blocking PROFILE_FALLBACK by default; risk concentrates on the PROJECT_MANAGEMENT_WEB_V1 auto-allow exception. |
| F11-CONTRACT-PROFILE-MISMATCH | MEDIUM | Narrower than F09/F10 — only triggers when input.profile and materializationProfile diverge for the same build. |
| F17-INTERACTION-PROOF-NO-MATERIALIZATION-PRECHECK | MEDIUM | Produces a slower, less-diagnostic failure rather than a silent one — the proof engine does eventually classify and report the failure. |
| F08-PERSISTENCE-ALWAYS-ON | LOW | Infrastructure-only module id; does not by itself introduce a user-visible wrong concept. |

## 14. Exact Files/Functions Likely Responsible

| File | Functions |
|---|---|
| `public/founder-reality/builder-home.js` | `executeChatToBuildBridge`, `newPrompt` |
| `server/build-from-prompt-handler.ts` | `evaluateGenerationFaithfulnessForBuild`, `evaluateLivePreviewGateForOrchestrator`, `evaluateProductFaithfulnessForBuild`, `handleBuildFromPromptRequest`, `normalizeOnePromptBuildResult`, `resolveAeePreviewContract` |
| `src/autonomous-engineering-executive/aee-preview-contract.ts` | `evaluateLivePreviewGateForOrchestrator`, `handleBuildFromPromptRequest`, `normalizeOnePromptBuildResult`, `resolveAeePreviewContract` |
| `src/build-execution-stabilizer-v1/build-execution-stabilizer.ts` | `runMonitoredCommand`, `runMonitoredPoll`, `runOnePromptLivePreviewBuild` |
| `src/build-execution-stabilizer-v1/build-execution-timeouts.ts` | `runMonitoredCommand`, `runMonitoredPoll`, `runOnePromptLivePreviewBuild` |
| `src/build-result-normalizer-v1/build-result-normalizer-adapter.ts` | `evaluateGenerationFaithfulnessForBuild`, `evaluateProductFaithfulnessForBuild`, `handleBuildFromPromptRequest` |
| `src/build-result-normalizer-v1/build-result-normalizer.ts` | `evaluateLivePreviewGateForOrchestrator`, `handleBuildFromPromptRequest`, `isSeriousFaithfulnessProblem`, `normalizeOnePromptBuildResult`, `resolveAeePreviewContract` |
| `src/chat-to-build-execution-bridge-v1/bridge-authority.ts` | `executeChatToBuildBridge`, `newPrompt`, `routeDuplicateProjectResume`, `shouldAutoContinueDuplicate` |
| `src/live-preview-gate/live-preview-orchestrator-bridge.ts` | `evaluateLivePreviewGateForOrchestrator`, `handleBuildFromPromptRequest`, `normalizeOnePromptBuildResult`, `resolveAeePreviewContract` |
| `src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts` | `runLivePreviewInteractionProof` |
| `src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts` | `evolvedRegistry`, `reuseIndex` |
| `src/one-prompt-live-preview/generated-dev-server-manager.ts` | `startGeneratedAppDevServer` |
| `src/one-prompt-live-preview/one-prompt-build-orchestrator.ts` | `runMonitoredCommand`, `runMonitoredPoll`, `runOnePromptLivePreviewBuild` |
| `src/one-prompt-live-preview/workspace-tab-registry.ts` | `hydrateWorkspaceSessions`, `resolveProjectContext`, `setActiveProjectId` |
| `src/product-faithfulness-v1/product-faithfulness-verdict.ts` | `isSeriousFaithfulnessProblem`, `normalizeOnePromptBuildResult` |
| `src/product-faithfulness-v2/generation-faithfulness-repair.ts` | `applyMinimalRepairs`, `repairAndReaudit` |
| `src/product-faithfulness-v2/index.ts` | `runGenerationGate` |
| `src/project-context-alignment-v1/project-context-metadata-store.ts` | `getProjectContextMetadata`, `upsertProjectContextMetadata` |
| `src/project-registry-v1/project-registry-v1-store.ts` | `hydrateWorkspaceSessions`, `resolveProjectContext`, `setActiveProjectId` |
| `src/project-resume-state/duplicate-project-resume-router.ts` | `executeChatToBuildBridge`, `routeDuplicateProjectResume`, `shouldAutoContinueDuplicate` |
| `src/prompt-bounded-materialization/module-candidate-collector.ts` | `collectProfileModuleCandidates`, `collectSystemShellCandidates`, `getProfileFeatureDefinition`, `projectManagementProfileAllowsModule` |
| `src/prompt-faithful-generation/prompt-module-name-normalizer.ts` | `deriveGenericCustomFeatureModules`, `sanitizeModuleIds` |
| `src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts` | `buildProfileContract`, `buildUniversalFeatureContract`, `buildUniversalMaterializedWorkspaceFiles` |
| `src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts` | `buildAllModularFeatureModuleFiles` |
| `src/universal-prompt-to-app-materialization/profile-feature-map.ts` | `collectProfileModuleCandidates`, `getProfileFeatureDefinition`, `projectManagementProfileAllowsModule` |
| `src/universal-prompt-to-app-materialization/prompt-app-metadata.ts` | `deriveGenericCustomFeatureModules`, `sanitizeModuleIds` |
| `src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts` | `buildProfileContract`, `buildUniversalFeatureContract`, `buildUniversalMaterializedWorkspaceFiles` |

## 15. Evidence Index (per finding)

- **F01-ACTIVE-PROJECT-FALLBACK** (2 citations): `src/one-prompt-live-preview/workspace-tab-registry.ts`, `src/project-registry-v1/project-registry-v1-store.ts`
- **F02-NEW-PROMPT-NO-FRESH-SIGNAL** (2 citations): `public/founder-reality/builder-home.js`, `src/chat-to-build-execution-bridge-v1/bridge-authority.ts`
- **F03-AUTO-RESUME-DUPLICATE-DEFAULT-ON** (3 citations): `src/chat-to-build-execution-bridge-v1/bridge-authority.ts`, `src/chat-to-build-execution-bridge-v1/bridge-authority.ts`, `src/project-resume-state/duplicate-project-resume-router.ts`
- **F04-METADATA-KEYWORD-ACCUMULATION** (1 citation): `src/project-context-alignment-v1/project-context-metadata-store.ts`
- **F05-EVOLUTION-REGISTRY-NOT-PROJECT-SCOPED** (1 citation): `src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts`
- **F06-UNCONDITIONAL-DASHBOARD-SEED** (2 citations): `src/universal-prompt-to-app-materialization/prompt-app-metadata.ts`, `src/prompt-faithful-generation/prompt-module-name-normalizer.ts`
- **F07-PROFILE-MAP-FIXED-LISTS** (2 citations): `src/universal-prompt-to-app-materialization/profile-feature-map.ts`, `src/prompt-bounded-materialization/module-candidate-collector.ts`
- **F08-PERSISTENCE-ALWAYS-ON** (1 citation): `src/prompt-bounded-materialization/module-candidate-collector.ts`
- **F09-CONTRACT-INDEPENDENT-OF-MODULE-PLAN** (2 citations): `src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts`, `src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts`
- **F10-GENERATOR-IGNORES-CONTRACT** (1 citation): `src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts`
- **F11-CONTRACT-PROFILE-MISMATCH** (1 citation): `src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts`
- **F12-FAITHFULNESS-POST-BUILD-ONLY** (2 citations): `server/build-from-prompt-handler.ts`, `src/build-result-normalizer-v1/build-result-normalizer-adapter.ts`
- **F13-GENERATION-GATE-UNWIRED** (1 citation): `src/product-faithfulness-v2/index.ts`
- **F14-REPAIR-IS-IN-MEMORY-ONLY** (2 citations): `src/product-faithfulness-v2/generation-faithfulness-repair.ts`, `src/product-faithfulness-v2/generation-faithfulness-repair.ts`
- **F15-REPAIR-RELABELS-NOT-RETRIES** (2 citations): `src/build-result-normalizer-v1/build-result-normalizer.ts`, `src/product-faithfulness-v1/product-faithfulness-verdict.ts`
- **F16-DEV-SERVER-UNCAUGHT-ASYNC** (1 citation): `src/one-prompt-live-preview/generated-dev-server-manager.ts`
- **F17-INTERACTION-PROOF-NO-MATERIALIZATION-PRECHECK** (1 citation): `src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts`
- **F18-STABILIZER-TIMEOUTS-NOT-ENFORCED-IN-PRODUCTION** (2 citations): `src/build-execution-stabilizer-v1/build-execution-timeouts.ts`, `src/build-execution-stabilizer-v1/build-execution-monitor.ts`
- **F19-FRAGMENTED-PREVIEW-VERDICTS** (3 citations): `src/autonomous-engineering-executive/aee-preview-contract.ts`, `src/build-result-normalizer-v1/build-result-normalizer.ts`, `server/build-from-prompt-handler.ts`

## Guarantees



- No app-specific fixes implemented: true
- No product domains hardcoded into behavior: true
- No existing generation behavior modified: true
- No validators weakened: true



Pass token: `APP_GENERATION_READINESS_AUDIT_V1_PASS`