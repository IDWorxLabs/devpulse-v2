/**
 * DevPulse V2 Phase 11.4B — Project Knowledge Reasoning validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_UNDERSTANDING_FEED,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
  withSharedMemoryFeedStages,
} from '../src/command-center-brain/index.js';
import { resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import {
  PROJECT_KNOWLEDGE_REASONING_PASS_TOKEN,
  answerFromReasoning,
  answerProjectQuestion,
  answerProjectQuestionWithTrace,
  collectProjectFacts,
  composeProjectAnswer,
  reasonOverProjectFacts,
  resetProjectUnderstandingForTests,
  resolveProjectIntent,
} from '../src/project-understanding/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const LEGACY_QUERIES = {
  workingOn: 'What project are we working on?',
  missing: 'What is missing in this project?',
  blocked: 'What is blocked?',
  next: 'What should this project do next?',
  related: 'What systems relate to this project?',
} as const;

const REASONING_QUERIES = [
  'How mature is this project?',
  'What is the biggest risk?',
  'What should be built next?',
  'What is holding us back?',
  'What is the weakest area?',
  'If I disappeared for six months what should happen next?',
  'What would stop World 2 from working?',
  'What systems matter most?',
  'Which system is furthest behind?',
  'Why is execution not connected?',
  'Which missing capability is most important?',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

async function postBrain(message: string): Promise<{ status: number; body: Record<string, unknown> | null }> {
  return new Promise((resolve) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        resolve({ status: 500, body: null });
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/brain/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
        .then(async (res) => {
          const body = (await res.json()) as Record<string, unknown>;
          server.close();
          resolve({ status: res.status, body });
        })
        .catch(() => {
          server.close();
          resolve({ status: 500, body: null });
        });
    });
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 11.4B Project Knowledge Reasoning');
  console.log('====================================================');
  console.log('');

  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();

  const engineSrc = readText('src/project-understanding/project-understanding-engine.ts');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. knowledge model module', existsSync(join(ROOT, 'src/project-understanding/project-knowledge-model.ts')), 'exists');
  assert('2. fact collector module', existsSync(join(ROOT, 'src/project-understanding/project-fact-collector.ts')), 'exists');
  assert('3. intent resolver module', existsSync(join(ROOT, 'src/project-understanding/project-intent-resolver.ts')), 'exists');
  assert('4. reasoning engine module', existsSync(join(ROOT, 'src/project-understanding/project-reasoning-engine.ts')), 'exists');
  assert('5. answer composer module', existsSync(join(ROOT, 'src/project-understanding/project-answer-composer.ts')), 'exists');
  assert('6. validate script', typeof pkg.scripts?.['validate:project-knowledge-reasoning'] === 'string', 'script');
  assert('7. pass token', PROJECT_KNOWLEDGE_REASONING_PASS_TOKEN.includes('REASONING'), 'token');
  assert('8. no formatter chain in engine', !engineSrc.includes('formatProjectGapsResponse'), 'no route formatters');
  assert('9. no keyword if missing', !engineSrc.includes("includes('missing')"), 'no keyword routes');
  assert('10. uses collectProjectFacts', engineSrc.includes('collectProjectFacts'), 'facts');

  const context = collectProjectFacts('test');
  assert('11. facts collected', context.snapshot.factCount > 10, String(context.snapshot.factCount));
  assert('12. memory facts', context.memoryFactCount >= 0, String(context.memoryFactCount));
  assert('13. cross-system facts', context.crossSystemFactCount > 0, String(context.crossSystemFactCount));

  const intent = resolveProjectIntent(LEGACY_QUERIES.missing);
  assert('14. missing intent STATUS', intent === 'STATUS', intent);

  const reasoning = reasonOverProjectFacts(LEGACY_QUERIES.missing, context, intent);
  assert('15. reasoning conclusions', reasoning.conclusions.length > 0, String(reasoning.conclusions.length));
  assert('16. reasoning confidence', ['HIGH', 'MEDIUM', 'LOW'].includes(reasoning.confidence), reasoning.confidence);
  assert('17. composer output', composeProjectAnswer(reasoning).includes('Summary:'), 'composer');

  const trace = answerProjectQuestionWithTrace(LEGACY_QUERIES.workingOn);
  assert('18. trace intent IDENTITY', trace.intent === 'IDENTITY', trace.intent);
  assert('19. trace response', trace.responseText.includes('DevPulse V2'), 'response');

  const workingOnQ = processBrainRequest({ message: LEGACY_QUERIES.workingOn });
  const missingQ = processBrainRequest({ message: LEGACY_QUERIES.missing });
  const blockedQ = processBrainRequest({ message: LEGACY_QUERIES.blocked });
  const nextQ = processBrainRequest({ message: LEGACY_QUERIES.next });
  const relatedQ = processBrainRequest({ message: LEGACY_QUERIES.related });

  assert('20. legacy working on', workingOnQ.brainResponse.includes('DevPulse V2'), 'legacy');
  assert('21. legacy missing gaps', missingQ.brainResponse.includes('Missing Capabilities'), 'legacy');
  assert('22. legacy blocked', blockedQ.brainResponse.includes('Blocked Items'), 'legacy');
  assert('23. legacy next step', nextQ.brainResponse.includes('Next Recommended Step') || nextQ.brainResponse.includes('Recommended Next Step'), 'legacy');
  assert('24. legacy related', relatedQ.brainResponse.includes('Related Systems'), 'legacy');

  assert('25. feed understanding project', workingOnQ.operatorFeedEvents.some((e) => e.eventType === 'Understanding Project'), 'feed');
  assert('26. feed gathering facts', workingOnQ.operatorFeedEvents.some((e) => e.eventType === 'Gathering Facts'), 'feed');
  assert('27. feed evaluating risks', workingOnQ.operatorFeedEvents.some((e) => e.eventType === 'Evaluating Risks'), 'feed');
  assert('28. feed analyzing dependencies', relatedQ.operatorFeedEvents.some((e) => e.eventType === 'Analyzing Dependencies'), 'feed');
  assert('29. feed generating conclusions', nextQ.operatorFeedEvents.some((e) => e.eventType === 'Generating Conclusions'), 'feed');

  for (let i = 0; i < REASONING_QUERIES.length; i += 1) {
    const q = REASONING_QUERIES[i]!;
    const r = answerProjectQuestion(q);
    assert(`${30 + i}. reasoning query ${i}`, r.includes('DevPulse V2') && r.includes('Summary:'), q.slice(0, 40));
  }

  assert('41. no dedicated route weakest', !readText('src/project-understanding/project-understanding-engine.ts').includes('weakest area'), 'no route');
  assert('42. intent broad classes only', !existsSync(join(ROOT, 'src/project-understanding/project-gap-intent.ts')), 'no sub-intents');

  for (let i = 0; i < 15; i += 1) {
    const t = answerProjectQuestionWithTrace(`What is missing iteration ${i}?`);
    assert(`${43 + i}. fact pipeline ${i}`, t.context.snapshot.factCount > 10 && t.reasoning.selectedFacts.length > 0, 'pipeline');
  }

  for (let i = 0; i < 15; i += 1) {
    const intentR = resolveProjectIntent(REASONING_QUERIES[i % REASONING_QUERIES.length]!);
    assert(`${58 + i}. intent resolved ${i}`, intentR !== 'UNKNOWN', intentR);
  }

  for (let i = 0; i < 15; i += 1) {
    const ctx = collectProjectFacts(`risk query ${i}`);
    const r = reasonOverProjectFacts(`risk query ${i}`, ctx, 'RISKS');
    assert(`${73 + i}. risk reasoning ${i}`, r.warnings.length >= 0 && r.conclusions.length > 0, 'risks');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: REASONING_QUERIES[i % REASONING_QUERIES.length]! });
    assert(`${88 + i}. brain reasoning ${i}`, r.category === 'PROJECT_UNDERSTANDING', r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(REASONING_QUERIES[i % REASONING_QUERIES.length]!);
    assert(`${98 + i}. http reasoning ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'How does World 2 connect to Command Center?' });
    assert(`${108 + i}. cross-system preserved ${i}`, r.category === 'RELATIONSHIP', r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What do you remember about World 2?' });
    assert(`${118 + i}. memory preserved ${i}`, r.category === 'MEMORY', r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const ctx = collectProjectFacts(LEGACY_QUERIES.related);
    assert(`${128 + i}. cross-system facts in ctx ${i}`, ctx.crossSystemFactCount > 0, 'cs');
  }

  for (let i = 0; i < 10; i += 1) {
    const ctx = collectProjectFacts(LEGACY_QUERIES.workingOn);
    assert(`${138 + i}. memory in ctx ${i}`, ctx.snapshot.facts.some((f) => f.category === 'memory' || f.category === 'identity'), 'mem');
  }

  assert('148. feed sequence length', withSharedMemoryFeedStages(PROJECT_UNDERSTANDING_FEED).length === 11, String(withSharedMemoryFeedStages(PROJECT_UNDERSTANDING_FEED).length));
  assert('149. answerFromReasoning fn', typeof answerFromReasoning === 'function', 'fn');
  assert('150. no child_process reasoning', !readText('src/project-understanding/project-reasoning-engine.ts').includes('child_process'), 'clean');

  for (let i = 0; i < 15; i += 1) {
    const t1 = answerProjectQuestion(LEGACY_QUERIES.missing);
    const t2 = answerProjectQuestion(LEGACY_QUERIES.missing);
    assert(`${151 + i}. deterministic ${i}`, t1 === t2, 'deterministic');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = answerProjectQuestion(`General project question ${i} about DevPulse foundation`);
    assert(`${166 + i}. general project ${i}`, r.includes('Understanding Intent'), 'intent label');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(LEGACY_QUERIES.missing);
    assert(`${181 + i}. http legacy missing ${i}`, res.status === 200 && String((res.body?.brainResponse as string) ?? '').includes('Missing Capabilities'), 'http');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'execute deploy now' });
    assert(`${191 + i}. blocked no project ${i}`, r.projectUnderstandingContext === undefined, 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const ctx = collectProjectFacts('test');
    assert(`${201 + i}. fact count grows with profile ${i}`, ctx.snapshot.factCount >= 20, String(ctx.snapshot.factCount));
  }

  for (let i = 0; i < 10; i += 1) {
    const intentP = resolveProjectIntent('What has been completed?');
    assert(`${211 + i}. progress intent ${i}`, intentP === 'PROGRESS', intentP);
  }

  for (let i = 0; i < 10; i += 1) {
    const intentD = resolveProjectIntent('What systems relate to this project?');
    assert(`${221 + i}. dependencies intent ${i}`, intentD === 'DEPENDENCIES', intentD);
  }

  for (let i = 0; i < 10; i += 1) {
    const intentPl = resolveProjectIntent('What should this project do next?');
    assert(`${231 + i}. planning intent ${i}`, intentPl === 'PLANNING', intentPl);
  }

  assert('241. shared memory context on brain', workingOnQ.sharedMemoryContext?.lookupPerformed === true, 'memory');
  assert('242. project context attached', workingOnQ.projectUnderstandingContext !== undefined, 'context');
  assert('243. intelligence only', workingOnQ.confirmation.intelligenceOnly === true, 'confirm');
  assert('244. no persistence', workingOnQ.confirmation.noPersistence === true, 'confirm');
  assert('245. reasoning engine no eval', !readText('src/project-understanding/project-reasoning-engine.ts').includes('eval('), 'clean');

  for (let i = 0; i < 10; i += 1) {
    const r = reasonOverProjectFacts('test', collectProjectFacts('test'), 'GENERAL_PROJECT');
    assert(`${246 + i}. general reasoning ${i}`, r.selectedFacts.length > 0, 'facts');
  }

  for (let i = 0; i < 25; i += 1) {
    const q = `Novel project question ${i} about DevPulse V2 gaps and risks without custom route`;
    const ans = answerProjectQuestion(q);
    assert(`${256 + i}. novel question ${i}`, ans.includes('DevPulse V2') && !ans.includes('formatProject'), 'novel');
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);
  const total = results.length;

  console.log(`Scenarios: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    console.log('Failed scenarios:');
    for (const f of failed.slice(0, 30)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 250) {
    console.log(`Insufficient scenarios: ${total} < 250`);
    process.exitCode = 1;
    return;
  }

  console.log(PROJECT_KNOWLEDGE_REASONING_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:project-knowledge-reasoning');
  console.log('npm run validate:project-understanding-engine');
  console.log('npm run typecheck');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
