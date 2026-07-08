/**
 * App Generation Readiness Audit V1 — findings, missing authorities, fix sequence, risk ranking.
 *
 * Split out from app-generation-readiness-audit.ts purely for file-size readability. Same rules
 * apply: read-only, evidence-cited, no product-domain branching, no calls into the generation
 * pipeline.
 */

import type { Finding, FixSequenceStep, MissingAuthority, RiskRankEntry } from './app-generation-readiness-audit-types.js';

function ev(file: string, note: string, function_?: string, lines?: string) {
  return { file, function: function_, lines, note };
}

/* ------------------------------------------------------------------------------------------
 * 5-10. Findings by category.
 * ---------------------------------------------------------------------------------------- */

export const FINDINGS: Finding[] = [
  {
    id: 'F01-ACTIVE-PROJECT-FALLBACK',
    category: 'PROJECT_CONTEXT_ISOLATION',
    severity: 'CRITICAL',
    title: 'Project context resolution falls back to a process-wide "active project" when a request omits projectId',
    summary:
      'resolveProjectContext() only mints a fresh project when the caller supplies neither a known projectId nor a still-registered activeProjectId. Any client call that omits projectId (which the "new prompt" UI flow does) is silently attached to whatever project happened to be active last, in this process, for any user of this server instance.',
    relatedStages: ['PROJECT_CONTEXT_RESOLUTION', 'PROMPT_RESET_NEW_BUILD_DETECTION'],
    evidence: [
      ev('src/one-prompt-live-preview/workspace-tab-registry.ts', 'requestedId is checked first; if absent, activeProjectId (a single module-level variable) is reused if it still has a session.', 'resolveProjectContext', 'L64-L93'),
      ev('src/project-registry-v1/project-registry-v1-store.ts', 'activeProjectId is also re-set from disk on registry hydration, so this fallback persists across server restarts, not just within one process lifetime.', 'hydrateWorkspaceSessions', 'L199-L207'),
    ],
    filesResponsible: ['src/one-prompt-live-preview/workspace-tab-registry.ts', 'src/project-registry-v1/project-registry-v1-store.ts'],
    functionsResponsible: ['resolveProjectContext', 'hydrateWorkspaceSessions', 'setActiveProjectId'],
  },
  {
    id: 'F02-NEW-PROMPT-NO-FRESH-SIGNAL',
    category: 'STALE_CONTEXT_CONTAMINATION',
    severity: 'CRITICAL',
    title: '"New prompt" in the client UI does not tell the server to start a fresh project',
    summary:
      'The builder UI\'s newPrompt() handler clears local state and prompt text, and its own comment claims it starts a "fresh project on next build" — but the next build request it sends carries no confirmFreshCopy flag and no explicit signal distinguishing "new app" from "continue previous app". The server has no way to tell these two intents apart from this call alone.',
    relatedStages: ['PROMPT_RESET_NEW_BUILD_DETECTION', 'PROJECT_CONTEXT_RESOLUTION'],
    evidence: [
      ev('public/founder-reality/builder-home.js', 'newPrompt() clears projectId client-side; the click handler then calls runBuild(prompt, { projectId: state.projectId || undefined }) with no other flags.', 'newPrompt', 'L1110-L1135'),
      ev('src/chat-to-build-execution-bridge-v1/bridge-authority.ts', 'confirmFreshCopy is a recognized bridge input, but nothing in the "new prompt" client path ever sets it to true.', 'executeChatToBuildBridge'),
    ],
    filesResponsible: ['public/founder-reality/builder-home.js', 'src/chat-to-build-execution-bridge-v1/bridge-authority.ts'],
    functionsResponsible: ['newPrompt', 'executeChatToBuildBridge'],
  },
  {
    id: 'F03-AUTO-RESUME-DUPLICATE-DEFAULT-ON',
    category: 'STALE_CONTEXT_CONTAMINATION',
    severity: 'HIGH',
    title: 'Duplicate/near-duplicate project auto-resume is on by default and matches on loose domain overlap',
    summary:
      'shouldAutoContinueDuplicate() treats every request as eligible for silent resume unless the caller explicitly opts out with rejectDuplicates: true, which the primary UI flow does not do. The resume router matches an incomplete prior project whenever a domain-overlap score of 0.55+ is reached (or a name substring match), which is loose enough that a genuinely different new prompt sharing a few domain keywords with an old, unfinished project can be silently routed onto that old project\'s workspace, contract, and generated files.',
    relatedStages: ['PROMPT_RESET_NEW_BUILD_DETECTION', 'PROJECT_CONTEXT_RESOLUTION', 'PRODUCT_IDENTITY_PRESERVATION'],
    evidence: [
      ev('src/chat-to-build-execution-bridge-v1/bridge-authority.ts', 'shouldAutoContinueDuplicate returns input.rejectDuplicates !== true — default is to auto-continue.', 'shouldAutoContinueDuplicate', 'L134-L136'),
      ev('src/chat-to-build-execution-bridge-v1/bridge-authority.ts', 'effectiveProjectId is overwritten with resumeRoute.resumingProjectId whenever auto-continue is allowed and the router flags a block.', 'executeChatToBuildBridge', 'L268-L270'),
      ev('src/project-resume-state/duplicate-project-resume-router.ts', 'domainScore >= 0.55 (or a name-substring match) is sufficient to classify a candidate as SIMILAR_DOMAIN and route to it.', 'routeDuplicateProjectResume', 'L154-L165'),
    ],
    filesResponsible: ['src/chat-to-build-execution-bridge-v1/bridge-authority.ts', 'src/project-resume-state/duplicate-project-resume-router.ts'],
    functionsResponsible: ['shouldAutoContinueDuplicate', 'executeChatToBuildBridge', 'routeDuplicateProjectResume'],
  },
  {
    id: 'F04-METADATA-KEYWORD-ACCUMULATION',
    category: 'STALE_CONTEXT_CONTAMINATION',
    severity: 'MEDIUM',
    title: 'Project context metadata merges keywords across builds instead of replacing them per prompt',
    summary:
      'upsertProjectContextMetadata unions new domain keywords into the existing keyword array for a projectId rather than replacing the array with the current prompt\'s signals. Alignment scoring then reads this accumulated superset, so a project\'s "domain identity" is effectively the union of every prompt ever submitted under that id, including domains the user has since moved away from.',
    relatedStages: ['PRODUCT_IDENTITY_PRESERVATION', 'PROJECT_CONTEXT_RESOLUTION'],
    evidence: [
      ev('src/project-context-alignment-v1/project-context-metadata-store.ts', 'domainIds = [...new Set([...(existing?.keywords ?? []), ...nameSignals.domainIds, ...(promptSignals?.domainIds ?? [])])] — existing keywords are always kept.', 'upsertProjectContextMetadata', 'L77-L89'),
    ],
    filesResponsible: ['src/project-context-alignment-v1/project-context-metadata-store.ts'],
    functionsResponsible: ['upsertProjectContextMetadata', 'getProjectContextMetadata'],
  },
  {
    id: 'F05-EVOLUTION-REGISTRY-NOT-PROJECT-SCOPED',
    category: 'STALE_CONTEXT_CONTAMINATION',
    severity: 'MEDIUM',
    title: 'Missing-capability evolution registry is process-global, not project-scoped',
    summary:
      'evolvedRegistry/reuseIndex in the missing-capability evolution engine are not keyed by projectId. A capability "evolved" for one product can be silently reused while building a completely unrelated product in the same process lifetime.',
    relatedStages: ['PLANNING'],
    evidence: [ev('src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts', 'Registry map has no projectId key in its type or lookup path.', 'evolvedRegistry')],
    filesResponsible: ['src/missing-capability-evolution-engine/missing-capability-evolution-registry.ts'],
    functionsResponsible: ['evolvedRegistry', 'reuseIndex'],
  },
  {
    id: 'F06-UNCONDITIONAL-DASHBOARD-SEED',
    category: 'FALLBACK_MODULE_CONTAMINATION',
    severity: 'HIGH',
    title: 'Generic custom-app module derivation unconditionally seeds "dashboard" (and pads with "records"/"settings")',
    summary:
      'deriveGenericCustomFeatureModules starts every custom-domain build\'s candidate set with "dashboard" unconditionally, and adds "records" and "settings" whenever the prompt yields two or fewer distinct modules. These are candidates fed into the evidence-gated resolver, but the seeding itself has no prompt-evidence requirement — it happens before the gate runs, so the gate\'s exemptions (e.g. treating "dashboard"/"settings" as allowed infrastructure ids in prompt-module-name-normalizer.ts) let them straight through even for prompts that never mentioned a dashboard.',
    relatedStages: ['MODULE_SELECTION'],
    evidence: [
      ev('src/universal-prompt-to-app-materialization/prompt-app-metadata.ts', 'const modules = new Set<string>(["dashboard"]); — added before any prompt-term evaluation.', 'deriveGenericCustomFeatureModules', 'L118-L139'),
      ev('src/prompt-faithful-generation/prompt-module-name-normalizer.ts', 'allowInfrastructure defaults to ["auth", "dashboard", "settings", "persistence"], so these ids bypass BANNED_FALLBACK_MODULES rejection during sanitization.', 'sanitizeModuleIds', 'L177'),
    ],
    filesResponsible: ['src/universal-prompt-to-app-materialization/prompt-app-metadata.ts', 'src/prompt-faithful-generation/prompt-module-name-normalizer.ts'],
    functionsResponsible: ['deriveGenericCustomFeatureModules', 'sanitizeModuleIds'],
  },
  {
    id: 'F07-PROFILE-MAP-FIXED-LISTS',
    category: 'FALLBACK_MODULE_CONTAMINATION',
    severity: 'MEDIUM',
    title: 'Fixed per-profile module lists (PROFILE_FEATURE_MAP) enter the candidate pool as PROFILE_FALLBACK, and some profiles auto-allow a subset',
    summary:
      'Every non-GENERIC_CUSTOM/HABIT_TRACKER profile returns its complete, hardcoded featureModules array from PROFILE_FEATURE_MAP. These become PROFILE_FALLBACK-origin candidates, which the resolver blocks by default — but PROJECT_MANAGEMENT_WEB_V1 has an explicit auto-allow path (projectManagementProfileAllowsModule) that lets a fixed subset through without prompt evidence. Wrong profile selection upstream (architecture/profile ranking) therefore has an outsized effect: it changes which fixed module list even enters consideration.',
    relatedStages: ['MODULE_SELECTION', 'ARCHITECTURE_GENERATION'],
    evidence: [
      ev('src/universal-prompt-to-app-materialization/profile-feature-map.ts', 'PROFILE_FEATURE_MAP contains a full hardcoded featureModules array per profile (e.g. TASK_TRACKER_WEB_V1: auth, dashboard, tasks, projects, labels, calendar, reports, settings, persistence).', 'PROFILE_FEATURE_MAP', 'L51-L107'),
      ev('src/prompt-bounded-materialization/module-candidate-collector.ts', 'collectProfileModuleCandidates maps every profile module id to a PROFILE_FALLBACK-origin candidate unconditionally.', 'collectProfileModuleCandidates', 'L53-L73'),
    ],
    filesResponsible: ['src/universal-prompt-to-app-materialization/profile-feature-map.ts', 'src/prompt-bounded-materialization/module-candidate-collector.ts'],
    functionsResponsible: ['getProfileFeatureDefinition', 'collectProfileModuleCandidates', 'projectManagementProfileAllowsModule'],
  },
  {
    id: 'F08-PERSISTENCE-ALWAYS-ON',
    category: 'FALLBACK_MODULE_CONTAMINATION',
    severity: 'LOW',
    title: 'System-shell candidate collector always adds "persistence" for non-utility prompts',
    summary:
      'collectSystemShellCandidates adds "persistence" unconditionally for any prompt not classified as a simple utility app, and adds "auth" only when the prompt explicitly requires login. "persistence" is infrastructure, not a user-visible concept, so this is lower risk than F06/F07, but it does mean the route/definition list always contains at least one entry ("persistence") with no corresponding generated feature folder (see F09).',
    relatedStages: ['MODULE_SELECTION'],
    evidence: [ev('src/prompt-bounded-materialization/module-candidate-collector.ts', 'const modules: string[] = ["persistence"]; unshift("auth") only if promptExplicitlyRequiresAuth.', 'collectSystemShellCandidates', 'L124-L131')],
    filesResponsible: ['src/prompt-bounded-materialization/module-candidate-collector.ts'],
    functionsResponsible: ['collectSystemShellCandidates'],
  },
  {
    id: 'F09-CONTRACT-INDEPENDENT-OF-MODULE-PLAN',
    category: 'CONTRACT_DRIFT',
    severity: 'CRITICAL',
    title: 'Universal Feature Contract is built from a fixed profile template, independent of the approved module plan',
    summary:
      'buildUniversalFeatureContract selects its entity/action template purely from the resolved profile string (via buildProfileContract), not from definition.featureModules / the bounded module plan that actually drives buildAllModularFeatureModuleFiles. The two systems can therefore describe different products for the same build: the contract can list entities (e.g. "habit") that no generated module implements, or omit entities for modules that were generated. Because buildAllModularFeatureModuleFiles never reads the contract (see F10), there is no reconciliation step anywhere in the pipeline.',
    relatedStages: ['UNIVERSAL_FEATURE_CONTRACT_GENERATION', 'MODULE_SELECTION', 'GENERATED_MODULES'],
    evidence: [
      ev('src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts', 'buildProfileContract keyed only on profile; GENERIC_CUSTOM_APP_V1 and HABIT_TRACKER_WEB_V1 both produce the same "habit" entity/action set regardless of the prompt.', 'buildUniversalFeatureContract', 'L543-L580'),
      ev('src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts', 'Contract build call and module-generator call are two separate, unlinked steps in the same function.', 'buildUniversalMaterializedWorkspaceFiles', 'L74-L87'),
    ],
    filesResponsible: ['src/universal-feature-contract-intelligence/universal-feature-contract-builder.ts', 'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts'],
    functionsResponsible: ['buildUniversalFeatureContract', 'buildProfileContract', 'buildUniversalMaterializedWorkspaceFiles'],
  },
  {
    id: 'F10-GENERATOR-IGNORES-CONTRACT',
    category: 'CONTRACT_DRIFT',
    severity: 'HIGH',
    title: 'Feature-module code generation never reads the Universal Feature Contract',
    summary:
      'buildAllModularFeatureModuleFiles takes a ProfileFeatureDefinition (module id list + routes) and never receives or reads the UniversalFeatureContract object at all. The contract is written to universal-feature-contract.json purely as a side artifact of the materialization engine, with no code path feeding it back into what gets generated.',
    relatedStages: ['GENERATED_MODULES', 'UNIVERSAL_FEATURE_CONTRACT_GENERATION'],
    evidence: [ev('src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts', 'Function signature is (appTitle: string, definition: ProfileFeatureDefinition) — no contract parameter.', 'buildAllModularFeatureModuleFiles', 'L286-L300')],
    filesResponsible: ['src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts'],
    functionsResponsible: ['buildAllModularFeatureModuleFiles'],
  },
  {
    id: 'F11-CONTRACT-PROFILE-MISMATCH',
    category: 'CONTRACT_DRIFT',
    severity: 'MEDIUM',
    title: 'The contract used for generation and the contract written to disk can be built from different profile values',
    summary:
      'Inside buildUniversalMaterializedWorkspaceFiles, the in-memory contract used elsewhere in materialization is built with profile: materializationProfile, while the JSON file written to the workspace (universal-feature-contract.json) is built with profile: input.profile ?? undefined — a second, independent call that is not guaranteed to resolve to the same profile.',
    relatedStages: ['UNIVERSAL_FEATURE_CONTRACT_GENERATION', 'MATERIALIZATION_MANIFEST'],
    evidence: [ev('src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts', 'Two separate buildUniversalFeatureContract(...)/buildUniversalFeatureContractJson(...) calls with independently-sourced profile values.', 'buildUniversalMaterializedWorkspaceFiles', 'L74-L183')],
    filesResponsible: ['src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts'],
    functionsResponsible: ['buildUniversalMaterializedWorkspaceFiles'],
  },
  {
    id: 'F12-FAITHFULNESS-POST-BUILD-ONLY',
    category: 'FAITHFULNESS_LATE_DETECTION',
    severity: 'CRITICAL',
    title: 'Product/generation faithfulness evaluation runs only after the build and interaction proof complete',
    summary:
      'evaluateProductFaithfulness and runGenerationFaithfulnessAudit (via evaluateProductFaithfulnessForBuild / evaluateGenerationFaithfulnessForBuild) are called from server/build-from-prompt-handler.ts strictly after runOnePromptLivePreviewBuild returns and after runInteractionProofForBuild finishes. Neither function, nor any function that calls them, is invoked anywhere inside one-prompt-build-orchestrator.ts, the code-generation engine, or the module resolver. By the time a mismatch is detected, the app has already been fully materialized, npm-installed, built, and preview-activated.',
    relatedStages: ['PRODUCT_FAITHFULNESS_EVALUATION', 'CANONICAL_PRODUCT_CONTRACT_CREATION'],
    evidence: [
      ev('server/build-from-prompt-handler.ts', 'Evaluation calls occur after "const livePreviewInteractionProof = await runInteractionProofForBuild(result);" in the same function body.', 'handleBuildFromPromptRequest', 'L210-L230'),
      ev('src/build-result-normalizer-v1/build-result-normalizer-adapter.ts', 'Module comment: "Builds the Product Faithfulness evidence bundle from real, already-computed build evidence only."', 'evaluateGenerationFaithfulnessForBuild', 'L32-L36'),
    ],
    filesResponsible: ['server/build-from-prompt-handler.ts', 'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts'],
    functionsResponsible: ['handleBuildFromPromptRequest', 'evaluateProductFaithfulnessForBuild', 'evaluateGenerationFaithfulnessForBuild'],
  },
  {
    id: 'F13-GENERATION-GATE-UNWIRED',
    category: 'FAITHFULNESS_LATE_DETECTION',
    severity: 'HIGH',
    title: 'The one function explicitly designed to run before materialization (runGenerationGate) is never called by the production pipeline',
    summary:
      'runGenerationGate\'s own doc comment states it is "intended to run before materialization begins." A repository-wide search shows its only caller is scripts/validate-product-faithfulness-milestone-2.ts. It is not called from the orchestrator, the bridge, or the materialization/code-generation engines. The preventive mechanism exists as an API surface, but production traffic never reaches it.',
    relatedStages: ['PRODUCT_FAITHFULNESS_EVALUATION', 'CANONICAL_PRODUCT_CONTRACT_CREATION', 'MODULE_SELECTION'],
    evidence: [ev('src/product-faithfulness-v2/index.ts', 'proceed: boolean output is never consumed by any generation-path caller.', 'runGenerationGate', 'L76-L96')],
    filesResponsible: ['src/product-faithfulness-v2/index.ts'],
    functionsResponsible: ['runGenerationGate'],
  },
  {
    id: 'F14-REPAIR-IS-IN-MEMORY-ONLY',
    category: 'REPAIR_LIMITATION',
    severity: 'CRITICAL',
    title: 'Generation-faithfulness "repair" patches in-memory evidence and re-audits; it never regenerates a file',
    summary:
      'generation-faithfulness-repair.ts\'s own header states it "never invokes a code-generation engine or LLM." When a concept is missing, applyMinimalRepairs either finds evidence for it elsewhere in already-collected stage evidence (a bookkeeping fix, not a code change) or records a REGENERATE_FEATURE_MODULE action with applied: false and a detail string admitting the module was not actually regenerated. repairAndReaudit re-runs the audit against this patched evidence purely in memory. No repair-path code calls materializeGeneratedApplication or buildAllModularFeatureModuleFiles again.',
    relatedStages: ['PRODUCT_FAITHFULNESS_EVALUATION', 'GENERATED_MODULES'],
    evidence: [
      ev('src/product-faithfulness-v2/generation-faithfulness-repair.ts', 'Header: "this module never invokes a code-generation engine or LLM — so it is recorded as a planned-but-not-applied \'regenerate feature module\' action instead of a fake success."', 'module header', 'L1-L13'),
      ev('src/product-faithfulness-v2/generation-faithfulness-repair.ts', 'applied: false branch explicitly states the concept "would require regenerating its feature module — not applied by this evaluation-time repair."', 'applyMinimalRepairs', 'L68-L92'),
    ],
    filesResponsible: ['src/product-faithfulness-v2/generation-faithfulness-repair.ts'],
    functionsResponsible: ['applyMinimalRepairs', 'repairAndReaudit'],
  },
  {
    id: 'F15-REPAIR-RELABELS-NOT-RETRIES',
    category: 'REPAIR_LIMITATION',
    severity: 'HIGH',
    title: 'A successful in-memory "repair" only changes the result label on an already-finished build',
    summary:
      'When any in-memory repair action has applied: true, build-result-normalizer.ts relabels the finished build\'s normalized result as BUILT_AFTER_FAITHFULNESS_REPAIR. The app itself — the files on disk, the running dev server, the live preview — is completely unchanged by this relabeling. Separately, isSeriousFaithfulnessProblem (v1) is exported but has zero callers anywhere in the repository, so a "serious" verdict has no wired consequence.',
    relatedStages: ['PRODUCT_FAITHFULNESS_EVALUATION', 'FAILURE_REPORTING'],
    evidence: [
      ev('src/build-result-normalizer-v1/build-result-normalizer.ts', 'genRepairsApplied -> result = "BUILT_AFTER_FAITHFULNESS_REPAIR" with no accompanying regeneration step.', 'normalizeOnePromptBuildResult', 'L158-L165'),
      ev('src/product-faithfulness-v1/product-faithfulness-verdict.ts', 'isSeriousFaithfulnessProblem is exported but has no callers in the codebase.', 'isSeriousFaithfulnessProblem', 'L10-L20'),
    ],
    filesResponsible: ['src/build-result-normalizer-v1/build-result-normalizer.ts', 'src/product-faithfulness-v1/product-faithfulness-verdict.ts'],
    functionsResponsible: ['normalizeOnePromptBuildResult', 'isSeriousFaithfulnessProblem'],
  },
  {
    id: 'F16-DEV-SERVER-UNCAUGHT-ASYNC',
    category: 'RUNTIME_FAILURE_OWNERSHIP',
    severity: 'HIGH',
    title: 'Dev server startup has an unguarded async IIFE that can leave its promise unsettled',
    summary:
      'startGeneratedAppDevServer wraps its spawn logic in `void (async () => { ... })()` with no attached .catch(). A synchronous throw or rejected await inside that IIFE (e.g. during stopGeneratedDevServerByKey for a pre-existing server) is not converted into a resolved { ok: false } result and is not caught by the 45s timer, which is armed after the async setup runs. This is the clearest single "silently stops responding" path found in the runtime-activation stage.',
    relatedStages: ['RUNTIME_ACTIVATION'],
    evidence: [ev('src/one-prompt-live-preview/generated-dev-server-manager.ts', 'return new Promise((resolve) => { void (async () => { ... })(); }); — inner IIFE has no .catch(), no try/catch wrapping stopGeneratedDevServerByKey + spawn + bindStartupListeners.', 'startGeneratedAppDevServer', 'L236-L264')],
    filesResponsible: ['src/one-prompt-live-preview/generated-dev-server-manager.ts'],
    functionsResponsible: ['startGeneratedAppDevServer'],
  },
  {
    id: 'F17-INTERACTION-PROOF-NO-MATERIALIZATION-PRECHECK',
    category: 'RUNTIME_FAILURE_OWNERSHIP',
    severity: 'MEDIUM',
    title: 'Live preview interaction proof does not verify materialization completeness before loading the page',
    summary:
      'runLivePreviewInteractionProof only checks input.previewUrl and input.devServerRunning before calling chromium and navigating. It has no check that npm install/build actually succeeded or that the expected files/modules exist on disk. If the app is only partially materialized, the proof engine discovers this by loading a broken page and classifying the failure after the fact, inside a 30s total budget, rather than short-circuiting immediately with a clear "materialization incomplete" verdict.',
    relatedStages: ['LIVE_PREVIEW_PROOF', 'MATERIALIZATION_MANIFEST'],
    evidence: [ev('src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts', 'Gate condition is `if (!input.previewUrl || !input.devServerRunning)` only; materializationManifestHints is used solely to derive search terms, not to gate.', 'runLivePreviewInteractionProof', 'L60-L66')],
    filesResponsible: ['src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts'],
    functionsResponsible: ['runLivePreviewInteractionProof'],
  },
  {
    id: 'F18-STABILIZER-TIMEOUTS-NOT-ENFORCED-IN-PRODUCTION',
    category: 'RUNTIME_FAILURE_OWNERSHIP',
    severity: 'HIGH',
    title: 'The build-execution-stabilizer\'s stall/timeout policy is defined but not wired into the production orchestrator',
    summary:
      'DEFAULT_STAGE_STALL_CONFIG defines per-stage stall and total timeouts (including a dedicated PREVIEW_STARTUP: 40s and INTERACTION_PROOF: 30s budget), and runMonitoredCommand/runMonitoredPoll in build-execution-stabilizer.ts implement real stall detection with process-kill-and-fail semantics. But one-prompt-build-orchestrator.ts does not call runMonitoredCommand/runMonitoredPoll anywhere — it uses raw execSync(..., { timeout }) for npm steps and generated-dev-server-manager\'s own independent 45s timer for preview startup (which does not match the stabilizer\'s stated 40s budget). BuildExecutionMonitor itself is explicitly documented as a passive state container with "no timers."',
    relatedStages: ['RUNTIME_ACTIVATION', 'LIVE_PREVIEW_PROOF', 'FAILURE_REPORTING'],
    evidence: [
      ev('src/build-execution-stabilizer-v1/build-execution-timeouts.ts', 'DEFAULT_STAGE_STALL_CONFIG.PREVIEW_STARTUP = { stallTimeoutMs: 20_000, totalTimeoutMs: 40_000 } vs. dev-server-manager\'s own 45_000ms default — the two numbers disagree and only one of them is actually enforced.', 'DEFAULT_STAGE_STALL_CONFIG', 'L10-L20'),
      ev('src/build-execution-stabilizer-v1/build-execution-monitor.ts', '"Pure state container — no process management, no timers." by design; enforcement lives only in build-execution-stabilizer.ts, which the orchestrator does not call.', 'module header', 'L4-L8'),
    ],
    filesResponsible: ['src/build-execution-stabilizer-v1/build-execution-timeouts.ts', 'src/build-execution-stabilizer-v1/build-execution-stabilizer.ts', 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'],
    functionsResponsible: ['runMonitoredCommand', 'runMonitoredPoll', 'runOnePromptLivePreviewBuild'],
  },
  {
    id: 'F19-FRAGMENTED-PREVIEW-VERDICTS',
    category: 'RUNTIME_FAILURE_OWNERSHIP',
    severity: 'HIGH',
    title: 'At least five modules each hold a partial, potentially conflicting verdict on whether the preview is actually working, with no single arbiter',
    summary:
      'The ASE interaction-proof engine decides live-preview-gate unlock during the build; AEE\'s preview contract can override that gate to UNLOCKED purely on an HTTP route probe passing, even when interaction verification failed (downgrading only to DEGRADED); the post-build Playwright interaction proof runs afterward and cannot affect the gate decision already baked into the build result; build-result-normalizer.ts downgrades a technical proof failure to BUILT_WITH_WARNINGS; and the handler\'s execution monitor records a BLOCKED proof outcome with the same completeStage(...) call used for a genuine pass. No module reconciles these into one authoritative pass/fail.',
    relatedStages: ['LIVE_PREVIEW_PROOF', 'RUNTIME_ACTIVATION', 'FAILURE_REPORTING'],
    evidence: [
      ev('src/autonomous-engineering-executive/aee-preview-contract.ts', 'routeProbe.ok true -> previewStatus = "UNLOCKED" (or "DEGRADED" if interactionVerificationFailed), synthesizing a gate override.', 'resolveAeePreviewContract', 'L168-L178'),
      ev('src/build-result-normalizer-v1/build-result-normalizer.ts', 'interactionProofFoundAProblem -> result = "BUILT_WITH_WARNINGS" rather than a failed/blocked classification.', 'normalizeOnePromptBuildResult', 'L107-L134'),
      ev('server/build-from-prompt-handler.ts', 'PREVIEW_INTERACTION_BLOCKED is routed through monitor.completeStage(...), identical call path to a real pass.', 'handleBuildFromPromptRequest', 'L72-L77'),
    ],
    filesResponsible: ['src/autonomous-engineering-executive/aee-preview-contract.ts', 'src/build-result-normalizer-v1/build-result-normalizer.ts', 'server/build-from-prompt-handler.ts', 'src/live-preview-gate/live-preview-orchestrator-bridge.ts'],
    functionsResponsible: ['resolveAeePreviewContract', 'normalizeOnePromptBuildResult', 'handleBuildFromPromptRequest', 'evaluateLivePreviewGateForOrchestrator'],
  },
];

/* ------------------------------------------------------------------------------------------
 * 11. Missing engine authorities.
 * ---------------------------------------------------------------------------------------- */

export const MISSING_AUTHORITIES: MissingAuthority[] = [
  {
    id: 'MA01-NO-EXPLICIT-NEW-BUILD-SIGNAL',
    title: 'No explicit, unambiguous "this is a new build" signal or function exists',
    description:
      'A repository-wide search for isNewBuild/detectNewBuild/clearContext-style symbols returns nothing. Fresh-build semantics are expressed indirectly through confirmFreshCopy, forceFreshProject, and confirmProjectResume flags that different callers set (or fail to set) inconsistently. There is no single authority function whose job is to answer "is this prompt starting a new app, or continuing an existing one?" and whose answer every downstream stage is required to honor.',
    evidence: [ev('src/chat-to-build-execution-bridge-v1/bridge-authority.ts', 'confirmFreshCopy, forceFreshProject, confirmProjectResume are all recognized but are optional inputs the bridge trusts callers to set correctly; none is derived by the bridge itself from prompt content.', 'executeChatToBuildBridge')],
  },
  {
    id: 'MA02-NO-CONTRACT-TO-GENERATOR-ENFORCEMENT',
    title: 'No authority enforces that generated modules/routes/contract stay consistent with each other',
    description:
      'There is no module whose job is to take the Universal Feature Contract and the approved module plan and either reconcile them or fail the build if they diverge. post-generation-contamination-validator.ts checks generated workspace folders against the approved module plan, but does not compare either of those against the Universal Feature Contract\'s entities/actions.',
    evidence: [ev('src/prompt-bounded-materialization/post-generation-contamination-validator.ts', 'Validates workspace folders vs. plan.approvedModuleIds only; contract entities are out of scope for this validator.', 'validatePostGenerationContamination', 'L37-L41')],
  },
  {
    id: 'MA03-NO-PRE-MATERIALIZATION-FAITHFULNESS-AUTHORITY',
    title: 'No production authority runs faithfulness/contract checks before materialization, despite one being designed',
    description:
      'runGenerationGate exists specifically to run before materialization and can return proceed: false, but nothing in the production build path calls it (see F13). There is no pre-materialization checkpoint at all between "module plan resolved" and "files written to disk."',
    evidence: [ev('src/product-faithfulness-v2/index.ts', 'runGenerationGate has zero production callers; only a validation script invokes it.', 'runGenerationGate', 'L76-L96')],
  },
  {
    id: 'MA04-NO-SINGLE-FAILURE-ARBITER',
    title: 'No single module owns the final pass/fail verdict for a build',
    description:
      'BuildExecutionMonitor is a passive recorder. The build-execution-stabilizer\'s enforcement functions are unused in production. ASE, AEE, the live-preview gate, and the post-build normalizer each hold a partial, independently-computed opinion about success, and at least one (AEE\'s preview contract) can override another (the live-preview gate) using different evidence (a route probe vs. interaction/visual proof). No module sits above all of them to produce one authoritative, non-overridable verdict.',
    evidence: [ev('src/autonomous-engineering-executive/aee-preview-contract.ts', 'Can synthesize a gate override (synthesizeGateForUnlock) rather than deferring to the gate\'s own blocked state.', 'resolveAeePreviewContract', 'L168-L178')],
  },
  {
    id: 'MA05-NO-ACTIVITY-BASED-STALL-DETECTION-IN-RUNTIME-ACTIVATION',
    title: 'No activity-based (only wall-clock) stall detection for dev-server startup and browser-based proof',
    description:
      'startGeneratedAppDevServer\'s only failure-by-time mechanism is a flat 45s timer; there is no "no stdout activity for N seconds" stall detector of the kind build-execution-stabilizer.ts implements elsewhere (and does not wire in here). chromium.launch() in the Playwright proof runner has no timeout at all. Both are single points where a hang can consume the full available time budget (or more) before any failure is reported.',
    evidence: [ev('src/one-prompt-live-preview/generated-dev-server-manager.ts', 'Single setTimeout(..., input.timeoutMs) is the only time-based failure path; no lastActivity/stall tracking like build-execution-stabilizer.ts has.', 'startGeneratedAppDevServer', 'L174-L179')],
  },
];

/* ------------------------------------------------------------------------------------------
 * 12. Recommended fix sequence (ordering only — this audit does not implement any of these).
 * ---------------------------------------------------------------------------------------- */

export const FIX_SEQUENCE: FixSequenceStep[] = [
  {
    order: 1,
    title: 'Establish one explicit, mandatory new-build-vs-continuation decision authority',
    rationale: 'Every other stale-context finding (F01-F04) is downstream of the fact that "is this a new app?" is currently inferred inconsistently by several independent call sites instead of decided once, explicitly, by one authority that all callers must consult.',
    addressesFindingIds: ['F01-ACTIVE-PROJECT-FALLBACK', 'F02-NEW-PROMPT-NO-FRESH-SIGNAL', 'F03-AUTO-RESUME-DUPLICATE-DEFAULT-ON'],
  },
  {
    order: 2,
    title: 'Remove the activeProjectId fallback from project context resolution (require an explicit id or explicit fresh-build intent)',
    rationale: 'Directly closes the highest-severity isolation gap: a request with no projectId should never silently attach to whichever project was last active in the process.',
    addressesFindingIds: ['F01-ACTIVE-PROJECT-FALLBACK'],
  },
  {
    order: 3,
    title: 'Replace keyword/metadata accumulation with per-build replacement, scoped strictly to the current prompt',
    rationale: 'F04 and F05 both stem from the same anti-pattern (union/merge instead of replace, or missing scoping). Fixing the merge semantics once, as a shared rule, prevents both.',
    addressesFindingIds: ['F04-METADATA-KEYWORD-ACCUMULATION', 'F05-EVOLUTION-REGISTRY-NOT-PROJECT-SCOPED'],
  },
  {
    order: 4,
    title: 'Wire the canonical product contract into module selection and require the module generator to consume it',
    rationale: 'This is the structural fix for contract drift (F09-F11): make the contract and the generator share one source of truth instead of two independently-derived artifacts.',
    addressesFindingIds: ['F09-CONTRACT-INDEPENDENT-OF-MODULE-PLAN', 'F10-GENERATOR-IGNORES-CONTRACT', 'F11-CONTRACT-PROFILE-MISMATCH'],
  },
  {
    order: 5,
    title: 'Require prompt-derived evidence for every candidate before it is added to the module pool, not just before it is approved',
    rationale: 'F06-F08 show that unconditional seeding happens upstream of the (already evidence-gated) resolver. Moving the evidence requirement earlier — into the collectors themselves — removes the need to rely on the resolver to catch every case.',
    addressesFindingIds: ['F06-UNCONDITIONAL-DASHBOARD-SEED', 'F07-PROFILE-MAP-FIXED-LISTS', 'F08-PERSISTENCE-ALWAYS-ON'],
  },
  {
    order: 6,
    title: 'Wire runGenerationGate (or an equivalent pre-materialization contract check) into the real build path',
    rationale: 'Converts faithfulness from purely detective (F12, F13) to preventive, using code that already exists but is currently unreachable from production traffic.',
    addressesFindingIds: ['F12-FAITHFULNESS-POST-BUILD-ONLY', 'F13-GENERATION-GATE-UNWIRED'],
  },
  {
    order: 7,
    title: 'Give "repair" a real regeneration path, or rename/relabel it so it is not mistaken for one',
    rationale: 'F14/F15 show repair is currently cosmetic. Either connect REGENERATE_FEATURE_MODULE actions to an actual regeneration call, or stop calling the outcome "repair" in user-facing labels until it can perform one.',
    addressesFindingIds: ['F14-REPAIR-IS-IN-MEMORY-ONLY', 'F15-REPAIR-RELABELS-NOT-RETRIES'],
  },
  {
    order: 8,
    title: 'Wire the existing build-execution-stabilizer enforcement into the orchestrator\'s actual npm/dev-server/proof calls, and add a .catch() to the dev-server startup IIFE',
    rationale: 'F16-F18 are all "policy exists, enforcement does not reach production." This is the lowest-risk, highest-clarity fix in the runtime-activation area because the enforcement code (runMonitoredCommand/runMonitoredPoll) already exists and is already tested elsewhere.',
    addressesFindingIds: ['F16-DEV-SERVER-UNCAUGHT-ASYNC', 'F17-INTERACTION-PROOF-NO-MATERIALIZATION-PRECHECK', 'F18-STABILIZER-TIMEOUTS-NOT-ENFORCED-IN-PRODUCTION'],
  },
  {
    order: 9,
    title: 'Designate one module as the final, non-overridable build-success arbiter and make every other verdict advisory input to it',
    rationale: 'Without this, fixing individual verdict-producers (steps 1-8) will keep leaving room for a different module to silently override or contradict the fix. This should be the last step so it can take the corrected verdict sources from steps 1-8 as its inputs.',
    addressesFindingIds: ['F19-FRAGMENTED-PREVIEW-VERDICTS'],
  },
];

/* ------------------------------------------------------------------------------------------
 * 13. Risk ranking.
 * ---------------------------------------------------------------------------------------- */

export const RISK_RANKING: RiskRankEntry[] = [
  { findingId: 'F01-ACTIVE-PROJECT-FALLBACK', risk: 'CRITICAL', justification: 'Silently attaches a request with no projectId to an unrelated prior project; affects every "new app, no id supplied" request path.' },
  { findingId: 'F02-NEW-PROMPT-NO-FRESH-SIGNAL', risk: 'CRITICAL', justification: 'The primary user-facing "start a new app" affordance does not actually assert freshness to the server; this is the most direct explanation for the reported symptom.' },
  { findingId: 'F09-CONTRACT-INDEPENDENT-OF-MODULE-PLAN', risk: 'CRITICAL', justification: 'Guarantees the two artifacts meant to describe "what this app is" (contract vs. generated modules) can disagree on every custom-domain build, with no detection until post-build faithfulness audit runs.' },
  { findingId: 'F12-FAITHFULNESS-POST-BUILD-ONLY', risk: 'CRITICAL', justification: 'The one system designed to catch product mismatch runs only after all generation work (and cost) has already been spent, and has no path back into generation.' },
  { findingId: 'F14-REPAIR-IS-IN-MEMORY-ONLY', risk: 'CRITICAL', justification: '"Repair" is the term most likely to be trusted by an operator watching a build; discovering it never touches files undermines confidence in every reported repair outcome.' },
  { findingId: 'F03-AUTO-RESUME-DUPLICATE-DEFAULT-ON', risk: 'HIGH', justification: 'Loose domain-overlap matching (>=0.55) plus default-on auto-resume is a second, independent path to the same stale-concept symptom, even when F01/F02 are fixed.' },
  { findingId: 'F06-UNCONDITIONAL-DASHBOARD-SEED', risk: 'HIGH', justification: 'Unconditional seeding happens before the evidence gate, meaning the gate is trusted to catch 100% of cases with no defense in depth.' },
  { findingId: 'F10-GENERATOR-IGNORES-CONTRACT', risk: 'HIGH', justification: 'Removes any possibility of the generator self-correcting toward the contract even if the contract were fixed first; both sides of F09 must be fixed together.' },
  { findingId: 'F13-GENERATION-GATE-UNWIRED', risk: 'HIGH', justification: 'A preventive mechanism already built and tested (in isolation) sits unused; wiring it is lower-risk than building new prevention from scratch.' },
  { findingId: 'F15-REPAIR-RELABELS-NOT-RETRIES', risk: 'HIGH', justification: 'Produces a user-facing label ("repaired") that overstates what happened, which can suppress legitimate follow-up investigation.' },
  { findingId: 'F16-DEV-SERVER-UNCAUGHT-ASYNC', risk: 'HIGH', justification: 'A genuine unbounded-hang path in the runtime-activation stage, distinct from the (bounded) 45s timeout path.' },
  { findingId: 'F18-STABILIZER-TIMEOUTS-NOT-ENFORCED-IN-PRODUCTION', risk: 'HIGH', justification: 'Existing, tested enforcement code is not reachable from the production orchestrator, so timeout policy documented in one file does not match behavior in another.' },
  { findingId: 'F19-FRAGMENTED-PREVIEW-VERDICTS', risk: 'HIGH', justification: 'Multiple authorities can each declare a different "did the preview work" answer for the same build, with an override path that favors the weaker (route-probe-only) evidence.' },
  { findingId: 'F04-METADATA-KEYWORD-ACCUMULATION', risk: 'MEDIUM', justification: 'Contributes to identity drift over multiple rebuilds of the same project id, slower-acting than F01-F03.' },
  { findingId: 'F05-EVOLUTION-REGISTRY-NOT-PROJECT-SCOPED', risk: 'MEDIUM', justification: 'Cross-project capability reuse without project scoping; likely lower frequency than context/module findings but same category of isolation gap.' },
  { findingId: 'F07-PROFILE-MAP-FIXED-LISTS', risk: 'MEDIUM', justification: 'Mitigated somewhat by the evidence gate blocking PROFILE_FALLBACK by default; risk concentrates on the PROJECT_MANAGEMENT_WEB_V1 auto-allow exception.' },
  { findingId: 'F11-CONTRACT-PROFILE-MISMATCH', risk: 'MEDIUM', justification: 'Narrower than F09/F10 — only triggers when input.profile and materializationProfile diverge for the same build.' },
  { findingId: 'F17-INTERACTION-PROOF-NO-MATERIALIZATION-PRECHECK', risk: 'MEDIUM', justification: 'Produces a slower, less-diagnostic failure rather than a silent one — the proof engine does eventually classify and report the failure.' },
  { findingId: 'F08-PERSISTENCE-ALWAYS-ON', risk: 'LOW', justification: 'Infrastructure-only module id; does not by itself introduce a user-visible wrong concept.' },
];
