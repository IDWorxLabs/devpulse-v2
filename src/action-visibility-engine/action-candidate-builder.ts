/**
 * Action candidate builder — gathers visible actions from intelligence sources.
 */

import { analyzePortfolioPriorities, readPortfolioProjects } from '../portfolio-intelligence/index.js';
import { reasonOverDecision } from '../unified-decision-layer/index.js';
import type { DecisionOption } from '../unified-decision-layer/decision-types.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { buildDependencyGraph } from '../dependency-intelligence/index.js';
import { evaluateActionStatus } from './action-status-evaluator.js';
import { resolveActionSourceFromQuery } from './action-source-resolver.js';
import type { ActionCandidate, ActionConfidence, ActionRecommendation } from './action-visibility-types.js';

let actionCounter = 0;

function nextActionId(): string {
  actionCounter += 1;
  return `act-${actionCounter.toString().padStart(4, '0')}`;
}

function mapConfidence(conf: string): ActionConfidence {
  if (conf === 'HIGH') return 'HIGH';
  if (conf === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function candidateFromDecisionOption(option: DecisionOption, isPrimary: boolean): ActionCandidate {
  const deferred = option.category === 'DEFER' || option.category === 'DO_NOT_BUILD_YET';
  const recommended = isPrimary && !option.blocked && !deferred;
  const status = evaluateActionStatus({
    blocked: option.blocked,
    deferred,
    recommended,
  });

  return {
    actionId: nextActionId(),
    title: option.title,
    description: option.description,
    sourceSystem: 'unified_decision_layer',
    status,
    priority: option.priority,
    confidence: mapConfidence(option.confidence),
    blocked: option.blocked,
    deferred,
    recommended,
    reason: option.recommendedAction || option.description,
    visibilityOnly: true,
  };
}

function supplementalActions(query: string): ActionCandidate[] {
  const profile = getCurrentProjectProfile();
  const actions: ActionCandidate[] = [];
  buildDependencyGraph();
  const projects = readPortfolioProjects(query);
  const priorities = analyzePortfolioPriorities(projects);

  for (const blocker of profile.blockedItems.slice(0, 3)) {
    actions.push({
      actionId: nextActionId(),
      title: 'Resolve blocked gate',
      description: blocker,
      sourceSystem: 'project_understanding_engine',
      status: 'Blocked',
      priority: 10,
      confidence: 'HIGH',
      blocked: true,
      deferred: false,
      recommended: false,
      reason: blocker,
      visibilityOnly: true,
    });
  }

  for (const dep of profile.missingCapabilities.slice(0, 2)) {
    actions.push({
      actionId: nextActionId(),
      title: `Address missing capability: ${dep}`,
      description: `Capability gap identified — ${dep} not yet built.`,
      sourceSystem: 'dependency_intelligence',
      status: 'Deferred',
      priority: 50,
      confidence: 'MEDIUM',
      blocked: false,
      deferred: true,
      recommended: false,
      reason: 'Required before Execution Runtime — intelligence foundation first.',
      visibilityOnly: true,
    });
  }

  const focus = priorities.find((p) => p.focusRecommended);
  if (focus) {
    actions.push({
      actionId: nextActionId(),
      title: `Focus portfolio on ${focus.projectName}`,
      description: focus.reason,
      sourceSystem: 'portfolio_intelligence',
      status: 'Suggested',
      priority: focus.priority,
      confidence: 'HIGH',
      blocked: false,
      deferred: false,
      recommended: false,
      reason: focus.reason,
      visibilityOnly: true,
    });
  }

  const sourceFilter = resolveActionSourceFromQuery(query);
  if (sourceFilter === 'dependency_intelligence') {
    actions.push({
      actionId: nextActionId(),
      title: 'Validate Dependency Intelligence',
      description: 'Ensure dependency graph and blockers are current before advancing.',
      sourceSystem: 'dependency_intelligence',
      status: 'Recommended',
      priority: 20,
      confidence: 'HIGH',
      blocked: false,
      deferred: false,
      recommended: true,
      reason: 'Required before Execution Runtime — dependency awareness gates advancement.',
      visibilityOnly: true,
    });
  }

  return actions;
}

export function buildActionCandidates(query: string): ActionCandidate[] {
  const trace = reasonOverDecision(query);
  const primary = trace.recommendation.primaryOption;
  const decisionActions = trace.options.map((opt) =>
    candidateFromDecisionOption(opt, opt.decisionId === primary.decisionId),
  );
  const supplemental = supplementalActions(query);

  const merged = new Map<string, ActionCandidate>();
  for (const action of [...decisionActions, ...supplemental]) {
    merged.set(`${action.sourceSystem}:${action.title}`, action);
  }

  return [...merged.values()].sort((a, b) => a.priority - b.priority);
}

export function buildActionRecommendation(action: ActionCandidate): ActionRecommendation | null {
  if (!action.recommended && action.status !== 'Recommended') return null;
  return {
    recommendationId: `rec-${action.actionId}`,
    actionId: action.actionId,
    title: action.title,
    sourceSystem: action.sourceSystem,
    status: action.status,
    priority: action.priority,
    confidence: action.confidence,
    reason: action.reason,
    visibilityOnly: true,
  };
}

export function buildActionVisibilityRecordsFromDecision(query: string): ActionCandidate[] {
  return buildActionCandidates(query);
}

export function resetActionCandidateCounterForTests(): void {
  actionCounter = 0;
}
