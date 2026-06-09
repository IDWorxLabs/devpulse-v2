/**
 * Fix risk analyzer — visible risks before any fix application.
 */

import { getDependencyIntelligenceContext } from '../dependency-intelligence/index.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { safetyViolationsForQuery } from '../execution-runtime/execution-safety-boundary.js';
import type { FixRisk } from './auto-fix-runtime-types.js';

let riskCounter = 0;

function nextRiskId(): string {
  riskCounter += 1;
  return `frisk-${riskCounter.toString().padStart(3, '0')}`;
}

export function resetFixRiskCounterForTests(): void {
  riskCounter = 0;
}

export function analyzeFixRisks(query: string): FixRisk[] {
  const dep = getDependencyIntelligenceContext(query);
  const profile = getCurrentProjectProfile();
  const violations = safetyViolationsForQuery(query);

  const risks: FixRisk[] = [
    {
      riskId: nextRiskId(),
      summary: 'Phase 14.5 forbids applying fixes — no file modification, no code application',
      level: 'CRITICAL',
      sourceSystem: 'auto_fix_runtime',
      simulationOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Auto-fix must not resolve failures automatically — failure visibility remains advisory',
      level: 'CRITICAL',
      sourceSystem: 'failure_visibility_engine',
      simulationOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Testing remains simulation-only — fixes cannot be verified by running tests in this phase',
      level: 'HIGH',
      sourceSystem: 'testing_runtime',
      simulationOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Code generation remains proposal-only — no replacement code written to project',
      level: 'HIGH',
      sourceSystem: 'code_generation_runtime',
      simulationOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Build task and execution packet remain blocked — executionAllowed must stay false',
      level: 'HIGH',
      sourceSystem: 'execution_runtime',
      simulationOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Future fix application requires founder approval and verification gates',
      level: 'HIGH',
      sourceSystem: 'unified_decision_layer',
      simulationOnly: true,
    },
  ];

  if (violations.length > 0) {
    risks.push({
      riskId: nextRiskId(),
      summary: `Forbidden pattern in query: ${violations[0]}`,
      level: 'CRITICAL',
      sourceSystem: 'auto_fix_runtime',
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
      summary: `Missing capability before fixing: ${gap}`,
      level: 'MEDIUM',
      sourceSystem: 'project_understanding_engine',
      simulationOnly: true,
    });
  }

  return risks;
}
