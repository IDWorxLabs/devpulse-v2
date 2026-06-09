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
import {
  isBroadProjectQuestion,
  isPlanningNotImpactQuestion,
} from './question-understanding-engine.js';
import {
  getCapabilityDetector,
  isDecisionQuestion,
  isTimelineQuestion,
} from './capability-routing-detectors.js';
import { CONTEXT_CAPABILITY_MAP, COMPANION_ROUTE_ENTRIES } from './capability-routing-table.js';
import { queryCapabilityRouteIndex } from './capability-route-index.js';
import {
  clearRoutingPerformanceCache,
  getCachedRoutingDecision,
  setCachedRoutingDecision,
  type CachedRoutingDecision,
} from './routing-performance-cache.js';

export interface CapabilitySelectionResult extends CachedRoutingDecision {}

function buildRoutingCacheKey(
  question: string,
  dimensions: QuestionDimension[],
  contextNeeds: ContextNeed[],
  reasoningModes: ReasoningMode[],
): string {
  const normalizedQuestion = question.trim().toLowerCase().replace(/\s+/g, ' ');
  const sortedContext = [...contextNeeds].sort().join(',');
  const sortedDimensions = [...dimensions].sort().join(',');
  const sortedModes = [...reasoningModes].sort().join(',');
  return `${normalizedQuestion}|${sortedContext}|${sortedDimensions}|${sortedModes}`;
}

function applyCompanionRoutes(question: string, selected: Set<SelectedCapability>): void {
  for (const entry of COMPANION_ROUTE_ENTRIES) {
    const detector = getCapabilityDetector(entry.detectorKey);
    if (!detector(question)) continue;
    for (const cap of entry.companions) {
      selected.add(cap);
    }
  }
}

function resolvePrimaryRoute(
  question: string,
  selectedList: SelectedCapability[],
  unavailable: Set<SelectedCapability>,
): Pick<CapabilitySelectionResult, 'primaryCapability' | 'secondaryCapabilities' | 'routingReason'> | null {
  for (const route of queryCapabilityRouteIndex({ kind: 'priorityOrder' })) {
    const detector = getCapabilityDetector(route.detectorKey);
    if (!detector(question)) continue;

    const primary = route.capabilityId;
    return {
      primaryCapability: primary,
      secondaryCapabilities: selectedList.filter((c) => c !== primary),
      routingReason: route.routingReason,
    };
  }
  return null;
}

export function selectCapabilities(
  question: string,
  dimensions: QuestionDimension[],
  contextNeeds: ContextNeed[],
  reasoningModes: ReasoningMode[],
): CapabilitySelectionResult {
  const cacheKey = buildRoutingCacheKey(question, dimensions, contextNeeds, reasoningModes);
  const cached = getCachedRoutingDecision(cacheKey);
  if (cached) return cached;

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

  applyCompanionRoutes(question, selected);

  if (dimensions.includes('SYSTEM') && !isBroadProjectQuestion(question, dimensions)) {
    selected.add('SYSTEM_AWARENESS');
  }

  if (dimensions.includes('EXECUTION') && !unavailable.has('EXECUTION_REASONING')) {
    unavailable.add('EXECUTION_REASONING');
  }

  if (reasoningModes.includes('RISK_ASSESSMENT') || reasoningModes.includes('PRIORITIZATION')) {
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    if (isDecisionQuestion(question)) {
      selected.add('UNIFIED_DECISION_LAYER');
    }
  }

  if (reasoningModes.includes('PLANNING')) {
    selected.add('PROJECT_KNOWLEDGE_REASONING');
    if (isDecisionQuestion(question)) {
      selected.add('UNIFIED_DECISION_LAYER');
    }
  }

  const selectedList = [...selected];

  const tablePrimary = resolvePrimaryRoute(question, selectedList, unavailable);
  if (tablePrimary) {
    const result: CapabilitySelectionResult = {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      ...tablePrimary,
    };
    setCachedRoutingDecision(cacheKey, result);
    return result;
  }

  if (isBroadProjectQuestion(question, dimensions)) {
    const primary: SelectedCapability = 'PROJECT_KNOWLEDGE_REASONING';
    const result: CapabilitySelectionResult = {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: selectedList.filter((c) => c !== primary),
      routingReason:
        'Broad project understanding question — route through Project Knowledge Reasoning with available facts.',
    };
    setCachedRoutingDecision(cacheKey, result);
    return result;
  }

  if (selected.has('SHARED_MEMORY_RECALL') && dimensions.includes('MEMORY')) {
    const primary: SelectedCapability = 'SHARED_MEMORY_RECALL';
    const result: CapabilitySelectionResult = {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: selectedList.filter((c) => c !== primary),
      routingReason: 'Memory recall question — route through Shared Memory layer.',
    };
    setCachedRoutingDecision(cacheKey, result);
    return result;
  }

  if (selected.has('CROSS_SYSTEM_AWARENESS') && crossSystemExplicit) {
    const primary: SelectedCapability = 'CROSS_SYSTEM_AWARENESS';
    const result: CapabilitySelectionResult = {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: selectedList.filter((c) => c !== primary),
      routingReason: 'Cross-system relationship/dependency/impact — route through Cross-System Awareness.',
    };
    setCachedRoutingDecision(cacheKey, result);
    return result;
  }

  if (selected.has('PROJECT_KNOWLEDGE_REASONING')) {
    const primary: SelectedCapability = 'PROJECT_KNOWLEDGE_REASONING';
    const result: CapabilitySelectionResult = {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: selectedList.filter((c) => c !== primary),
      routingReason: 'Project facts can answer this question — Project Knowledge Reasoning primary.',
    };
    setCachedRoutingDecision(cacheKey, result);
    return result;
  }

  if (selected.has('ROADMAP_AWARENESS')) {
    const primary: SelectedCapability = 'ROADMAP_AWARENESS';
    const result: CapabilitySelectionResult = {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: selectedList.filter((c) => c !== primary),
      routingReason: 'Roadmap-oriented question — combine roadmap awareness with project facts.',
    };
    setCachedRoutingDecision(cacheKey, result);
    return result;
  }

  if (selectedList.length > 0) {
    const primary = selectedList[0] ?? null;
    const result: CapabilitySelectionResult = {
      selectedCapabilities: selectedList,
      unavailableCapabilities: [...unavailable],
      primaryCapability: primary,
      secondaryCapabilities: selectedList.slice(1),
      routingReason: 'Selected capabilities from context needs and dimensions.',
    };
    setCachedRoutingDecision(cacheKey, result);
    return result;
  }

  const fallback: CapabilitySelectionResult = {
    selectedCapabilities: [],
    unavailableCapabilities: [...unavailable],
    primaryCapability: null,
    secondaryCapabilities: [],
    routingReason: 'No capability selected — generic fallback may apply if no facts apply.',
  };
  setCachedRoutingDecision(cacheKey, fallback);
  return fallback;
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

export function clearCapabilitySelectionCacheForTests(): void {
  clearRoutingPerformanceCache();
}
