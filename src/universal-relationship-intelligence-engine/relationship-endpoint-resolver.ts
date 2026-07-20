/**
 * Universal Relationship Intelligence Engine V1 — endpoint resolution.
 */

import type { ApprovedModulePlan } from '../contract-bound-generation-authority-v4/approved-module-plan.js';
import type { CbgaCanonicalContractEvidence } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { NormalizedApprovedRelationship } from './relationship-normalization-engine.js';

export interface ResolvedRelationshipEndpoints {
  readonly sourceModuleId: string;
  readonly targetModuleId: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly sourceRoute: string;
  readonly targetRoute: string;
  readonly resolved: boolean;
  readonly ambiguityReason?: string;
}

export function resolveRelationshipEndpoints(
  normalized: NormalizedApprovedRelationship,
  modulePlan: ApprovedModulePlan,
  contract?: CbgaCanonicalContractEvidence,
): ResolvedRelationshipEndpoints {
  const source = resolveEntityToModule(normalized.sourceEntityLabel, modulePlan, contract);
  const target =
    normalized.cardinality === 'SELF_REFERENTIAL' || normalized.cardinality === 'PARENT_CHILD'
      ? source
      : resolveEntityToModule(normalized.targetEntityLabel, modulePlan, contract);

  if (!source || !target) {
    return {
      sourceModuleId: source?.moduleId ?? normalized.sourceEntityLabel,
      targetModuleId: target?.moduleId ?? normalized.targetEntityLabel,
      sourceEntityId: source?.moduleId ?? normalized.sourceEntityLabel,
      targetEntityId: target?.moduleId ?? normalized.targetEntityLabel,
      sourceRoute: source?.route ?? '/',
      targetRoute: target?.route ?? '/',
      resolved: false,
      ambiguityReason: !source ? 'missing_source_entity' : 'missing_target_entity',
    };
  }

  return {
    sourceModuleId: source.moduleId,
    targetModuleId: target.moduleId,
    sourceEntityId: source.moduleId,
    targetEntityId: target.moduleId,
    sourceRoute: source.route,
    targetRoute: target.route,
    resolved: true,
  };
}

function resolveEntityToModule(
  entityLabel: string,
  modulePlan: ApprovedModulePlan,
  contract?: CbgaCanonicalContractEvidence,
): { moduleId: string; route: string } | null {
  const tokens = tokenize(entityLabel);
  if (tokens.length === 0) return null;

  // Contract-assisted resolution: map the label to its most-similar contract core entity, then to
  // the module most similar to THAT entity. Both selections take the maximum-scoring candidate
  // rather than the first past a threshold, so a label like "Stock Adjustments" can never be
  // captured by an earlier-listed sibling ("Stock Records") that merely shares a token.
  if (contract) {
    let bestEntity: { entity: string; sim: number } | null = null;
    for (const entity of contract.coreEntities) {
      const sim = similarity(entityLabel, entity);
      if (sim >= 0.55 && (!bestEntity || sim > bestEntity.sim)) bestEntity = { entity, sim };
    }
    if (bestEntity) {
      let bestVia: { moduleId: string; route: string; score: number } | null = null;
      for (const entry of modulePlan.moduleEntries) {
        const s = Math.max(
          similarity(entry.displayName, bestEntity.entity),
          similarity(entry.moduleId.replace(/-/g, ' '), bestEntity.entity),
        );
        if (s >= 0.4 && (!bestVia || s > bestVia.score)) {
          bestVia = { moduleId: entry.moduleId, route: entry.route, score: s };
        }
      }
      if (bestVia) return { moduleId: bestVia.moduleId, route: bestVia.route };
    }
  }

  // Direct token resolution. Score = fraction of the label's tokens that match the module, where an
  // exact token match counts fully (1.0), a shared 4-char prefix partially (0.6), and a bare
  // moduleId substring weakly (0.5). Normalizing by the label's token count lets a module that
  // matches MORE of the label ("stock" + "adjustment" → stock-adjustments) outscore one that only
  // shares a prefix ("stock" → stock-records), instead of both saturating a flat ceiling and being
  // decided by iteration order.
  let best: { moduleId: string; route: string; score: number } | null = null;
  for (const entry of modulePlan.moduleEntries) {
    const moduleTokens = new Set<string>([
      ...tokenize(entry.moduleId.replace(/-/g, ' ')),
      ...tokenize(entry.displayName),
    ]);
    const moduleIdCompact = entry.moduleId.replace(/-/g, '');
    let matched = 0;
    for (const token of tokens) {
      let strength = 0;
      for (const mt of moduleTokens) {
        if (mt === token) {
          strength = 1;
          break;
        }
        if (
          mt.startsWith(token.slice(0, Math.min(4, token.length))) ||
          token.startsWith(mt.slice(0, Math.min(4, mt.length)))
        ) {
          strength = Math.max(strength, 0.6);
        }
      }
      if (strength < 0.5 && moduleIdCompact.includes(token)) strength = 0.5;
      matched += strength;
    }
    let score = matched / tokens.length;

    // Exact whole-label equality (against either the moduleId or displayName) is decisive.
    const normalizedLabel = tokens.join(' ');
    if (
      normalizedLabel === tokenize(entry.moduleId.replace(/-/g, ' ')).join(' ') ||
      normalizedLabel === tokenize(entry.displayName).join(' ')
    ) {
      score = 1;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { moduleId: entry.moduleId, route: entry.route, score };
    }
  }

  return best && best.score >= 0.45 ? { moduleId: best.moduleId, route: best.route } : null;
}

function similarity(a: string, b: string): number {
  return overlapScore(tokenize(a), tokenize(b));
}

function tokenize(value: string): string[] {
  const singular = (word: string) => (word.endsWith('s') && word.length > 3 ? word.slice(0, -1) : word);
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .split(/[\s-]+/)
    .map((t) => singular(t))
    .filter((t) => t.length > 2);
}

function overlapScore(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const hits = a.filter((t) => setB.has(t)).length;
  return hits / Math.max(a.length, b.length);
}
