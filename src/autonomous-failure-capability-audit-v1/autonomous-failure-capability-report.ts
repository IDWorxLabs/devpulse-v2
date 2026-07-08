/**
 * Autonomous Failure Diagnosis + Capability Detection Audit V1 — report assembly.
 *
 * AUDIT ONLY — read-only. Assembles the catalog of candidate systems + the failure-class
 * coverage probes + the real import-graph reachability computation into the final report. Does
 * not modify generation behavior and does not implement any repair.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  auditCandidateSystem,
  auditFailureClassCoverage,
  computeProductionReachability,
  PRODUCTION_BUILD_ENTRYPOINT,
} from './autonomous-failure-capability-audit.js';
import type {
  AuditCandidateSystemDefinition,
  AuditCandidateSystemResult,
  AuditEvidenceCitation,
  AuditFailureClass,
  AutonomousFailureCapabilityAuditReport,
} from './autonomous-failure-capability-audit-types.js';
import { AUTONOMOUS_FAILURE_CAPABILITY_AUDIT_V1_CONTRACT } from './autonomous-failure-capability-audit-types.js';

/**
 * The catalog of candidate systems this audit inspects. Every `realLogicProbe` below cites a
 * file+marker this audit's author personally read on disk before writing this entry; entries
 * without a probe fall back to the generic "non-trivial exported declaration" heuristic in
 * autonomous-failure-capability-audit.ts, which still reads the real files on disk.
 */
