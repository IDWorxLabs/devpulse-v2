/**
 * Decision answer composer — structured advisory response format.
 */

import { riskLevelLabel } from './decision-risk-evaluator.js';
import type { DecisionAnswer, DecisionContext, DecisionRecommendation } from './decision-types.js';

export function composeDecisionAnswer(
  context: DecisionContext,
  recommendation: DecisionRecommendation,
): DecisionAnswer {
  const lines: string[] = [
    'Unified Decision Layer Response',
    '',
    'Recommendation:',
    recommendation.recommendation,
    '',
    'Why:',
    recommendation.why,
    '',
    'Risk level:',
    riskLevelLabel(recommendation.riskLevel),
    '',
    'Confidence:',
    recommendation.confidence,
    '',
    'Blockers:',
  ];

  if (recommendation.blockers.length === 0) {
    lines.push('None identified for this recommendation.');
  } else {
    for (const blocker of recommendation.blockers) {
      lines.push(`• ${blocker}`);
    }
  }

  lines.push('', 'Supporting facts:');
  if (recommendation.supportingFacts.length === 0) {
    lines.push('• Decision context gathered from project understanding, timeline, and roadmap state.');
  } else {
    for (const fact of recommendation.supportingFacts) {
      lines.push(`• ${fact}`);
    }
  }

  lines.push('', 'Next safe action:');
  lines.push(recommendation.nextSafeAction);

  if (context.dependencyRisks.length > 0 || context.dependencyBlockers.length > 0) {
    lines.push('', 'Dependency context:');
    if (context.dependencyRisks.length > 0) {
      lines.push(`• Highest dependency risk: ${context.dependencyRisks[0]}`);
    }
    if (context.dependencyBlockers.length > 0) {
      lines.push(`• Blocked dependencies: ${context.dependencyBlockers.length}`);
      for (const b of context.dependencyBlockers.slice(0, 3)) {
        lines.push(`  - ${b}`);
      }
    }
    if (context.dependencyPaths.length > 0) {
      lines.push(`• Dependency path: ${context.dependencyPaths[0]}`);
    }
    lines.push(`• Dependency confidence: ${context.dependencyConfidence}`);
  }

  if (context.latestExecutiveSummary.length > 0) {
    lines.push('', 'Summarization context:');
    lines.push(`• Executive: ${context.latestExecutiveSummary.split('\n')[0]}`);
    if (context.latestProjectHealth.length > 0) {
      lines.push(`• Health: ${context.latestProjectHealth.split('\n')[0]}`);
    }
  }

  if (context.portfolioSummary.length > 0) {
    lines.push('', 'Portfolio context:');
    lines.push(`• Health: ${context.portfolioHealth.split('\n')[0]}`);
    if (context.portfolioPriorities.length > 0) {
      lines.push(`• Top priority: ${context.portfolioPriorities[0]}`);
    }
    if (context.portfolioRisks.length > 0) {
      lines.push(`• Top risk: ${context.portfolioRisks[0]}`);
    }
  }

  if (context.recentChanges.length > 0 || context.majorMilestones.length > 0) {
    lines.push('', 'Project history context:');
    lines.push(`• History confidence: ${context.historyConfidence}`);
    if (context.recentChanges.length > 0) {
      lines.push(`• Recent change: ${context.recentChanges[0]}`);
    }
    if (context.rollbackCount > 0) {
      lines.push(`• Rollback events: ${context.rollbackCount}`);
    }
    if (context.phaseTransitionCount > 0) {
      lines.push(`• Phase transitions: ${context.phaseTransitionCount}`);
    }
    for (const m of context.majorMilestones.slice(0, 2)) {
      lines.push(`• Milestone: ${m}`);
    }
  }

  if (context.workspaceRisks.length > 0 || context.contextIsolationWarnings.length > 0) {
    lines.push('', 'Workspace context:');
    lines.push(`• Ownership confidence: ${context.workspaceOwnershipConfidence}`);
    if (context.workspaceMismatchCount > 0) {
      lines.push(`• Workspace mismatches: ${context.workspaceMismatchCount}`);
    }
    for (const warning of context.contextIsolationWarnings.slice(0, 3)) {
      lines.push(`• ${warning}`);
    }
    for (const risk of context.workspaceRisks.slice(0, 2)) {
      lines.push(`• ${risk}`);
    }
  }

  if (recommendation.rankedOptions.length > 1) {
    lines.push('', 'Ranked options (advisory):');
    for (const opt of recommendation.rankedOptions.slice(0, 5)) {
      const status = opt.blocked ? 'BLOCKED' : opt.category;
      lines.push(`• [${status}] ${opt.title} — priority ${opt.priority}`);
    }
  }

  lines.push('');
  lines.push(`Intent: ${context.intent}`);
  lines.push(`Current phase: ${context.currentPhase}`);
  lines.push('Advisory only — no execution performed.');

  const responseText = lines.join('\n').trim();

  return {
    query: context.query,
    intent: context.intent,
    recommendation,
    responseText,
  };
}
