/**
 * Phase 26.95 — Chat Intelligence Scenario Consumption validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessChatCapabilityAnswerQuality, CHAT_CAPABILITY_ANSWER_QUALITY_PASS } from '../src/chat-capability-answer-quality/index.js';
import { CAPABILITY_ANSWER_SCENARIOS } from '../src/chat-capability-answer-quality/chat-capability-answer-quality-registry.js';
import { buildOperationalEvidenceSnapshot } from '../src/chat-operational-self-knowledge/operational-evidence-snapshot.js';
import {
  CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_PASS,
  assessChatIntelligenceScenarioConsumption,
  buildChatIntelligenceScenarioConsumptionReportMarkdown,
  buildChatIntelligenceScenarioPipelineAuditMarkdown,
  buildChatIntelligenceScenarioConsumptionValidationMarkdown,
  countExecutedScenarios,
  countRegisteredScenarios,
  deriveChatIntelligenceFromRegisteredSources,
  detectChatIntelligenceConsumptionContradiction,
  reconcileChatIntelligenceForFounderTest,
  resetChatIntelligenceScenarioConsumptionModuleForTests,
} from '../src/chat-intelligence-scenario-consumption-audit/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-chat-intelligence-scenario-consumption';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/chat-intelligence-scenario-consumption-audit/chat-intelligence-scenario-consumption-types.ts',
  'src/chat-intelligence-scenario-consumption-audit/chat-intelligence-scenario-consumption-registry.ts',
  'src/chat-intelligence-scenario-consumption-audit/scenario-registration-auditor.ts',
  'src/chat-intelligence-scenario-consumption-audit/scenario-discovery-auditor.ts',
  'src/chat-intelligence-scenario-consumption-audit/scenario-selection-auditor.ts',
  'src/chat-intelligence-scenario-consumption-audit/scenario-execution-auditor.ts',
  'src/chat-intelligence-scenario-consumption-audit/scenario-result-capture-auditor.ts',
  'src/chat-intelligence-scenario-consumption-audit/scenario-score-propagation-auditor.ts',
  'src/chat-intelligence-scenario-consumption-audit/chat-intelligence-consumption-bridge.ts',
  'src/chat-intelligence-scenario-consumption-audit/chat-intelligence-scenario-consumption-report-builder.ts',
  'src/chat-intelligence-scenario-consumption-audit/chat-intelligence-scenario-consumption-history.ts',
  'src/chat-intelligence-scenario-consumption-audit/chat-intelligence-scenario-consumption-authority.ts',
  'src/chat-intelligence-scenario-consumption-audit/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const authoritySource = readFileSync(
  join(ROOT, 'src/chat-intelligence-scenario-consumption-audit/chat-intelligence-scenario-consumption-authority.ts'),
  'utf8',
);
const bridgeSource = readFileSync(
  join(ROOT, 'src/founder-truth-matrix-integration/launch-readiness-truth-bridge.ts'),
  'utf8',
);

assert('no nested assessConnectedBuildExecution in consumption authority', !authoritySource.includes('assessConnectedBuildExecution'), 'nested chain');
assert('no nested runFounderTest in consumption authority', !authoritySource.includes('runFounderTest'), 'nested chain');
assert('no nested validate: in consumption authority', !authoritySource.includes('validate:'), 'nested chain');
assert('truth bridge uses registered source derivation', bridgeSource.includes('deriveChatIntelligenceFromRegisteredSources'), 'missing bridge wire');

resetChatIntelligenceScenarioConsumptionModuleForTests();

const snapshot = buildOperationalEvidenceSnapshot({ rootDir: ROOT, skipHeavyAuthorities: true });
const capabilityAssessment = assessChatCapabilityAnswerQuality({ rootDir: ROOT, snapshot, skipHistoryRecording: true });
assert('capability answer quality passes', capabilityAssessment.report.passToken === CHAT_CAPABILITY_ANSWER_QUALITY_PASS, capabilityAssessment.report.passToken ?? 'null');

const consumption = assessChatIntelligenceScenarioConsumption({
  rootDir: ROOT,
  chatCapabilityAnswerQuality: capabilityAssessment,
  skipHistoryRecording: true,
});

const report = consumption.report;
const derived = consumption.derivedChatIntelligence;

assert('assessment completes', consumption.orchestrationState === 'CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_COMPLETE', consumption.orchestrationState);
assert('registered scenarios detected', report.registeredScenarioCount >= CAPABILITY_ANSWER_SCENARIOS.length, String(report.registeredScenarioCount));
assert('discovered scenarios detected', report.discoveredScenarioCount >= CAPABILITY_ANSWER_SCENARIOS.length, String(report.discoveredScenarioCount));
assert('executed scenarios detected', report.executedScenarioCount >= CAPABILITY_ANSWER_SCENARIOS.length, String(report.executedScenarioCount));
assert('results captured', report.traces.filter((t) => t.resultCaptured).length >= CAPABILITY_ANSWER_SCENARIOS.length, 'insufficient capture');
assert('results scored', report.scoredScenarioCount >= CAPABILITY_ANSWER_SCENARIOS.length, String(report.scoredScenarioCount));
assert('scores propagated', report.propagatedScenarioCount >= CAPABILITY_ANSWER_SCENARIOS.length, String(report.propagatedScenarioCount));
assert('Founder Test consumes scores', report.founderTestConsumed, `score=${report.chatIntelligenceScore}, run=${report.scenariosRun}`);
assert('report reflects non-zero scenario count', report.scenariosRun > 0, String(report.scenariosRun));
assert('report reflects non-zero chat intelligence score', report.chatIntelligenceScore >= 85, String(report.chatIntelligenceScore));
assert('no 0/0 when capability results exist', !(report.executedScenarioCount > 0 && report.scenariosRun === 0), '0/0 contradiction');
assert('no contradiction detected', !report.contradictionDetected, report.contradictionDetail ?? 'ok');
assert('pass token issued', report.passToken === CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_PASS, report.passToken ?? 'null');

const reconciled = reconcileChatIntelligenceForFounderTest({
  rootDir: ROOT,
  chatIntelligenceReality: { ...derived, scenariosRun: 0, chatIntelligenceScore: 0, scenariosPassed: 0 },
  chatCapabilityAnswerQuality: capabilityAssessment,
});
assert('reconcile recovers from phantom 0/0', reconciled.scenariosRun > 0 && reconciled.chatIntelligenceScore >= 85, `${reconciled.scenariosPassed}/${reconciled.scenariosRun} @ ${reconciled.chatIntelligenceScore}`);

const bridgeDerived = deriveChatIntelligenceFromRegisteredSources({
  rootDir: ROOT,
  chatStressSimulation: null,
  chatCapabilityAnswerQuality: capabilityAssessment,
});
assert('bridge derives from capability when stress absent', bridgeDerived.scenariosRun >= 4 && bridgeDerived.chatIntelligenceScore >= 85, `${bridgeDerived.scenariosPassed}/${bridgeDerived.scenariosRun}`);

const contradiction = detectChatIntelligenceConsumptionContradiction({
  derived: { ...bridgeDerived, scenariosRun: 0, chatIntelligenceScore: 0, scenariosPassed: 0 } as typeof bridgeDerived,
  capabilityAnswerQuality: capabilityAssessment,
});
assert('contradiction detector flags 0/0 with capability pass', contradiction.contradictionDetected, contradiction.detail ?? 'none');

writeFileSync(
  join(ROOT, 'architecture/CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_REPORT.md'),
  buildChatIntelligenceScenarioConsumptionReportMarkdown(report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/CHAT_INTELLIGENCE_SCENARIO_PIPELINE_AUDIT.md'),
  buildChatIntelligenceScenarioPipelineAuditMarkdown(report),
  'utf8',
);
writeFileSync(
  join(ROOT, 'architecture/CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_VALIDATION.md'),
  buildChatIntelligenceScenarioConsumptionValidationMarkdown(results, report.passToken),
  'utf8',
);

const failed = results.filter((r) => !r.passed);
const pass = failed.length === 0;

console.log(`\n=== ${VALIDATOR_BASENAME} ===\n`);
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
}
console.log(`\n${failed.length} failed / ${results.length} checks`);
console.log(`Registered: ${countRegisteredScenarios()}, Executed traces: ${countExecutedScenarios(report.traces)}`);
console.log(`Derived Chat Intelligence: ${derived.chatIntelligenceScore}/100 (${derived.scenariosPassed}/${derived.scenariosRun})`);
if (pass) {
  console.log(`\n${CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_PASS}\n`);
  process.exit(0);
}
process.exit(1);
