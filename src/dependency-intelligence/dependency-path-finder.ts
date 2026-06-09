/**
 * Dependency path finder — upstream/downstream path resolution.
 */

import { getDependencyGraph } from './dependency-graph-builder.js';
import type { DependencyEdge, DependencyPathResult } from './dependency-intelligence-types.js';
import { displayNameFor } from './dependency-intelligence-types.js';

function normalizeToken(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function resolveSystemId(token: string, systems: string[]): string | null {
  const norm = normalizeToken(token);
  const direct = systems.find((s) => s === norm || s.includes(norm) || norm.includes(s));
  if (direct) return direct;
  const byDisplay = systems.find((s) => displayNameFor(s).toLowerCase().includes(token.toLowerCase()));
  return byDisplay ?? null;
}

function bfsPath(
  start: string,
  end: string,
  edges: DependencyEdge[],
  forward: boolean,
): string[] | null {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const from = forward ? e.source : e.target;
    const to = forward ? e.target : e.source;
    const list = adj.get(from) ?? [];
    list.push(to);
    adj.set(from, list);
  }

  const queue: Array<{ node: string; path: string[] }> = [{ node: start, path: [start] }];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.node === end) return current.path;
    for (const next of adj.get(current.node) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push({ node: next, path: [...current.path, next] });
    }
  }
  return null;
}

export function findDependencyPath(sourceQuery: string, targetQuery: string): DependencyPathResult {
  const graph = getDependencyGraph();
  const source = resolveSystemId(sourceQuery, graph.systems);
  const target = resolveSystemId(targetQuery, graph.systems);

  if (!source || !target) {
    return {
      source: sourceQuery,
      target: targetQuery,
      found: false,
      path: [],
      edges: [],
      confidence: 'LOW',
    };
  }

  const path = bfsPath(source, target, graph.edges, true);
  if (!path) {
    const reverse = bfsPath(target, source, graph.edges, false);
    if (reverse) {
      const edgeChain: DependencyEdge[] = [];
      for (let i = 0; i < reverse.length - 1; i += 1) {
        const from = reverse[i]!;
        const to = reverse[i + 1]!;
        const edge = graph.edges.find((e) => e.source === from && e.target === to);
        if (edge) edgeChain.push(edge);
      }
      return {
        source: sourceQuery,
        target: targetQuery,
        found: true,
        path: reverse,
        edges: edgeChain,
        confidence: 'MEDIUM',
      };
    }
    return {
      source: sourceQuery,
      target: targetQuery,
      found: false,
      path: [],
      edges: [],
      confidence: 'LOW',
    };
  }

  const edgeChain: DependencyEdge[] = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    const from = path[i]!;
    const to = path[i + 1]!;
    const edge = graph.edges.find((e) => e.source === from && e.target === to);
    if (edge) edgeChain.push(edge);
  }

  return {
    source: sourceQuery,
    target: targetQuery,
    found: path.length > 0,
    path,
    edges: edgeChain,
    confidence: path.length <= 4 ? 'HIGH' : 'MEDIUM',
  };
}

export function extractPathQueries(question: string): { source: string; target: string } | null {
  const lower = question.toLowerCase();
  if (!lower.includes('dependency path') && !lower.includes('path from')) return null;
  const fromMatch = lower.match(/from\s+(.+?)\s+to\s+(.+?)(?:\?|$)/);
  if (fromMatch) {
    return { source: fromMatch[1]!.trim(), target: fromMatch[2]!.trim() };
  }
  return null;
}
