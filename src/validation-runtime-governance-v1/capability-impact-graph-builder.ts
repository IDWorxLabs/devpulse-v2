/**
 * Validation Runtime Governance V1 — capability impact graph.
 */

import type { ValidatorCategory, ValidatorRuntimeMetric } from '../validation-runtime-audit-v1/validation-runtime-audit-types.js';
import type { CapabilityImpactGraph, CapabilityImpactNode } from './validation-runtime-governance-types.js';

interface CapabilityDefinition {
  capabilityId: string;
  capabilityName: string;
  filePatterns: readonly string[];
  categories: readonly ValidatorCategory[];
}

const CAPABILITY_DEFINITIONS: readonly CapabilityDefinition[] = [
  {
    capabilityId: 'CQI',
    capabilityName: 'Clarifying Question Intelligence',
    filePatterns: ['src/clarifying-question-intelligence/', 'scripts/validate-clarifying-question', 'scripts/validate-cqi-'],
    categories: ['CQI'],
  },
  {
    capabilityId: 'UVL',
    capabilityName: 'Unified Verification Lab',
    filePatterns: ['src/unified-verification-lab/', 'scripts/validate-uvl-', 'scripts/validate-unified-verification'],
    categories: ['UVL'],
  },
  {
    capabilityId: 'AFLA',
    capabilityName: 'Autonomous Founder Launch Authority',
    filePatterns: ['src/autonomous-founder-launch-authority/', 'scripts/validate-afla-', 'scripts/validate-autonomous-founder-launch'],
    categories: ['AFLA', 'LAUNCH'],
  },
  {
    capabilityId: 'PAI',
    capabilityName: 'Product Architect Intelligence',
    filePatterns: ['src/product-architect-intelligence/', 'scripts/validate-product-architect-intelligence'],
    categories: ['PAI'],
  },
  {
    capabilityId: 'RBEP',
    capabilityName: 'Real Build Execution Pipeline',
    filePatterns: ['src/real-build-execution-pipeline/', 'scripts/validate-real-build-execution'],
    categories: ['REAL_BUILD_EXECUTION'],
  },
  {
    capabilityId: 'WORLD2',
    capabilityName: 'World2 Execution',
    filePatterns: ['src/world2-', 'scripts/validate-world2-'],
    categories: ['WORLD2'],
  },
  {
    capabilityId: 'BLUEPRINT',
    capabilityName: 'Universal App Blueprint',
    filePatterns: ['src/universal-app-blueprint/', 'scripts/validate-universal-app-blueprint'],
    categories: ['BLUEPRINT'],
  },
  {
    capabilityId: 'FEATURE_REALITY',
    capabilityName: 'Feature Reality Validation',
    filePatterns: ['src/feature-reality/', 'scripts/validate-feature-reality', 'scripts/validate-universal-feature-contract'],
    categories: ['FEATURE_REALITY'],
  },
  {
    capabilityId: 'ENGINEERING',
    capabilityName: 'Engineering Reality',
    filePatterns: ['src/engineering-reality/', 'scripts/validate-engineering-reality'],
    categories: ['ENGINEERING'],
  },
  {
    capabilityId: 'OPERATOR',
    capabilityName: 'Founder Review Operator',
    filePatterns: ['src/founder-review-operator/', 'scripts/validate-founder-review-operator', 'scripts/validate-operator-'],
    categories: ['OPERATOR'],
  },
  {
    capabilityId: 'CONNECTED_PIPELINE',
    capabilityName: 'Connected Build/Preview/Verification Pipeline',
    filePatterns: ['src/connected-', 'scripts/validate-connected-'],
    categories: ['CONNECTED_PIPELINE'],
  },
  {
    capabilityId: 'CAPABILITY_AUDIT',
    capabilityName: 'Capability Audit',
    filePatterns: ['src/capability-audit-', 'scripts/validate-capability-audit'],
    categories: ['CAPABILITY_AUDIT'],
  },
  {
    capabilityId: 'FOUNDATION',
    capabilityName: 'Foundation Stack',
    filePatterns: ['src/foundation/', 'scripts/validate-foundation', 'scripts/validate-chat-authority'],
    categories: ['FOUNDATION'],
  },
  {
    capabilityId: 'VALIDATION_GOVERNANCE',
    capabilityName: 'Validation Runtime Governance',
    filePatterns: ['src/validation-runtime-governance-v1/', 'scripts/validate-validation-runtime-governance'],
    categories: ['OTHER'],
  },
  {
    capabilityId: 'VALIDATION_AUDIT',
    capabilityName: 'Validation Runtime Audit',
    filePatterns: ['src/validation-runtime-audit-v1/', 'scripts/validate-validation-runtime-audit'],
    categories: ['OTHER'],
  },
];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').toLowerCase();
}

export function buildCapabilityImpactGraph(metrics: readonly ValidatorRuntimeMetric[]): CapabilityImpactGraph {
  const byCategory = new Map<ValidatorCategory, string[]>();
  for (const metric of metrics) {
    if (!metric.registeredInPackageJson) continue;
    const list = byCategory.get(metric.category) ?? [];
    list.push(metric.validatorName);
    byCategory.set(metric.category, list);
  }

  const nodes: CapabilityImpactNode[] = CAPABILITY_DEFINITIONS.map((def) => {
    const validators = new Set<string>();
    for (const category of def.categories) {
      for (const name of byCategory.get(category) ?? []) {
        validators.add(name);
      }
    }
    for (const metric of metrics) {
      if (!metric.registeredInPackageJson) continue;
      const haystack = normalizePath(metric.scriptPath);
      if (def.filePatterns.some((p) => haystack.includes(normalizePath(p)))) {
        validators.add(metric.validatorName);
      }
    }
    return {
      capabilityId: def.capabilityId,
      capabilityName: def.capabilityName,
      filePatterns: def.filePatterns,
      validators: [...validators].sort(),
      categories: def.categories,
    };
  });

  const filePatternIndex: Record<string, string> = {};
  for (const node of nodes) {
    for (const pattern of node.filePatterns) {
      filePatternIndex[pattern] = node.capabilityId;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    nodes,
    filePatternIndex,
  };
}

export function resolveAffectedCapabilities(
  graph: CapabilityImpactGraph,
  changedFiles: readonly string[],
): readonly CapabilityImpactNode[] {
  const normalized = changedFiles.map(normalizePath);
  const affectedIds = new Set<string>();
  for (const file of normalized) {
    for (const node of graph.nodes) {
      if (node.filePatterns.some((p) => file.includes(normalizePath(p)))) {
        affectedIds.add(node.capabilityId);
      }
    }
  }
  return graph.nodes.filter((n) => affectedIds.has(n.capabilityId));
}

export function resolveValidatorsForChangedFiles(
  graph: CapabilityImpactGraph,
  changedFiles: readonly string[],
): readonly string[] {
  const affected = resolveAffectedCapabilities(graph, changedFiles);
  const validators = new Set<string>();
  for (const node of affected) {
    for (const v of node.validators) validators.add(v);
  }
  return [...validators].sort();
}
