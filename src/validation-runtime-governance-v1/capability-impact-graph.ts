/**
 * Validation Runtime Governance V1 — capability impact graph.
 */

import { classifyValidatorCategory } from '../validation-runtime-audit-v1/index.js';
import type { ValidatorRegistryEntry } from '../validation-runtime-audit-v1/index.js';
import type { CapabilityImpactGraph, CapabilityImpactNode } from './validation-runtime-governance-v1-types.js';

const CATEGORY_PATH_PATTERNS: Array<{ category: string; patterns: readonly string[] }> = [
  { category: 'CQI', patterns: ['src/clarifying-question', 'src/cqi-', 'scripts/validate-clarifying', 'scripts/validate-cqi'] },
  { category: 'UVL', patterns: ['src/uvl-', 'src/unified-verification', 'scripts/validate-uvl', 'scripts/validate-unified-verification'] },
  { category: 'AFLA', patterns: ['src/afla-', 'src/autonomous-founder-launch', 'scripts/validate-afla', 'scripts/validate-autonomous-founder-launch'] },
  { category: 'PAI', patterns: ['src/product-architect-intelligence', 'scripts/validate-product-architect-intelligence'] },
  { category: 'REAL_BUILD_EXECUTION', patterns: ['src/real-build-execution', 'scripts/validate-real-build-execution'] },
  { category: 'LAUNCH', patterns: ['src/launch-council', 'src/launch-readiness', 'scripts/validate-launch'] },
  { category: 'ENGINEERING', patterns: ['src/engineering-reality', 'src/repository-typecheck', 'scripts/validate-engineering'] },
  { category: 'BLUEPRINT', patterns: ['src/universal-app-blueprint', 'scripts/validate-universal-app-blueprint', 'scripts/validate-blueprint'] },
  { category: 'FEATURE_REALITY', patterns: ['src/feature-reality', 'src/universal-feature-contract', 'scripts/validate-feature-reality', 'scripts/validate-universal-feature'] },
  { category: 'WORLD2', patterns: ['src/world2-', 'scripts/validate-world2'] },
  { category: 'OPERATOR', patterns: ['src/founder-review-operator', 'src/command-center', 'public/founder-reality', 'scripts/validate-founder-review', 'scripts/validate-operator'] },
  { category: 'CONNECTED_PIPELINE', patterns: ['src/connected-build', 'src/connected-runtime', 'src/connected-preview', 'src/connected-verification', 'src/connected-launch'] },
  { category: 'FOUNDATION', patterns: ['src/foundation', 'src/shell', 'src/task-governor', 'src/chat-authority', 'scripts/validate-foundation', 'scripts/validate-shell', 'scripts/validate-task-governor'] },
  { category: 'CAPABILITY_AUDIT', patterns: ['src/capability-audit', 'scripts/validate-capability-audit'] },
  { category: 'VALIDATION_GOVERNANCE', patterns: ['src/validation-runtime-governance', 'src/validation-runtime-audit', 'scripts/validate-validation-runtime'] },
];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').toLowerCase();
}

export function buildCapabilityImpactGraph(
  registry: readonly ValidatorRegistryEntry[],
): CapabilityImpactGraph {
  const validatorsByCategory = new Map<string, string[]>();

  for (const entry of registry) {
    if (!entry.registeredInPackageJson) continue;
    const category = classifyValidatorCategory(entry.validatorName, entry.scriptFile);
    const list = validatorsByCategory.get(category) ?? [];
    list.push(entry.validatorName);
    validatorsByCategory.set(category, list);
  }

  const nodes: CapabilityImpactNode[] = CATEGORY_PATH_PATTERNS.map(({ category, patterns }) => ({
    capabilityCategory: category,
    pathPatterns: patterns,
    validators: validatorsByCategory.get(category) ?? [],
  }));

  function resolveValidatorsForChangedFiles(changedFiles: readonly string[]): readonly string[] {
    const normalized = changedFiles.map(normalizePath);
    const matchedCategories = new Set<string>();

    for (const file of normalized) {
      for (const node of nodes) {
        if (node.pathPatterns.some((p) => file.includes(p.toLowerCase()))) {
          matchedCategories.add(node.capabilityCategory);
        }
      }
    }

    const validators = new Set<string>();
    for (const category of matchedCategories) {
      const node = nodes.find((n) => n.capabilityCategory === category);
      for (const v of node?.validators ?? []) {
        validators.add(v);
      }
    }

    if (matchedCategories.has('VALIDATION_GOVERNANCE')) {
      validators.add('validate:validation-runtime-governance-v1');
      validators.add('validate:validation-runtime-audit-v1');
    }

    return [...validators].sort();
  }

  return { nodes, resolveValidatorsForChangedFiles };
}

export function explainCapabilityImpact(
  changedFiles: readonly string[],
  graph: CapabilityImpactGraph,
): { categories: string[]; validators: string[]; excluded: string[] } {
  const validators = graph.resolveValidatorsForChangedFiles(changedFiles);
  const categories = graph.nodes
    .filter((n) =>
      changedFiles.some((f) =>
        n.pathPatterns.some((p) => normalizePath(f).includes(p.toLowerCase())),
      ),
    )
    .map((n) => n.capabilityCategory);

  const excluded = [
    'validate:autonomous-founder-launch-authority-v1',
    'validate:uvl-verification-execution-v1',
    'validate:capability-audit-v3',
    'validate:large-scale-multi-app-validation-v1',
  ].filter((v) => !validators.includes(v));

  return { categories, validators: [...validators], excluded };
}
