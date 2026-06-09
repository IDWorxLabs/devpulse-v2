/**
 * Testing failure bridge — exposes simulated failures to failure visibility without full plan chain.
 */

import { buildTestCases } from './test-case-model.js';
import { analyzeTestRisks } from './test-risk-analyzer.js';
import { buildSimulatedTestResults, simulatedFailureResults } from './simulated-test-result-model.js';
import { isTestingRuntimeFoundationQuestion } from './testing-runtime-types.js';

export interface TestingFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildTestingFailureContext(query: string): TestingFailureContext[] {
  if (!isTestingRuntimeFoundationQuestion(query)) return [];

  const cases = buildTestCases(query);
  const simulated = buildSimulatedTestResults(cases, query);
  const failures = simulatedFailureResults(simulated);
  const risks = analyzeTestRisks(query);

  const records: TestingFailureContext[] = [];

  for (const f of failures) {
    records.push({
      title: `Simulated test failure: ${f.title}`,
      description: f.summary,
      sourceSystem: 'testing_runtime',
      severity: 'HIGH',
    });
  }

  for (const r of risks.filter((x) => x.level === 'CRITICAL' || x.level === 'HIGH').slice(0, 3)) {
    records.push({
      title: `Testing risk: ${r.summary.slice(0, 60)}`,
      description: r.summary,
      sourceSystem: r.sourceSystem,
      severity: r.level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
    });
  }

  return records;
}
