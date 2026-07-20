/**
 * Autonomous Engineering Intelligence V1 — finding grouping.
 */

import type { AutonomousEngineeringFinding } from './autonomous-engineering-types.js';

export interface FindingGroup {
  readonly groupId: string;
  readonly rootCauseHint: string;
  readonly findingIds: readonly string[];
}

export function groupEngineeringFindings(findings: readonly AutonomousEngineeringFinding[]): FindingGroup[] {
  const groups = new Map<string, string[]>();
  for (const f of findings) {
    const key = `${f.diagnosticCode}::${f.providerIds.join(',')}::${f.artifactPaths.join(',')}`;
    const list = groups.get(key) ?? [];
    list.push(f.findingId);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([key, findingIds]) => ({
      groupId: `group-${key.replace(/[^a-z0-9]+/gi, '_').slice(0, 48)}`,
      rootCauseHint: key.split('::')[0] ?? 'unknown',
      findingIds: [...findingIds].sort(),
    }))
    .sort((a, b) => a.groupId.localeCompare(b.groupId));
}
