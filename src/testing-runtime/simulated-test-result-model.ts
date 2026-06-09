/**
 * Simulated test result model — models pass/fail without running tests.
 */

import type { SimulatedTestResult, TestingCase } from './testing-runtime-types.js';

let resultCounter = 0;

function nextResultId(): string {
  resultCounter += 1;
  return `tres-${resultCounter.toString().padStart(4, '0')}`;
}

export function resetSimulatedTestResultCounterForTests(): void {
  resultCounter = 0;
}

export function buildSimulatedTestResults(cases: TestingCase[], query: string): SimulatedTestResult[] {
  const lower = query.toLowerCase();
  const wantsFailures = lower.includes('simulated failures') || lower.includes('fail');

  return cases.map((testCase, index) => {
    let status: SimulatedTestResult['status'] = 'NOT_RUN';
    let summary = 'Simulated — test not executed; planning only';

    if (index < 3) {
      status = 'PASS';
      summary = `Simulated PASS — ${testCase.title} would pass if executed in future governed phase`;
    } else if (index === 3 || (wantsFailures && index === 4)) {
      status = 'FAIL';
      summary = `Simulated FAIL — ${testCase.title} blocked by Phase 14.4 no-execution guard`;
    } else if (index >= 4) {
      status = 'SKIPPED';
      summary = `Simulated SKIPPED — ${testCase.title} deferred until approval gates pass`;
    }

    return {
      resultId: nextResultId(),
      caseId: testCase.caseId,
      title: testCase.title,
      status,
      summary,
      evidenceNote: 'No commands run — simulated result for visibility only',
      executed: false,
      simulationOnly: true,
    };
  });
}

export function simulatedFailureResults(results: SimulatedTestResult[]): SimulatedTestResult[] {
  return results.filter((r) => r.status === 'FAIL');
}
