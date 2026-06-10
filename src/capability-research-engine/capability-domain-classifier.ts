/**
 * Capability Research Engine — domain classifier.
 */

import type { CapabilityDomain, CapabilityResearchInput, DomainClassificationResult } from './capability-research-types.js';
import { getCachedDomainClassification, setCachedDomainClassification } from './capability-research-cache.js';

let domainClassificationCount = 0;

const DOMAIN_SIGNALS: Record<CapabilityDomain, string[]> = {
  BUILDING: ['build', 'builder', 'construction', 'parallel_build'],
  TESTING: ['test', 'testing', 'autonomous_testing'],
  FIXING: ['fix', 'fixing', 'autonomous_fixing', 'recovery'],
  VERIFICATION: ['verify', 'verification', 'uvl', 'evidence'],
  COMPLETION: ['completion', 'complete', 'finish'],
  MONITORING: ['monitor', 'monitoring', 'feed', 'alert'],
  ORCHESTRATION: ['orchestrat', 'schedule', 'pipeline'],
  RESOURCE_MANAGEMENT: ['resource', 'allocation', 'capacity'],
  WORKSPACE_MANAGEMENT: ['workspace', 'isolation', 'hosting'],
  WORLD2: ['world2', 'world 2', 'simulation'],
  TRUST: ['trust', 'confidence', 'authority'],
  DIAGNOSTICS: ['diagnostic', 'debug', 'trace', 'log'],
  PERFORMANCE: ['performance', 'bottleneck', 'slow', 'optimizer'],
  SELF_EVOLUTION: ['self evolution', 'self evolving', 'capability gap', 'missing capability'],
};

export function classifyCapabilityDomain(input: CapabilityResearchInput): DomainClassificationResult {
  const cacheKey = [
    input.proposedCapability ?? '',
    input.subsystem ?? '',
    (input.signals ?? []).join(','),
    input.escalationDecision ?? '',
  ].join('|');

  const cached = getCachedDomainClassification(cacheKey);
  if (cached) return cached;

  domainClassificationCount += 1;

  const haystack = [
    input.proposedCapability ?? '',
    input.subsystem ?? '',
    ...(input.signals ?? []),
    input.escalationDecision ?? '',
  ].join(' ').toLowerCase();

  let bestDomain: CapabilityDomain = 'ORCHESTRATION';
  let bestScore = 0;

  for (const [domain, signals] of Object.entries(DOMAIN_SIGNALS) as [CapabilityDomain, string[]][]) {
    let score = 0;
    for (const signal of signals) {
      if (haystack.includes(signal)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }

  if (bestScore === 0) {
    bestDomain = 'ORCHESTRATION';
  }

  const confidence = bestScore > 0 ? Math.min(95, 40 + bestScore * 15) : 20;

  const result: DomainClassificationResult = { domain: bestDomain, confidence };
  setCachedDomainClassification(cacheKey, result);
  return result;
}

export function getDomainClassificationCount(): number {
  return domainClassificationCount;
}

export function resetDomainClassifierForTests(): void {
  domainClassificationCount = 0;
}
