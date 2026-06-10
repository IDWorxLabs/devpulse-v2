/**
 * Autonomous Testing — cost and duration estimation.
 */

import type { AutonomousTestDepth } from './autonomous-testing-types.js';

const SUITE_COST_MS: Record<string, number> = {
  'TypeScript Typecheck': 12000,
  'Unit Scenario Validation': 8000,
  'Registry Integration Validation': 6000,
  'Capability Integration Validation': 6000,
  'Runtime Safety Validation': 10000,
  'Startup Safety Validation': 5000,
  'UVL Row Presence Validation': 4000,
  'Find Panel Alias Validation': 3000,
  'Surface Visibility Validation': 4000,
  'Route Canonicalization Validation': 5000,
  'Route Registry Validation': 5000,
  'Brain Capability Selection Validation': 7000,
  'Brain Context Need Validation': 5000,
  'Trust Score Policy Validation': 5000,
  'Trust Recovery Policy Validation': 6000,
  'World 2 Workspace Boundary Validation': 8000,
  'Autonomous Builder Safety Validation': 7000,
  'Cloud Runtime Contract Validation': 9000,
  'Worker Endpoint Safety Validation': 8000,
  'Build Strategy Selection Validation': 6000,
  'Build Plan Boundary Validation': 5000,
  'Verification Strategy Validation': 5000,
  'Verification Plan Integration Validation': 6000,
  'Regression Guard Validation': 5000,
  'Duplicate Capability Detection Validation': 4000,
};

const DEPTH_MULTIPLIER: Record<AutonomousTestDepth, number> = {
  SMOKE: 0.6,
  STANDARD: 1,
  DEEP: 1.4,
  RELEASE: 1.5,
  CLOUD: 1.3,
  WORLD2: 1.4,
  TRUST_RECOVERY: 1.6,
};

export function analyzeAutonomousTestCost(
  requiredSuites: string[],
  optionalSuites: string[],
  depth: AutonomousTestDepth,
): { estimatedCost: number; estimatedDurationMs: number } {
  const allSuites = [...new Set([...requiredSuites, ...optionalSuites])];
  let estimatedDurationMs = 0;
  for (const suite of allSuites) {
    estimatedDurationMs += SUITE_COST_MS[suite] ?? 5000;
  }
  estimatedDurationMs = Math.round(estimatedDurationMs * (DEPTH_MULTIPLIER[depth] ?? 1));
  const estimatedCost = allSuites.length * 8 + Math.round(estimatedDurationMs / 1000);
  return { estimatedCost, estimatedDurationMs };
}