export const CANDIDATE_SYSTEMS: AuditCandidateSystemDefinition[] = [
  // ---------------------------------------------------------------------------------------
  // FAILURE DIAGNOSIS
  // ---------------------------------------------------------------------------------------
  {
    id: 'aee-build-failure-classifier',
    displayName: 'AEE build-failure classifier (classifyBuildFailure)',
    category: 'FAILURE_DIAGNOSIS',
    moduleDir: 'src/autonomous-engineering-executive',
    claim: 'Classifies npm-build stderr/stdout into a specific failure class before deciding how to repair it.',
    realLogicProbe: { relativeFile: 'aee-build-autofix-loop.ts', markerPattern: 'export function classifyBuildFailure', markerDescription: 'a real regex-based classifier function' },
    callSiteProbe: { file: 'src/autonomous-engineering-executive/aee-build-autofix-loop.ts', markerPattern: 'classifyBuildFailure\\(currentOutput\\)', markerDescription: 'runAeeBuildAutofixLoop literally calls classifyBuildFailure on each attempt' },
  },
  {
    id: 'universal-build-blocker-classification',
    displayName: 'Universal build pipeline — BlockerClass taxonomy',
    category: 'FAILURE_DIAGNOSIS',
    moduleDir: 'src/universal-build-pipeline-verification',
    claim: 'Classifies pipeline blockers (legitimate vs overstrict vs stale-evidence vs profile-misroute, etc).',
    realLogicProbe: { relativeFile: 'universal-build-pipeline-types.ts', markerPattern: 'export type BlockerClass', markerDescription: 'a real BlockerClass union type' },
    callSiteProbe: null,
  },
  {
    id: 'build-outcome-policy',
    displayName: 'Universal build pipeline — resolveBuildOutcome policy',
    category: 'FAILURE_DIAGNOSIS',
    moduleDir: 'src/universal-build-pipeline-verification',
    claim: 'Resolves one final BuildOutcome (preview/degraded/build-errors/blocked) from raw stage evidence.',
    realLogicProbe: { relativeFile: 'build-outcome-policy.ts', markerPattern: 'export function resolveBuildOutcome', markerDescription: 'a real outcome-resolution function' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'resolveBuildOutcome\\(', markerDescription: 'the orchestrator calls resolveBuildOutcome to finalize the build result' },
  },
  {
    id: 'build-execution-stall-detection',
    displayName: 'Build Execution Stabilizer — stall/hang detection',
    category: 'FAILURE_DIAGNOSIS',
    moduleDir: 'src/build-execution-stabilizer-v1',
    claim: 'Monitors build execution stages and detects stalls (a form of runtime hang).',
    realLogicProbe: { relativeFile: 'build-execution-monitor.ts', markerPattern: 'markStall\\(stage: BuildExecutionStageName', markerDescription: 'a real markStall(...) method on BuildExecutionMonitor' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'executionMonitor\\.markStall\\(', markerDescription: 'the orchestrator calls executionMonitor.markStall when build output matches a timeout/hang pattern' },
  },
  {
    id: 'build-result-normalizer-drift-classification',
    displayName: 'Build Result Normalizer — product/contract drift result kinds',
    category: 'FAILURE_DIAGNOSIS',
    moduleDir: 'src/build-result-normalizer-v1',
    claim: 'Normalizes internal signals into one founder-facing result, including drift/contract-inconsistency states.',
    realLogicProbe: { relativeFile: 'build-result-normalizer.ts', markerPattern: 'export function normalizeBuildResult', markerDescription: 'a real normalization function' },
    callSiteProbe: null,
  },
  {
    id: 'end-to-end-build-reality-engine',
    displayName: 'End-to-End Build Reality Engine V1',
    category: 'FAILURE_DIAGNOSIS',
    moduleDir: 'src/end-to-end-build-reality-engine-v1',
    claim: 'Produces an end-to-end reality report about whether the build pipeline behaved honestly.',
    realLogicProbe: { relativeFile: 'index.ts', markerPattern: 'runEndToEndBuildReality', markerDescription: 'runEndToEndBuildReality is exported' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'runEndToEndBuildReality\\(', markerDescription: 'the orchestrator calls runEndToEndBuildReality' },
  },
  { id: 'generated-runtime-crash-diagnosis', displayName: 'Generated Runtime Crash Diagnosis', category: 'FAILURE_DIAGNOSIS', moduleDir: 'src/generated-runtime-crash-diagnosis', claim: 'Diagnoses crashes in the generated (child) application at runtime.', realLogicProbe: null, callSiteProbe: null },
  { id: 'root-cause-attribution', displayName: 'Root Cause Attribution', category: 'FAILURE_DIAGNOSIS', moduleDir: 'src/root-cause-attribution', claim: 'Attributes a failure to a specific root cause.', realLogicProbe: null, callSiteProbe: null },
  { id: 'failure-prediction', displayName: 'Failure Prediction', category: 'FAILURE_DIAGNOSIS', moduleDir: 'src/failure-prediction', claim: 'Predicts likely failures before they occur.', realLogicProbe: null, callSiteProbe: null },
  { id: 'failure-visibility-engine', displayName: 'Failure Visibility Engine', category: 'FAILURE_DIAGNOSIS', moduleDir: 'src/failure-visibility-engine', claim: 'Surfaces failure evidence for visibility/reporting.', realLogicProbe: null, callSiteProbe: null },
  { id: 'unified-failure-escalation-authority-v1', displayName: 'Unified Failure Escalation Authority V1', category: 'FAILURE_DIAGNOSIS', moduleDir: 'src/unified-failure-escalation-authority-v1', claim: 'Unifies failure escalation decisions across subsystems.', realLogicProbe: null, callSiteProbe: null },
  { id: 'runtime-startup-proof-repair', displayName: 'Runtime Startup Proof + Repair', category: 'FAILURE_DIAGNOSIS', moduleDir: 'src/runtime-startup-proof-repair', claim: 'Classifies and repairs runtime startup failures.', realLogicProbe: null, callSiteProbe: null },
  { id: 'architecture-drift-detection', displayName: 'Architecture Drift Detection', category: 'FAILURE_DIAGNOSIS', moduleDir: 'src/architecture-drift-detection', claim: 'Detects drift between planned architecture and generated reality.', realLogicProbe: null, callSiteProbe: null },

  // ---------------------------------------------------------------------------------------
  // REPAIR
  // ---------------------------------------------------------------------------------------
  {
    id: 'aee-build-autofix-repair',
    displayName: 'AEE Build AutoFix — applyBuildRepair (mutates workspace files)',
    category: 'REPAIR',
    moduleDir: 'src/autonomous-engineering-executive',
    claim: 'Applies a bounded, deterministic source-code repair (installs missing npm packages, syncs route registry, restores package.json build script, adds missing React import) before rerunning npm build.',
    realLogicProbe: { relativeFile: 'aee-build-autofix-loop.ts', markerPattern: 'function applyBuildRepair', markerDescription: 'a real repair-application function that performs on-disk source-file edits' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'runAeeBuildAutofixLoop\\(\\{', markerDescription: 'the orchestrator calls runAeeBuildAutofixLoop after the first npm build attempt fails' },
  },
  {
    id: 'aee-preview-recovery-loop',
    displayName: 'AEE Preview Recovery Loop',
    category: 'REPAIR',
    moduleDir: 'src/autonomous-engineering-executive',
    claim: 'Attempts to recover a locked/failed live preview (restart dev server, re-run gate evidence).',
    realLogicProbe: { relativeFile: 'aee-preview-recovery-loop.ts', markerPattern: 'runAeePreviewRecoveryLoop', markerDescription: 'a real preview-recovery loop function' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'runAeePreviewRecoveryLoop\\(\\{', markerDescription: 'the orchestrator calls runAeePreviewRecoveryLoop when the live preview is not available after a successful build' },
  },
  {
    id: 'autonomous-recovery-authority',
    displayName: 'Autonomous Recovery Authority (attemptEngineeringRecovery)',
    category: 'REPAIR',
    moduleDir: 'src/autonomous-recovery-authority',
    claim: 'Decides whether/how to recover engineering evidence gaps before or during a build.',
    realLogicProbe: { relativeFile: 'index.ts', markerPattern: 'attemptEngineeringRecovery', markerDescription: 'attemptEngineeringRecovery is exported' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'attemptEngineeringRecovery\\(\\{', markerDescription: 'the orchestrator calls attemptEngineeringRecovery early in the build' },
  },
  {
    id: 'workspace-materialization-stabilizer',
    displayName: 'Workspace Materialization Stabilizer V1',
    category: 'REPAIR',
    moduleDir: 'src/workspace-materialization-stabilizer-v1',
    claim: 'Repairs an incomplete/corrupted generated workspace before npm install runs.',
    realLogicProbe: { relativeFile: 'index.ts', markerPattern: 'stabilizeWorkspaceMaterialization', markerDescription: 'stabilizeWorkspaceMaterialization is exported' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'stabilizeWorkspaceMaterialization\\(\\{', markerDescription: 'the orchestrator calls stabilizeWorkspaceMaterialization before npm install' },
  },
  {
    id: 'ase-repair-router',
    displayName: 'ASE Repair Router (routeAseRepair)',
    category: 'REPAIR',
    moduleDir: 'src/autonomous-software-engineering-engine',
    claim: 'Decides, from autonomous-debugging evidence, whether repair was applied/exhausted and what to do next.',
    realLogicProbe: { relativeFile: 'ase-repair-router.ts', markerPattern: 'export function routeAseRepair', markerDescription: 'a real repair-routing decision function' },
    callSiteProbe: null,
  },
  {
    id: 'ael-repair-router',
    displayName: 'Autonomous Engineering Loop — repair router (routeAelRepair)',
    category: 'REPAIR',
    moduleDir: 'src/autonomous-engineering-loop',
    claim: 'A second, parallel repair-routing decision inside the "AEL" loop.',
    realLogicProbe: { relativeFile: 'index.ts', markerPattern: 'routeAelRepair', markerDescription: 'routeAelRepair is exported' },
    callSiteProbe: null,
  },
  {
    id: 'product-faithfulness-generation-repair',
    displayName: 'Product Faithfulness V2 — applyMinimalRepairs (evidence reconciliation, not code repair)',
    category: 'REPAIR',
    moduleDir: 'src/product-faithfulness-v2',
    claim: 'Reintroduces a concept into a stage\'s evidence when it is present in another stage ("Recovered X") — an in-memory evidence merge, not a source-code mutation.',
    realLogicProbe: { relativeFile: 'generation-faithfulness-repair.ts', markerPattern: 'export function applyMinimalRepairs', markerDescription: 'a real (evidence-level, not code-level) repair function' },
    callSiteProbe: null,
  },
  {
    id: 'autonomous-debugging-engine',
    displayName: 'Autonomous Debugging Engine',
    category: 'REPAIR',
    moduleDir: 'src/autonomous-debugging-engine',
    claim: 'Runs an autonomous debugging pipeline with repair loops and an unresolved/repaired count.',
    realLogicProbe: { relativeFile: 'index.ts', markerPattern: 'runAutonomousDebuggingPipeline', markerDescription: 'runAutonomousDebuggingPipeline is exported' },
    callSiteProbe: { file: 'src/autonomous-software-engineering-engine/ase-stage-orchestrator.ts', markerPattern: 'runAutonomousDebuggingPipeline\\(\\{', markerDescription: 'the ASE stage orchestrator calls runAutonomousDebuggingPipeline' },
  },
  { id: 'autonomous-repair-loop', displayName: 'Autonomous Repair Loop', category: 'REPAIR', moduleDir: 'src/autonomous-repair-loop', claim: 'A generic, standalone autonomous repair loop orchestrator.', realLogicProbe: null, callSiteProbe: null },
  { id: 'autonomous-fixing', displayName: 'Autonomous Fixing', category: 'REPAIR', moduleDir: 'src/autonomous-fixing', claim: 'A generic autonomous fixing system.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-chains', displayName: 'Recovery Chains', category: 'REPAIR', moduleDir: 'src/recovery-chains', claim: 'Chains multiple recovery actions together.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-escalation-authority', displayName: 'Recovery Escalation Authority', category: 'REPAIR', moduleDir: 'src/recovery-escalation-authority', claim: 'Decides when a recovery attempt must escalate.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-execution', displayName: 'Recovery Execution', category: 'REPAIR', moduleDir: 'src/recovery-execution', claim: 'Executes a chosen recovery strategy, with its own classifier/state-machine/report.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-executor', displayName: 'Recovery Executor', category: 'REPAIR', moduleDir: 'src/recovery-executor', claim: 'Executes recovery actions.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-hardening', displayName: 'Recovery Hardening', category: 'REPAIR', moduleDir: 'src/recovery-hardening', claim: 'Hardens recovery behavior against edge cases.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-memory', displayName: 'Recovery Memory', category: 'REPAIR', moduleDir: 'src/recovery-memory', claim: 'Remembers past recovery attempts/outcomes.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-planner', displayName: 'Recovery Planner', category: 'REPAIR', moduleDir: 'src/recovery-planner', claim: 'Plans a recovery strategy from evidence.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-report-builder', displayName: 'Recovery Report Builder', category: 'REPAIR', moduleDir: 'src/recovery-report-builder', claim: 'Builds a report describing recovery attempts.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-root-cause', displayName: 'Recovery Root Cause', category: 'REPAIR', moduleDir: 'src/recovery-root-cause', claim: 'Analyzes the root cause behind a recoverable failure.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-strategy-engine', displayName: 'Recovery Strategy Engine', category: 'REPAIR', moduleDir: 'src/recovery-strategy-engine', claim: 'Chooses a recovery strategy.', realLogicProbe: null, callSiteProbe: null },
  { id: 'recovery-strategy-planner', displayName: 'Recovery Strategy Planner', category: 'REPAIR', moduleDir: 'src/recovery-strategy-planner', claim: 'Plans recovery strategies (distinct module from recovery-strategy-engine).', realLogicProbe: null, callSiteProbe: null },
  { id: 'rollback-retry-engine', displayName: 'Rollback / Retry Engine', category: 'REPAIR', moduleDir: 'src/rollback-retry-engine', claim: 'Rolls back and/or retries a failed operation.', realLogicProbe: null, callSiteProbe: null },
  { id: 'adaptive-autofix-intelligence', displayName: 'Adaptive AutoFix Intelligence', category: 'REPAIR', moduleDir: 'src/adaptive-autofix-intelligence', claim: 'An adaptive AutoFix intelligence layer.', realLogicProbe: null, callSiteProbe: null },
  {
    id: 'build-reality-autofix-engine-v1',
    displayName: 'Build Reality AutoFix Engine V1',
    category: 'REPAIR',
    moduleDir: 'src/build-reality-autofix-engine-v1',
    claim: 'A second, dedicated build-reality AutoFix engine that patches generated source files (separate from the AEE build-autofix loop).',
    realLogicProbe: { relativeFile: 'build-reality-autofix-engine.ts', markerPattern: 'export async function runBuildRealityAutofix', markerDescription: 'a real repair-application function that performs on-disk source-file edits' },
    callSiteProbe: { file: 'src/end-to-end-build-reality-engine-v1/e2e-build-reality-authority.ts', markerPattern: 'runBuildRealityAutofix\\(\\{', markerDescription: 'the E2E build-reality authority calls runBuildRealityAutofix, and is itself called by the orchestrator via runEndToEndBuildReality' },
  },
  { id: 'auto-fix-control', displayName: 'Auto Fix Control', category: 'REPAIR', moduleDir: 'src/auto-fix-control', claim: 'Controls/classifies which AutoFix actions are permitted.', realLogicProbe: null, callSiteProbe: null },
  { id: 'auto-fix-runtime', displayName: 'Auto Fix Runtime', category: 'REPAIR', moduleDir: 'src/auto-fix-runtime', claim: 'Runtime execution of AutoFix plans/proposals.', realLogicProbe: null, callSiteProbe: null },

  // ---------------------------------------------------------------------------------------
  // CAPABILITY DETECTION
  // ---------------------------------------------------------------------------------------
  {
    id: 'capability-planning-gap-analysis',
    displayName: 'Capability Planning Engine — gap analysis (NEEDS_CAPABILITY_EVOLUTION)',
    category: 'CAPABILITY_DETECTION',
    moduleDir: 'src/capability-planning-engine',
    claim: 'Analyzes required-vs-existing capabilities pre-generation and produces a permission verdict.',
    realLogicProbe: { relativeFile: 'capability-planning-types.ts', markerPattern: 'NEEDS_CAPABILITY_EVOLUTION', markerDescription: 'a real permission verdict value used to gate generation' },
    callSiteProbe: { file: 'src/autonomous-software-engineering-engine/ase-capability-evolution-router.ts', markerPattern: "capabilityPlanning\\.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION'", markerDescription: 'routeAseCapabilityEvolution reads this exact verdict to decide evolutionRequired' },
  },
  {
    id: 'missing-capability-evolution-intake',
    displayName: 'Missing Capability Evolution Engine — intake (intakeMissingCapabilities)',
    category: 'CAPABILITY_DETECTION',
    moduleDir: 'src/missing-capability-evolution-engine',
    claim: 'Converts capability-planning gaps + autonomous-debugging capability-gap findings into structured missing-capability intake items.',
    realLogicProbe: { relativeFile: 'missing-capability-intake.ts', markerPattern: 'export function intakeMissingCapabilities', markerDescription: 'a real, evidence-driven intake function (reads capabilityPlanning.gaps)' },
    callSiteProbe: { file: 'src/missing-capability-evolution-engine/capability-evolution-authority.ts', markerPattern: 'intakeMissingCapabilities\\(input\\)', markerDescription: 'runMissingCapabilityEvolutionPipeline calls intakeMissingCapabilities as its first stage' },
  },
  {
    id: 'ase-capability-evolution-router',
    displayName: 'ASE Capability Evolution Router (routeAseCapabilityEvolution)',
    category: 'CAPABILITY_DETECTION',
    moduleDir: 'src/autonomous-software-engineering-engine',
    claim: 'Decides whether capability evolution is required/complete and whether to resume at CAPABILITY_PLANNING or INCREMENTAL_BUILD.',
    realLogicProbe: { relativeFile: 'ase-capability-evolution-router.ts', markerPattern: 'export function routeAseCapabilityEvolution', markerDescription: 'a real gating/routing decision function' },
    callSiteProbe: { file: 'src/autonomous-software-engineering-engine/ase-stage-orchestrator.ts', markerPattern: 'routeAseCapabilityEvolution\\(\\{', markerDescription: 'the ASE stage orchestrator calls routeAseCapabilityEvolution after running the missing-capability-evolution pipeline' },
  },
  { id: 'missing-capability-detector', displayName: 'Missing Capability Detector', category: 'CAPABILITY_DETECTION', moduleDir: 'src/missing-capability-detector', claim: 'Detects a missing capability directly (distinct from the evolution engine\'s intake stage).', realLogicProbe: null, callSiteProbe: null },
  { id: 'missing-capability-escalation', displayName: 'Missing Capability Escalation', category: 'CAPABILITY_DETECTION', moduleDir: 'src/missing-capability-escalation', claim: 'Escalates a missing capability finding.', realLogicProbe: null, callSiteProbe: null },
  { id: 'safe-capability-acquisition', displayName: 'Safe Capability Acquisition', category: 'CAPABILITY_DETECTION', moduleDir: 'src/safe-capability-acquisition', claim: 'Safely acquires a new capability.', realLogicProbe: null, callSiteProbe: null },
  { id: 'self-evolution-authority', displayName: 'Self-Evolution Authority', category: 'CAPABILITY_DETECTION', moduleDir: 'src/self-evolution-authority', claim: 'The authority governing whether/how the engine may evolve itself.', realLogicProbe: null, callSiteProbe: null },
  { id: 'self-evolution-execution-v1', displayName: 'Self-Evolution Execution V1', category: 'CAPABILITY_DETECTION', moduleDir: 'src/self-evolution-execution-v1', claim: 'Executes a self-evolution step, including an "evolution gap detector".', realLogicProbe: null, callSiteProbe: null },
  { id: 'self-evolution-foundation', displayName: 'Self-Evolution Foundation', category: 'CAPABILITY_DETECTION', moduleDir: 'src/self-evolution-foundation', claim: 'Foundational types/contracts for self-evolution.', realLogicProbe: null, callSiteProbe: null },
  { id: 'self-evolution-governance', displayName: 'Self-Evolution Governance', category: 'CAPABILITY_DETECTION', moduleDir: 'src/self-evolution-governance', claim: 'Governs self-evolution decisions.', realLogicProbe: null, callSiteProbe: null },
  { id: 'gap-detection-authority', displayName: 'Gap Detection Authority', category: 'CAPABILITY_DETECTION', moduleDir: 'src/gap-detection-authority', claim: 'A dedicated authority for detecting capability/requirement gaps.', realLogicProbe: null, callSiteProbe: null },
  { id: 'unknown-discovery-authority', displayName: 'Unknown Discovery Authority', category: 'CAPABILITY_DETECTION', moduleDir: 'src/unknown-discovery-authority', claim: 'Discovers "unknowns" the engine has not yet classified.', realLogicProbe: null, callSiteProbe: null },
  { id: 'capability-audit-v1', displayName: 'Capability Audit V1', category: 'CAPABILITY_DETECTION', moduleDir: 'src/capability-audit-v1', claim: 'An earlier capability-inventory audit.', realLogicProbe: null, callSiteProbe: null },
  { id: 'capability-audit-v2', displayName: 'Capability Audit V2', category: 'CAPABILITY_DETECTION', moduleDir: 'src/capability-audit-v2', claim: 'A later capability-inventory audit, with a v1-category-remap.', realLogicProbe: null, callSiteProbe: null },
  { id: 'capability-audit-v3', displayName: 'Capability Audit V3', category: 'CAPABILITY_DETECTION', moduleDir: 'src/capability-audit-v3', claim: 'The latest capability-inventory audit, including missing-capabilities + duplicate-risk analysis.', realLogicProbe: null, callSiteProbe: null },
  { id: 'aidevengine-capability-audit', displayName: 'AiDevEngine Capability Audit', category: 'CAPABILITY_DETECTION', moduleDir: 'src/aidevengine-capability-audit', claim: 'An engine-level capability audit.', realLogicProbe: null, callSiteProbe: null },
  { id: 'strategic-capability-audit-v4', displayName: 'Strategic Capability Audit V4', category: 'CAPABILITY_DETECTION', moduleDir: 'src/strategic-capability-audit-v4', claim: 'A strategic-level capability audit with its own evidence collector.', realLogicProbe: null, callSiteProbe: null },

  // ---------------------------------------------------------------------------------------
  // SUPPORTING INFRASTRUCTURE (orchestration umbrellas that host several of the above)
  // ---------------------------------------------------------------------------------------
  {
    id: 'ase-enforcement-engine',
    displayName: 'ASE Enforcement Engine (runAutonomousEngineering)',
    category: 'SUPPORTING_INFRASTRUCTURE',
    moduleDir: 'src/ase-enforcement-engine',
    claim: 'The gate that decides whether the ASE pipeline authorizes materialization to proceed.',
    realLogicProbe: { relativeFile: 'index.ts', markerPattern: 'runAutonomousEngineering', markerDescription: 'runAutonomousEngineering is exported' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'runAutonomousEngineering\\(', markerDescription: 'the orchestrator calls runAutonomousEngineering to authorize materialization' },
  },
  {
    id: 'autonomous-software-engineering-engine',
    displayName: 'Autonomous Software Engineering Engine (ASE pipeline orchestrator)',
    category: 'SUPPORTING_INFRASTRUCTURE',
    moduleDir: 'src/autonomous-software-engineering-engine',
    claim: 'Runs the full ASE stage pipeline (capability planning, incremental build, behavior/virtual-user/device simulation, interaction proof, autonomous debugging, capability evolution routing).',
    realLogicProbe: { relativeFile: 'ase-stage-orchestrator.ts', markerPattern: 'runAutonomousDebuggingPipeline', markerDescription: 'the stage orchestrator really wires in autonomous-debugging-engine' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'runAutonomousEngineering\\(', markerDescription: 'the orchestrator invokes the ASE pipeline (which internally runs ase-stage-orchestrator.ts)' },
  },
  {
    id: 'autonomous-engineering-executive',
    displayName: 'Autonomous Engineering Executive (AEE)',
    category: 'SUPPORTING_INFRASTRUCTURE',
    moduleDir: 'src/autonomous-engineering-executive',
    claim: 'The executive that coordinates build/preview decisions (CONTINUE/REPAIR/PREVIEW/ABORT).',
    realLogicProbe: { relativeFile: 'index.ts', markerPattern: 'runAeeExecutiveCoordination', markerDescription: 'runAeeExecutiveCoordination is exported' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'runAeeExecutiveCoordination\\(', markerDescription: 'the orchestrator calls runAeeExecutiveCoordination at multiple decision points' },
  },
  {
    id: 'autonomous-engineering-loop',
    displayName: 'Autonomous Engineering Loop (AEL)',
    category: 'SUPPORTING_INFRASTRUCTURE',
    moduleDir: 'src/autonomous-engineering-loop',
    claim: 'A second, iterative engineering loop with its own decision engine, evidence collector, and founder loop.',
    realLogicProbe: { relativeFile: 'index.ts', markerPattern: 'runAutonomousEngineeringLoop', markerDescription: 'runAutonomousEngineeringLoop is exported' },
    callSiteProbe: { file: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', markerPattern: 'runAutonomousEngineeringLoop\\(', markerDescription: 'the orchestrator calls runAutonomousEngineeringLoop near the end of the build' },
  },
];

function findSystem(results: AuditCandidateSystemResult[], id: string): AuditCandidateSystemResult {
  const found = results.find((r) => r.definition.id === id);
  if (!found) throw new Error(`Audit catalog inconsistency: missing candidate system "${id}"`);
  return found;
}

function citeExisting(repoRoot: string, file: string, markerPattern: string): AuditEvidenceCitation {
  const abs = join(repoRoot, file);
  const source = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  if (!source) return { readOnly: true, file, line: null, detail: 'File not found on disk.' };
  const idx = source.search(new RegExp(markerPattern));
  const line = idx >= 0 ? source.slice(0, idx).split('\n').length : null;
  return { readOnly: true, file, line, detail: idx >= 0 ? `Matched "${markerPattern}"` : `Marker "${markerPattern}" not found.` };
}

export function buildAutonomousFailureCapabilityAuditReport(repoRoot: string): AutonomousFailureCapabilityAuditReport {
  const { report: reachability, moduleFirstPath } = computeProductionReachability(repoRoot);
  const reachableModules = new Set(reachability.modulesReached);

  const systems = CANDIDATE_SYSTEMS.map((def) => auditCandidateSystem(repoRoot, def, reachableModules, moduleFirstPath));
  const failureClassCoverage = auditFailureClassCoverage(repoRoot);

  const byCategory = (cat: AuditCandidateSystemDefinition['category']) => systems.filter((s) => s.definition.category === cat);

  const failureClassesHandled: AuditFailureClass[] = failureClassCoverage.filter((f) => f.handled).map((f) => f.failureClass);
  const failureClassesNotHandled: AuditFailureClass[] = failureClassCoverage.filter((f) => !f.handled).map((f) => f.failureClass);

  const buildAutofixRepair = findSystem(systems, 'aee-build-autofix-repair');
  const previewRecoveryLoop = findSystem(systems, 'aee-preview-recovery-loop');

  const report: AutonomousFailureCapabilityAuditReport = {
    readOnly: true,
    contractVersion: AUTONOMOUS_FAILURE_CAPABILITY_AUDIT_V1_CONTRACT,
    generatedAt: new Date().toISOString(),
    repoRoot,
    reachability,
    systems,
    failureClassCoverage,
    existingFailureDiagnosisSystems: byCategory('FAILURE_DIAGNOSIS'),
    existingRepairSystems: byCategory('REPAIR'),
    existingCapabilityDetectionSystems: byCategory('CAPABILITY_DETECTION'),
    wiredIntoProduction: systems.filter((s) => s.verdict === 'WIRED_AND_REAL'),
    existsButUnused: systems.filter((s) => s.verdict === 'REAL_BUT_UNUSED' || s.verdict === 'EXISTS_BUT_NO_REAL_LOGIC_FOUND'),
    missingOrNotFound: systems.filter((s) => s.verdict === 'MISSING'),
    failureClassesHandled,
    failureClassesNotHandled,
    earliestStoppingPoint: {
      readOnly: true,
      file: 'src/autonomous-engineering-executive/aee-build-autofix-loop.ts',
      functionName: 'applyBuildRepair (called from runAeeBuildAutofixLoop)',
      description:
        'When classifyBuildFailure() returns TYPESCRIPT_ERROR, INVALID_JSX_TSX, MISSING_IMPORT_EXPORT, or UNKNOWN_BUILD_FAILURE, the only repair attempted is a single narrow heuristic (ensureReactImport). ' +
        'When that heuristic does not apply, applyBuildRepair\'s switch statement falls through to its `default` branch and returns `repairApplied: false` with detail "No repair strategy for failure class." ' +
        'runAeeBuildAutofixLoop then reruns npm build unchanged, and after `maxAttempts` (3) identical failures it sets `exhausted: true`. The orchestrator (one-prompt-build-orchestrator.ts, around the `buildAutofixLoop.exhausted` branch) then calls runAeeExecutiveCoordination + buildAeeFinalReport with `remainingGaps` and the build is reported as BUILD_COMPLETED_WITH_BUILD_ERRORS / FAILED — no further code-level repair is attempted and no automatic hand-off to the missing-capability-evolution pipeline occurs for this failure path.',
      citation: citeExisting(repoRoot, 'src/autonomous-engineering-executive/aee-build-autofix-loop.ts', 'No repair strategy for failure class'),
    },
    missingCapabilityEvolutionGapFinding: {
      readOnly: true,
      description:
        'The missing-capability-evolution pipeline (src/missing-capability-evolution-engine) IS wired into two real call sites: (1) pre-generation, via capability-planning\'s NEEDS_CAPABILITY_EVOLUTION verdict routed by ase-capability-evolution-router.ts, and (2) the preview-recovery loop, which receives `missingCapabilityEvolution: asePipeline.artifacts.missingCapabilityEvolution` as one of its evidence pipelines. ' +
        'It is NOT wired into the npm-build AutoFix loop (runAeeBuildAutofixLoop / applyBuildRepair) — that function never imports or calls anything from missing-capability-evolution-engine, so a compiler-error failure with "no repair strategy" never triggers a missing-capability check or evolution attempt; it simply exhausts.',
      wiredCitation: citeExisting(repoRoot, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts', 'missingCapabilityEvolution: asePipeline\\.artifacts\\.missingCapabilityEvolution'),
      notWiredCitation: citeExisting(repoRoot, 'src/autonomous-engineering-executive/aee-build-autofix-loop.ts', 'No repair strategy for failure class'),
    },
    contractBoundGenerationAuthorityAssessment: {
      readOnly: true,
      alreadyImplied: true,
      reasoning:
        'A "Contract-Bound Generation Authority" would gate generation on a formal capability contract: generation may only proceed once every required capability is present, or has been safely evolved/validated/installed. ' +
        'capability-planning-engine + missing-capability-evolution-engine, connected by ase-capability-evolution-router.routeAseCapabilityEvolution, already implement a narrow version of exactly this: capabilityPlanning.permissionVerdict === "NEEDS_CAPABILITY_EVOLUTION" blocks/redirects the pipeline, evolution is attempted with a safety verdict (EvolutionSafetyVerdict), validated (CapabilityValidationEvidence), installed (CapabilityInstallationResult), and only a clean EVOLUTION_PASS resumes at INCREMENTAL_BUILD — otherwise resumeGate stays at CAPABILITY_PLANNING. ' +
        'This IS a real, wired, evidence-driven precedent for "do not generate until the required capability contract is satisfied". It is not yet a UNIFIED authority, though: it only gates the ASE/capability-planning stage of the pipeline — it does not also gate the npm-build AutoFix loop, the preview AutoFix loop\'s non-capability failures, or the product-faithfulness repair path, each of which makes its own local "can I repair this" decision independently (see missingCapabilityEvolutionGapFinding above). A Contract-Bound Generation Authority would need to unify these into one contract check, not invent a new detection mechanism from scratch.',
      supportingCitations: [
        citeExisting(repoRoot, 'src/autonomous-software-engineering-engine/ase-capability-evolution-router.ts', 'export function routeAseCapabilityEvolution'),
        citeExisting(repoRoot, 'src/missing-capability-evolution-engine/missing-capability-evolution-types.ts', 'export type EvolutionVerdict'),
        citeExisting(repoRoot, 'src/capability-planning-engine/capability-planning-types.ts', 'NEEDS_CAPABILITY_EVOLUTION'),
      ],
    },
    recommendedImplementationOrder: [
      {
        readOnly: true,
        order: 1,
        title: 'Unify the failure-class taxonomy that already exists across separate modules',
        rationale:
          'AeeBuildFailureClass (compiler/module errors), BlockerClass (stale evidence, etc.), NormalizedBuildResultKind (product/contract drift), and the ad-hoc stall regex in the orchestrator are four separate, uncoordinated classification systems for the 7 requested failure classes. Before adding anything new, merge these into one authoritative failure-class enum so every downstream decision (repair routing, capability-evolution routing, reporting) reads the same classification.',
        dependsOnExistingSystems: ['aee-build-failure-classifier', 'universal-build-blocker-classification', 'build-result-normalizer-drift-classification', 'build-execution-stall-detection'],
      },
      {
        readOnly: true,
        order: 2,
        title: 'Connect the build-AutoFix "no repair strategy" outcome to the existing missing-capability-evolution pipeline',
        rationale:
          'applyBuildRepair\'s default branch already cleanly reports "no repair strategy for failure class" (see earliestStoppingPoint). This is the single cheapest, most surgical connection point: route that exact outcome into intakeMissingCapabilities (which already accepts a `debuggingCapabilityGap` field for this exact purpose) instead of just exhausting silently.',
        dependsOnExistingSystems: ['aee-build-autofix-repair', 'missing-capability-evolution-intake'],
      },
      {
        readOnly: true,
        order: 3,
        title: 'Formalize a single Contract-Bound Generation Authority over the existing capability-evolution routing',
        rationale:
          'ase-capability-evolution-router already proves the core mechanism works for the capability-planning stage. Generalize its resumeGate concept so ALL stages (build AutoFix, preview recovery, product-faithfulness repair) consult the same capability contract before deciding they have "no repair strategy", rather than each maintaining its own local default-case give-up.',
        dependsOnExistingSystems: ['ase-capability-evolution-router', 'capability-planning-gap-analysis', 'missing-capability-evolution-intake'],
      },
      {
        readOnly: true,
        order: 4,
        title: 'Resolve duplication between the many capability-audit generations (v1/v2/v3) and the recovery-* cluster',
        rationale:
          'This audit found three sequential "capability audit" module generations and a dozen similarly-named recovery-* modules, most unreachable from the real build path. Before building anything new, determine which (if any) of these are still authoritative, and retire or wire in the rest, to avoid a fourth parallel system.',
        dependsOnExistingSystems: ['capability-audit-v1', 'capability-audit-v2', 'capability-audit-v3', 'recovery-strategy-engine', 'recovery-strategy-planner', 'recovery-execution', 'recovery-executor'],
      },
    ],
  };

  return report;
}

export function renderAutonomousFailureCapabilityAuditReportMarkdown(report: AutonomousFailureCapabilityAuditReport): string {
  const lines: string[] = [];
  lines.push('# Autonomous Failure Diagnosis + Capability Detection Audit V1');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Production entrypoint inspected: \`${report.reachability.entrypointFile}\` (exists: ${report.reachability.entrypointExists})`);
  lines.push(`Real import graph BFS visited ${report.reachability.filesVisited} files and reached ${report.reachability.modulesReached.length} distinct src/ modules.`);
  lines.push('');

  const section = (title: string, results: readonly AuditCandidateSystemResult[]) => {
    lines.push(`## ${title}`);
    lines.push('');
    for (const r of results) {
      const invocationNote = r.directlyInvokedEvidence
        ? ' [CONFIRMED DIRECTLY INVOKED at a real call site]'
        : r.wiredIntoProduction
          ? ' [import-reachable only — direct invocation not separately confirmed]'
          : '';
      lines.push(`- **${r.definition.displayName}** (\`${r.definition.moduleDir}\`) — ${r.verdict}${invocationNote}`);
      lines.push(`  - ${r.oneLineFinding}`);
    }
    lines.push('');
  };

  section('Existing Failure Diagnosis Systems', report.existingFailureDiagnosisSystems);
  section('Existing Repair Systems', report.existingRepairSystems);
  section('Existing Capability Detection Systems', report.existingCapabilityDetectionSystems);

  lines.push('## Failure Class Coverage');
  lines.push('');
  for (const f of report.failureClassCoverage) {
    lines.push(`- ${f.failureClass}: ${f.handled ? 'HANDLED' : 'NOT HANDLED'} — ${f.note}`);
  }
  lines.push('');

  lines.push('## Wired Into Production vs Unused vs Missing');
  lines.push('');
  lines.push(`- Wired into production: ${report.wiredIntoProduction.length}`);
  lines.push(`- Exists but unused / no real logic found: ${report.existsButUnused.length}`);
  lines.push(`- Missing (not found on disk): ${report.missingOrNotFound.length}`);
  lines.push('');

  lines.push('## Earliest Stopping Point (description only, not fixed)');
  lines.push('');
  lines.push(`File: \`${report.earliestStoppingPoint.file}\``);
  lines.push(`Function: ${report.earliestStoppingPoint.functionName}`);
  lines.push(report.earliestStoppingPoint.description);
  lines.push('');

  lines.push('## Contract-Bound Generation Authority — already implied?');
  lines.push('');
  lines.push(`Already implied: ${report.contractBoundGenerationAuthorityAssessment.alreadyImplied}`);
  lines.push(report.contractBoundGenerationAuthorityAssessment.reasoning);
  lines.push('');

  lines.push('## Recommended Implementation Order');
  lines.push('');
  for (const step of report.recommendedImplementationOrder) {
    lines.push(`${step.order}. **${step.title}** — ${step.rationale}`);
  }

  return lines.join('\n');
}
