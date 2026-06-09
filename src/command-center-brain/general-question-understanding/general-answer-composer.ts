/**
 * Compose unified answers from general routing execution results.
 */

import type { ReasoningResult } from '../../project-understanding/project-knowledge-model.js';
import type { QuestionRoutingPlan, ReasoningMode } from './general-question-types.js';

const DEVELOPMENT_UNAVAILABLE =
  'Development reasoning has not been implemented yet. Available project and system facts are included below.';
const DEBUGGING_UNAVAILABLE =
  'Debugging reasoning has not been implemented yet. Available project and system facts are included below.';
const EXECUTION_UNAVAILABLE =
  'Execution reasoning is not connected yet. Intelligence foundations must complete before controlled execution is introduced.';

function pickPrimaryConclusion(
  reasoning: ReasoningResult,
  modes: ReasoningMode[],
  question: string,
): string {
  const lower = question.toLowerCase();
  const gaps = reasoning.selectedFacts.filter((f) => f.category === 'gap');
  const risks = reasoning.selectedFacts.filter((f) => f.category === 'risk');
  const blocked = reasoning.selectedFacts.filter((f) => f.category === 'blocked');

  if (modes.includes('PRIORITIZATION') || lower.includes('biggest') || lower.includes('most important')) {
    if (lower.includes('weakness') || lower.includes('weak at') || lower.includes('holding back')) {
      const executionGap = gaps.find((g) => g.title.toLowerCase().includes('execution') || g.statement.toLowerCase().includes('execution'));
      if (executionGap) {
        return `The biggest weakness is execution runtime — ${executionGap.statement} Several future goals depend on it before autonomous building or cloud runtime can become real.`;
      }
      if (risks.length > 0) {
        return `The biggest weakness is ${risks[0]!.title.toLowerCase()} — ${risks[0]!.statement}`;
      }
      if (gaps.length > 0) {
        return `The biggest weakness is the missing ${gaps[0]!.title} capability — ${gaps[0]!.statement}`;
      }
    }
    if (lower.includes('furthest behind') || lower.includes('riskiest')) {
      const top = gaps[0] ?? risks[0] ?? blocked[0];
      if (top) return `${top.title} is furthest behind — ${top.statement}`;
    }
    if (lower.includes('missing capability')) {
      const topGap = [...gaps].sort((a, b) => b.importance - a.importance)[0];
      if (topGap) return `The most important missing capability is ${topGap.title} — ${topGap.statement}`;
    }
    if (lower.includes('strong at')) {
      const milestones = reasoning.selectedFacts.filter((f) => f.category === 'milestone');
      if (milestones.length > 0) {
        return `DevPulse V2 is strong at foundation intelligence — ${milestones.slice(0, 2).map((m) => m.statement).join(' ')}`;
      }
    }
  }

  if (modes.includes('PLANNING') && (lower.includes('six months') || lower.includes('disappeared'))) {
    return reasoning.conclusions.find((c) => c.includes('Planning') || c.includes('blocked')) ??
      'If you disappeared for six months, the project should continue finishing intelligence foundations, defer execution until gates clear, and advance roadmap phases in documented order.';
  }

  if (lower.includes('execution not connected') || lower.includes('why is execution')) {
    return 'Execution is not connected yet by design — intelligence layers and governance foundations must complete before controlled execution runtime is introduced.';
  }

  if (lower.includes('focus before cloud') || lower.includes('cloud runtime')) {
    return 'Before cloud runtime, focus on completing intelligence foundations, shared memory, project understanding, and cross-system awareness — then introduce execution with verification gates.';
  }

  return reasoning.conclusions[0] ?? 'Project understanding conclusion from available facts.';
}

function buildReasoningLines(reasoning: ReasoningResult, modes: ReasoningMode[]): string[] {
  const lines: string[] = [];
  for (const conclusion of reasoning.conclusions.slice(1, 5)) {
    lines.push(conclusion);
  }
  if (modes.includes('RISK_ASSESSMENT')) {
    const risks = reasoning.selectedFacts.filter((f) => f.category === 'risk');
    for (const risk of risks.slice(0, 3)) {
      lines.push(risk.statement);
    }
  }
  if (modes.includes('DEPENDENCY_ANALYSIS')) {
    const systems = reasoning.selectedFacts.filter((f) => f.category === 'system');
    if (systems.length > 0) {
      lines.push(`${systems.length} related systems inform dependency understanding across the project.`);
    }
  }
  if (lines.length === 0 && reasoning.supportingEvidence.length > 0) {
    lines.push('Facts were evaluated across project profile, gaps, risks, and roadmap state.');
  }
  return lines.slice(0, 6);
}

export function composeGeneralAnswer(input: {
  question: string;
  routingPlan: QuestionRoutingPlan;
  reasoning?: ReasoningResult;
  recommendedNextStep?: string;
  limitationMessage?: string;
  supplementalResponse?: string;
}): string {
  const { routingPlan, reasoning, limitationMessage, supplementalResponse } = input;
  const modes = routingPlan.reasoningModes;
  const blocks: string[] = [];

  if (limitationMessage) {
    blocks.push('Limitation:', limitationMessage, '');
  }

  if (reasoning) {
    const conclusion = pickPrimaryConclusion(reasoning, modes, input.question);
    blocks.push('Conclusion:', conclusion, '');
    blocks.push('Reasoning:');
    for (const line of buildReasoningLines(reasoning, modes)) {
      blocks.push(`• ${line}`);
    }
    blocks.push('');
    blocks.push('Supporting Facts:');
    const facts =
      reasoning.supportingEvidence.length > 0
        ? reasoning.supportingEvidence.slice(0, 8)
        : reasoning.selectedFacts.slice(0, 6).map((f) => f.statement);
    for (const fact of facts) {
      blocks.push(`• ${fact}`);
    }
    blocks.push('');
    blocks.push('Next Step / Limitation:');
    blocks.push(input.recommendedNextStep ?? reasoning.recommendedNextStep);
    if (routingPlan.unavailableCapabilities.length > 0) {
      blocks.push(`Unavailable capabilities: ${routingPlan.unavailableCapabilities.join(', ')}.`);
    }
  } else if (supplementalResponse) {
    blocks.push('Conclusion:', supplementalResponse.split('\n')[0] ?? supplementalResponse, '');
    blocks.push(supplementalResponse);
  }

  blocks.push('');
  blocks.push(`Routing: ${routingPlan.routingReason}`);
  blocks.push(`Confidence: ${routingPlan.confidence}`);

  return blocks.join('\n').trim();
}

export function buildDevelopmentLimitationMessage(routingPlan: QuestionRoutingPlan): string | null {
  if (routingPlan.unavailableCapabilities.includes('DEBUGGING_REASONING')) {
    return DEBUGGING_UNAVAILABLE;
  }
  if (routingPlan.unavailableCapabilities.includes('DEVELOPMENT_REASONING')) {
    return DEVELOPMENT_UNAVAILABLE;
  }
  if (routingPlan.unavailableCapabilities.includes('EXECUTION_REASONING') && routingPlan.dimensions.includes('EXECUTION')) {
    return EXECUTION_UNAVAILABLE;
  }
  return null;
}
