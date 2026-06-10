/**
 * Interactive Explanations — system explanation analyzer.
 */

import type {
  InteractiveExplanationsInput,
  SystemExplanationAnalysis,
} from './interactive-explanations-types.js';
import { getCachedSystemExplanation, setCachedSystemExplanation } from './interactive-explanations-cache.js';

export interface SystemExplanationSnapshot {
  systemCount: number;
  capabilityCount: number;
  domainCount: number;
}

const BASE_SYSTEMS = [
  'systems',
  'capabilities',
  'domains',
  'phases',
  'checkpoints',
  'authority_chains',
] as const;

let systemAnalysisCount = 0;

export function analyzeSystemExplanation(
  input: InteractiveExplanationsInput,
  snapshot: SystemExplanationSnapshot,
): SystemExplanationAnalysis {
  const cacheKey = [
    snapshot.systemCount,
    snapshot.capabilityCount,
    input.missingSystemExplanationGuidance,
    input.missingCapabilityExplanationGuidance,
    ...(input.undocumentedSystems ?? []),
  ].join('|');

  const cached = getCachedSystemExplanation(cacheKey);
  if (cached) return cached;

  systemAnalysisCount += 1;
  const systemWarnings: string[] = [];
  const undocumentedSystems: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingSystemExplanationGuidance, 'missing_system_explanation_guidance', 'systems'],
    [input.missingCapabilityExplanationGuidance, 'missing_capability_explanation_guidance', 'capabilities'],
    [input.missingDomainExplanationGuidance, 'missing_domain_explanation_guidance', 'domains'],
    [input.missingPhaseExplanationGuidance, 'missing_phase_explanation_guidance', 'phases'],
    [input.missingCheckpointExplanationGuidance, 'missing_checkpoint_explanation_guidance', 'checkpoints'],
    [input.missingAuthorityChainExplanationGuidance, 'missing_authority_chain_explanation_guidance', 'authority_chains'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      systemWarnings.push(warning);
      undocumentedSystems.push(area);
      penalty += 9;
    }
  }

  for (const system of input.undocumentedSystems ?? []) {
    if (!undocumentedSystems.includes(system)) {
      undocumentedSystems.push(system);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.systemCount > 0 ? 10 : 0)
    + (snapshot.capabilityCount > 0 ? 9 : 0)
    + (snapshot.domainCount > 0 ? 8 : 0);
  const documented = BASE_SYSTEMS.length - undocumentedSystems.filter(
    (s) => BASE_SYSTEMS.includes(s as typeof BASE_SYSTEMS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_SYSTEMS.length) * 82 + systemBonus);
  const systemCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: SystemExplanationAnalysis = { systemCoverageScore, undocumentedSystems, systemWarnings };
  setCachedSystemExplanation(cacheKey, result);
  return result;
}

export function getSystemAnalysisCount(): number {
  return systemAnalysisCount;
}

export function resetSystemExplanationAnalyzerForTests(): void {
  systemAnalysisCount = 0;
}

export function listBaseSystemAreas(): readonly string[] {
  return BASE_SYSTEMS;
}
