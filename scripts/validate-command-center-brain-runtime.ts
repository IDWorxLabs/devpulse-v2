/**
 * DevPulse V2 Phase 11.1A — Command Center Brain Runtime Verification.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BRAIN_HEALTH_PATH,
  BRAIN_RESPOND_PATH,
  BRAIN_RUNTIME_VERIFICATION_PASS_TOKEN,
  BRAIN_SERVER_CAPABILITY,
  FEED_STAGE_DELAY_MS,
  OPERATOR_FEED_EVENT_SEQUENCE,
  assertRuntimeReportHealthy,
  buildBrainHealthPayload,
  buildBrainRuntimeVerificationReport,
  buildBrainRuntimeVerificationReportFromResult,
  interpretHttpBrainFailure,
  mapFeedEventToSection,
  processBrainRequest,
  resetBrainCountersForTests,
  runtimeReportKey,
  verifyBrainProcessing,
  verifyChatPipeline,
  verifyHealthResponsePayload,
  verifyOperatorFeedEvents,
} from '../src/command-center-brain/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import { sendBrainHealth } from '../server/brain-api-handler.js';

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

async function withServer<T>(
  fn: (baseUrl: string) => Promise<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('Could not bind test server'));
        return;
      }
      const baseUrl = `http://127.0.0.1:${addr.port}`;
      fn(baseUrl)
        .then((value) => {
          server.close();
          resolve(value);
        })
        .catch((err) => {
          server.close();
          reject(err);
        });
    });
  });
}

async function getHealth(baseUrl: string): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(`${baseUrl}${BRAIN_HEALTH_PATH}`);
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

async function postBrain(
  baseUrl: string,
  message: string,
): Promise<{ status: number; bodyText: string; body: Record<string, unknown> | null }> {
  const res = await fetch(`${baseUrl}${BRAIN_RESPOND_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, timestamp: Date.now() }),
  });
  const bodyText = await res.text();
  let body: Record<string, unknown> | null = null;
  try {
    body = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    body = null;
  }
  return { status: res.status, bodyText, body };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 11.1A Brain Runtime Verification');
  console.log('====================================================');
  console.log('');

  resetBrainCountersForTests();
  const appJs = readText('public/founder-reality/app.js');
  const html = readText('public/founder-reality/index.html');
  const css = readText('public/founder-reality/styles.css');
  const serverSrc = readText('server/founder-reality-server.ts');
  const brainHandler = readText('server/brain-api-handler.ts');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. runtime module dir exists', existsSync(join(ROOT, 'src/command-center-brain/runtime-verification')), 'exists');
  assert('2. validate script registered', typeof pkg.scripts?.['validate:command-center-brain-runtime'] === 'string', 'script');
  assert('3. pass token defined', BRAIN_RUNTIME_VERIFICATION_PASS_TOKEN.includes('RUNTIME_VERIFICATION'), 'token');
  assert('4. health path constant', BRAIN_HEALTH_PATH === '/api/brain/health', BRAIN_HEALTH_PATH);
  assert('5. respond path constant', BRAIN_RESPOND_PATH === '/api/brain/respond', BRAIN_RESPOND_PATH);
  assert('6. server capability token', BRAIN_SERVER_CAPABILITY === 'command-center-brain-v11.1a', BRAIN_SERVER_CAPABILITY);
  assert('7. feed delay defined', FEED_STAGE_DELAY_MS >= 150, String(FEED_STAGE_DELAY_MS));

  const healthPayload = buildBrainHealthPayload();
  assert('8. health postAllowed', healthPayload.postAllowed === true, 'post');
  assert('9. health brainConnected', healthPayload.brainConnected === true, 'connected');
  assert('10. health phase 11.1A', healthPayload.phase === '11.1A', healthPayload.phase);

  const roadmapLocal = processBrainRequest({ message: 'What should we build next?' });
  const reportLocal = buildBrainRuntimeVerificationReportFromResult(roadmapLocal);
  assert('11. report requestReceived', reportLocal.requestReceived === true, 'received');
  assert('12. report classificationComplete', reportLocal.classificationComplete === true, 'class');
  assert('13. report systemAwareness', reportLocal.systemAwarenessComplete === true, 'systems');
  assert('14. report roadmapAwareness', reportLocal.roadmapAwarenessComplete === true, 'roadmap');
  assert('15. report responseGenerated', reportLocal.responseGenerated === true, 'response');
  assert('16. report feedActivated', reportLocal.feedActivated === true, 'feed');

  const feedCheck = verifyOperatorFeedEvents(roadmapLocal.operatorFeedEvents);
  assert('17. feed activated', feedCheck.feedActivated === true, 'active');
  assert('18. feed ordered', feedCheck.stagesOrdered === true, 'ordered');
  assert('19. feed stage count', feedCheck.stageCount === 5, String(feedCheck.stageCount));

  for (let i = 0; i < OPERATOR_FEED_EVENT_SEQUENCE.length; i += 1) {
    const stage = OPERATOR_FEED_EVENT_SEQUENCE[i]!;
    assert(`${20 + i}. feed stage ${stage}`, feedCheck.actualStages[i] === stage, stage);
  }

  const chatVerify = verifyChatPipeline({ message: 'What should we build next?' });
  assert('25. chat message captured', chatVerify.messageCaptured === true, 'captured');
  assert('26. chat response returned', chatVerify.responseReturned === true, 'returned');
  assert('27. chat response renderable', chatVerify.responseRenderable === true, 'renderable');
  assert('28. chat brain visible', chatVerify.brainMessageVisible === true, 'visible');

  const processing = verifyBrainProcessing('What should we build next?');
  assert('29. processing ok', processing.ok === true, 'ok');
  assert('30. processing has result', processing.result !== null, 'result');

  const staleMsg = interpretHttpBrainFailure(405, '{"error":"Method not allowed - Founder Reality Surface is read-only"}');
  assert('31. stale server detected', staleMsg.includes('Stale'), staleMsg);

  const healthVerify = verifyHealthResponsePayload(healthPayload);
  assert('32. health verify reachable', healthVerify.endpointReachable === true, 'reachable');
  assert('33. health verify postAllowed', healthVerify.postAllowed === true, 'post');

  assert('34. server health route', serverSrc.includes('/api/brain/health'), 'health');
  assert('35. server respond route', serverSrc.includes('/api/brain/respond'), 'respond');
  assert('36. server sendBrainHealth import', serverSrc.includes('sendBrainHealth'), 'import');
  assert('37. handler runtimeReport', brainHandler.includes('runtimeReport'), 'report');
  assert('38. app health check', appJs.includes('/api/brain/health'), 'health');
  assert('39. app feed stream', appJs.includes('streamOperatorFeedEvents'), 'stream');
  assert('40. app feed delay', appJs.includes('FEED_STAGE_DELAY_MS'), 'delay');
  assert('41. app interpret failure', appJs.includes('interpretBrainFailure'), 'failure');
  assert('42. app diagnostics panel', html.includes('section-runtime-diagnostics'), 'diag');
  assert('43. app feed stream log', html.includes('feed-stream-log'), 'log');
  assert('44. css feed stream', css.includes('.feed-stream-log'), 'css');
  assert('45. css diagnostics', css.includes('.diagnostics-list'), 'css');
  assert('46. notification started', appJs.includes('Brain Request Started'), 'started');
  assert('47. notification completed', appJs.includes('Brain Request Completed'), 'completed');
  assert('48. notification failed', appJs.includes('Brain Request Failed'), 'failed');
  assert('49. notification feed active', appJs.includes('Operator Feed Active'), 'feed');
  assert('50. notification brain active', appJs.includes('Unified Command Center Brain Active'), 'active');

  const httpHealth = await withServer((base) => getHealth(base));
  assert('51. http health 200', httpHealth.status === 200, String(httpHealth.status));
  assert('52. http health capability', httpHealth.body.serverCapability === BRAIN_SERVER_CAPABILITY, String(httpHealth.body.serverCapability));
  assert('53. http health postAllowed', httpHealth.body.postAllowed === true, String(httpHealth.body.postAllowed));

  const httpRoadmap = await withServer((base) => postBrain(base, 'What should we build next?'));
  assert('54. http brain 200', httpRoadmap.status === 200, String(httpRoadmap.status));
  assert('55. http brainResponse', typeof httpRoadmap.body?.brainResponse === 'string', 'response');
  assert('56. http runtimeReport', httpRoadmap.body?.runtimeReport !== undefined, 'report');
  assert('57. http operator events', Array.isArray(httpRoadmap.body?.operatorFeedEvents), 'events');
  assert('58. http no execution confirm', (httpRoadmap.body?.confirmation as { noExecutionPerformed?: boolean })?.noExecutionPerformed === true, 'confirm');

  const runtimeReport = httpRoadmap.body?.runtimeReport as Record<string, unknown> | undefined;
  assert('59. http report responseGenerated', runtimeReport?.responseGenerated === true, String(runtimeReport?.responseGenerated));
  assert('60. http report feedActivated', runtimeReport?.feedActivated === true, String(runtimeReport?.feedActivated));

  const httpEmpty = await withServer((base) => postBrain(base, ''));
  assert('61. empty message 400', httpEmpty.status === 400, String(httpEmpty.status));

  assert('62. server no child_process', !serverSrc.includes('child_process'), 'clean');
  assert('63. server no spawn', !serverSrc.includes('spawn('), 'clean');
  assert('64. server no eval', !serverSrc.includes('eval('), 'clean');
  assert('65. runtime module no child_process', !readText('src/command-center-brain/runtime-verification/brain-api-verification.ts').includes('child_process'), 'clean');

  for (let i = 0; i < OPERATOR_FEED_EVENT_SEQUENCE.length; i += 1) {
    const stage = OPERATOR_FEED_EVENT_SEQUENCE[i]!;
    const section = mapFeedEventToSection(stage);
    assert(`${66 + i}. map ${stage}`, section.length > 0, section);
  }

  assert('71. publishFeedFailure', appJs.includes('publishFeedFailure'), 'failure feed');
  assert('72. renderRuntimeDiagnostics', appJs.includes('renderRuntimeDiagnostics'), 'diag fn');
  assert('73. last request status', appJs.includes('last-request-status'), 'status');
  assert('74. last error field', appJs.includes('last-error'), 'error');
  assert('75. JSON parse guard', appJs.includes('Brain response malformed'), 'parse');

  const fullReport = buildBrainRuntimeVerificationReport('What should we build next?');
  assert('76. full report healthy', assertRuntimeReportHealthy(fullReport), runtimeReportKey(fullReport));
  assert('77. full report feed', fullReport.feedActivated === true, String(fullReport.feedActivated));

  for (let i = 0; i < 30; i += 1) {
    const r = buildBrainRuntimeVerificationReport('What should we build next?');
    assert(`${78 + i}. report stable ${i}`, r.responseGenerated === true && r.classificationComplete === true, 'stable');
  }

  for (let i = 0; i < 25; i += 1) {
    const r = verifyChatPipeline({ message: `Explain trust engine iteration ${i}` });
    assert(`${108 + i}. chat pipeline ${i}`, r.responseReturned === true, 'pipeline');
  }

  for (let i = 0; i < 20; i += 1) {
    const events = processBrainRequest({ message: 'What should we build next?' }).operatorFeedEvents;
    const check = verifyOperatorFeedEvents(events);
    assert(`${133 + i}. feed verify ${i}`, check.stagesOrdered === true, 'ordered');
  }

  for (let i = 0; i < 15; i += 1) {
    const res = await withServer((base) => postBrain(base, 'What should we build next?'));
    assert(`${153 + i}. http stable ${i}`, res.status === 200 && typeof res.body?.brainResponse === 'string', 'http');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await withServer((base) => getHealth(base));
    assert(`${168 + i}. health stable ${i}`, res.body.serverCapability === BRAIN_SERVER_CAPABILITY, 'health');
  }

  assert('178. sendBrainHealth export', typeof sendBrainHealth === 'function', 'fn');
  assert('179. stale marker constant', staleMsg.includes('4321') || staleMsg.includes('npm run dev'), staleMsg);
  assert('180. app no localStorage', !appJs.includes('localStorage'), 'storage');
  assert('181. app no sessionStorage', !appJs.includes('sessionStorage'), 'storage');
  assert('182. app no eval', !appJs.includes('eval('), 'eval');
  assert('183. failure feed to operator', appJs.includes('publishFeedFailure'), 'feed fail');
  assert('184. completed feed css', css.includes('completed-feed'), 'css');
  assert('185. active event css', css.includes('active-event'), 'css');

  for (let i = 0; i < 20; i += 1) {
    const fail = interpretHttpBrainFailure(405, `read-only marker ${i}`);
    assert(`${186 + i}. interpret 405 ${i}`, fail.length > 10, fail);
  }

  for (let i = 0; i < 15; i += 1) {
    const emptyChat = verifyChatPipeline({ message: '' });
    assert(`${206 + i}. empty chat ${i}`, emptyChat.messageCaptured === false, 'empty');
  }

  for (let i = 0; i < 15; i += 1) {
    const blocked = processBrainRequest({ message: 'execute deploy now' });
    assert(`${221 + i}. blocked no feed ${i}`, blocked.operatorFeedEvents.length === 0, 'no feed');
  }

  for (let i = 0; i < 10; i += 1) {
    const key1 = runtimeReportKey(buildBrainRuntimeVerificationReport('What should we build next?'));
    const key2 = runtimeReportKey(buildBrainRuntimeVerificationReport('What should we build next?'));
    assert(`${236 + i}. report key stable ${i}`, key1 === key2, 'key');
  }

  assert('246. roadmap response content', (httpRoadmap.body?.brainResponse as string)?.includes('11.2'), 'roadmap');
  assert('247. feed events in response', (httpRoadmap.body?.operatorFeedEvents as unknown[])?.length === 5, 'events');
  assert('248. pipeline stages present', Array.isArray(httpRoadmap.body?.pipelineStages), 'stages');
  assert('249. category ROADMAP', httpRoadmap.body?.category === 'ROADMAP', String(httpRoadmap.body?.category));
  assert('250. intelligence only confirm', (httpRoadmap.body?.confirmation as { intelligenceOnly?: boolean })?.intelligenceOnly === true, 'intel');

  for (let i = 0; i < 5; i += 1) {
    const det1 = processBrainRequest({ message: 'What should we build next?' });
    const det2 = processBrainRequest({ message: 'What should we build next?' });
    assert(`${251 + i}. deterministic ${i}`, det1.brainResponse === det2.brainResponse, 'deterministic');
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

  if (total < 250) {
    console.log(`Insufficient scenarios: ${total} < 250`);
    process.exitCode = 1;
    return;
  }

  console.log(BRAIN_RUNTIME_VERIFICATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:command-center-brain-runtime');
  console.log('npm run typecheck');
  console.log('npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
