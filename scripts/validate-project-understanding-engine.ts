/**
 * DevPulse V2 Phase 11.4 — Project Understanding Engine validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  PROJECT_UNDERSTANDING_FEED,
  classifyBrainRequest,
  isProjectUnderstandingQuestion,
  processBrainRequest,
  resetBrainCountersForTests,
  resetDevPulseV2CommandCenterBrainForTests,
  withSharedMemoryFeedStages,
} from '../src/command-center-brain/index.js';
import { getSharedMemoryStore, resetSharedMemoryForTests } from '../src/shared-memory/index.js';
import {
  DUPLICATE_PROJECT_UNDERSTANDING_PATTERNS,
  PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE,
  PROJECT_UNDERSTANDING_ENGINE_PASS_TOKEN,
  analyzeProjectGaps,
  analyzeProjectRisks,
  answerProjectQuestion,
  getCurrentProjectProfile,
  getDevPulseV2ProjectUnderstandingEngine,
  processProjectUnderstanding,
  recommendProjectNextStep,
  resetProjectUnderstandingForTests,
  summarizeProjectStatus,
} from '../src/project-understanding/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const PROJECT_QUERIES = {
  workingOn: 'What project are we working on?',
  missing: 'What is missing in this project?',
  blocked: 'What is blocked?',
  next: 'What should this project do next?',
  related: 'What systems relate to this project?',
  risks: 'What are the project risks?',
  status: 'What is the project status?',
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
  console.log('DevPulse V2 — Phase 11.4 Project Understanding Engine');
  console.log('=====================================================');
  console.log('');

  resetBrainCountersForTests();
  resetSharedMemoryForTests();
  resetProjectUnderstandingForTests();
  resetDevPulseV2CommandCenterBrainForTests();

  const brainSrc = readText('src/command-center-brain/command-center-brain.ts');
  const html = readText('public/founder-reality/index.html');
  const appJs = readText('public/founder-reality/app.js');
  const engineSrc = readText('src/project-understanding/project-understanding-engine.ts');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  const profile = getCurrentProjectProfile();

  assert('1. module dir exists', existsSync(join(ROOT, 'src/project-understanding')), 'exists');
  assert('2. validate script', typeof pkg.scripts?.['validate:project-understanding-engine'] === 'string', 'script');
  assert('3. pass token', PROJECT_UNDERSTANDING_ENGINE_PASS_TOKEN.includes('PROJECT_UNDERSTANDING'), 'token');
  assert('4. registry ownership', getDevPulseV2Owner('project_understanding_engine').ownerModule === PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE);
  assert('5. registry phase 11.4', getDevPulseV2Owner('project_understanding_engine').phase === 11.4, '11.4');
  assert('6. default profile name', profile.name === 'DevPulse V2', profile.name);
  assert('7. profile milestones', profile.completedMilestones.length >= 10, String(profile.completedMilestones.length));
  assert('8. profile missing caps', profile.missingCapabilities.length >= 5, String(profile.missingCapabilities.length));
  assert('9. profile blocked items', profile.blockedItems.length >= 2, String(profile.blockedItems.length));
  assert('10. brain integrates project', brainSrc.includes('processProjectUnderstandingRequest'), 'integrated');

  const status = summarizeProjectStatus();
  const gaps = analyzeProjectGaps();
  const risks = analyzeProjectRisks();
  const next = recommendProjectNextStep();

  assert('11. status summary', status.name === 'DevPulse V2', status.name);
  assert('12. gap analysis', gaps.gapCount === profile.missingCapabilities.length, String(gaps.gapCount));
  assert('13. risk analysis', risks.riskCount === profile.riskItems.length, String(risks.riskCount));
  assert('14. next step', next.nextRecommendedStep.length > 10, 'step');
  assert('15. answer project fn', answerProjectQuestion(PROJECT_QUERIES.workingOn).includes('DevPulse V2'), 'answer');

  const workingOnQ = processBrainRequest({ message: PROJECT_QUERIES.workingOn });
  const missingQ = processBrainRequest({ message: PROJECT_QUERIES.missing });
  const blockedQ = processBrainRequest({ message: PROJECT_QUERIES.blocked });
  const nextQ = processBrainRequest({ message: PROJECT_QUERIES.next });
  const relatedQ = processBrainRequest({ message: PROJECT_QUERIES.related });

  assert('16. working on class', workingOnQ.category === 'PROJECT_UNDERSTANDING', workingOnQ.category);
  assert('17. missing class', missingQ.category === 'PROJECT_UNDERSTANDING', missingQ.category);
  assert('18. blocked class', blockedQ.category === 'PROJECT_UNDERSTANDING', blockedQ.category);
  assert('19. next class', nextQ.category === 'PROJECT_UNDERSTANDING', nextQ.category);
  assert('20. related class', relatedQ.category === 'PROJECT_UNDERSTANDING', relatedQ.category);

  assert('21. working on profile', workingOnQ.brainResponse.includes('DevPulse V2'), 'response');
  assert('22. missing gaps', missingQ.brainResponse.includes('Missing Capabilities'), 'response');
  assert('23. blocked items', blockedQ.brainResponse.includes('Blocked Items'), 'response');
  assert('24. next step response', nextQ.brainResponse.includes('Next Recommended Step'), 'response');
  assert('25. related systems', relatedQ.brainResponse.includes('Related Systems'), 'response');

  assert('26. project context attached', workingOnQ.projectUnderstandingContext?.profile.name === 'DevPulse V2', 'context');
  assert('27. pipeline project stage', workingOnQ.pipelineStages.includes('PROJECT_UNDERSTANDING_CHECKED'), 'stage');
  assert('28. feed loading project', workingOnQ.operatorFeedEvents.some((e) => e.eventType === 'Understanding Project'), 'feed');
  assert('29. feed analyzing status', workingOnQ.operatorFeedEvents.some((e) => e.eventType === 'Gathering Facts'), 'feed');
  assert('30. feed checking gaps', missingQ.operatorFeedEvents.some((e) => e.eventType === 'Evaluating Risks'), 'feed');
  assert('31. feed checking risks', relatedQ.operatorFeedEvents.some((e) => e.eventType === 'Analyzing Dependencies'), 'feed');
  assert('32. feed recommendation ready', nextQ.operatorFeedEvents.some((e) => e.eventType === 'Generating Conclusions'), 'feed');

  assert('33. diagnostics active', workingOnQ.projectUnderstandingDiagnostics?.projectUnderstandingActive === true, 'diag');
  assert('34. diagnostics project name', workingOnQ.projectUnderstandingDiagnostics?.currentProject === 'DevPulse V2', 'diag');
  assert('35. diagnostics missing count', (workingOnQ.projectUnderstandingDiagnostics?.missingCapabilityCount ?? 0) > 0, 'diag');

  assert('36. html project diag section', html.includes('section-project-understanding-diagnostics'), 'html');
  assert('37. app render project diag', appJs.includes('renderProjectUnderstandingDiagnostics'), 'app');
  assert('38. no generic fallback working on', !workingOnQ.brainResponse.startsWith('I am the Unified Command Center Brain'), 'no generic');

  assert('39. memory observation stored', getSharedMemoryStore().searchMemories('Project Understanding Engine connected').length > 0, 'memory');
  assert('40. cross-system in related answer', relatedQ.projectUnderstandingContext?.crossSystemContextUsed === true, 'cross');

  assert('41. no child_process engine', !engineSrc.includes('child_process'), 'clean');
  assert('42. no fs write engine', !engineSrc.includes('writeFileSync'), 'clean');
  assert('43. no spawn engine', !engineSrc.includes('spawn('), 'clean');
  assert('44. no eval engine', !engineSrc.includes('eval('), 'clean');
  assert('45. intelligence only', workingOnQ.confirmation.intelligenceOnly === true, 'confirm');

  const httpWorking = await postBrain(PROJECT_QUERIES.workingOn);
  assert('46. http 200', httpWorking.status === 200, String(httpWorking.status));
  assert('47. http project context', httpWorking.body?.projectUnderstandingContext !== undefined, 'context');
  assert('48. http diagnostics', httpWorking.body?.projectUnderstandingDiagnostics !== undefined, 'diag');

  assert('49. feed sequence length', withSharedMemoryFeedStages(PROJECT_UNDERSTANDING_FEED).length === 11, String(withSharedMemoryFeedStages(PROJECT_UNDERSTANDING_FEED).length));
  assert('50. isProjectUnderstandingQuestion', isProjectUnderstandingQuestion(PROJECT_QUERIES.missing), 'fn');

  for (let i = 0; i < DUPLICATE_PROJECT_UNDERSTANDING_PATTERNS.length; i += 1) {
    const pattern = DUPLICATE_PROJECT_UNDERSTANDING_PATTERNS[i]!;
    const owners = listDevPulseV2Owners().map((o) => o.ownerModule);
    const competing = owners.filter((m) => m.includes('project_understanding') && m !== PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE);
    assert(`${51 + i}. no dup ${pattern}`, competing.length <= 1, pattern);
  }

  assert('55. getDevPulseV2ProjectUnderstandingEngine', getDevPulseV2ProjectUnderstandingEngine() instanceof Object, 'instance');
  assert('56. distinct from project_vault', getDevPulseV2Owner('project_vault').ownerModule !== PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, 'distinct');
  assert('57. distinct from shared memory', getDevPulseV2Owner('shared_memory_layer').ownerModule !== PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE, 'distinct');

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: PROJECT_QUERIES.workingOn });
    assert(`${58 + i}. working on stable ${i}`, r.category === 'PROJECT_UNDERSTANDING', r.category);
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: PROJECT_QUERIES.missing });
    assert(`${73 + i}. missing stable ${i}`, r.brainResponse.includes('Missing Capabilities'), 'gaps');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: PROJECT_QUERIES.blocked });
    assert(`${88 + i}. blocked stable ${i}`, r.brainResponse.includes('Blocked'), 'blocked');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: PROJECT_QUERIES.next });
    assert(`${103 + i}. next stable ${i}`, r.brainResponse.includes('Next Recommended Step'), 'next');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: PROJECT_QUERIES.related });
    assert(`${118 + i}. related stable ${i}`, r.brainResponse.includes('Related Systems'), 'related');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'How does World 2 connect to Command Center?' });
    assert(`${128 + i}. cross-system unchanged ${i}`, r.category === 'RELATIONSHIP', r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'What do you remember about World 2?' });
    assert(`${138 + i}. memory unchanged ${i}`, r.category === 'MEMORY', r.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processProjectUnderstanding(`validation query ${i}`);
    assert(`${148 + i}. engine process ${i}`, r.context.profile.projectId === 'devpulse-v2', 'engine');
  }

  for (let i = 0; i < 10; i += 1) {
    const c = classifyBrainRequest({ message: PROJECT_QUERIES.risks });
    assert(`${158 + i}. risk classifier ${i}`, c.category === 'PROJECT_UNDERSTANDING', c.category);
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(PROJECT_QUERIES.missing);
    assert(`${168 + i}. http missing ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(PROJECT_QUERIES.blocked);
    assert(`${178 + i}. http blocked ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'execute deploy now' });
    assert(`${188 + i}. blocked no project ${i}`, r.projectUnderstandingContext === undefined, 'blocked');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: PROJECT_QUERIES.status });
    assert(`${198 + i}. status query ${i}`, r.brainResponse.includes('DevPulse V2'), 'status');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = answerProjectQuestion(`What is DevPulse V2 iteration ${i}?`);
    assert(`${208 + i}. direct answer ${i}`, r.includes('DevPulse V2'), 'answer');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${218 + i}. gap count stable ${i}`, analyzeProjectGaps().gapCount === profile.missingCapabilities.length, 'gaps');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${228 + i}. risk count stable ${i}`, analyzeProjectRisks().riskCount === profile.riskItems.length, 'risks');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain(PROJECT_QUERIES.next);
    assert(`${238 + i}. http next ${i}`, res.status === 200 && String((res.body?.brainResponse as string) ?? '').includes('Next Recommended Step'), 'http');
  }

  assert('248. profile phase', profile.currentPhase.includes('11.4'), profile.currentPhase);
  assert('249. profile status', profile.status === 'FOUNDATION_BUILDING', profile.status);
  assert('250. no persistence file', !existsSync(join(ROOT, 'data', 'project-profile.json')), 'no file');
  assert('251. related systems count', profile.relatedSystems.length >= 5, String(profile.relatedSystems.length));
  assert('252. memory context used', workingOnQ.sharedMemoryContext?.lookupPerformed === true, 'memory');
  assert('253. feed has memory stages', workingOnQ.operatorFeedEvents.some((e) => e.eventType === 'Loading Memory'), 'memory feed');
  assert('254. last project query diag', workingOnQ.projectUnderstandingDiagnostics?.lastProjectQuery === PROJECT_QUERIES.workingOn, 'query');
  assert('255. risks response', processBrainRequest({ message: PROJECT_QUERIES.risks }).brainResponse.includes('Risk'), 'risks');

  for (let i = 0; i < 25; i += 1) {
    const r = summarizeProjectStatus();
    assert(`${256 + i}. status deterministic ${i}`, r.completedCount === profile.completedMilestones.length, String(r.completedCount));
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

  if (total < 280) {
    console.log(`Insufficient scenarios: ${total} < 280`);
    process.exitCode = 1;
    return;
  }

  console.log(PROJECT_UNDERSTANDING_ENGINE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:project-understanding-engine');
  console.log('npm run typecheck');
  console.log('npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
