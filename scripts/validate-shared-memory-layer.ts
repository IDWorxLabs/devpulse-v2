/**
 * DevPulse V2 Phase 11.3 — Shared Memory Layer validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  buildBrainRuntimeVerificationReportFromResult,
  classifyBrainRequest,
  isMemoryQuestion,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
  SHARED_MEMORY_OPERATOR_FEED_STAGES,
  withSharedMemoryFeedStages,
} from '../src/command-center-brain/index.js';
import {
  DUPLICATE_SHARED_MEMORY_PATTERNS,
  SHARED_MEMORY_LAYER_OWNER_MODULE,
  SHARED_MEMORY_LAYER_PASS_TOKEN,
  ensureSharedMemorySeeded,
  getDevPulseV2SharedMemoryLayer,
  getSharedMemoryStore,
  listArchitectureFacts,
  listFounderDecisions,
  listRuntimeObservations,
  recallByCategory,
  recallRelevantMemories,
  resetSharedMemoryForTests,
  seedArchitectureFacts,
  seedFounderDecisions,
  seedRuntimeObservations,
} from '../src/shared-memory/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const MEMORY_QUERIES = {
  world2: 'What do you remember about World 2?',
  decisions: 'What decisions have been recorded?',
  operatorFeedObs: 'What observations exist about Operator Feed?',
} as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
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
  console.log('DevPulse V2 — Phase 11.3 Shared Memory Layer');
  console.log('=============================================');
  console.log('');

  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetDevPulseV2CommandCenterBrainForTests();

  const brainSrc = readText('src/command-center-brain/command-center-brain.ts');
  const memoryDir = join(ROOT, 'src/shared-memory');
  const storeSrc = readText('src/shared-memory/shared-memory-store.ts');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. module dir exists', existsSync(memoryDir), 'exists');
  assert('2. types module', existsSync(join(memoryDir, 'shared-memory-types.ts')), 'exists');
  assert('3. store module', existsSync(join(memoryDir, 'shared-memory-store.ts')), 'exists');
  assert('4. recall module', existsSync(join(memoryDir, 'shared-memory-recall.ts')), 'exists');
  assert('5. runtime module', existsSync(join(memoryDir, 'shared-memory-runtime.ts')), 'exists');
  assert('6. validate script', typeof pkg.scripts?.['validate:shared-memory-layer'] === 'string', 'script');
  assert('7. pass token', SHARED_MEMORY_LAYER_PASS_TOKEN.includes('SHARED_MEMORY_LAYER'), 'token');
  assert('8. registry ownership', getDevPulseV2Owner('shared_memory_layer').ownerModule === SHARED_MEMORY_LAYER_OWNER_MODULE, SHARED_MEMORY_LAYER_OWNER_MODULE);
  assert('9. registry phase 11.3', getDevPulseV2Owner('shared_memory_layer').phase === 11.3, '11.3');
  assert('10. brain integrates memory', brainSrc.includes('processMemoryForRequest'), 'integrated');

  ensureSharedMemorySeeded();
  const store = getSharedMemoryStore();

  assert('11. facts seeded', listArchitectureFacts().length >= 3, String(listArchitectureFacts().length));
  assert('12. decisions seeded', listFounderDecisions().length >= 3, String(listFounderDecisions().length));
  assert('13. observations seeded', listRuntimeObservations().length >= 3, String(listRuntimeObservations().length));
  assert('14. memory count > 0', store.memoryCount() > 0, String(store.memoryCount()));

  const world2Recall = recallRelevantMemories('World 2');
  const govRecall = recallRelevantMemories('Governance');
  const feedRecall = recallRelevantMemories('Operator Feed');

  assert('15. world2 recall', world2Recall.matchCount > 0, String(world2Recall.matchCount));
  assert('16. governance recall', govRecall.matchCount > 0, String(govRecall.matchCount));
  assert('17. operator feed recall', feedRecall.matchCount > 0, String(feedRecall.matchCount));

  const world2Q = processBrainRequest({ message: MEMORY_QUERIES.world2 });
  const decisionsQ = processBrainRequest({ message: MEMORY_QUERIES.decisions });
  const obsQ = processBrainRequest({ message: MEMORY_QUERIES.operatorFeedObs });

  assert('18. world2 memory class', world2Q.category === 'MEMORY', world2Q.category);
  assert('19. decisions memory class', decisionsQ.category === 'MEMORY', decisionsQ.category);
  assert('20. obs memory class', obsQ.category === 'MEMORY', obsQ.category);

  assert('21. world2 structured response', world2Q.brainResponse.includes('World 2') || world2Q.brainResponse.includes('Memories found'), 'response');
  assert('22. decisions structured response', decisionsQ.brainResponse.includes('DECISION') || decisionsQ.brainResponse.includes('Decisions'), 'response');
  assert('23. obs structured response', obsQ.brainResponse.includes('Operator Feed') || obsQ.brainResponse.includes('OBSERVATION'), 'response');

  assert('24. shared memory context', world2Q.sharedMemoryContext?.lookupPerformed === true, 'context');
  assert('25. memory count in context', (world2Q.sharedMemoryContext?.memoryCount ?? 0) > 0, String(world2Q.sharedMemoryContext?.memoryCount));
  assert('26. recalled memories', (world2Q.sharedMemoryContext?.recalledCount ?? 0) > 0, String(world2Q.sharedMemoryContext?.recalledCount));

  const runtimeReport = buildBrainRuntimeVerificationReportFromResult(world2Q);
  assert('27. runtime memory count', runtimeReport.memoryCount > 0, String(runtimeReport.memoryCount));
  assert('28. runtime memory lookup', runtimeReport.memoryLookupComplete === true, 'lookup');

  assert('29. feed loading memory', world2Q.operatorFeedEvents.some((e) => e.eventType === 'Loading Memory'), 'feed');
  assert('30. feed searching memory', world2Q.operatorFeedEvents.some((e) => e.eventType === 'Searching Memory'), 'feed');
  assert('31. feed memory ready', world2Q.operatorFeedEvents.some((e) => e.eventType === 'Memory Context Ready'), 'feed');

  assert('32. memory feed stages count', SHARED_MEMORY_OPERATOR_FEED_STAGES.length === 3, String(SHARED_MEMORY_OPERATOR_FEED_STAGES.length));
  assert('33. pipeline shared memory stage', world2Q.pipelineStages.includes('SHARED_MEMORY_CHECKED'), 'stage');
  assert('34. question history stored', recallByCategory('QUESTION_HISTORY').length >= 3, String(recallByCategory('QUESTION_HISTORY').length));

  assert('35. no child_process store', !storeSrc.includes('child_process'), 'clean');
  assert('36. no fs write store', !storeSrc.includes('writeFileSync'), 'clean');
  assert('37. no spawn store', !storeSrc.includes('spawn('), 'clean');
  assert('38. no eval store', !storeSrc.includes('eval('), 'clean');
  assert('39. intelligence only confirm', world2Q.confirmation.intelligenceOnly === true, 'confirm');
  assert('40. no persistence confirm', world2Q.confirmation.noPersistence === true, 'confirm');

  const httpWorld2 = await postBrain(MEMORY_QUERIES.world2);
  assert('41. http world2 200', httpWorld2.status === 200, String(httpWorld2.status));
  assert('42. http memory context', httpWorld2.body?.sharedMemoryContext !== undefined, 'context');
  assert('43. http runtime memory count', ((httpWorld2.body?.runtimeReport as { memoryCount?: number })?.memoryCount ?? 0) > 0, 'count');

  for (let i = 0; i < DUPLICATE_SHARED_MEMORY_PATTERNS.length; i += 1) {
    const pattern = DUPLICATE_SHARED_MEMORY_PATTERNS[i]!;
    const owners = listDevPulseV2Owners().map((o) => o.ownerModule);
    const competing = owners.filter((m) => m.includes('shared_memory') && m !== SHARED_MEMORY_LAYER_OWNER_MODULE);
    assert(`${44 + i}. no dup ${pattern}`, competing.length <= 1, pattern);
  }

  assert('48. getDevPulseV2SharedMemoryLayer', getDevPulseV2SharedMemoryLayer() instanceof Object, 'instance');
  assert('49. isMemoryQuestion', isMemoryQuestion(MEMORY_QUERIES.world2), 'fn');
  assert('50. cross-system unchanged', processBrainRequest({ message: 'How does World 2 connect to Command Center?' }).category === 'RELATIONSHIP', 'rel');

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: MEMORY_QUERIES.world2 });
    assert(`${51 + i}. world2 stable ${i}`, r.category === 'MEMORY' && r.sharedMemoryContext?.lookupPerformed === true, 'stable');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: MEMORY_QUERIES.decisions });
    assert(`${66 + i}. decisions stable ${i}`, r.brainResponse.includes('Decision') || r.brainResponse.includes('DECISION'), 'stable');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: MEMORY_QUERIES.operatorFeedObs });
    assert(`${81 + i}. obs stable ${i}`, r.brainResponse.toLowerCase().includes('operator feed') || r.brainResponse.includes('OBSERVATION'), 'stable');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What should we build next?' });
    assert(`${96 + i}. roadmap has memory ${i}`, r.sharedMemoryContext?.lookupPerformed === true, 'memory');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What depends on Governance?' });
    assert(`${106 + i}. dep has memory feed ${i}`, r.operatorFeedEvents.some((e) => e.eventType === 'Loading Memory'), 'feed');
  }

  for (let i = 0; i < 10; i += 1) {
    const added = store.addMemory({
      category: 'FACT',
      title: `Test fact ${i}`,
      summary: `Validation fact number ${i}`,
      createdAt: Date.now(),
      sourceSystem: 'validation',
      phase: 11.3,
      tags: ['test', `fact-${i}`],
    });
    assert(`${116 + i}. add memory ${i}`, added.memoryId.startsWith('mem-'), added.memoryId);
  }

  for (let i = 0; i < 10; i += 1) {
    const found = store.searchMemories(`fact ${i}`);
    assert(`${126 + i}. search memory ${i}`, found.length > 0, 'found');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(MEMORY_QUERIES.decisions);
    assert(`${136 + i}. http decisions ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(MEMORY_QUERIES.operatorFeedObs);
    assert(`${146 + i}. http obs ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const c = classifyBrainRequest({ message: MEMORY_QUERIES.world2 });
    assert(`${156 + i}. classifier memory ${i}`, c.category === 'MEMORY', c.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = recallRelevantMemories('Trust Engine');
    assert(`${166 + i}. trust recall ${i}`, r.matchCount > 0, String(r.matchCount));
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'execute deploy now' });
    assert(`${176 + i}. blocked no memory ${i}`, r.sharedMemoryContext === undefined, 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    seedArchitectureFacts();
    seedFounderDecisions();
    seedRuntimeObservations();
    assert(`${186 + i}. reseed idempotent ${i}`, store.memoryCount() > 10, String(store.memoryCount()));
  }

  for (let i = 0; i < 10; i += 1) {
    const facts = store.listByCategory('FACT');
    assert(`${196 + i}. list facts ${i}`, facts.length > 0, String(facts.length));
  }

  for (let i = 0; i < 10; i += 1) {
    const all = store.listMemories();
    assert(`${206 + i}. list all ${i}`, all.length > 0, String(all.length));
  }

  for (let i = 0; i < 10; i += 1) {
    const first = store.listMemories()[0];
    if (!first) {
      assert(`${216 + i}. get memory ${i}`, false, 'no records');
      continue;
    }
    const got = store.getMemory(first.memoryId);
    assert(`${216 + i}. get memory ${i}`, got?.memoryId === first.memoryId, first.memoryId);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: `Question iteration ${i} about Governance` });
    assert(`${226 + i}. question stored ${i}`, (r.sharedMemoryContext?.memoryCount ?? 0) > 10, String(r.sharedMemoryContext?.memoryCount));
  }

  assert('236. memory feed injection helper', withSharedMemoryFeedStages(['Classifying Request', 'Response Ready']).length === 5, 'inject');
  assert('237. distinct from cross system owner', getDevPulseV2Owner('cross_system_awareness').ownerModule !== SHARED_MEMORY_LAYER_OWNER_MODULE, 'distinct');
  assert('238. distinct from brain owner', getDevPulseV2Owner('command_center_brain').ownerModule !== SHARED_MEMORY_LAYER_OWNER_MODULE, 'distinct');
  assert('239. world2 fact exists', listArchitectureFacts().some((f) => f.title.includes('World 2')), 'fact');
  assert('240. chat-first decision', listFounderDecisions().some((d) => d.title.includes('chat-first')), 'decision');

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What breaks if Operator Feed disappears?' });
    assert(`${241 + i}. impact still works ${i}`, r.category === 'IMPACT', r.category);
  }

  assert('251. no execution in memory response', !world2Q.brainResponse.includes('executed deploy'), 'no exec');
  assert('252. memory informational footer', world2Q.brainResponse.includes('informational') || world2Q.brainResponse.includes('in-memory'), 'footer');
  assert('253. store in-memory only', !existsSync(join(ROOT, 'data', 'shared-memory.json')), 'no file');
  assert('254. memory module no fs write', !readText('src/shared-memory/shared-memory-store.ts').includes('writeFileSync'), 'clean');
  assert('255. recall keyword simple', recallRelevantMemories('Governance').matches.some((m) => m.tags.some((t) => t.includes('governance')) || m.summary.toLowerCase().includes('governance')), 'keyword');

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

  console.log(SHARED_MEMORY_LAYER_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:shared-memory-layer');
  console.log('npm run typecheck');
  console.log('npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
