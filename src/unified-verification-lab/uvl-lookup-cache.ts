/**
 * UVL lookup cache — wraps uvl-row-registry without modifying ALL_UVL_ROWS.
 */

import { ALL_UVL_ROWS, type UvlRow } from './uvl-row-registry.js';
import { buildUvlPanelSnapshot, type UvlPanelSnapshot } from './uvl-panel-registry.js';

export const MAX_UVL_CACHE_SIZE = 512;

export interface UvlLookupCacheStats {
  rowHits: number;
  rowMisses: number;
  panelHits: number;
  panelMisses: number;
  phaseHits: number;
  phaseMisses: number;
  rowCacheSize: number;
  panelCacheSize: number;
  phaseCacheSize: number;
}

const rowCache = new Map<string, UvlRow | null>();
const phaseCache = new Map<string, readonly UvlRow[]>();
const panelCache = new Map<string, UvlPanelSnapshot>();
let rowHits = 0;
let rowMisses = 0;
let panelHits = 0;
let panelMisses = 0;
let phaseHits = 0;
let phaseMisses = 0;

function touchMap<T>(map: Map<string, T>, key: string, value: T): void {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  while (map.size > MAX_UVL_CACHE_SIZE) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

export function hasCachedUvlRow(rowId: string): boolean {
  const key = `row:${rowId}`;
  if (rowCache.has(key)) {
    rowHits += 1;
    return rowCache.get(key) !== null;
  }
  rowMisses += 1;
  const exists = ALL_UVL_ROWS.some((r) => r.rowId === rowId);
  touchMap(rowCache, key, exists ? (ALL_UVL_ROWS.find((r) => r.rowId === rowId) ?? null) : null);
  return exists;
}

export function getCachedUvlRow(rowId: string): UvlRow | undefined {
  const key = `row:${rowId}`;
  if (rowCache.has(key)) {
    rowHits += 1;
    const hit = rowCache.get(key);
    return hit ?? undefined;
  }
  rowMisses += 1;
  const row = ALL_UVL_ROWS.find((r) => r.rowId === rowId);
  touchMap(rowCache, key, row ?? null);
  return row;
}

export function getCachedUvlRowsByPhase(phase: number): readonly UvlRow[] {
  const key = `phase:${phase}`;
  const hit = phaseCache.get(key);
  if (hit) {
    phaseHits += 1;
    return hit;
  }
  phaseMisses += 1;
  const rows = ALL_UVL_ROWS.filter((r) => r.phase === phase);
  touchMap(phaseCache, key, rows);
  return rows;
}

export function getCachedUvlPanel(query: string): UvlPanelSnapshot {
  const key = `panel:${query.toLowerCase().trim()}`;
  const hit = panelCache.get(key);
  if (hit) {
    panelHits += 1;
    return hit;
  }
  panelMisses += 1;
  const panel = buildUvlPanelSnapshot();
  touchMap(panelCache, key, panel);
  return panel;
}

export function getUvlLookupCacheStats(): UvlLookupCacheStats {
  return {
    rowHits,
    rowMisses,
    panelHits,
    panelMisses,
    phaseHits,
    phaseMisses,
    rowCacheSize: rowCache.size,
    panelCacheSize: panelCache.size,
    phaseCacheSize: phaseCache.size,
  };
}

export function clearUvlLookupCache(): void {
  rowCache.clear();
  phaseCache.clear();
  panelCache.clear();
  rowHits = 0;
  rowMisses = 0;
  panelHits = 0;
  panelMisses = 0;
  phaseHits = 0;
  phaseMisses = 0;
}
