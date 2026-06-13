/**
 * Phase 26.73 — Chat Operational Self-Knowledge validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessChatIntelligenceReality } from '../src/chat-intelligence-reality/index.js';
import {
  CHAT_OPERATIONAL_SELF_KNOWLEDGE_V1_PASS,
  CONSCIOUSNESS_CLAIM_PATTERNS,
  buildCapabilityTruthRegistry,
  buildOperationalSelfKnowledgeAssessment,
  classifyOperationalQuestion,
  composeOperationalSelfKnowledgeResponse,
  enhanceChatWithOperationalSelfKnowledge,
  getOperationalEvidenceSnapshot,
  resetOperationalEvidenceSnapshotCacheForTests,
} from '../src/chat-operational-self-knowledge/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/chat-operational-self-knowledge/chat-operational-self-knowledge-authority.ts',
  'src/chat-operational-self-knowledge/capability-truth-registry.ts',
  'src/chat-operational-self-knowledge/uncertainty-model.ts',
  'src/chat-operational-self-knowledge/operational-evidence-snapshot.ts',
  'src/chat-operational-self-knowledge/operational-response-composer.ts',
  'src/chat-operational-self-knowledge/operational-question-classifier.ts',
  'src/llm-chat-brain/llm-chat-orchestrator.ts',
  'src/chat-intelligence-reality/chat-intelligence-reality-authority.ts',
  'scripts/validate-chat-operational-self-knowledge.ts',
  'architecture/CHAT_OPERATIONAL_SELF_KNOWLEDGE_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

resetOperationalEvidenceSnapshotCacheForTests();
const snapshot = getOperationalEvidenceSnapshot(ROOT);
const registry = buildCapabilityTruthRegistry(ROOT);

assert('capability truth registry exists', registry.entries.length >= 8, String(registry.entries.length));
assert(
  'capability truth levels valid',
  registry.entries.every((e) =>
    ['PROVEN', 'PARTIALLY_PROVEN', 'NOT_PROVEN', 'UNKNOWN'].includes(e.truthLevel),
  ),
  'levels',
);
assert('uncertainty model present', Boolean(snapshot.overallUncertainty.level), snapshot.overallUncertainty.level);
assert('evidence sources recorded', snapshot.evidenceSources.length >= 3, String(snapshot.evidenceSources.length));

const trustKind = classifyOperationalQuestion('Why should I trust you?');
assert('trust question classified', trustKind === 'TRUST', trustKind);
const nextKind = classifyOperationalQuestion('What should I do next?');
assert('next-step classified', nextKind === 'NEXT_STEP', nextKind);
const stageKind = classifyOperationalQuestion('What is the first broken stage right now?');
assert('first broken stage classified', stageKind === 'FIRST_BROKEN_STAGE', stageKind);

const trustAssessment = buildOperationalSelfKnowledgeAssessment({
  message: 'Why should I trust you?',
  kind: 'TRUST',
  snapshot,
});
assert('trust references proof systems', trustAssessment.referencesProofSystems, String(trustAssessment.referencesProofSystems));
assert('trust no consciousness claims', trustAssessment.consciousnessClaimBlocked, String(trustAssessment.consciousnessClaimBlocked));
assert(
  'trust answer uses evidence language',
  /\b(founder test|evidence|proof|typecheck|execution)\b/i.test(trustAssessment.responseText),
  'evidence words',
);

const limitationAssessment = buildOperationalSelfKnowledgeAssessment({
  message: 'What are you unable to do?',
  kind: 'LIMITATIONS',
  snapshot,
});
assert('limitations admit limits', limitationAssessment.admitsLimitations, String(limitationAssessment.admitsLimitations));
assert(
  'limitations reference proven/unproven',
  /\b(proven|unproven|NOT_PROVEN|PROVEN)\b/i.test(limitationAssessment.responseText),
  'capability truth',
);

const nextAssessment = buildOperationalSelfKnowledgeAssessment({
  message: 'What should I do next?',
  kind: 'NEXT_STEP',
  snapshot,
});
assert(
  'next-step has priorities',
  /priority 1/i.test(nextAssessment.responseText),
  nextAssessment.responseText.slice(0, 80),
);

const weaknessAssessment = buildOperationalSelfKnowledgeAssessment({
  message: 'What is your biggest weakness?',
  kind: 'WEAKNESS',
  snapshot,
});
assert(
  'weakness references capability',
  /\b(weakness|unproven|NOT_PROVEN|broken)\b/i.test(weaknessAssessment.responseText),
  'weakness',
);

const selfAssessment = composeOperationalSelfKnowledgeResponse({
  kind: 'SELF_AWARENESS',
  snapshot,
});
assert(
  'no consciousness claims in self-awareness',
  !CONSCIOUSNESS_CLAIM_PATTERNS.some((p) => p.test(selfAssessment)),
  'clean',
);
assert(
  'self-awareness denies consciousness',
  /\bnot conscious|not sentient|not human-self-aware\b/i.test(selfAssessment),
  'denial',
);

const enhanced = enhanceChatWithOperationalSelfKnowledge({
  message: 'What do you not know right now?',
  rootDir: ROOT,
  snapshot,
});
assert('operational enhancement used', enhanced.usedOperationalSelfKnowledge, String(enhanced.usedOperationalSelfKnowledge));
assert('no fake self-awareness', !/\bi am fully self-aware\b/i.test(enhanced.finalAnswer), 'no fake');

const chatIntel = assessChatIntelligenceReality({ rootDir: ROOT, deadlineMs: 60_000 });
assert(
  'founder test chat intel consumes snapshot',
  chatIntel.operationalEvidenceSnapshot.capabilityTruth.entries.length > 0,
  String(chatIntel.operationalEvidenceSnapshot.capabilityTruth.entries.length),
);
assert(
  'chat intelligence scenarios improved',
  chatIntel.scenariosPassed >= 6,
  `${chatIntel.scenariosPassed}/${chatIntel.scenariosRun}`,
);

const orchSource = readFileSync(join(ROOT, 'src/llm-chat-brain/llm-chat-orchestrator.ts'), 'utf8');
assert('llm orchestrator wired', orchSource.includes('enhanceChatWithOperationalSelfKnowledge'), 'llm');
const intelSource = readFileSync(
  join(ROOT, 'src/chat-intelligence-reality/chat-intelligence-reality-authority.ts'),
  'utf8',
);
assert('chat intelligence wired', intelSource.includes('resolveOperationalSelfKnowledgeChatResponse'), 'intel');

const arch = readFileSync(join(ROOT, 'architecture/CHAT_OPERATIONAL_SELF_KNOWLEDGE_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(CHAT_OPERATIONAL_SELF_KNOWLEDGE_V1_PASS), 'token');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Chat Operational Self-Knowledge Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${CHAT_OPERATIONAL_SELF_KNOWLEDGE_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
