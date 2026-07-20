/**
 * Universal Capability Pack Framework V1 — dependency resolution.
 */

import { getPack } from './capability-pack-registry.js';

export interface PackDependencyIssue {
  readonly code: 'missing_dependency' | 'circular_dependency' | 'incompatible_pack_pair' | 'unimplemented_dependency';
  readonly packId: string;
  readonly detail: string;
}

export interface PackDependencyResolution {
  readonly installationOrder: readonly string[];
  readonly issues: readonly PackDependencyIssue[];
}

export function resolvePackDependencies(selectedPackIds: readonly string[]): PackDependencyResolution {
  const issues: PackDependencyIssue[] = [];
  const byId = new Map(selectedPackIds.map((id) => [id, getPack(id)]));
  const deps = new Map<string, string[]>();

  for (const packId of selectedPackIds.sort()) {
    const pack = byId.get(packId);
    if (!pack) {
      issues.push({ code: 'missing_dependency', packId, detail: `Selected pack '${packId}' not found in registry` });
      continue;
    }
    const packDeps: string[] = [];
    for (const dep of pack.requiredPacks) {
      if (!byId.has(dep) && !getPack(dep)) {
        issues.push({ code: 'missing_dependency', packId, detail: `Missing required pack '${dep}'` });
      } else {
        const depPack = getPack(dep);
        if (depPack?.supportStatus === 'NOT_IMPLEMENTED') {
          issues.push({ code: 'unimplemented_dependency', packId, detail: `Required pack '${dep}' is not implemented` });
        }
        packDeps.push(dep);
      }
    }
    for (const other of pack.incompatiblePacks) {
      if (selectedPackIds.includes(other)) {
        issues.push({ code: 'incompatible_pack_pair', packId, detail: `Incompatible with selected pack '${other}'` });
      }
    }
    deps.set(packId, packDeps.sort());
  }

  const order: string[] = [];
  const state = new Map<string, 'visiting' | 'done'>();

  const visit = (id: string, chain: string[]): void => {
    const current = state.get(id);
    if (current === 'done') return;
    if (current === 'visiting') {
      issues.push({ code: 'circular_dependency', packId: id, detail: `Circular dependency: ${[...chain, id].join(' → ')}` });
      return;
    }
    state.set(id, 'visiting');
    for (const dep of deps.get(id) ?? []) {
      if (selectedPackIds.includes(dep)) visit(dep, [...chain, id]);
    }
    state.set(id, 'done');
    order.push(id);
  };

  for (const id of selectedPackIds.sort()) visit(id, []);

  const hasCycle = issues.some((i) => i.code === 'circular_dependency');
  return { installationOrder: hasCycle ? [] : order, issues };
}
