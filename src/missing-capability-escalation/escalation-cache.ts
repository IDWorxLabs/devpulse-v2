/**
 * Missing Capability Escalation — lookup cache.
 */

import type {
  BottleneckPatternResult,
  CapabilityGapAnalysis,
  EscalationDecision,
  FailurePatternResult,
  StallPatternResult,
} from './escalation-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const failureCache = new Map<string, FailurePatternResult>();
const stallCache = new Map<string, StallPatternResult>();
const bottleneckCache = new Map<string, BottleneckPatternResult>();
const decisionCache = new Map<string, EscalationDecision>();
const gapCache = new Map<string, CapabilityGapAnalysis>();

export function getCachedFailurePattern(key: string): FailurePatternResult | undefined {
  const cached = failureCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedFailurePattern(key: string, result: FailurePatternResult): void {
  failureCache.set(key, result);
}

export function getCachedStallPattern(key: string): StallPatternResult | undefined {
  const cached = stallCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedStallPattern(key: string, result: StallPatternResult): void {
  stallCache.set(key, result);
}

export function getCachedBottleneckPattern(key: string): BottleneckPatternResult | undefined {
  const cached = bottleneckCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedBottleneckPattern(key: string, result: BottleneckPatternResult): void {
  bottleneckCache.set(key, result);
}

export function getCachedDecision(key: string): EscalationDecision | undefined {
  const cached = decisionCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedDecision(key: string, decision: EscalationDecision): void {
  decisionCache.set(key, decision);
}

export function getCachedGapAnalysis(key: string): CapabilityGapAnalysis | undefined {
  const cached = gapCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedGapAnalysis(key: string, analysis: CapabilityGapAnalysis): void {
  gapCache.set(key, analysis);
}

export function getEscalationCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetEscalationCacheForTests(): void {
  failureCache.clear();
  stallCache.clear();
  bottleneckCache.clear();
  decisionCache.clear();
  gapCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
