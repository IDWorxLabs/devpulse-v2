/**
 * Test evidence model — evidence requirements without collecting evidence.
 */

import type { TestingEvidenceRequirement } from './testing-runtime-types.js';

let evidenceCounter = 0;

function nextEvidenceId(): string {
  evidenceCounter += 1;
  return `tevd-${evidenceCounter.toString().padStart(4, '0')}`;
}

export function resetTestEvidenceCounterForTests(): void {
  evidenceCounter = 0;
}

export function buildEvidenceRequirements(query: string): TestingEvidenceRequirement[] {
  const lower = query.toLowerCase();

  const requirements: TestingEvidenceRequirement[] = [
    {
      evidenceId: nextEvidenceId(),
      requirement: 'Validation script pass token emitted for phase',
      sourceSystem: 'testing_runtime',
      proofType: 'PASS_TOKEN',
      simulationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      requirement: 'typecheck passes with zero errors',
      sourceSystem: 'testing_runtime',
      proofType: 'TYPECHECK',
      simulationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      requirement: 'No file writes in testing-runtime module source',
      sourceSystem: 'testing_runtime',
      proofType: 'STATIC_GUARD',
      simulationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      requirement: 'Code generation plan remains proposal-only with applied: false',
      sourceSystem: 'code_generation_runtime',
      proofType: 'LINKAGE',
      simulationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      requirement: 'Execution packet readiness.executionAllowed remains false',
      sourceSystem: 'execution_runtime',
      proofType: 'LINKAGE',
      simulationOnly: true,
    },
    {
      evidenceId: nextEvidenceId(),
      requirement: 'Build task plan remains blocked',
      sourceSystem: 'build_task_runtime',
      proofType: 'LINKAGE',
      simulationOnly: true,
    },
  ];

  if (lower.includes('prove') || lower.includes('evidence')) {
    requirements.push({
      evidenceId: nextEvidenceId(),
      requirement: 'Operator-visible proof criteria documented before any future test execution',
      sourceSystem: 'operator_feed',
      proofType: 'OPERATOR_FEED',
      simulationOnly: true,
    });
  }

  return requirements;
}
