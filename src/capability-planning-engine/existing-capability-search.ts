/**
 * Capability Planning Engine Era 3 — existing capability search.
 */

import { listCapabilityUniverse, searchCapabilityUniverse } from './capability-planning-registry.js';
import type {
  CapabilityRecord,
  ExistingCapabilityMatchType,
  ExistingCapabilitySearchResult,
  RequiredCapability,
} from './capability-planning-types.js';

function nameSimilarity(a: string, b: string): number {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 1;
  if (al.includes(bl) || bl.includes(al)) return 0.85;
  const aTokens = al.split(/\s+/);
  const bTokens = bl.split(/\s+/);
  const overlap = aTokens.filter((t) => bTokens.some((bt) => bt.includes(t) || t.includes(bt))).length;
  return overlap / Math.max(aTokens.length, bTokens.length, 1);
}

function classifyMatch(record: CapabilityRecord | null, confidence: number): ExistingCapabilityMatchType {
  if (!record) return 'MISSING';
  if (record.status === 'BLOCKED' || record.status === 'REQUIRES_HUMAN_REVIEW') return 'INCOMPATIBLE';
  if (record.status === 'VALIDATED') return confidence >= 0.75 ? 'VALIDATED' : 'INCOMPLETE';
  if (record.status === 'AVAILABLE_WITH_LIMITATIONS' || record.status === 'COMPOSED') return 'INCOMPLETE';
  if (record.status === 'GENERATED_PENDING_VALIDATION') return 'UNVALIDATED';
  return 'MISSING';
}

function findBestMatch(required: RequiredCapability): CapabilityRecord | null {
  const candidates = searchCapabilityUniverse(required.name);
  const universe = candidates.length ? candidates : listCapabilityUniverse();
  let best: CapabilityRecord | null = null;
  let bestScore = 0;

  for (const record of universe) {
    const score = Math.max(
      nameSimilarity(required.name, record.name),
      ...record.supportedRequirementCategories.map((cat) =>
        required.category === cat ? 0.8 : 0,
      ),
    );
    if (score > bestScore) {
      bestScore = score;
      best = record;
    }
  }

  return bestScore >= 0.55 ? best : null;
}

export function searchExistingCapabilities(
  requiredCapabilities: readonly RequiredCapability[],
): ExistingCapabilitySearchResult[] {
  return requiredCapabilities.map((required) => {
    const matchedCapability = findBestMatch(required);
    const matchConfidence = matchedCapability
      ? Math.max(nameSimilarity(required.name, matchedCapability.name), matchedCapability.reuseConfidence * 0.9)
      : 0;
    const matchType = classifyMatch(matchedCapability, matchConfidence);
    const coveragePercentage =
      matchType === 'VALIDATED' ? 1 :
      matchType === 'INCOMPLETE' ? 0.75 :
      matchType === 'UNVALIDATED' ? 0.5 :
      matchType === 'INCOMPATIBLE' ? 0.2 : 0;

    return {
      readOnly: true,
      requiredCapability: required,
      matchedCapability,
      matchType,
      matchConfidence: Math.round(matchConfidence * 100) / 100,
      coveragePercentage,
    };
  });
}
