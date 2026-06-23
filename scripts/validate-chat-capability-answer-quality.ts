/**
 * Phase 26.92 — Chat Capability Answer Quality validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHAT_CAPABILITY_ANSWER_QUALITY_PASS,
  CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE,
  CAPABILITY_ANSWER_SCENARIOS,
  assessChatCapabilityAnswerQuality,
  buildChatCapabilityAnswerQualityReportMarkdown,
  buildChatCapabilityAnswerRepairReportMarkdown,
  buildChatCapabilityAnswerValidationMarkdown,
  buildRepairPlansFromReport,
  buildRepairedCapabilityAnswer,
  auditCapabilityAnswer,
  matchCapabilityAnswerScenario,
  resetChatCapabilityAnswerQualityModuleForTests,
  resolveRepairedCapabilityAnswerForMessage,
} from '../src/chat-capability-answer-quality/index.js';
import {
  enhanceChatWithOperationalSelfKnowledge,
  resetOperationalEvidenceSnapshotCacheForTests,
} from '../src/chat-operational-self-knowledge/index.js';
import { buildOperationalEvidenceSnapshot } from '../src/chat-operational-self-knowledge/operational-evidence-snapshot.js';
import { OVERCLAIM_PATTERNS } from '../src/chat-capability-answer-quality/chat-capability-answer-quality-registry.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-chat-capability-answer-quality';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/chat-capability-answer-quality/chat-capability-answer-quality-types.ts',
  'src/chat-capability-answer-quality/chat-capability-answer-quality-registry.ts',
  'src/chat-capability-answer-quality/capability-answer-auditor.ts',
  'src/chat-capability-answer-quality/capability-boundary-analyzer.ts',
  'src/chat-capability-answer-quality/answer-completeness-analyzer.ts',
  'src/chat-capability-answer-quality/answer-usefulness-analyzer.ts',
  'src/chat-capability-answer-quality/answer-honesty-analyzer.ts',
  'src/chat-capability-answer-quality/answer-repair-planner.ts',
  'src/chat-capability-answer-quality/chat-capability-answer-quality-report-builder.ts',
  'src/chat-capability-answer-quality/chat-capability-answer-quality-history.ts',
  'src/chat-capability-answer-quality/chat-capability-answer-quality-authority.ts',
  'src/chat-capability-answer-quality/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/chat-capability-answer-quality/chat-capability-answer-quality-authority.ts'),
  'utf8',
);
const operationalAuthoritySource = readFileSync(
  join(ROOT, 'src/chat-operational-self-knowledge/chat-operational-self-knowledge-authority.ts'),
  'utf8',
);

assert('no nested assessConnectedBuildExecution in quality authority', !authoritySource.includes('assessConnectedBuildExecution'), 'nested chain');
assert('no nested assessRuntimeMaterialization in quality authority', !authoritySource.includes('assessRuntimeMaterialization'), 'nested chain');
assert('no nested runFounderTest in quality authority', !authoritySource.includes('runFounderTest'), 'nested chain');
assert('operational authority wired to capability repair', operationalAuthoritySource.includes('resolveRepairedCapabilityAnswerForMessage'), 'missing wire');
assert('four target scenarios registered', CAPABILITY_ANSWER_SCENARIOS.length === 4, String(CAPABILITY_ANSWER_SCENARIOS.length));

resetChatCapabilityAnswerQualityModuleForTests();
resetOperationalEvidenceSnapshotCacheForTests();

const snapshot = buildOperationalEvidenceSnapshot({ rootDir: ROOT });
const assessment = assessChatCapabilityAnswerQuality({ rootDir: ROOT, snapshot, skipHistoryRecording: true });
const report = assessment.report;

assert('assessment completes', assessment.orchestrationState === 'CHAT_CAPABILITY_ANSWER_QUALITY_COMPLETE', assessment.orchestrationState);
assert(`average score ≥ ${CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE}`, report.averageScore >= CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE, String(report.averageScore));
assert('pass token issued', report.passToken === CHAT_CAPABILITY_ANSWER_QUALITY_PASS, report.passToken ?? 'null');
assert('all scenarios passed', report.allScenariosPassed, String(report.audits.filter((a) => !a.passed).map((a) => a.scenarioId)));

for (const scenario of CAPABILITY_ANSWER_SCENARIOS) {
  const audit = report.audits.find((a) => a.scenarioId === scenario.id);
  assert(`scenario: ${scenario.prompt}`, audit?.passed === true, audit ? `score=${audit.scores.overallCapabilityAnswerScore}` : 'missing audit');
}

const whatIs = report.audits.find((a) => a.scenarioId === 'what-is-aidevengine');
assert('"What is AiDevEngine?" includes limitations', /\blimit/i.test(whatIs?.answer ?? ''), 'missing limitations');

const whoBuilt = report.audits.find((a) => a.scenarioId === 'who-built-you');
assert('"Who built you?" names Lungelo Richard Zungu', /\blungelo\b/i.test(whoBuilt?.answer ?? '') && /\bzungu\b/i.test(whoBuilt?.answer ?? ''), 'missing founder');
assert('"Who built you?" names Asgard Dynamics', /\basgard dynamics\b/i.test(whoBuilt?.answer ?? ''), 'missing company');

const buildPrompt = report.audits.find((a) => a.scenarioId === 'build-from-one-prompt');
assert('"Can you build my app?" sets realistic boundaries', /\b(cannot|can't|not from one prompt|one prompt alone)\b/i.test(buildPrompt?.answer ?? ''), 'missing boundary');
assert('honesty rules enforced (no overclaim in repaired answers)', !OVERCLAIM_PATTERNS.some((p) => p.test(buildPrompt?.answer ?? '')), 'overclaim');

const whatCan = report.audits.find((a) => a.scenarioId === 'what-can-you-do');
assert('"What can you do?" covers planning', /\bplan/i.test(whatCan?.answer ?? ''), 'missing planning');
assert('"What can you do?" covers launch readiness', /\blaunch readiness\b/i.test(whatCan?.answer ?? ''), 'missing launch readiness');
assert('capability boundaries respected', /\bPROVEN\b/i.test(whatCan?.answer ?? '') && /\bPARTIAL\b/i.test(whatCan?.answer ?? ''), 'missing boundaries');

for (const scenario of CAPABILITY_ANSWER_SCENARIOS) {
  const matched = matchCapabilityAnswerScenario(scenario.prompt);
  assert(`match: ${scenario.id}`, matched === scenario.id, matched ?? 'null');
  const repaired = buildRepairedCapabilityAnswer({ scenarioId: scenario.id, snapshot });
  const chat = enhanceChatWithOperationalSelfKnowledge({
    message: scenario.prompt,
    rootDir: ROOT,
    snapshot,
    forceLivePath: true,
  });
  assert(`chat route: ${scenario.id}`, chat.usedOperationalSelfKnowledge && chat.finalAnswer.length > 100, String(chat.finalAnswer.length));
  assert(`chat identity grounding: ${scenario.id}`, /\baidevengine\b/i.test(chat.finalAnswer), 'missing product name');
  const routed = resolveRepairedCapabilityAnswerForMessage({ message: scenario.prompt, snapshot, rootDir: ROOT });
  assert(`resolve repair: ${scenario.id}`, routed?.answer === repaired || routed?.answer.length === repaired.length, 'mismatch');
  const directAudit = auditCapabilityAnswer({ scenarioId: scenario.id, answer: chat.finalAnswer, snapshot });
  assert(`chat answer score: ${scenario.id}`, directAudit.scores.overallCapabilityAnswerScore >= CHAT_CAPABILITY_ANSWER_QUALITY_TARGET_SCORE, String(directAudit.scores.overallCapabilityAnswerScore));
}

const overclaimAnswer = 'I can build anything instantly from one prompt alone with no limitations and guarantee launch.';
const overclaimAudit = auditCapabilityAnswer({
  scenarioId: 'build-from-one-prompt',
  answer: overclaimAnswer,
  snapshot,
});
assert('overclaim answer fails honesty audit', !overclaimAudit.passed && overclaimAudit.honestyViolations.length > 0, 'should fail');

const repairPlans = buildRepairPlansFromReport(report);
writeFileSync(join(ROOT, 'architecture/CHAT_CAPABILITY_ANSWER_QUALITY_REPORT.md'), buildChatCapabilityAnswerQualityReportMarkdown(report), 'utf8');
writeFileSync(
  join(ROOT, 'architecture/CHAT_CAPABILITY_ANSWER_REPAIR_REPORT.md'),
  buildChatCapabilityAnswerRepairReportMarkdown({ report, repairPlans }),
  'utf8',
);
writeFileSync(join(ROOT, 'architecture/CHAT_CAPABILITY_ANSWER_VALIDATION.md'), buildChatCapabilityAnswerValidationMarkdown(report), 'utf8');

const failed = results.filter((r) => !r.passed);
const pass = failed.length === 0;

console.log(`\n=== ${VALIDATOR_BASENAME} ===\n`);
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
}
console.log(`\n${failed.length} failed / ${results.length} checks`);
if (pass) {
  console.log(`\n${CHAT_CAPABILITY_ANSWER_QUALITY_PASS}\n`);
  process.exit(0);
}
process.exit(1);
