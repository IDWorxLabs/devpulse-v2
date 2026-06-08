/**
 * Brain request classifier — deterministic local classification only.
 */

import type { BrainClassification, BrainRequestCategory, BrainRequestInput } from './brain-types.js';
import { BRAIN_REQUEST_CATEGORIES } from './brain-types.js';

const CATEGORY_PATTERNS: Array<{ category: BrainRequestCategory; patterns: string[] }> = [
  { category: 'IMPACT', patterns: ['what breaks if', 'what would break', 'what happens if', 'disappeared', 'disappear', 'if trust engine', 'if operator feed', 'if world 2'] },
  { category: 'DEPENDENCY', patterns: ['what systems depend', 'systems depend on', 'what depends on', 'depends on', 'depend on', 'what relies on', 'relies on', 'rely on', 'downstream of'] },
  { category: 'RELATIONSHIP', patterns: ['how does', 'connect to', 'connects to', 'relationship between', 'relate to', 'link between', 'how do'] },
  { category: 'ROADMAP', patterns: ['what should we build', 'build next', 'next phase', 'roadmap', 'what next', 'what should we do next'] },
  { category: 'STATUS', patterns: ['how mature', 'maturity', 'status', 'complete', 'ready', 'what exists', 'what phase'] },
  { category: 'RISK', patterns: ['risk', 'danger', 'unsafe', 'will this break', 'concern'] },
  { category: 'SYSTEM', patterns: ['explain', 'trust engine', 'world 2', 'world2', 'governance', 'mobile command', 'self-evolution', 'experience layer', 'what is'] },
  { category: 'PROJECT', patterns: ['project', 'project idea', 'workspace', 'build it', 'can i type'] },
  { category: 'ARCHITECTURE', patterns: ['architecture', 'duplication', 'duplicate', 'ownership', 'registry', 'design'] },
];

export function classificationKey(classification: BrainClassification): string {
  return `${classification.category}:${classification.confidence}:${classification.matchedSignals.join(',')}`;
}

export function classifyBrainRequest(input: BrainRequestInput): BrainClassification {
  const lower = input.message.toLowerCase().trim();
  const matchedSignals: string[] = [];

  for (const mapping of CATEGORY_PATTERNS) {
    for (const pattern of mapping.patterns) {
      if (lower.includes(pattern)) {
        matchedSignals.push(pattern);
        return {
          category: mapping.category,
          confidence: matchedSignals.length >= 2 ? 'HIGH' : 'HIGH',
          matchedSignals,
          reason: `Matched ${mapping.category} signal: "${pattern}"`,
        };
      }
    }
  }

  return {
    category: 'GENERAL',
    confidence: 'LOW',
    matchedSignals: ['general inquiry'],
    reason: 'No specific category signal — classified as GENERAL',
  };
}

export function isKnownCategory(category: string): category is BrainRequestCategory {
  return (BRAIN_REQUEST_CATEGORIES as readonly string[]).includes(category);
}

export function isRoadmapQuestion(message: string): boolean {
  return classifyBrainRequest({ message }).category === 'ROADMAP';
}

export function isSystemQuestion(message: string): boolean {
  return classifyBrainRequest({ message }).category === 'SYSTEM';
}

export function isArchitectureQuestion(message: string): boolean {
  return classifyBrainRequest({ message }).category === 'ARCHITECTURE';
}

export function isRelationshipQuestion(message: string): boolean {
  return classifyBrainRequest({ message }).category === 'RELATIONSHIP';
}

export function isDependencyQuestion(message: string): boolean {
  return classifyBrainRequest({ message }).category === 'DEPENDENCY';
}

export function isImpactQuestion(message: string): boolean {
  return classifyBrainRequest({ message }).category === 'IMPACT';
}

export function isCrossSystemQuestion(message: string): boolean {
  const cat = classifyBrainRequest({ message }).category;
  return cat === 'DEPENDENCY' || cat === 'IMPACT' || cat === 'RELATIONSHIP';
}
