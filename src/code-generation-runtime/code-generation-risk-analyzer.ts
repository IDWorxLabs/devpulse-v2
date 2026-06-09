/**
 * Code generation risk analyzer — visible risks before any generation.
 */

import { getDependencyIntelligenceContext } from '../dependency-intelligence/index.js';
import { getCurrentProjectProfile } from '../project-understanding/project-profile-store.js';
import { safetyViolationsForQuery } from '../execution-runtime/execution-safety-boundary.js';
import type { CodeGenerationRisk } from './code-generation-runtime-types.js';

let riskCounter = 0;

function nextRiskId(): string {
  riskCounter += 1;
  return `crisk-${riskCounter.toString().padStart(3, '0')}`;
}

export function resetCodeGenerationRiskCounterForTests(): void {
  riskCounter = 0;
}

export function analyzeCodeGenerationRisks(query: string): CodeGenerationRisk[] {
  const dep = getDependencyIntelligenceContext(query);
  const profile = getCurrentProjectProfile();
  const violations = safetyViolationsForQuery(query);

  const risks: CodeGenerationRisk[] = [
    {
      riskId: nextRiskId(),
      summary: 'Phase 14.3 forbids writing generated code into real project source files',
      level: 'CRITICAL',
      sourceSystem: 'code_generation_runtime',
      proposalOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Build task and execution packet remain blocked — generation is simulation-only',
      level: 'HIGH',
      sourceSystem: 'build_task_runtime',
      proposalOnly: true,
    },
    {
      riskId: nextRiskId(),
      summary: 'Founder approval and verification gates required before any future real generation',
      level: 'HIGH',
      sourceSystem: 'execution_runtime',
      proposalOnly: true,
    },
  ];

  if (violations.length > 0) {
    risks.push({
      riskId: nextRiskId(),
      summary: `Forbidden pattern in query: ${violations[0]}`,
      level: 'CRITICAL',
      sourceSystem: 'code_generation_runtime',
      proposalOnly: true,
    });
  }

  for (const blocker of dep.dependencyBlockers.slice(0, 3)) {
    risks.push({
      riskId: nextRiskId(),
      summary: blocker,
      level: 'MEDIUM',
      sourceSystem: 'dependency_intelligence',
      proposalOnly: true,
    });
  }

  for (const gap of profile.missingCapabilities.slice(0, 2)) {
    risks.push({
      riskId: nextRiskId(),
      summary: `Missing capability before generation: ${gap}`,
      level: 'MEDIUM',
      sourceSystem: 'project_understanding_engine',
      proposalOnly: true,
    });
  }

  return risks;
}
