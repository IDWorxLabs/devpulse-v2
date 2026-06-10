/**
 * Autonomous Testing — depth registry metadata.
 */

import type { AutonomousTestCategory, AutonomousTestDepth } from './autonomous-testing-types.js';

export interface AutonomousTestDepthEntry {
  depth: AutonomousTestDepth;
  description: string;
  requiredCategories: AutonomousTestCategory[];
  expectedSuites: string[];
  minimumConfidence: number;
  riskTolerance: number;
}

export const AUTONOMOUS_TEST_DEPTH_REGISTRY: readonly AutonomousTestDepthEntry[] = [
  {
    depth: 'SMOKE',
    description: 'Minimum smoke testing for read-only and planning-only work',
    requiredCategories: ['UNIT', 'REGRESSION'],
    expectedSuites: ['TypeScript Typecheck', 'Regression Guard Validation'],
    minimumConfidence: 45,
    riskTolerance: 50,
  },
  {
    depth: 'STANDARD',
    description: 'Balanced testing for normal feature, UI, and code work',
    requiredCategories: ['UNIT', 'INTEGRATION', 'RUNTIME', 'REGRESSION'],
    expectedSuites: ['TypeScript Typecheck', 'Unit Scenario Validation', 'Runtime Safety Validation'],
    minimumConfidence: 65,
    riskTolerance: 40,
  },
  {
    depth: 'DEEP',
    description: 'Deep testing for architecture, brain, routing, and infrastructure changes',
    requiredCategories: ['UNIT', 'INTEGRATION', 'RUNTIME', 'BRAIN', 'ROUTING', 'REGRESSION'],
    expectedSuites: ['Brain Capability Selection Validation', 'Route Registry Validation', 'Runtime Safety Validation'],
    minimumConfidence: 80,
    riskTolerance: 20,
  },
  {
    depth: 'RELEASE',
    description: 'Release testing for production packaging and deployment preparation',
    requiredCategories: ['UNIT', 'INTEGRATION', 'RUNTIME', 'VERIFICATION', 'REGRESSION'],
    expectedSuites: ['Regression Guard Validation', 'Verification Strategy Validation', 'Runtime Safety Validation'],
    minimumConfidence: 85,
    riskTolerance: 15,
  },
  {
    depth: 'CLOUD',
    description: 'Cloud testing for cloud, worker, and remote execution changes',
    requiredCategories: ['CLOUD', 'RUNTIME', 'INTEGRATION', 'VERIFICATION'],
    expectedSuites: ['Cloud Runtime Contract Validation', 'Worker Endpoint Safety Validation'],
    minimumConfidence: 75,
    riskTolerance: 25,
  },
  {
    depth: 'WORLD2',
    description: 'World 2 testing for autonomous builder and workspace changes',
    requiredCategories: ['WORLD2', 'BUILD', 'TRUST', 'VERIFICATION', 'REGRESSION'],
    expectedSuites: ['World 2 Workspace Boundary Validation', 'Autonomous Builder Safety Validation'],
    minimumConfidence: 80,
    riskTolerance: 15,
  },
  {
    depth: 'TRUST_RECOVERY',
    description: 'Trust recovery testing after repeated failures or verification disagreement',
    requiredCategories: ['TRUST', 'BRAIN', 'VERIFICATION', 'REGRESSION'],
    expectedSuites: ['Trust Score Policy Validation', 'Trust Recovery Policy Validation', 'Verification Plan Integration Validation'],
    minimumConfidence: 90,
    riskTolerance: 5,
  },
] as const;

export function getAutonomousTestDepthEntry(depth: AutonomousTestDepth): AutonomousTestDepthEntry | undefined {
  return AUTONOMOUS_TEST_DEPTH_REGISTRY.find((e) => e.depth === depth);
}

export function listAutonomousTestDepthEntries(): AutonomousTestDepthEntry[] {
  return [...AUTONOMOUS_TEST_DEPTH_REGISTRY];
}
