/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1 — domain-specific UVL behaviour inspection.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  DomainBehaviourEvidenceItem,
  DomainBehaviourEvidenceRecord,
  DomainBehaviourSpec,
} from './multi-domain-scenario-types.js';

function listSourceFiles(workspaceDir: string, max = 200): string[] {
  if (!existsSync(workspaceDir)) return [];
  const out: string[] = [];
  function walk(current: string, depth: number): void {
    if (out.length >= max || depth > 8) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        walk(full, depth + 1);
      } else if (/\.(tsx?|jsx?|html|css|json)$/i.test(entry.name)) {
        out.push(full);
      }
    }
  }
  walk(workspaceDir, 0);
  return out;
}

function readWorkspaceCombined(workspaceDir: string): string {
  let combined = '';
  for (const file of listSourceFiles(workspaceDir)) {
    try {
      combined += readFileSync(file, 'utf8') + '\n';
    } catch {
      /* skip */
    }
  }
  return combined;
}

export function inspectDomainBehaviours(input: {
  workspaceDir: string;
  behaviourSpecs: readonly DomainBehaviourSpec[];
}): DomainBehaviourEvidenceRecord {
  const combined = readWorkspaceCombined(input.workspaceDir);
  const lower = combined.toLowerCase();
  const distIndex = join(input.workspaceDir, 'dist', 'index.html');
  const distExists = existsSync(distIndex);
  let distDetail = distExists ? distIndex.replace(/\\/g, '/') : 'missing dist/index.html';
  if (distExists) {
    const html = readFileSync(distIndex, 'utf8');
    distDetail += html.includes('id="root"') || html.includes("id='root'") ? ' with #root mount' : ' without #root';
  }

  const behaviours: DomainBehaviourEvidenceItem[] = input.behaviourSpecs.map((spec) => ({
    readOnly: true,
    id: spec.id,
    label: spec.label,
    category: spec.category,
    critical: spec.critical,
    passed: spec.pattern.test(lower),
    detail: spec.pattern.test(lower) ? 'pattern in generated sources' : `missing pattern for ${spec.label}`,
    source: 'generated-source',
  }));

  behaviours.push({
    readOnly: true,
    id: 'browserBuildArtifactExists',
    label: 'Browser build artifact exists',
    category: 'build',
    critical: true,
    passed: distExists,
    detail: distDetail,
    source: 'build-artifact',
  });

  const passedCount = behaviours.filter((b) => b.passed).length;
  return {
    readOnly: true,
    workspacePath: input.workspaceDir,
    behaviours,
    passedCount,
    totalCount: behaviours.length,
    allBehavioursPresent: behaviours.length > 0 && behaviours.every((b) => b.passed),
  };
}
