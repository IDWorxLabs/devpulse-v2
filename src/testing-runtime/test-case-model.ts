/**
 * Test case model — planned test cases without execution.
 */

import type { TestingCase } from './testing-runtime-types.js';

let caseCounter = 0;

function nextCaseId(): string {
  caseCounter += 1;
  return `tcase-${caseCounter.toString().padStart(4, '0')}`;
}

export function resetTestCaseCounterForTests(): void {
  caseCounter = 0;
}

export function buildTestCases(query: string): TestingCase[] {
  const lower = query.toLowerCase();

  const cases: TestingCase[] = [
    {
      caseId: nextCaseId(),
      title: 'Typecheck validation',
      description: 'Verify TypeScript compiles without errors after proposed changes',
      passCriteria: 'tsc --noEmit exits 0 with no new errors',
      failCriteria: 'Any new type error in proposed module surface',
      linkedArtifact: 'types.ts',
      simulationOnly: true,
    },
    {
      caseId: nextCaseId(),
      title: 'Foundation validation script',
      description: 'Run phase validation script with minimum scenario count',
      passCriteria: 'Validation script passes with pass token emitted',
      failCriteria: 'Any scenario failure or insufficient scenario count',
      linkedArtifact: 'validate script',
      simulationOnly: true,
    },
    {
      caseId: nextCaseId(),
      title: 'Routing integration',
      description: 'Verify Command Center routes testing questions correctly',
      passCriteria: 'TESTING_RUNTIME_FOUNDATION is primary for success questions',
      failCriteria: 'Wrong capability primary or blocked advisory question',
      linkedArtifact: 'capability-selector.ts',
      simulationOnly: true,
    },
    {
      caseId: nextCaseId(),
      title: 'No file write guard',
      description: 'Verify testing runtime does not write test files to project',
      passCriteria: 'No writeFileSync, no spawn, no child_process in testing-runtime module',
      failCriteria: 'Any file write or command execution detected',
      linkedArtifact: 'testing-runtime.ts',
      simulationOnly: true,
    },
    {
      caseId: nextCaseId(),
      title: 'Linkage integrity',
      description: 'Verify links to code generation, build task, and execution packet',
      passCriteria: 'linkedGenerationId, linkedBuildTaskId, linkedExecutionId populated; executionAllowed false',
      failCriteria: 'Missing links or executionAllowed true',
      linkedArtifact: null,
      simulationOnly: true,
    },
    {
      caseId: nextCaseId(),
      title: 'Operator feed stages',
      description: 'Verify operator feed publishes full testing planning sequence',
      passCriteria: 'All TESTING_RUNTIME_FEED_STAGES published in order',
      failCriteria: 'Missing feed stage or wrong source system',
      linkedArtifact: null,
      simulationOnly: true,
    },
  ];

  if (lower.includes('simulated failures')) {
    cases.push({
      caseId: nextCaseId(),
      title: 'Simulated failure visibility',
      description: 'Verify simulated FAIL results appear in failure visibility context',
      passCriteria: 'FAIL simulated results create visible failure records',
      failCriteria: 'Simulated failures not visible to failure visibility engine',
      linkedArtifact: null,
      simulationOnly: true,
    });
  }

  return cases;
}

export function extractPassCriteria(cases: TestingCase[]): string[] {
  return cases.map((c) => `${c.title}: ${c.passCriteria}`);
}

export function extractFailCriteria(cases: TestingCase[]): string[] {
  return cases.map((c) => `${c.title}: ${c.failCriteria}`);
}
