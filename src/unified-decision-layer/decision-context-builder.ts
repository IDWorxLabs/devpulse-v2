/**
 * Decision context builder — reads from existing intelligence systems only.
 */

import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { getRelationshipEdges } from '../command-center-brain/cross-system-awareness/system-relationship-registry.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { collectProjectFacts } from '../project-understanding/project-fact-collector.js';
import { recallRelevantMemories } from '../shared-memory/shared-memory-recall.js';
import { buildTimelineState } from '../timeline-intelligence/timeline-state-model.js';
import { getDependencyIntelligenceContext } from '../dependency-intelligence/index.js';
import { getWorkspaceIntelligenceContext } from '../workspace-intelligence/index.js';
import { getProjectHistoryIntelligenceContext } from '../project-history-intelligence/index.js';
import { getProjectSummarizationContext } from '../project-summarization-engine/index.js';
import { getPortfolioIntelligenceContext } from '../portfolio-intelligence/index.js';
import type { DecisionContext, DecisionIntent } from './decision-types.js';

function resolveIntent(query: string): DecisionIntent {
  const lower = query.toLowerCase();

  if (lower.includes('should we build execution') || lower.includes('build execution now') || lower.includes('execution now')) {
    return 'EXECUTION_NOW';
  }
  if (lower.includes('cloud runtime') && (lower.includes('build') || lower.includes('should') || lower.includes('now'))) {
    return 'CLOUD_RUNTIME_NOW';
  }
  if (lower.includes('development reasoning')) {
    return 'DEVELOPMENT_REASONING_NOW';
  }
  if (lower.includes('not build') || lower.includes("don't build") || lower.includes('do not build')) {
    return 'DO_NOT_BUILD';
  }
  if (lower.includes('safest') || lower.includes('safe foundation') || lower.includes('safe next')) {
    return 'SAFE_MOVE';
  }
  if (lower.includes('riskiest') || lower.includes('worst move')) {
    return 'RISKY_MOVE';
  }
  if (lower.includes('blocked') || lower.includes('holding back')) {
    return 'BLOCKED_ITEMS';
  }
  if (lower.includes('validate') || lower.includes('validation first')) {
    return 'VALIDATE_FIRST';
  }
  if (lower.includes('defer')) {
    return 'DEFER_ITEMS';
  }
  if (lower.includes('highest priority') || lower.includes('most important') || lower.includes('what is highest')) {
    return 'HIGHEST_PRIORITY';
  }
  if (lower.includes('lowest priority') || lower.includes('what is lowest')) {
    return 'LOWEST_PRIORITY';
  }
  if (lower.includes('risk/reward') || lower.includes('risk reward') || lower.includes('best risk')) {
    return 'RISK_REWARD';
  }
  if (lower.includes('approve') || lower.includes('founder')) {
    return 'FOUNDER_APPROVE';
  }
  if (lower.includes('build next') || lower.includes('what should we build') || lower.includes('best next move')) {
    return 'BUILD_NEXT';
  }

  return 'GENERAL_DECISION';
}

export function buildDecisionContext(query: string): DecisionContext {
  const roadmap = getBrainRoadmapContext();
  const reasoning = collectProjectFacts(query);
  const timeline = buildTimelineState();
  const memory = recallRelevantMemories(query);
  const edges = getRelationshipEdges();
  const owners = listDevPulseV2Owners();
  const depContext = getDependencyIntelligenceContext(query);
  const wsContext = getWorkspaceIntelligenceContext(query);
  const histContext = getProjectHistoryIntelligenceContext(query);
  const sumContext = getProjectSummarizationContext(query);
  const portContext = getPortfolioIntelligenceContext(query);

  const gapFacts = reasoning.snapshot.facts.filter((f) => f.category === 'gap');
  const blockedFacts = reasoning.snapshot.facts.filter((f) => f.category === 'blocked');
  const riskFacts = reasoning.snapshot.facts.filter((f) => f.category === 'risk');
  const systemFacts = reasoning.snapshot.facts.filter((f) => f.category === 'system');

  const missingCapabilities = gapFacts.map((f) => f.title);
  const blockedItems = [
    ...blockedFacts.map((f) => f.statement),
    ...timeline.activeBlockers,
  ];
  const risks = riskFacts.map((f) => f.statement);
  const supportingFacts = reasoning.snapshot.facts
    .filter((f) => ['milestone', 'roadmap', 'recommendation', 'phase', 'identity'].includes(f.category))
    .slice(0, 12)
    .map((f) => f.statement);

  const relatedSystems = [
    ...new Set([
      ...systemFacts.map((f) => f.title),
      ...edges.slice(0, 8).map((e) => e.sourceId),
    ]),
  ];

  return {
    query,
    intent: resolveIntent(query),
    currentPhase: roadmap.currentPhase,
    nextPhase: roadmap.nextPhase,
    roadmapNextStep: roadmap.recommendedNextStep,
    missingCapabilities,
    blockedItems: [...new Set(blockedItems)],
    riskFacts: [...new Set(risks)],
    supportingFacts,
    relatedSystems,
    timelineBlockers: timeline.activeBlockers,
    timelineNextSteps: timeline.recommendedNextSteps,
    ownershipDomains: owners.length,
    memoryFactCount: memory.matches.length,
    crossSystemEdgeCount: edges.length,
    dependencyBlockers: depContext.dependencyBlockers,
    dependencyRisks: depContext.dependencyRisks,
    dependencyPaths: depContext.dependencyPaths,
    dependencyConfidence: depContext.dependencyConfidence,
    dependencyCount: depContext.diagnostics.dependencyCount,
    blockedDependencyCount: depContext.diagnostics.blockedDependencyCount,
    workspaceRisks: wsContext.workspaceRisks,
    workspaceOwnershipConfidence: wsContext.workspaceOwnershipConfidence,
    workspaceMismatchCount: wsContext.workspaceMismatchCount,
    contextIsolationWarnings: wsContext.contextIsolationWarnings,
    recentChanges: histContext.recentChanges,
    majorMilestones: histContext.majorMilestones,
    historyConfidence: histContext.historyConfidence,
    rollbackCount: histContext.rollbackCount,
    phaseTransitionCount: histContext.phaseTransitionCount,
    latestExecutiveSummary: sumContext.latestExecutiveSummary,
    latestProjectHealth: sumContext.latestProjectHealth,
    latestMilestoneSummary: sumContext.latestMilestoneSummary,
    latestRiskSummary: sumContext.latestRiskSummary,
    portfolioHealth: portContext.portfolioHealth,
    portfolioRisks: portContext.portfolioRisks,
    portfolioPriorities: portContext.portfolioPriorities,
    portfolioSummary: portContext.portfolioSummary,
  };
}

export function decisionContextKey(ctx: DecisionContext): string {
  return [
    ctx.intent,
    ctx.currentPhase,
    ctx.missingCapabilities.length,
    ctx.blockedItems.length,
    ctx.riskFacts.length,
  ].join('|');
}
