/**
 * Test risk analyzer — visible risks before any test execution.
 */

import { getDependencyIntelligenceContext } from '../dependency-intelligence/index.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { safetyViolationsForQuery } from '../execution-runtime/execution-safety-boundary.js';
import type { TestingRisk } from './testing-runtime-types.js';

let riskCounter = 0;

function nextRiskId(): string {
  riskCounter += 1;
  return `trisk-${riskCounter.toString().padStart(3, '0')}`;
}

export function resetTestRiskCounterForTests(): void {
  riskCounter = 0;
}

export function analyzeTestRisks(query: string): TestingRisk[] {
  const dep = getDependencyIntelligenceContext(query);
  const profile = getCurrentProjectProfile();
  const violations = safetyViolationsForQuery(query);

  const risks: TestingRisk[] = [
    {
      riskId: nextRiskId(),
      summary: 'Phase 14.4 forbids running tests — npm, node, tsx, git, shell commands not executed',
      level: 'CRITICAL',
      sourceSystem: 'testing_runtime',
      simulationOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Test files must not be written to real project source in this phase',
      level: 'CRITICAL',
      sourceSystem: 'testing_runtime',
      simulationOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Code generation remains proposal-only — generation not executable',
      level: 'HIGH',
      sourceSystem: 'code_generation_runtime',
      simulationOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Build task and execution packet remain blocked — testing is simulation-only',
      level: 'HIGH',
      sourceSystem: 'build_task_runtime',
      simulationOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Future test execution requires founder approval and verification gates',
      level: 'HIGH',
      sourceSystem: 'execution_runtime',
      simulationOnly: true,
    },
  ];

  if (violations.length > 0) {
    risks.push({
      riskId: nextRiskId(),
      summary: `Forbidden pattern in query: ${violations[0]}`,
      level: 'CRITICAL',
      sourceSystem: 'testing_runtime',
      simulationOnly: true,
    });
  }

  for (const blocker of dep.dependencyBlockers.slice(0, 3)) {
    risks.push({
      riskId: nextRiskId(),
      summary: blocker,
      level: 'MEDIUM',
      sourceSystem: 'dependency_intelligence',
      simulationOnly: true,
    });
  }

  for (const gap of profile.missingCapabilities.slice(0, 2)) {
    risks.push({
      riskId: nextRiskId(),
      summary: `Missing capability before testing: ${gap}`,
      level: 'MEDIUM',
      sourceSystem: 'project_understanding_engine',
      simulationOnly: true,
    });
  }

  return risks;
}
