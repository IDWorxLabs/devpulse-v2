/**
 * Visual QA Engine — bounded lookup cache.
 */

import type {
  AlignmentConsistencyAnalysis,
  ColorConsistencyAnalysis,
  DesktopVisualAnalysis,
  EmptySpaceUtilizationAnalysis,
  FirstImpressionAnalysis,
  LayoutQualityAnalysis,
  MobileVisualAnalysis,
  ProductProfessionalismAnalysis,
  SpacingConsistencyAnalysis,
  TypographyQualityAnalysis,
  VisualClutterAnalysis,
  VisualHierarchyAnalysis,
  VisualQAAuthority,
  VisualQAEvaluation,
} from './visual-qa-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const hierarchyCache = new Map<string, VisualHierarchyAnalysis>();
const layoutCache = new Map<string, LayoutQualityAnalysis>();
const spacingCache = new Map<string, SpacingConsistencyAnalysis>();
const alignmentCache = new Map<string, AlignmentConsistencyAnalysis>();
const typographyCache = new Map<string, TypographyQualityAnalysis>();
const colorCache = new Map<string, ColorConsistencyAnalysis>();
const clutterCache = new Map<string, VisualClutterAnalysis>();
const emptySpaceCache = new Map<string, EmptySpaceUtilizationAnalysis>();
const mobileCache = new Map<string, MobileVisualAnalysis>();
const desktopCache = new Map<string, DesktopVisualAnalysis>();
const firstImpressionCache = new Map<string, FirstImpressionAnalysis>();
const professionalismCache = new Map<string, ProductProfessionalismAnalysis>();
const authorityCache = new Map<string, VisualQAAuthority>();
const evaluationCache = new Map<string, VisualQAEvaluation>();

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
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

function setCached<T>(map: Map<string, T>, key: string, value: T): void {
  map.set(key, value);
  trimCache(map);
}

export function getCachedVisualHierarchy(key: string): VisualHierarchyAnalysis | undefined {
  return getCached(hierarchyCache, key);
}

export function setCachedVisualHierarchy(key: string, value: VisualHierarchyAnalysis): void {
  setCached(hierarchyCache, key, value);
}

export function getCachedLayoutQuality(key: string): LayoutQualityAnalysis | undefined {
  return getCached(layoutCache, key);
}

export function setCachedLayoutQuality(key: string, value: LayoutQualityAnalysis): void {
  setCached(layoutCache, key, value);
}

export function getCachedSpacingConsistency(key: string): SpacingConsistencyAnalysis | undefined {
  return getCached(spacingCache, key);
}

export function setCachedSpacingConsistency(key: string, value: SpacingConsistencyAnalysis): void {
  setCached(spacingCache, key, value);
}

export function getCachedAlignmentConsistency(key: string): AlignmentConsistencyAnalysis | undefined {
  return getCached(alignmentCache, key);
}

export function setCachedAlignmentConsistency(key: string, value: AlignmentConsistencyAnalysis): void {
  setCached(alignmentCache, key, value);
}

export function getCachedTypographyQuality(key: string): TypographyQualityAnalysis | undefined {
  return getCached(typographyCache, key);
}

export function setCachedTypographyQuality(key: string, value: TypographyQualityAnalysis): void {
  setCached(typographyCache, key, value);
}

export function getCachedColorConsistency(key: string): ColorConsistencyAnalysis | undefined {
  return getCached(colorCache, key);
}

export function setCachedColorConsistency(key: string, value: ColorConsistencyAnalysis): void {
  setCached(colorCache, key, value);
}

export function getCachedVisualClutter(key: string): VisualClutterAnalysis | undefined {
  return getCached(clutterCache, key);
}

export function setCachedVisualClutter(key: string, value: VisualClutterAnalysis): void {
  setCached(clutterCache, key, value);
}

export function getCachedEmptySpaceUtilization(key: string): EmptySpaceUtilizationAnalysis | undefined {
  return getCached(emptySpaceCache, key);
}

export function setCachedEmptySpaceUtilization(key: string, value: EmptySpaceUtilizationAnalysis): void {
  setCached(emptySpaceCache, key, value);
}

export function getCachedMobileVisual(key: string): MobileVisualAnalysis | undefined {
  return getCached(mobileCache, key);
}

export function setCachedMobileVisual(key: string, value: MobileVisualAnalysis): void {
  setCached(mobileCache, key, value);
}

export function getCachedDesktopVisual(key: string): DesktopVisualAnalysis | undefined {
  return getCached(desktopCache, key);
}

export function setCachedDesktopVisual(key: string, value: DesktopVisualAnalysis): void {
  setCached(desktopCache, key, value);
}

export function getCachedFirstImpression(key: string): FirstImpressionAnalysis | undefined {
  return getCached(firstImpressionCache, key);
}

export function setCachedFirstImpression(key: string, value: FirstImpressionAnalysis): void {
  setCached(firstImpressionCache, key, value);
}

export function getCachedProductProfessionalism(key: string): ProductProfessionalismAnalysis | undefined {
  return getCached(professionalismCache, key);
}

export function setCachedProductProfessionalism(key: string, value: ProductProfessionalismAnalysis): void {
  setCached(professionalismCache, key, value);
}

export function getCachedVisualQAAuthority(key: string): VisualQAAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedVisualQAAuthority(key: string, value: VisualQAAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedVisualQAEvaluation(key: string): VisualQAEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedVisualQAEvaluation(key: string, value: VisualQAEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getVisualQACacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetVisualQACacheForTests(): void {
  hierarchyCache.clear();
  layoutCache.clear();
  spacingCache.clear();
  alignmentCache.clear();
  typographyCache.clear();
  colorCache.clear();
  clutterCache.clear();
  emptySpaceCache.clear();
  mobileCache.clear();
  desktopCache.clear();
  firstImpressionCache.clear();
  professionalismCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
