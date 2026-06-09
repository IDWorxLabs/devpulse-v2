/**
 * Select existing engine capabilities for routing.
 */

import type {
  ContextNeed,
  QuestionDimension,
  ReasoningMode,
  SelectedCapability,
} from './general-question-types.js';
import { UNAVAILABLE_CAPABILITIES } from './general-question-types.js';
import { isBroadProjectQuestion, isPlanningNotImpactQuestion } from './question-understanding-engine.js';
import { isTimelineQuestion } from '../../timeline-intelligence/timeline-types.js';

const CONTEXT_CAPABILITY_MAP: Partial<Record<ContextNeed, SelectedCapability>> = {
  PROJECT_PROFILE: 'PROJECT_UNDERSTANDING',
  PROJECT_FACTS: 'PROJECT_KNOWLEDGE_REASONING',
  RISK_FACTS: 'PROJECT_KNOWLEDGE_REASONING',
  MISSING_CAPABILITIES: 'PROJECT_KNOWLEDGE_REASONING',
  BLOCKERS: 'PROJECT_KNOWLEDGE_REASONING',
  SHARED_MEMORY: 'SHARED_MEMORY_RECALL',
  CROSS_SYSTEM_RELATIONSHIPS: 'CROSS_SYSTEM_AWARENESS',
  ROADMAP_STATE: 'ROADMAP_AWARENESS',
  OWNERSHIP_REGISTRY: 'SYSTEM_AWARENESS',
  RUNTIME_STATUS: 'PROJECT_KNOWLEDGE_REASONING',
  DEVELOPMENT_KNOWLEDGE: 'DEVELOPMENT_REASONING',
  DEBUG_CONTEXT: 'DEBUGGING_REASONING',
  TIMELINE_STATE: 'TIMELINE_INTELLIGENCE',
};

export interface CapabilitySelectionResult {
  selectedCapabilities: SelectedCapability[];
  unavailableCapabilities: SelectedCapability[];
  primaryCapability: SelectedCapability | null;
  secondaryCapabilities: SelectedCapability[];
  routingReason: string;
}

export function selectCapabilities(
  question: string,
  dimensions: QuestionDimension[],
  contextNeeds: ContextNeed[],
  reasoningModes: ReasoningMode[],
): CapabilitySelectionResult {
  const lower = question.toLowerCase();
  const selected = new Set<SelectedCapability>();
  const unavailable = new Set<SelectedCapability>();

  for (const need of contextNeeds) {
    const cap = CONTEXT_CAPABILITY_MAP[need];
    if (!cap) continue;
    if (UNAVAILABLE_CAPABILITIES.includes(cap)) {
      unavailable.add(cap);
    } else {
      selected.add(cap);
    }
  }

  if (isBroadProjectQuestion(question, dimensions)) {
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    selected.add('PROJECT_UNDERSTANDING');
  }

  if (dimensions.includes('MEMORY') || lower.includes('remember') || lower.includes('recall')) {
    selected.add('SHARED_MEMORY_RECALL');
  }

  const crossSystemExplicit =
    (dimensions.includes('DEPENDENCY') || dimensions.includes('IMPACT')) &&
    !isPlanningNotImpactQuestion(question) &&
    (lower.includes('depend') ||
      lower.includes('impact') ||
      lower.includes('relationship') ||
      lower.includes('connected to'));

  if (crossSystemExplicit) {
    selected.add('CROSS_SYSTEM_AWARENESS');
  }

  if (dimensions.includes('ROADMAP') || lower.includes('roadmap') || lower.includes('phase')) {
    selected.add('ROADMAP_AWARENESS');
  }

  if (isTimelineQuestion(question) && !isPlanningNotImpactQuestion(question)) {
    selected.add('TIMELINE_INTELLIGENCE');
  }

  if (dimensions.includes('SYSTEM') && !isBroadProjectQuestion(question, dimensions)) {
    selected.add('SYSTEM_AWARENESS');
  }

  if (dimensions.includes('EXECUTION') && !unavailable.has('EXECUTION_REASONING')) {
    unavailable.add('EXECUTION_REASONING');
  }

  if (reasoningModes.includes('RISK_ASSESSMENT') || reasoningModes.includes('PRIORITIZATION')) {
    selected.add('PROJECT_KNOWLEDGE_REASONING');
  }

  if (reasoningModes.includes('PLANNING')) {
    selected.add('PROJECT_KNOWLEDGE_REASONING');
  }

  const selectedList = [...selected];
  let primary: SelectedCapability | null = null;
  let secondary: SelectedCapability[] = [];

  if (isTimelineQuestion(question) && !isPlanningNotImpactQuestion(question)) {
    primary = 'TIMELINE_INTELLIGENCE';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Timeline-oriented question — route through Timeline Intelligence for past/present/future understanding.',
    };
  }

  if (isBroadProjectQuestion(question, dimensions)) {
    primary = 'PROJECT_KNOWLEDGE_REASONING';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason:
        'Broad project understanding question — route through Project Knowledge Reasoning with available facts.',
    };
  }

  if (selected.has('SHARED_MEMORY_RECALL') && dimensions.includes('MEMORY')) {
    primary = 'SHARED_MEMORY_RECALL';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Memory recall question — route through Shared Memory layer.',
    };
  }

  if (selected.has('CROSS_SYSTEM_AWARENESS') && crossSystemExplicit) {
    primary = 'CROSS_SYSTEM_AWARENESS';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Cross-system relationship/dependency/impact — route through Cross-System Awareness.',
    };
  }

  if (selected.has('PROJECT_KNOWLEDGE_REASONING')) {
    primary = 'PROJECT_KNOWLEDGE_REASONING';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Project facts can answer this question — Project Knowledge Reasoning primary.',
    };
  }

  if (selected.has('ROADMAP_AWARENESS')) {
    primary = 'ROADMAP_AWARENESS';
    secondary = selectedList.filter((c) => c !== primary);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Roadmap-oriented question — combine roadmap awareness with project facts.',
    };
  }

  if (selectedList.length > 0) {
    primary = selectedList[0] ?? null;
    secondary = selectedList.slice(1);
    return {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: secondary,
      routingReason: 'Selected capabilities from context needs and dimensions.',
    };
  }

  return {
    selectedCapabilities: [],
    unavailableCapabilities: [...unavailable],
    primaryCapability: null,
    secondaryCapabilities: [],
    routingReason: 'No capability selected — generic fallback may apply if no facts apply.',
  };
}

export function computeRoutingConfidence(
  dimensions: QuestionDimension[],
  selectedCapabilities: SelectedCapability[],
): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (dimensions.includes('UNKNOWN') && selectedCapabilities.length === 0) return 'LOW';
  if (selectedCapabilities.includes('PROJECT_KNOWLEDGE_REASONING')) return 'HIGH';
  if (selectedCapabilities.length >= 2) return 'MEDIUM';
  if (selectedCapabilities.length === 1) return 'MEDIUM';
  return 'LOW';
}
