/**
 * Phase 26.46 — Per-run fixture cache for product readiness simulation (V1).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProductMemoryFoundationBundle } from '../llm-chat-brain/product-memory-foundation-loader.js';
import { loadProductMemoryFoundations } from '../llm-chat-brain/product-memory-foundation-loader.js';

interface ShellFixture {
  html: string;
  appJs: string;
}

const shellCache = new Map<string, ShellFixture>();
const memoryCache = new Map<string, ProductMemoryFoundationBundle>();

export function resetProductReadinessFixtureCacheForTests(): void {
  shellCache.clear();
  memoryCache.clear();
}

export function loadProductReadinessShellCached(rootDir: string): ShellFixture {
  const cached = shellCache.get(rootDir);
  if (cached) return cached;
  const publicDir = join(rootDir, 'public', 'founder-reality');
  const shell: ShellFixture = {
    html: readFileSync(join(publicDir, 'index.html'), 'utf8'),
    appJs: readFileSync(join(publicDir, 'app.js'), 'utf8'),
  };
  shellCache.set(rootDir, shell);
  return shell;
}

export function loadProductMemoryFoundationsCached(
  message = 'what are we building',
): ProductMemoryFoundationBundle {
  const cached = memoryCache.get(message);
  if (cached) return cached;
  const loaded = loadProductMemoryFoundations({ message });
  memoryCache.set(message, loaded);
  return loaded;
}
