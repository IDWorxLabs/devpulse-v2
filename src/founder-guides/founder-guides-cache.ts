/**
 * Founder Guides — bounded lookup cache.
 */

import type {
  CheckpointGuideAnalysis,
  EvolutionGuideAnalysis,
  FounderGuidesEvaluation,
  ModificationSafetyGuideAnalysis,
  RoadmapGuideAnalysis,
  SystemNavigationGuideAnalysis,
  UnifiedFounderGuidesAuthority,
} from './founder-guides-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const roadmapCache = new Map<string, RoadmapGuideAnalysis>();
const checkpointCache = new Map<string, CheckpointGuideAnalysis>();
const navigationCache = new Map<string, SystemNavigationGuideAnalysis>();
const safetyCache = new Map<string, ModificationSafetyGuideAnalysis>();
const evolutionCache = new Map<string, EvolutionGuideAnalysis>();
const authorityCache = new Map<string, UnifiedFounderGuidesAuthority>();
const evaluationCache = new Map<string, FounderGuidesEvaluation>();

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

export function getCachedRoadmapAnalysis(key: string): RoadmapGuideAnalysis | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedRoadmapAnalysis(key: string, value: RoadmapGuideAnalysis): void {
  setCached(roadmapCache, key, value);
}

export function getCachedCheckpointAnalysis(key: string): CheckpointGuideAnalysis | undefined {
  return getCached(checkpointCache, key);
}

export function setCachedCheckpointAnalysis(key: string, value: CheckpointGuideAnalysis): void {
  setCached(checkpointCache, key, value);
}

export function getCachedNavigationAnalysis(key: string): SystemNavigationGuideAnalysis | undefined {
  return getCached(navigationCache, key);
}

export function setCachedNavigationAnalysis(key: string, value: SystemNavigationGuideAnalysis): void {
  setCached(navigationCache, key, value);
}

export function getCachedSafetyAnalysis(key: string): ModificationSafetyGuideAnalysis | undefined {
  return getCached(safetyCache, key);
}

export function setCachedSafetyAnalysis(key: string, value: ModificationSafetyGuideAnalysis): void {
  setCached(safetyCache, key, value);
}

export function getCachedEvolutionAnalysis(key: string): EvolutionGuideAnalysis | undefined {
  return getCached(evolutionCache, key);
}

export function setCachedEvolutionAnalysis(key: string, value: EvolutionGuideAnalysis): void {
  setCached(evolutionCache, key, value);
}

export function getCachedFounderGuidesAuthority(key: string): UnifiedFounderGuidesAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFounderGuidesAuthority(key: string, value: UnifiedFounderGuidesAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFounderGuidesEvaluation(key: string): FounderGuidesEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedFounderGuidesEvaluation(key: string, value: FounderGuidesEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getFounderGuidesCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetFounderGuidesCacheForTests(): void {
  roadmapCache.clear();
  checkpointCache.clear();
  navigationCache.clear();
  safetyCache.clear();
  evolutionCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
