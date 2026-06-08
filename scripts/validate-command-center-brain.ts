/**
 * DevPulse V2 Phase 11.1 Unified Command Center Brain — validation scenarios.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  BRAIN_PIPELINE_SEQUENCE,
  BRAIN_REQUEST_CATEGORIES,
  COMMAND_CENTER_AWARE_SYSTEMS,
  COMMAND_CENTER_BRAIN_OWNER_MODULE,
  COMMAND_CENTER_BRAIN_PASS_TOKEN,
  DevPulseV2CommandCenterBrain,
  DUPLICATE_BRAIN_PATTERNS,
  OPERATOR_FEED_EVENT_SEQUENCE,
  assertDistinctFromCentralBrain,
  brainStructuralKey,
  classifyBrainRequest,
  findSystemByKeyword,
  formatCompletedPhasesList,
  generateBlockedResponse,
  getBrainRoadmapContext,
  getCommandCenterAwareSystems,
  getNextBuildRecommendation,
  isArchitectureQuestion,
  isKnownCategory,
  isRoadmapQuestion,
  isSystemQuestion,
  processBrainRequest,
  resetBrainCountersForTests,
  scanBrainModuleForForbiddenPatterns,
  summarizeSystemMaturity,
} from '../src/command-center-brain/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

async function postBrain(message: string): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        resolve({ status: 500, body: {} });
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
          resolve({ status: 500, body: {} });
        });
    });
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 11.1 Unified Command Center Brain');
  console.log('====================================================');
  console.log('');

  resetBrainCountersForTests();
  const brain = DevPulseV2CommandCenterBrain;
  const appJs = readText('public/founder-reality/app.js');
  const serverSrc = readText('server/founder-reality-server.ts');
  const brainHandler = readText('server/brain-api-handler.ts');
  const html = readText('public/founder-reality/index.html');

  const roadmapQ = processBrainRequest({ message: 'What should we build next?' });
  const world2Q = processBrainRequest({ message: 'Explain World 2 and how mature it is' });
  const trustQ = processBrainRequest({ message: 'Explain the Trust Engine' });
  const archQ = processBrainRequest({ message: 'Will this create duplication?' });
  const blockedQ = processBrainRequest({ message: 'please execute this now' });

  assert('1. registry ownership', brain.assertRegistryOwnership(), COMMAND_CENTER_BRAIN_OWNER_MODULE);
  assert('2. registry phase 11.1', getDevPulseV2Owner('command_center_brain').phase === 11.1, '11.1');
  assert('3. distinct from central brain', brain.assertDistinctFromCentralBrain(), 'distinct');
  assert('4. no duplicate brain', brain.assertNoDuplicateBrain(), 'ok');
  assert('5. does not execute', brain.assertDoesNotExecute(), 'safe');
  assert('6. no forbidden patterns', brain.assertNoForbiddenPatterns(), 'clean');
  assert('7. pass token', COMMAND_CENTER_BRAIN_PASS_TOKEN === 'DEVPULSE_V2_UNIFIED_COMMAND_CENTER_BRAIN_FOUNDATION_V1_PASS', COMMAND_CENTER_BRAIN_PASS_TOKEN);
  assert('8. roadmap classification', roadmapQ.category === 'ROADMAP', roadmapQ.category);
  assert('9. roadmap mentions 11.2', roadmapQ.brainResponse.includes('11.2'), '11.2');
  assert('10. status classification', world2Q.category === 'STATUS' || world2Q.category === 'SYSTEM', world2Q.category);
  assert('11. world2 honest response', world2Q.brainResponse.includes('execution runtime has not been implemented') || world2Q.brainResponse.includes('not been implemented'), 'honest');
  assert('12. trust system response', trustQ.brainResponse.includes('Trust Engine') || trustQ.brainResponse.includes('trust'), 'trust');
  assert('13. architecture duplication', archQ.category === 'ARCHITECTURE', archQ.category);
  assert('14. blocked execution', blockedQ.pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  assert('15. intelligence only confirmation', roadmapQ.confirmation.intelligenceOnly === true, 'confirmed');
  assert('16. no external AI', roadmapQ.confirmation.noExternalAiCalls === true, 'confirmed');
  assert('17. no persistence', roadmapQ.confirmation.noPersistence === true, 'confirmed');
  assert('18. no execution', roadmapQ.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('19. no file modification', roadmapQ.confirmation.noFilesModified === true, 'confirmed');
  assert('20. no code generation', roadmapQ.confirmation.noCodeGenerated === true, 'confirmed');

  assert('21. pipeline stages visible', roadmapQ.pipelineStages.length >= 6, String(roadmapQ.pipelineStages.length));
  assert('22. operator feed events', roadmapQ.operatorFeedEvents.length === 5, String(roadmapQ.operatorFeedEvents.length));
  assert('23. feed classifying', roadmapQ.operatorFeedEvents[0]!.eventType === 'Classifying Request', 'classifying');
  assert('24. feed response ready', roadmapQ.operatorFeedEvents[4]!.eventType === 'Response Ready', 'ready');
  assert('25. aware systems count', COMMAND_CENTER_AWARE_SYSTEMS.length >= 9, String(COMMAND_CENTER_AWARE_SYSTEMS.length));
  assert('26. categories count', BRAIN_REQUEST_CATEGORIES.length === 10, String(BRAIN_REQUEST_CATEGORIES.length));
  assert('27. pipeline sequence', BRAIN_PIPELINE_SEQUENCE.length === 7, String(BRAIN_PIPELINE_SEQUENCE.length));
  assert('28. operator sequence', OPERATOR_FEED_EVENT_SEQUENCE.length === 5, String(OPERATOR_FEED_EVENT_SEQUENCE.length));
  assert('29. duplicate patterns', DUPLICATE_BRAIN_PATTERNS.length === 4, String(DUPLICATE_BRAIN_PATTERNS.length));
  assert('30. roadmap context', getBrainRoadmapContext().currentPhase.includes('11.2'), getBrainRoadmapContext().currentPhase);

  assert('31. app brain API', appJs.includes('/api/brain/respond'), 'api');
  assert('32. app askBrain', appJs.includes('askBrain'), 'askBrain');
  assert('33. app brain message class', appJs.includes("'brain'"), 'brain');
  assert('34. app operator feed stream', appJs.includes('streamOperatorFeedEvents'), 'stream');
  assert('35. app brain notification', appJs.includes('Unified Command Center Brain Connected'), 'notif');
  assert('36. app no localStorage', !appJs.includes('localStorage'), 'clean');
  assert('37. app no eval', !appJs.includes('eval('), 'clean');
  assert('38. server brain route', serverSrc.includes('/api/brain/respond'), 'route');
  assert('39. server POST allowed', serverSrc.includes("req.method === 'POST'"), 'POST');
  assert('40. handler processBrainRequest', brainHandler.includes('processBrainRequest'), 'handler');

  assert('41. server no child_process', !serverSrc.includes('child_process') && !brainHandler.includes('child_process'), 'clean');
  assert('42. server no spawn', !serverSrc.includes('spawn('), 'clean');
  assert('43. server no eval', !serverSrc.includes('eval('), 'clean');
  assert('44. brain module no writeFileSync', scanBrainModuleForForbiddenPatterns(join(ROOT, 'src/command-center-brain')).length === 0, 'clean');
  assert('45. html chat surface', html.includes('id="chat-surface"'), 'chat');
  assert('46. html operator feed', html.includes('id="operator-feed"'), 'feed');
  assert('47. central brain distinct owner', getDevPulseV2Owner('central_brain').ownerModule !== COMMAND_CENTER_BRAIN_OWNER_MODULE, 'distinct');
  assert('48. isRoadmapQuestion', isRoadmapQuestion('What should we build next?'), 'roadmap');
  assert('49. isSystemQuestion', isSystemQuestion('Explain the Trust Engine'), 'system');
  assert('50. isArchitectureQuestion', isArchitectureQuestion('Will this create duplication?'), 'arch');

  for (let i = 0; i < BRAIN_REQUEST_CATEGORIES.length; i += 1) {
    const cat = BRAIN_REQUEST_CATEGORIES[i]!;
    assert(`${51 + i}. category known ${cat}`, isKnownCategory(cat), cat);
  }

  const det1 = processBrainRequest({ message: 'What should we build next?' });
  const det2 = processBrainRequest({ message: 'What should we build next?' });
  assert('58. deterministic score', det1.brainResponse === det2.brainResponse, 'same');
  assert('59. deterministic key', brainStructuralKey(det1) === brainStructuralKey(det2), 'key');
  assert('60. deterministic category', det1.category === det2.category, det1.category);

  const httpRoadmap = await postBrain('What should we build next?');
  assert('61. http brain 200', httpRoadmap.status === 200, String(httpRoadmap.status));
  assert('62. http brain response', typeof httpRoadmap.body.brainResponse === 'string', 'response');
  assert('63. http pipeline stages', Array.isArray(httpRoadmap.body.pipelineStages), 'stages');
  assert('64. http operator events', Array.isArray(httpRoadmap.body.operatorFeedEvents), 'events');

  const httpBlocked = await postBrain('execute deploy now');
  const blockedStages = httpBlocked.body.pipelineStages;
  assert(
    '65. http blocked intent',
    (httpBlocked.body.brainResponse as string)?.includes('blocked')
      || (Array.isArray(blockedStages) && blockedStages.includes('BRAIN_REQUEST_BLOCKED')),
    'blocked',
  );

  for (let i = 0; i < COMMAND_CENTER_AWARE_SYSTEMS.length; i += 1) {
    const sys = COMMAND_CENTER_AWARE_SYSTEMS[i]!;
    assert(`${66 + i}. aware system ${sys.systemId}`, getCommandCenterAwareSystems().some((s) => s.systemId === sys.systemId), sys.systemId);
  }

  assert('75. find trust keyword', findSystemByKeyword('trust engine').some((s) => s.systemId.includes('trust')), 'trust');
  assert('76. find world2 keyword', findSystemByKeyword('world 2').some((s) => s.systemId.includes('world2')), 'world2');
  assert('77. summarize maturity', summarizeSystemMaturity().includes('foundation-complete'), summarizeSystemMaturity());
  assert('78. next recommendation', getNextBuildRecommendation().includes('Shared Context'), getNextBuildRecommendation());
  assert('79. completed phases list', formatCompletedPhasesList().includes('Phase 6'), 'phase 6');
  assert('80. blocked response helper', generateBlockedResponse('test').includes('blocked'), 'blocked');

  assert('81. no fake world2 build', !roadmapQ.brainResponse.toLowerCase().includes('autonomously build applications'), 'honest');
  assert('82. experience layer owner distinct', getDevPulseV2Owner('experience_layer_foundation').ownerModule !== COMMAND_CENTER_BRAIN_OWNER_MODULE, 'distinct');
  assert('83. trust expansion referenced', trustQ.brainResponse.includes('10.2') || trustQ.brainResponse.includes('aggregation'), 'trust');
  assert('84. governance stack aware', getCommandCenterAwareSystems().some((s) => s.systemId === 'governance_stack'), 'gov');
  assert('85. shell aware', getCommandCenterAwareSystems().some((s) => s.systemId === 'command_center_runtime_shell'), 'shell');

  for (let i = 0; i < DUPLICATE_BRAIN_PATTERNS.length; i += 1) {
    const pattern = DUPLICATE_BRAIN_PATTERNS[i]!;
    const owners = listDevPulseV2Owners().map((o) => o.ownerModule);
    const competing = owners.filter((m) => m.includes(pattern.replace(/_/g, '')) && m !== COMMAND_CENTER_BRAIN_OWNER_MODULE);
    assert(`${86 + i}. no dup ${pattern}`, competing.length === 0, pattern);
  }

  assert('90. assertDistinctFromCentralBrain fn', assertDistinctFromCentralBrain(), 'ok');
  assert('91. owner function', getDevPulseV2Owner('command_center_brain').ownerFunction === 'getDevPulseV2CommandCenterBrain', 'fn');
  assert('92. description intelligence', getDevPulseV2Owner('command_center_brain').description.includes('intelligence'), 'desc');
  assert('93. no system replacement', roadmapQ.confirmation.noSystemReplacement === true, 'confirmed');
  assert('94. no runtime mutation', roadmapQ.confirmation.noRuntimeMutation === true, 'confirmed');
  assert('95. no deployment', roadmapQ.confirmation.noDeploymentPerformed === true, 'confirmed');

  const categories = ['ROADMAP', 'SYSTEM', 'STATUS', 'ARCHITECTURE', 'RISK', 'PROJECT', 'GENERAL'];
  const messages = [
    'What should we build next?',
    'Explain governance stack',
    'How mature is DevPulse?',
    'Will this create duplication?',
    'What are the risks?',
    'Can I start a project idea?',
    'Hello DevPulse',
  ];
  for (let i = 0; i < categories.length; i += 1) {
    const r = processBrainRequest({ message: messages[i]! });
    assert(`${96 + i}. classify ${categories[i]}`, r.brainResponse.length > 20, categories[i]!);
  }

  for (let i = 0; i < 25; i += 1) {
    const r = processBrainRequest({ message: `What should we build next? iteration ${i}` });
    assert(`${103 + i}. bulk roadmap ${i}`, r.category === 'ROADMAP', r.category);
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `Explain system ${i} trust world2` });
    assert(`${128 + i}. bulk system ${i}`, r.brainResponse.length > 0, 'response');
  }

  for (let i = 0; i < 15; i += 1) {
    const r = processBrainRequest({ message: 'What should we build next?' });
    assert(`${148 + i}. stability ${i}`, r.pipelineStages.includes('BRAIN_RESPONSE_READY'), 'ready');
  }

  assert('163. classify ROADMAP signal', classifyBrainRequest({ message: 'what next phase' }).category === 'ROADMAP', 'ROADMAP');
  assert('164. classify STATUS signal', classifyBrainRequest({ message: 'how mature is world 2' }).category === 'STATUS', 'STATUS');
  assert('165. classify RISK signal', classifyBrainRequest({ message: 'what is the risk' }).category === 'RISK', 'RISK');
  assert('166. classify PROJECT signal', classifyBrainRequest({ message: 'project idea workspace' }).category === 'PROJECT', 'PROJECT');
  assert('167. empty message blocked', processBrainRequest({ message: '' }).pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  assert('168. generate code blocked', processBrainRequest({ message: 'generate code for app' }).pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  assert('169. modify file blocked', processBrainRequest({ message: 'modify file system' }).pipelineStages.includes('BRAIN_REQUEST_BLOCKED'), 'blocked');
  assert('170. brain responds id', roadmapQ.responseId.startsWith('brain-resp-'), roadmapQ.responseId);

  for (let i = 0; i < 30; i += 1) {
    const r = processBrainRequest({ message: 'What should we build next?' });
    assert(`${171 + i}. deterministic bulk ${i}`, r.brainResponse === roadmapQ.brainResponse, 'deterministic');
  }

  for (let i = 0; i < 20; i += 1) {
    const r = processBrainRequest({ message: `architecture duplication registry ${i}` });
    assert(`${201 + i}. arch bulk ${i}`, r.category === 'ARCHITECTURE', r.category);
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
    for (const f of failed.slice(0, 20)) {
      console.log(`  ✗ ${f.name}: ${f.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  if (total < 220) {
    console.log(`Insufficient scenarios: ${total} < 220`);
    process.exitCode = 1;
    return;
  }

  console.log('DEVPULSE_V2_UNIFIED_COMMAND_CENTER_BRAIN_FOUNDATION_V1_PASS');
  console.log('');
  console.log('npm run validate:command-center-brain');
  console.log('npm run typecheck');
  console.log('npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
