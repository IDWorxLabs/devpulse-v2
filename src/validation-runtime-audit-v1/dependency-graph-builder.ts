/**
 * Validation Runtime Audit V1 — dependency graph builder.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { DependencyGraph, DependencyGraphNode } from './validation-runtime-audit-types.js';
import type { ValidatorRegistryEntry } from './validator-registry.js';
import { extractNestedValidatorTargets, readValidatorScriptContent } from './validator-static-analyzer.js';

export function buildDependencyGraph(
  registry: readonly ValidatorRegistryEntry[],
): DependencyGraph {
  const triggersByValidator = new Map<string, string[]>();

  for (const entry of registry) {
    const content = readValidatorScriptContent(entry.scriptPath);
    const targets = extractNestedValidatorTargets(content).filter(
      (t) => t !== entry.validatorName && t.startsWith('validate:'),
    );
    triggersByValidator.set(entry.validatorName, targets);
  }

  const triggeredByMap = new Map<string, Set<string>>();
  for (const [source, targets] of triggersByValidator) {
    for (const target of targets) {
      if (!triggeredByMap.has(target)) triggeredByMap.set(target, new Set());
      triggeredByMap.get(target)!.add(source);
    }
  }

  const nodes: DependencyGraphNode[] = registry
    .filter((e) => e.registeredInPackageJson)
    .map((entry) => {
      const triggers = triggersByValidator.get(entry.validatorName) ?? [];
      const triggeredBy = [...(triggeredByMap.get(entry.validatorName) ?? [])];
      return {
        validatorName: entry.validatorName,
        triggers,
        triggeredBy,
        nestedValidation: triggers.length > 0,
        circularRisk: false,
      };
    });

  const circularPaths: string[] = [];
  const nestedChains: Array<{ chain: string[]; circular: boolean }> = [];

  function findCycle(start: string, current: string, path: string[], visited: Set<string>): void {
    if (path.includes(current)) {
      const cycleStart = path.indexOf(current);
      const cycle = [...path.slice(cycleStart), current];
      circularPaths.push(cycle.join(' → '));
      nestedChains.push({ chain: cycle, circular: true });
      const node = nodes.find((n) => n.validatorName === start);
      if (node) node.circularRisk = true;
      return;
    }
    if (visited.has(current)) return;
    visited.add(current);
    const next = triggersByValidator.get(current) ?? [];
    for (const target of next) {
      findCycle(start, target, [...path, current], new Set(visited));
    }
    if (next.length > 0 && path.length >= 1) {
      nestedChains.push({ chain: [...path, current, ...next.slice(0, 2)], circular: false });
    }
  }

  for (const node of nodes) {
    if (node.triggers.length > 0) {
      findCycle(node.validatorName, node.validatorName, [], new Set());
    }
  }

  const repeatedPaths: string[] = [];
  const pathCounts = new Map<string, number>();
  for (const chain of nestedChains) {
    const key = chain.chain.join('→');
    pathCounts.set(key, (pathCounts.get(key) ?? 0) + 1);
  }
  for (const [path, count] of pathCounts) {
    if (count > 1) repeatedPaths.push(`${path} (${count}x)`);
  }

  return {
    nodes,
    nestedChains: nestedChains.slice(0, 50),
    circularValidationPaths: [...new Set(circularPaths)],
    repeatedValidationPaths: repeatedPaths.slice(0, 20),
  };
}

/** Scan scripts for explicit nested execSync validate chains (validation-budget compatible). */
export function scanNestedValidatorCalls(scriptsDir: string): Array<{
  sourceFile: string;
  targetScript?: string;
  line: number;
}> {
  const files = readdirSync(scriptsDir).filter((f) => f.startsWith('validate-') && f.endsWith('.ts'));
  const calls: Array<{ sourceFile: string; targetScript?: string; line: number }> = [];

  for (const file of files) {
    const content = readFileSync(join(scriptsDir, file), 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      if (/execSync\s*\([^)]*npm run validate:/.test(line) || /spawnSync\s*\([^)]*validate:/.test(line)) {
        const match = line.match(/validate:([a-z0-9-]+)/);
        calls.push({
          sourceFile: file,
          targetScript: match ? `validate:${match[1]}` : undefined,
          line: i + 1,
        });
      }
    }
  }
  return calls;
}
