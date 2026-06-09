/**
 * Execution readiness evaluator — read-only analysis from intelligence sources.
 */

import { getDependencyIntelligenceContext } from '../dependency-intelligence/index.js';
import { buildDecisionContext } from '../unified-decision-layer/decision-context-builder.js';
import { getWorkspaceIntelligenceDiagnostics } from '../workspace-intelligence/workspace-intelligence-diagnostics.js';
import { getProgressIntelligenceDiagnostics } from '../progress-intelligence/progress-intelligence-diagnostics.js';
import { buildFailureRecords } from '../failure-visibility-engine/failure-record-builder.js';
import { analyzeRecurringBlockers } from '../learning-visibility-engine/learning-blocker-analyzer.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import type {
  ExecutionConfidence,
  ExecutionReadinessLevel,
  ExecutionReadinessReport,
} from './execution-runtime-types.js';
import {
  aggregateSafetyStatus,
  assessRequestedActionSafety,
  safetyViolationsForQuery,
} from './execution-safety-boundary.js';
import { applyGovernanceToReadiness, requiredApprovalGates } from './execution-governance.js';

function readinessLevelFromScore(score: number): ExecutionReadinessLevel {
  if (score >= 75) return 'HIGH';
  if (score >= 45) return 'MEDIUM';
  if (score > 0) return 'LOW';
  return 'NONE';
}

function confidenceFromReadiness(score: number, blockerCount: number): ExecutionConfidence {
  if (blockerCount > 5) return 'LOW';
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function evaluateExecutionReadiness(
  query: string,
  requestedAction = 'evaluate execution readiness',
): {
  readiness: ExecutionReadinessReport;
  confidence: ExecutionConfidence;
  blockers: string[];
} {
  const dep = getDependencyIntelligenceContext(query);
  const decision = buildDecisionContext(query);
  const profile = getCurrentProjectProfile();
  const failures = buildFailureRecords(query);
  const learningBlockers = analyzeRecurringBlockers(query);

  const blockers = new Set<string>([
    ...dep.dependencyBlockers,
    ...decision.blockedItems,
    ...decision.workspaceRisks,
    ...decision.contextIsolationWarnings,
    ...decision.timelineBlockers,
    ...profile.blockedItems,
    ...failures.filter((f) => f.severity !== 'Info').map((f) => `${f.title}: ${f.description}`),
    ...learningBlockers.records.map((r) => r.observation),
    'Phase 14.1 Execution Runtime Foundation — real execution is not connected',
    'AiDev Runtime execution path is readiness-only in this phase',
  ]);

  const missingDependencies = [
    ...dep.dependencyBlockers,
    ...dep.analysis.missingDependencies,
    ...decision.dependencyBlockers,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const requiredCapabilities = [
    'dependency_intelligence',
    'unified_decision_layer',
    'workspace_intelligence',
    'progress_intelligence',
    'failure_visibility_engine',
    'learning_visibility_engine',
    'action_visibility_engine',
    'reasoning_visibility_engine',
    'execution_verification_loop',
    'founder_approval_execution_gate',
  ];

  const approvalRequired = [
    ...requiredApprovalGates(),
    ...(decision.blockedItems.length > 0 ? ['founder_approval_execution_gate'] : []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const safetyViolations = safetyViolationsForQuery(query);
  const actionSafety = assessRequestedActionSafety(requestedAction);
  const safetyStatus = aggregateSafetyStatus(actionSafety, safetyViolations);

  let score = 35;
  if (dep.diagnostics.dependencyIntelligenceActive) score += 10;
  if (decision.dependencyCount > 0) score += 5;
  if (getWorkspaceIntelligenceDiagnostics().workspaceIntelligenceActive) score += 5;
  if (getProgressIntelligenceDiagnostics().progressIntelligenceActive) score += 5;
  if (failures.length > 0) score -= 5;
  if (blockers.size > 8) score -= 15;
  if (safetyStatus === 'FORBIDDEN') score = 0;
  score = Math.max(0, Math.min(100, score));

  const blockerList = [...blockers];
  const draft: ExecutionReadinessReport = {
    executionAllowed: false,
    readinessLevel: readinessLevelFromScore(score),
    readinessScore: score,
    blockers: blockerList,
    missingDependencies,
    requiredCapabilities,
    approvalRequired,
    safetyStatus,
    basis: [
      `Unified Decision Layer consulted (${decision.supportingFacts.length} supporting facts).`,
      `Dependency Intelligence consulted (${dep.diagnostics.dependencyCount} edges).`,
      `Workspace Intelligence active: ${getWorkspaceIntelligenceDiagnostics().workspaceIntelligenceActive}.`,
      `Progress Intelligence active: ${getProgressIntelligenceDiagnostics().progressIntelligenceActive}.`,
      `Visible failures: ${failures.length}; learning blocker records: ${learningBlockers.records.length}.`,
      `Decision dependency blockers: ${decision.dependencyBlockers.length}.`,
    ].join(' '),
    simulationOnly: true,
  };

  const readiness = applyGovernanceToReadiness(draft);
  const confidence = confidenceFromReadiness(score, blockerList.length);

  return { readiness, confidence, blockers: blockerList };
}
