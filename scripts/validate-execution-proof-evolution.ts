/**
 * Phase 24E — Execution Proof Evolution validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessExecutionProofEvolution,
  evaluateExecutionProofAttempt,
  EXECUTION_PROOF_EVIDENCE_SOURCES,
  EXECUTION_PROOF_EVOLUTION_PASS_TOKEN,
  EXECUTION_PROOF_VERDICTS,
  resetExecutionProofEvolutionModuleForTests,
  VERDICT_NOT_PROVEN_MIN,
  VERDICT_PARTIALLY_PROVEN_MIN,
  VERDICT_PROVEN_FIXED_MIN,
} from '../src/execution-proof-evolution/index.js';
import type {
  AssessExecutionProofEvolutionInput,
  ExecutionProofAttempt,
  ExecutionProofProblem,
} from '../src/execution-proof-evolution/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 15_000;

const REQUIRED_FILES = [
  'src/execution-proof-evolution/execution-proof-types.ts',
  'src/execution-proof-evolution/execution-proof-registry.ts',
  'src/execution-proof-evolution/execution-proof-authority.ts',
  'src/execution-proof-evolution/execution-proof-evaluator.ts',
  'src/execution-proof-evolution/execution-proof-history.ts',
  'src/execution-proof-evolution/execution-proof-report-builder.ts',
  'src/execution-proof-evolution/index.ts',
  'architecture/EXECUTION_PROOF_EVOLUTION_REPORT.md',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function baseProblem(overrides: Partial<ExecutionProofProblem> = {}): ExecutionProofProblem {
  return {
    problemId: 'prob-shell-click',
    problemType: 'SHELL_INTERACTION',
    originalFailingSignal: 'Shell not clickable within target ms',
    description: 'Founder cannot click primary shell control during workflow',
    ...overrides,
  };
}

function provenFixedAttempt(): ExecutionProofAttempt {
  return {
    attemptId: 'attempt-proven-1',
    problemId: 'prob-shell-click',
    claimedFixType: 'AUTOFIX_SHELL_CLICK_HANDLER',
    claimedFixDescription: 'Rebind shell click handler and retest visible path',
    snapshot: {
      beforeState: 'Shell visible but click handler missing — click timeout',
      afterState: 'Shell clickable in 420ms — original failure absent',
      metricBefore: 3200,
      metricAfter: 420,
      originalFailureStillPresent: false,
      regressionObserved: false,
    },
    evidence: [
      {
        evidenceId: 'ev-validator',
        source: 'VALIDATOR_RESULT',
        summary: 'Visible UI clickability guard passes after fix',
        supportsImprovement: true,
        supportsRegression: false,
        capturedAt: '2026-06-12T10:00:00.000Z',
      },
      {
        evidenceId: 'ev-runtime',
        source: 'RUNTIME_OBSERVATION',
        summary: 'Playwright click succeeds on primary shell control',
        supportsImprovement: true,
        supportsRegression: false,
        capturedAt: '2026-06-12T10:00:05.000Z',
      },
      {
        evidenceId: 'ev-metric',
        source: 'BEFORE_AFTER_METRIC',
        summary: 'Click latency 3200ms → 420ms',
        supportsImprovement: true,
        supportsRegression: false,
        capturedAt: '2026-06-12T10:00:10.000Z',
      },
    ],
    originalFailureRetested: true,
    causalLinkToFix: true,
  };
}

function insufficientEvidenceAttempt(): ExecutionProofAttempt {
  return {
    attemptId: 'attempt-insufficient-1',
    problemId: 'prob-chat-routing',
    claimedFixType: 'CAPABILITY_CREATED',
    claimedFixDescription: 'Added routing module but did not retest original failure',
    snapshot: {
      beforeState: 'Chat routes to wrong handler',
      afterState: 'Chat routes to wrong handler',
      metricBefore: null,
      metricAfter: null,
      originalFailureStillPresent: true,
      regressionObserved: false,
    },
    evidence: [
      {
        evidenceId: 'ev-missing',
        source: 'MISSING_EVIDENCE',
        summary: 'Validator passed but original prompt not retested',
        supportsImprovement: false,
        supportsRegression: false,
        capturedAt: '2026-06-12T11:00:00.000Z',
      },
    ],
    originalFailureRetested: false,
    causalLinkToFix: false,
  };
}

function regressionAttempt(): ExecutionProofAttempt {
  return {
    attemptId: 'attempt-regression-1',
    problemId: 'prob-preview-load',
    claimedFixType: 'AUTOFIX_PREVIEW_BUNDLE',
    claimedFixDescription: 'Patched preview bundle loader',
    snapshot: {
      beforeState: 'Preview fails to load — 404 on bundle',
      afterState: 'Preview loads but shell feed disappears',
      metricBefore: 0,
      metricAfter: 1,
      originalFailureStillPresent: false,
      regressionObserved: true,
    },
    evidence: [
      {
        evidenceId: 'ev-preview',
        source: 'LIVE_PREVIEW_RESULT',
        summary: 'Preview route returns 200',
        supportsImprovement: true,
        supportsRegression: false,
        capturedAt: '2026-06-12T12:00:00.000Z',
      },
      {
        evidenceId: 'ev-ui-regression',
        source: 'UI_REALITY_RESULT',
        summary: 'Inline operator feed no longer visible after fix',
        supportsImprovement: false,
        supportsRegression: true,
        capturedAt: '2026-06-12T12:00:05.000Z',
      },
    ],
    originalFailureRetested: true,
    causalLinkToFix: true,
  };
}

function loopRiskAttempt(): ExecutionProofAttempt {
  return {
    attemptId: 'attempt-loop-4',
    problemId: 'prob-loop-chat',
    claimedFixType: 'AUTOFIX_SAME_PATH',
    claimedFixDescription: 'Repeated same routing patch without new diagnostics',
    snapshot: {
      beforeState: 'Chat context missing on follow-up',
      afterState: 'Chat context still missing on follow-up',
      metricBefore: 2,
      metricAfter: 2,
      originalFailureStillPresent: true,
      regressionObserved: false,
    },
    evidence: [
      {
        evidenceId: 'ev-validator-only',
        source: 'VALIDATOR_RESULT',
        summary: 'Unit validator passes — original scenario not retested',
        supportsImprovement: false,
        supportsRegression: false,
        capturedAt: '2026-06-12T13:00:00.000Z',
      },
    ],
    originalFailureRetested: false,
    causalLinkToFix: false,
  };
}

function main(): void {
  console.log('');
  console.log('Execution Proof Evolution — Validation (leaf mode)');
  console.log('==================================================');
  console.log('');

  checkpoint('start');
  resetExecutionProofEvolutionModuleForTests();

  for (const file of REQUIRED_FILES) {
    assert(`file exists: ${file}`, existsSync(join(ROOT, file)), file);
  }
  checkpoint('file checks');

  const authoritySource = readText('src/execution-proof-evolution/execution-proof-authority.ts');
  const evaluatorSource = readText('src/execution-proof-evolution/execution-proof-evaluator.ts');
  const registrySource = readText('src/execution-proof-evolution/execution-proof-registry.ts');
  const reportMd = readText('architecture/EXECUTION_PROOF_EVOLUTION_REPORT.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. package script registered', Boolean(pkg.scripts?.['validate:execution-proof-evolution']), 'package.json');
  assert('02. authority export exists', authoritySource.includes('assessExecutionProofEvolution'), 'authority');
  assert('03. all verdicts registered', EXECUTION_PROOF_VERDICTS.length === 6, String(EXECUTION_PROOF_VERDICTS.length));
  assert(
    '04. verdict constants present',
    EXECUTION_PROOF_VERDICTS.every((v) => registrySource.includes(`'${v}'`)),
    'registry',
  );
  assert(
    '05. evidence sources registered',
    EXECUTION_PROOF_EVIDENCE_SOURCES.length === 10,
    String(EXECUTION_PROOF_EVIDENCE_SOURCES.length),
  );
  assert(
    '06. scoring thresholds in registry',
    registrySource.includes(String(VERDICT_PROVEN_FIXED_MIN)) &&
      registrySource.includes(String(VERDICT_PARTIALLY_PROVEN_MIN)) &&
      registrySource.includes(String(VERDICT_NOT_PROVEN_MIN)),
    'thresholds',
  );
  assert('07. report pass token', reportMd.includes(EXECUTION_PROOF_EVOLUTION_PASS_TOKEN), 'report token');
  assert('08. no nested npm validation', !authoritySource.includes("execSync('npm run validate"), 'cascade');
  assert('09. no network fetch in module', !authoritySource.includes('fetch(') && !evaluatorSource.includes('fetch('), 'network');
  checkpoint('static checks');

  const provenInput: AssessExecutionProofEvolutionInput = {
    problem: baseProblem(),
    attempt: provenFixedAttempt(),
  };
  const proven = assessExecutionProofEvolution(provenInput);
  assert(
    '10. proven fixed scenario passes',
    proven.verdict === 'PROVEN_FIXED' && proven.executionProofScore >= VERDICT_PROVEN_FIXED_MIN,
    `${proven.verdict} score=${proven.executionProofScore}`,
  );

  resetExecutionProofEvolutionModuleForTests();
  const insufficient = assessExecutionProofEvolution({
    problem: baseProblem({ problemId: 'prob-chat-routing', problemType: 'CHAT_ROUTING' }),
    attempt: insufficientEvidenceAttempt(),
  });
  assert(
    '11. insufficient evidence scenario fails',
    insufficient.verdict === 'INSUFFICIENT_EVIDENCE' && insufficient.executionProofScore < VERDICT_NOT_PROVEN_MIN,
    `${insufficient.verdict} score=${insufficient.executionProofScore}`,
  );

  resetExecutionProofEvolutionModuleForTests();
  const regression = assessExecutionProofEvolution({
    problem: baseProblem({ problemId: 'prob-preview-load', problemType: 'PREVIEW_LOAD' }),
    attempt: regressionAttempt(),
  });
  assert(
    '12. regression scenario returns REGRESSION_DETECTED',
    regression.verdict === 'REGRESSION_DETECTED',
    `${regression.verdict} score=${regression.executionProofScore}`,
  );

  resetExecutionProofEvolutionModuleForTests();
  const loopEval = evaluateExecutionProofAttempt(loopRiskAttempt(), 3);
  const loop = assessExecutionProofEvolution({
    problem: baseProblem({ problemId: 'prob-loop-chat', problemType: 'CHAT_CONTEXT' }),
    attempt: loopRiskAttempt(),
    priorUnprovenAttemptsForProblem: 3,
  });
  assert(
    '13. repeated failed attempts returns LOOP_RISK',
    loopEval.verdict === 'LOOP_RISK' && loop.verdict === 'LOOP_RISK',
    `${loop.verdict} score=${loop.executionProofScore}`,
  );

  assert(
    '14. authority answers present',
    proven.authorityAnswers.originalProblem.length > 0 &&
      proven.authorityAnswers.claimedFix.length > 0 &&
      proven.authorityAnswers.recommendedAction === 'KEEP',
    proven.fixDisposition,
  );
  assert(
    '15. score breakdown sums correctly',
    proven.scoreBreakdown.originalFailureRetested +
      proven.scoreBreakdown.beforeAfterEvidence +
      proven.scoreBreakdown.independentConfirmation +
      proven.scoreBreakdown.noRegression +
      proven.scoreBreakdown.causalLink +
      proven.scoreBreakdown.reusableMemory ===
      proven.executionProofScore,
    String(proven.executionProofScore),
  );
  checkpoint('scenario checks');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('');
  console.log('Results');
  console.log('-------');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }
  console.log('');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('EXECUTION_PROOF_EVOLUTION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(EXECUTION_PROOF_EVOLUTION_PASS_TOKEN);
  console.log('');
  console.log('Proof score examples:');
  console.log(`  PROVEN_FIXED:        ${proven.executionProofScore}/100`);
  console.log(`  INSUFFICIENT_EVIDENCE: ${insufficient.executionProofScore}/100`);
  console.log(`  REGRESSION_DETECTED: ${regression.executionProofScore}/100 (verdict override)`);
  console.log(`  LOOP_RISK:           ${loop.executionProofScore}/100 (verdict override)`);
  console.log('');
  console.log('Report: architecture/EXECUTION_PROOF_EVOLUTION_REPORT.md');
  console.log(`Runtime: ${Date.now() - START}ms`);
  console.log('');
}

main();
