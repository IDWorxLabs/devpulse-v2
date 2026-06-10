/**
 * Autonomous Testing — suite builder.
 */

import type { AutonomousTestCategory, AutonomousTestDepth } from './autonomous-testing-types.js';
import { getAutonomousTestDepthEntry } from './autonomous-test-registry.js';

const CATEGORY_SUITES: Record<AutonomousTestCategory, { required: string[]; optional: string[] }> = {
  UNIT: { required: ['TypeScript Typecheck', 'Unit Scenario Validation'], optional: [] },
  INTEGRATION: { required: ['Registry Integration Validation', 'Capability Integration Validation'], optional: [] },
  RUNTIME: { required: ['Runtime Safety Validation'], optional: ['Startup Safety Validation'] },
  UI: { required: ['UVL Row Presence Validation', 'Find Panel Alias Validation'], optional: ['Surface Visibility Validation'] },
  ROUTING: { required: ['Route Canonicalization Validation', 'Route Registry Validation'], optional: [] },
  BRAIN: { required: ['Brain Capability Selection Validation', 'Brain Context Need Validation'], optional: [] },
  TRUST: { required: ['Trust Score Policy Validation'], optional: ['Trust Recovery Policy Validation'] },
  WORLD2: { required: ['World 2 Workspace Boundary Validation', 'Autonomous Builder Safety Validation'], optional: [] },
  CLOUD: { required: ['Cloud Runtime Contract Validation', 'Worker Endpoint Safety Validation'], optional: [] },
  BUILD: { required: ['Build Strategy Selection Validation', 'Build Plan Boundary Validation'], optional: [] },
  VERIFICATION: { required: ['Verification Strategy Validation', 'Verification Plan Integration Validation'], optional: [] },
  REGRESSION: { required: ['Regression Guard Validation', 'Duplicate Capability Detection Validation'], optional: [] },
};

const SUITE_ORDER: Record<string, number> = {
  'TypeScript Typecheck': 1,
  'Unit Scenario Validation': 2,
  'Registry Integration Validation': 3,
  'Capability Integration Validation': 4,
  'Runtime Safety Validation': 5,
  'Startup Safety Validation': 6,
  'Route Canonicalization Validation': 7,
  'Route Registry Validation': 8,
  'Brain Capability Selection Validation': 9,
  'Brain Context Need Validation': 10,
  'Trust Score Policy Validation': 11,
  'Trust Recovery Policy Validation': 12,
  'Cloud Runtime Contract Validation': 13,
  'Worker Endpoint Safety Validation': 14,
  'World 2 Workspace Boundary Validation': 15,
  'Autonomous Builder Safety Validation': 16,
  'Build Strategy Selection Validation': 17,
  'Build Plan Boundary Validation': 18,
  'Verification Strategy Validation': 19,
  'Verification Plan Integration Validation': 20,
  'UVL Row Presence Validation': 21,
  'Find Panel Alias Validation': 22,
  'Surface Visibility Validation': 23,
  'Regression Guard Validation': 24,
  'Duplicate Capability Detection Validation': 25,
};

let optimizerReductions = 0;

export function buildAutonomousTestSuites(
  categories: AutonomousTestCategory[],
  depth: AutonomousTestDepth,
): {
  requiredSuites: string[];
  optionalSuites: string[];
  executionOrder: string[];
  reductions: number;
} {
  const required = new Set<string>();
  const optional = new Set<string>();

  for (const cat of categories) {
    const suites = CATEGORY_SUITES[cat];
    for (const s of suites.required) required.add(s);
    for (const s of suites.optional) optional.add(s);
  }

  const depthEntry = getAutonomousTestDepthEntry(depth);
  for (const s of depthEntry?.expectedSuites ?? []) {
    required.add(s);
  }

  const before = required.size + optional.size;
  for (const s of optional) {
    if (required.has(s)) optional.delete(s);
  }
  const after = required.size + optional.size;
  optimizerReductions += Math.max(0, before - after);

  const executionOrder = [...required, ...optional].sort(
    (a, b) => (SUITE_ORDER[a] ?? 99) - (SUITE_ORDER[b] ?? 99),
  );

  return {
    requiredSuites: [...required],
    optionalSuites: [...optional],
    executionOrder,
    reductions: Math.max(0, before - after),
  };
}

export function getAutonomousTestOptimizerReductions(): number {
  return optimizerReductions;
}

export function resetAutonomousTestSuiteBuilderForTests(): void {
  optimizerReductions = 0;
}
