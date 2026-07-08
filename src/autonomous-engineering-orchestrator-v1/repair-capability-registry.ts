/**
 * Autonomous Engineering Orchestrator V1 — repair capability registry.
 *
 * A deterministic, honest catalog of repair capabilities that already exist in the codebase
 * (found by the Autonomous Failure Diagnosis + Capability Detection Audit). This registry does
 * not implement any repair itself — it only describes, per capability, what it can handle and how
 * honestly it is wired: production-wired, planning-only, validator-only, governance-only, or
 * simulated. AEO's planner refuses to auto-run anything that isn't honestly production-wired and
 * safe.
 */

import type { AeoRepairCapabilityDefinition } from './autonomous-engineering-orchestrator-types.js';
import type { AeoFailureClass } from './failure-taxonomy.js';

export const AEO_REPAIR_CAPABILITY_REGISTRY: readonly AeoRepairCapabilityDefinition[] = [
  {
    readOnly: true,
    capabilityId: 'generation-pipeline-compliance-authority-v1',
    displayName: 'Generation Pipeline Compliance Authority V1',
    failureClassesHandled: [
      'GENERATION_PIPELINE_NON_COMPLIANCE',
      'LEGACY_GENERATOR_DETECTED',
      'TEMPLATE_GENERATOR_DETECTED',
      'BLUEPRINT_BYPASS',
      'CONTRACT_TRACEABILITY_FAILURE',
      'GENERATOR_INPUT_BYPASS',
      'PIPELINE_COMPLIANCE_FAILURE',
    ],
    inputEvidenceRequired: [
      'CanonicalProductContract (product-faithfulness-v2)',
      'CbgaGenerationReport (contract-bound-generation-authority-v4)',
      'the actual proposed/generated module, route, navigation, title, and file-path evidence for this build',
    ],
    // GPCA is a production-wired audit/gate authority, not a repair: it only ever proves whether
    // the pipeline complied and blocks when it did not. It never writes or regenerates a file, so
    // it is intentionally never safe to "auto-run as a repair" — there is no repair action to run.
    safeToRunAutomatically: false,
    maxAttempts: 0,
    affectedStages: ['MODULE_GENERATION', 'WORKSPACE_MATERIALIZATION'],
    existingModuleFunction:
      'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-authority.ts#runGenerationPipelineComplianceAuthority',
    wiringStatus: 'PRODUCTION_WIRED',
    mayChangeProductIdentity: false,
    limitations: [
      'GPCA never generates code and never repairs a generator — when it blocks, the underlying generator (e.g. the blueprint generator\'s unconditional shell pages) still needs a real, separate fix.',
      'Runs twice per build in one-prompt-build-orchestrator.ts: once pre-materialization (verifies proposed inputs) and once post-materialization (verifies real generated files) — before the dev server / live preview is ever started.',
      'Engineering Intelligence is only invoked for these failure classes if EIAA\'s policy allows it after GPCA proves the generator itself lacks the capability to satisfy compliance.',
    ],
    confidence: 90,
  },
  {
    readOnly: true,
    capabilityId: 'contract-bound-generation-authority-v4',
    displayName: 'Contract-Bound Generation Authority V4',
    failureClassesHandled: ['UNAUTHORIZED_FALLBACK_MODULES', 'CONTRACT_INCONSISTENCY', 'PRODUCT_IDENTITY_DRIFT'],
    inputEvidenceRequired: ['CanonicalProductContract (product-faithfulness-v2)', 'the proposed module/route/navigation/app-title inputs about to be materialized'],
    safeToRunAutomatically: true,
    maxAttempts: 1,
    affectedStages: ['MODULE_GENERATION', 'WORKSPACE_MATERIALIZATION'],
    existingModuleFunction: 'src/contract-bound-generation-authority-v4/contract-bound-generation-authority.ts#runContractBoundGenerationAuthority',
    wiringStatus: 'PRODUCTION_WIRED',
    // Never edits product identity directly — for PRODUCT_IDENTITY_DRIFT it only rebuilds the
    // module/route/navigation/surface plans and app-title input from the *existing* canonical
    // product contract, so the contract itself (and what it authoritatively considers the
    // product's identity to be) is never rewritten by this capability.
    mayChangeProductIdentity: false,
    limitations: [
      'Only runs when this failure class\'s inputs are present (a canonical product contract and proposed module/route/nav/title inputs) — with no contract to compare against, it cannot gate anything.',
      'For PRODUCT_IDENTITY_DRIFT it repairs by rebuilding generation plans from the contract, never by editing the contract or the product identity directly.',
      'Wired pre-materialization in one-prompt-build-orchestrator.ts (before module/route/navigation files are generated) — it does not rewrite files already written to a previous build\'s workspace.',
    ],
    confidence: 85,
  },
  {
    readOnly: true,
    capabilityId: 'build-reality-autofix-engine-v1',
    displayName: 'Build Reality AutoFix Engine V1',
    failureClassesHandled: ['COMPILER_FAILURE', 'MODULE_GENERATION_FAILURE', 'MATERIALIZATION_FAILURE', 'PREVIEW_RUNTIME_FAILURE'],
    inputEvidenceRequired: ['TypeScript/build output', 'E2E build-reality report', 'DOM/preview-authority failure detail'],
    safeToRunAutomatically: true,
    maxAttempts: 3,
    affectedStages: ['BUILD_COMPILE', 'MODULE_GENERATION', 'PREVIEW_STARTUP'],
    existingModuleFunction: 'src/build-reality-autofix-engine-v1/build-reality-autofix-engine.ts#runBuildRealityAutofix',
    wiringStatus: 'PRODUCTION_WIRED',
    mayChangeProductIdentity: false,
    limitations: [
      'Only reached from one-prompt build when the E2E build-reality gate runs (runEndToEndBuildReality), not on every failure path.',
      'Patches are limited to deterministic, contract-driven fixes (imports/exports, route/root mount, missing files) — no free-form code generation.',
    ],
    confidence: 80,
  },
  {
    readOnly: true,
    capabilityId: 'autonomous-recovery-authority',
    displayName: 'Autonomous Recovery Authority',
    failureClassesHandled: ['DEPENDENCY_INSTALL_FAILURE', 'MATERIALIZATION_FAILURE'],
    inputEvidenceRequired: ['failureStage', 'failureReason', 'blockers', 'evidenceRefs'],
    safeToRunAutomatically: true,
    maxAttempts: 3,
    affectedStages: ['DEPENDENCY_INSTALL', 'WORKSPACE_MATERIALIZATION'],
    existingModuleFunction: 'src/autonomous-recovery-authority/autonomous-recovery-authority.ts#attemptEngineeringRecovery',
    wiringStatus: 'PRODUCTION_WIRED',
    mayChangeProductIdentity: false,
    limitations: [
      'Directly imported and called by one-prompt-build-orchestrator.ts, but only for npm-install-stage failures today.',
      'Real repair execution happens through host callbacks (recovery-executor) — without a host it only diagnoses/plans.',
    ],
    confidence: 75,
  },
  {
    readOnly: true,
    capabilityId: 'autonomous-debugging-engine',
    displayName: 'Autonomous Debugging Engine',
    failureClassesHandled: ['PREVIEW_RUNTIME_FAILURE', 'LIVE_PREVIEW_PROOF_FAILURE'],
    inputEvidenceRequired: ['upstream preview/interaction failure evidence'],
    safeToRunAutomatically: false,
    maxAttempts: 3,
    affectedStages: ['PREVIEW_STARTUP', 'LIVE_PREVIEW_PROOF'],
    existingModuleFunction: 'src/autonomous-debugging-engine/index.ts#runAutonomousDebuggingPipeline',
    wiringStatus: 'SIMULATED',
    mayChangeProductIdentity: false,
    limitations: [
      'Reached in production via AEE preview recovery (aee-preview-recovery-loop.ts), but repair execution itself is simulated (repair-execution-simulator.ts) — it does not write workspace files.',
      'safeToRunAutomatically is false because a simulated repair result is not real evidence of a fix.',
    ],
    confidence: 40,
  },
  {
    readOnly: true,
    capabilityId: 'generation-faithfulness-repair',
    displayName: 'Generation Faithfulness Repair (Product Faithfulness V2, Milestone 2)',
    failureClassesHandled: ['PRODUCT_IDENTITY_DRIFT', 'CONTRACT_INCONSISTENCY'],
    inputEvidenceRequired: ['GenerationStageEvidence for every generation stage'],
    safeToRunAutomatically: false,
    maxAttempts: 1,
    affectedStages: ['MODULE_GENERATION'],
    existingModuleFunction: 'src/product-faithfulness-v2/generation-faithfulness-repair.ts#applyMinimalRepairs / repairAndReaudit',
    wiringStatus: 'SIMULATED',
    mayChangeProductIdentity: true,
    limitations: [
      'Header explicitly states this module never invokes a code-generation engine or LLM — it only reconciles in-memory concept evidence between stages.',
      'When a concept is missing from every stage it records a REGENERATE_FEATURE_MODULE action with applied:false — it cannot manufacture the fix.',
      'Called post-build from server/build-from-prompt-handler.ts, not from the pre-return one-prompt-build-orchestrator.ts failure paths.',
    ],
    confidence: 35,
  },
  {
    readOnly: true,
    capabilityId: 'product-faithfulness-v2-repair',
    displayName: 'Product Faithfulness V2 Repair (same underlying file as generation-faithfulness-repair)',
    failureClassesHandled: ['PRODUCT_IDENTITY_DRIFT'],
    inputEvidenceRequired: ['CanonicalProductContract', 'GenerationFaithfulnessAuditResult'],
    safeToRunAutomatically: false,
    maxAttempts: 1,
    affectedStages: ['MODULE_GENERATION'],
    existingModuleFunction: 'src/product-faithfulness-v2/generation-faithfulness-repair.ts#repairAndReaudit',
    wiringStatus: 'SIMULATED',
    mayChangeProductIdentity: true,
    limitations: [
      'There is no separate src/generation-faithfulness-repair/ or src/product-faithfulness-v2-repair/ directory — both requested names resolve to the same report/evidence-only file.',
      'Report/evidence-only: relabels the audit result (e.g. BUILT_AFTER_FAITHFULNESS_REPAIR) without regenerating or patching any generated file on disk.',
    ],
    confidence: 30,
  },
  {
    readOnly: true,
    capabilityId: 'fresh-build-artifact-isolation-v4',
    displayName: 'Fresh Build Artifact Isolation V4',
    failureClassesHandled: ['STALE_EVIDENCE_FAILURE'],
    inputEvidenceRequired: ['prior build artifact directory listing', 'runtime evidence scope id'],
    safeToRunAutomatically: true,
    maxAttempts: 1,
    affectedStages: ['WORKSPACE_MATERIALIZATION'],
    existingModuleFunction: 'src/fresh-build-artifact-isolation-v4/fresh-build-artifact-purge-authority.ts#purgeStaleBuildArtifacts',
    wiringStatus: 'PRODUCTION_WIRED',
    mayChangeProductIdentity: false,
    limitations: [
      'Runs once at the start of every build to mint a fresh runtime evidence scope — it is a preventative purge, not a mid-build retry mechanism.',
      'Cannot repair stale evidence that was already consumed and reported before this build started.',
    ],
    confidence: 70,
  },
  {
    readOnly: true,
    capabilityId: 'project-context-isolation-v4',
    displayName: 'Project Context Isolation V4',
    failureClassesHandled: ['PROJECT_CONTEXT_FAILURE'],
    inputEvidenceRequired: ['rawPrompt', 'projectId', 'prior build intent history'],
    safeToRunAutomatically: true,
    maxAttempts: 1,
    affectedStages: ['PROJECT_CONTEXT'],
    existingModuleFunction: 'src/project-context-isolation-v4/new-build-decision-authority-v2.ts#decideNewBuildOrContinue',
    wiringStatus: 'PRODUCTION_WIRED',
    mayChangeProductIdentity: false,
    limitations: [
      'Decides NEW_BUILD vs CONTINUE_EXISTING_PROJECT before generation starts — it is a targeted context reset, not a repair of an in-flight failure.',
      'When ambiguous, it requires an explicit user confirmation (buildIntentOverride) rather than resolving automatically.',
    ],
    confidence: 65,
  },
  {
    readOnly: true,
    capabilityId: 'build-execution-stabilizer-v1',
    displayName: 'Build Execution Stabilizer V1',
    failureClassesHandled: ['PREVIEW_RUNTIME_FAILURE', 'COMPILER_FAILURE', 'DEPENDENCY_INSTALL_FAILURE'],
    inputEvidenceRequired: ['per-stage heartbeat/timeline evidence'],
    safeToRunAutomatically: true,
    maxAttempts: 1,
    affectedStages: ['DEPENDENCY_INSTALL', 'BUILD_COMPILE', 'PREVIEW_STARTUP'],
    existingModuleFunction: 'src/build-execution-stabilizer-v1/build-execution-monitor.ts#markStall / build-execution-recovery.ts',
    wiringStatus: 'PRODUCTION_WIRED',
    mayChangeProductIdentity: false,
    limitations: [
      'Exactly one bounded recovery attempt per stage — deliberately shallow, by design, never a broad rebuild.',
      'Detects stalls/hangs and restarts the same stage; it does not diagnose or fix the underlying cause.',
    ],
    confidence: 60,
  },
  {
    readOnly: true,
    capabilityId: 'live-preview-gate',
    displayName: 'Live Preview Gate',
    failureClassesHandled: ['LIVE_PREVIEW_PROOF_FAILURE', 'PREVIEW_RUNTIME_FAILURE'],
    inputEvidenceRequired: ['dev server state', 'preview interaction proof result'],
    safeToRunAutomatically: false,
    maxAttempts: 1,
    affectedStages: ['LIVE_PREVIEW_PROOF', 'PREVIEW_STARTUP'],
    existingModuleFunction: 'src/live-preview-gate/live-preview-gate-evaluator.ts#evaluateLivePreviewGate',
    wiringStatus: 'PRODUCTION_WIRED',
    mayChangeProductIdentity: false,
    limitations: [
      'A gate/evaluator, not a repair — it decides whether preview may be shown and explains blockers, but never fixes them itself.',
      'safeToRunAutomatically is false because "running" this capability produces a diagnosis, not a resolved failure.',
    ],
    confidence: 55,
  },
  {
    readOnly: true,
    capabilityId: 'validation-runtime-governance-v1',
    displayName: 'Validation Runtime Governance V1 / Validation Budget (validation-impact systems)',
    failureClassesHandled: ['VALIDATION_FAILURE'],
    inputEvidenceRequired: ['validator registry', 'validation trigger'],
    safeToRunAutomatically: false,
    maxAttempts: 0,
    affectedStages: ['VALIDATION'],
    existingModuleFunction: null,
    wiringStatus: 'GOVERNANCE_ONLY',
    mayChangeProductIdentity: false,
    limitations: [
      'Not imported by one-prompt-build-orchestrator.ts or any of the listed production entrypoints — CI/validator-budget governance only.',
      'Cannot repair a validation failure; it only decides which validators should run and how expensive that is.',
    ],
    confidence: 10,
  },
  {
    readOnly: true,
    capabilityId: 'capability-planning-engine',
    displayName: 'Capability Planning Engine',
    failureClassesHandled: ['MISSING_REPAIR_CAPABILITY', 'MODULE_GENERATION_FAILURE'],
    inputEvidenceRequired: ['rawPrompt', 'existing capability registry snapshot'],
    safeToRunAutomatically: false,
    maxAttempts: 0,
    affectedStages: ['PLANNING'],
    existingModuleFunction: 'src/capability-planning-engine/capability-authority.ts#runCapabilityPlanningPipeline',
    wiringStatus: 'PLANNING_ONLY',
    mayChangeProductIdentity: false,
    limitations: [
      'Wired pre-generation (via prompt-faithful-generation) to decide what to build, not post-failure to repair what already failed.',
      'Matches against an in-memory registry — it does not scan the live codebase for whether a capability truly exists.',
    ],
    confidence: 30,
  },
  {
    readOnly: true,
    capabilityId: 'missing-capability-evolution-engine',
    displayName: 'Missing Capability Evolution Engine',
    failureClassesHandled: ['MISSING_REPAIR_CAPABILITY'],
    inputEvidenceRequired: ['MissingCapabilityIntakeItem[]', 'ProductIntelligenceModel'],
    safeToRunAutomatically: false,
    maxAttempts: 0,
    affectedStages: ['PLANNING', 'MODULE_GENERATION'],
    existingModuleFunction: 'src/missing-capability-evolution-engine/capability-evolution-authority.ts#runMissingCapabilityEvolutionPipeline',
    wiringStatus: 'PLANNING_ONLY',
    mayChangeProductIdentity: true,
    limitations: [
      'Reached from one-prompt-build-orchestrator.ts only indirectly (via prompt-faithful-generation and engineering-intelligence-runtime), never from the post-failure return paths this milestone targets.',
      'capability-installation-executor.ts only flips a boolean "installed: true" flag with no real filesystem write — the real write happens one layer down, in engineering-intelligence-runtime.',
    ],
    confidence: 35,
  },
  {
    readOnly: true,
    capabilityId: 'engineering-intelligence-runtime',
    displayName: 'Engineering Intelligence Runtime',
    failureClassesHandled: ['MODULE_GENERATION_FAILURE', 'MISSING_REPAIR_CAPABILITY'],
    inputEvidenceRequired: ['CapabilityGap[]', 'workspaceDir', 'projectRootDir'],
    safeToRunAutomatically: false,
    maxAttempts: 1,
    affectedStages: ['MODULE_GENERATION'],
    existingModuleFunction: 'src/engineering-intelligence-runtime/missing-capability-runtime.ts#generateMissingModuleFiles',
    wiringStatus: 'PRODUCTION_WIRED',
    mayChangeProductIdentity: true,
    limitations: [
      'Does write real feature module files to the workspace, but scope/safety of what it writes for an arbitrary missing capability is not yet bounded enough to run unattended (mayChangeProductIdentity=true).',
      'AEO V1 deliberately does not treat this as safeToRunAutomatically — that decision belongs to a future, explicitly-scoped milestone.',
    ],
    confidence: 45,
  },
];

export function findRepairCapabilitiesForFailureClass(
  failureClass: AeoFailureClass,
): AeoRepairCapabilityDefinition[] {
  return AEO_REPAIR_CAPABILITY_REGISTRY.filter((c) => c.failureClassesHandled.includes(failureClass));
}

export function getRepairCapabilityById(capabilityId: string): AeoRepairCapabilityDefinition | null {
  return AEO_REPAIR_CAPABILITY_REGISTRY.find((c) => c.capabilityId === capabilityId) ?? null;
}
