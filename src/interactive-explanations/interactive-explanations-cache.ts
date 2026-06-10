/**
 * Interactive Explanations — bounded lookup cache.
 */

import type {
  InteractiveExplanationsEvaluation,
  NextStepGuidanceAnalysis,
  ReasoningExplanationAnalysis,
  ReportInterpretationAnalysis,
  SystemExplanationAnalysis,
  UnifiedInteractiveExplanationsAuthority,
  WorkflowExplanationAnalysis,
} from './interactive-explanations-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const systemCache = new Map<string, SystemExplanationAnalysis>();
const workflowCache = new Map<string, WorkflowExplanationAnalysis>();
const reasoningCache = new Map<string, ReasoningExplanationAnalysis>();
const reportCache = new Map<string, ReportInterpretationAnalysis>();
const guidanceCache = new Map<string, NextStepGuidanceAnalysis>();
const authorityCache = new Map<string, UnifiedInteractiveExplanationsAuthority>();
const evaluationCache = new Map<string, InteractiveExplanationsEvaluation>();

function trimCache<T>(map: Map<string, T>): void {
  if (map.size <= MAX_CACHE_ENTRIES) return;
  const keys = [...map.keys()];
  const evict = keys.length - MAX_CACHE_ENTRIES;
  for (let i = 0; i < evict; i++) {
    map.delete(keys[i]);
    cacheEvictions += 1;
  }
}

function getCached<T>(map: Map<string, T>, key: string): T | undefined {
  const cached = map.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

function setCached<T>(map: Map<string, T>, key: string, value: T): void {
  map.set(key, value);
  trimCache(map);
}

export function getCachedSystemExplanation(key: string): SystemExplanationAnalysis | undefined {
  return getCached(systemCache, key);
}

export function setCachedSystemExplanation(key: string, value: SystemExplanationAnalysis): void {
  setCached(systemCache, key, value);
}

export function getCachedWorkflowExplanation(key: string): WorkflowExplanationAnalysis | undefined {
  return getCached(workflowCache, key);
}

export function setCachedWorkflowExplanation(key: string, value: WorkflowExplanationAnalysis): void {
  setCached(workflowCache, key, value);
}

export function getCachedReasoningExplanation(key: string): ReasoningExplanationAnalysis | undefined {
  return getCached(reasoningCache, key);
}

export function setCachedReasoningExplanation(key: string, value: ReasoningExplanationAnalysis): void {
  setCached(reasoningCache, key, value);
}

export function getCachedReportInterpretation(key: string): ReportInterpretationAnalysis | undefined {
  return getCached(reportCache, key);
}

export function setCachedReportInterpretation(key: string, value: ReportInterpretationAnalysis): void {
  setCached(reportCache, key, value);
}

export function getCachedNextStepGuidance(key: string): NextStepGuidanceAnalysis | undefined {
  return getCached(guidanceCache, key);
}

export function setCachedNextStepGuidance(key: string, value: NextStepGuidanceAnalysis): void {
  setCached(guidanceCache, key, value);
}

export function getCachedInteractiveExplanationsAuthority(
  key: string,
): UnifiedInteractiveExplanationsAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedInteractiveExplanationsAuthority(
  key: string,
  value: UnifiedInteractiveExplanationsAuthority,
): void {
  setCached(authorityCache, key, value);
}

export function getCachedInteractiveExplanationsEvaluation(
  key: string,
): InteractiveExplanationsEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedInteractiveExplanationsEvaluation(
  key: string,
  value: InteractiveExplanationsEvaluation,
): void {
  setCached(evaluationCache, key, value);
}

export function getInteractiveExplanationsCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetInteractiveExplanationsCacheForTests(): void {
  systemCache.clear();
  workflowCache.clear();
  reasoningCache.clear();
  reportCache.clear();
  guidanceCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
