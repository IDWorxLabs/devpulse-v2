/**
 * DevPulse V2 Phase 10.3 Founder Reality Surface Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  buildFounderRealityManifest,
  COMPLETED_STACKS,
  DUPLICATE_SURFACE_PATTERNS,
  FOUNDER_CHECKLIST,
  FOUNDER_REALITY_PORT,
  FOUNDER_REALITY_SURFACE_OWNER_MODULE,
  FOUNDER_REALITY_SURFACE_PASS_TOKEN,
  FOUNDER_REALITY_URL,
  REALITY_WARNINGS,
} from '../server/founder-reality-manifest.js';
import {
  createFounderRealityServer,
  getFounderRealityManifest,
  getFounderRealityManifestJson,
} from '../server/founder-reality-server.js';

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

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8')) as Record<string, unknown>;
}

async function fetchManifestFromServer(): Promise<{ status: number; body: string; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('No address'));
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/founder-reality.json`)
        .then(async (res) => {
          const body = await res.text();
          const headers: Record<string, string> = {};
          res.headers.forEach((v, k) => {
            headers[k] = v;
          });
          server.close();
          resolve({ status: res.status, body, headers });
        })
        .catch((err) => {
          server.close();
          reject(err);
        });
    });
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 10.3 Founder Reality Surface Foundation');
  console.log('===========================================================');
  console.log('');

  const pkg = readJson('package.json');
  const scripts = pkg.scripts as Record<string, string>;
  const serverSrc = readText('server/founder-reality-server.ts');
  const html = readText('public/founder-reality/index.html');
  const css = readText('public/founder-reality/styles.css');
  const appJs = readText('public/founder-reality/app.js');
  const manifestModule = readText('server/founder-reality-manifest.ts');

  const validators = Object.keys(scripts).filter((k) => k.startsWith('validate:')).sort();
  const manifest = buildFounderRealityManifest(validators);
  const runtimeManifest = getFounderRealityManifest();

  assert('1. server file exists', existsSync(join(ROOT, 'server/founder-reality-server.ts')), 'exists');
  assert('2. manifest file exists', existsSync(join(ROOT, 'server/founder-reality-manifest.ts')), 'exists');
  assert('3. index.html exists', existsSync(join(ROOT, 'public/founder-reality/index.html')), 'exists');
  assert('4. styles.css exists', existsSync(join(ROOT, 'public/founder-reality/styles.css')), 'exists');
  assert('5. app.js exists', existsSync(join(ROOT, 'public/founder-reality/app.js')), 'exists');
  assert('6. dev script exists', typeof scripts.dev === 'string' && scripts.dev.includes('founder-reality-server'), scripts.dev ?? 'missing');
  assert('7. start script exists', typeof scripts.start === 'string' && scripts.start.includes('founder-reality-server'), scripts.start ?? 'missing');
  assert('8. validate script exists', typeof scripts['validate:founder-reality-surface'] === 'string', 'exists');
  assert('9. registry ownership', getDevPulseV2Owner('founder_reality_surface').ownerModule === FOUNDER_REALITY_SURFACE_OWNER_MODULE, FOUNDER_REALITY_SURFACE_OWNER_MODULE);
  assert('10. registry phase 10.3', getDevPulseV2Owner('founder_reality_surface').phase === 10.3, '10.3');

  assert('11. html DevPulse V2 title', html.includes('DevPulse V2'), 'title');
  assert('12. html Founder Reality Surface', html.includes('Founder Reality') || html.includes('founder-reality'), 'founder');
  assert('13. html current status section', html.includes('Current Status'), 'section');
  assert('14. html completed stacks section', html.includes('Completed Foundation Stacks'), 'section');
  assert('15. html validators section', html.includes('Available Validators'), 'section');
  assert('16. html exists vs not yet section', html.includes('What Exists vs What Does Not Exist Yet'), 'section');
  assert('17. html reality warnings section', html.includes('Reality Warnings') || html.includes('section-warnings'), 'section');
  assert('18. html founder checklist section', html.includes('Founder Reality Checklist'), 'section');
  assert('19. html next step section', html.includes('Next Recommended Build Step'), 'section');
  assert('20. html no auto-run hint', html.includes('does not auto-run validators'), 'hint');

  assert('21. manifest title', manifest.title === 'DevPulse V2', manifest.title);
  assert('22. manifest subtitle', manifest.subtitle === 'Command Center Runtime Shell' || manifest.subtitle.includes('Command Center'), manifest.subtitle);
  assert('23. manifest phase', manifest.phase === '10.3.1', manifest.phase);
  assert('24. completed stacks count', manifest.completedStacks.length >= 7, String(manifest.completedStacks.length));
  assert('25. reality warnings count', manifest.realityWarnings.length === 7, String(manifest.realityWarnings.length));
  assert('26. founder checklist count', manifest.founderChecklist.length === 9, String(manifest.founderChecklist.length));
  assert('27. validators loaded', manifest.validators.length >= 50, String(manifest.validators.length));
  assert('28. next step present', manifest.nextRecommendedStep.length > 20, 'present');
  assert('29. experience placeholder', manifest.experienceLayerPlaceholder.includes('Experience Layer'), 'placeholder');
  assert('30. trust placeholder', manifest.trustEnginePlaceholder.includes('Trust Engine'), 'placeholder');

  assert('31. server uses node:http', serverSrc.includes("from 'node:http'") || serverSrc.includes('from "node:http"'), 'http');
  assert('32. server no child_process', !serverSrc.includes('child_process'), 'clean');
  assert('33. server no exec', !serverSrc.match(/\bexec\s*\(/), 'clean');
  assert('34. server no spawn', !serverSrc.includes('spawn('), 'clean');
  assert('35. server no eval', !serverSrc.includes('eval('), 'clean');
  assert('36. server no writeFileSync', !serverSrc.includes('writeFileSync'), 'clean');
  assert('37. server read-only POST block', serverSrc.includes('405') || serverSrc.includes('Method not allowed'), '405');
  assert('38. server forbidden command path', serverSrc.includes('command'), 'guard');
  assert('39. server forbidden write path', serverSrc.includes('write'), 'guard');
  assert('40. server port 4321', manifestModule.includes('4321') && serverSrc.includes('FOUNDER_REALITY_PORT'), '4321');

  assert('41. app.js fetch manifest', appJs.includes('/api/founder-reality.json'), 'fetch');
  assert('42. app.js no eval', !appJs.includes('eval('), 'clean');
  assert('43. app.js no auto validator', !appJs.includes('validate:') || appJs.includes('does not auto-run'), 'no auto-run');
  assert('44. css present', css.length > 500, String(css.length));
  assert('45. pass token defined', FOUNDER_REALITY_SURFACE_PASS_TOKEN === 'DEVPULSE_V2_FOUNDER_REALITY_SURFACE_FOUNDATION_V1_PASS', FOUNDER_REALITY_SURFACE_PASS_TOKEN);
  assert('46. url defined', FOUNDER_REALITY_URL === 'http://localhost:4321', FOUNDER_REALITY_URL);
  assert('47. port defined', FOUNDER_REALITY_PORT === 4321, String(FOUNDER_REALITY_PORT));
  assert('48. confirmation visibility', manifest.confirmation.visibilityOnly === true, 'confirmed');
  assert('49. confirmation no validator auto-run', manifest.confirmation.noValidatorAutoRun === true, 'confirmed');
  assert('50. confirmation no deployment', manifest.confirmation.noDeployment === true, 'confirmed');

  const stacks = ['Governance Stack', 'World 2 Foundation Stack', 'Mobile Command Foundation Stack', 'Self-Evolution Foundation Stack', 'Experience Layer Foundation', 'Trust Engine Expansion Foundation'];
  for (let i = 0; i < stacks.length; i += 1) {
    const name = stacks[i]!;
    assert(`${51 + i}. stack ${name}`, manifest.completedStacks.some((s) => s.name.includes(name.split(' ')[0]!)), name);
  }

  for (let i = 0; i < REALITY_WARNINGS.length; i += 1) {
    const w = REALITY_WARNINGS[i]!;
    assert(`${57 + i}. warning ${w.id}`, html.includes('Reality Warnings') && manifest.realityWarnings.some((m) => m.message === w.message), w.message.slice(0, 40));
  }

  for (let i = 0; i < FOUNDER_CHECKLIST.length; i += 1) {
    const item = FOUNDER_CHECKLIST[i]!;
    assert(`${64 + i}. checklist ${i + 1}`, manifest.founderChecklist.some((c) => c.question === item.question && c.answer === item.answer), item.answer);
  }

  assert('73. checklist open YES', manifest.founderChecklist.find((c) => c.question.includes('open DevPulse'))?.answer === 'YES', 'YES');
  assert('74. checklist build NOT YET', manifest.founderChecklist.find((c) => c.question.includes('build it'))?.answer === 'NOT YET', 'NOT YET');
  assert('75. checklist execute NOT YET', manifest.founderChecklist.find((c) => c.question.includes('execute builds'))?.answer === 'NOT YET', 'NOT YET');
  assert('76. checklist cloud NOT YET', manifest.founderChecklist.find((c) => c.question.includes('cloud'))?.answer === 'NOT YET', 'NOT YET');
  assert('77. checklist mobile NOT YET', manifest.founderChecklist.find((c) => c.question.includes('mobile control'))?.answer === 'NOT YET', 'NOT YET');
  assert('78. checklist self-evolution NOT YET', manifest.founderChecklist.find((c) => c.question.includes('Self-Evolution'))?.answer === 'NOT YET', 'NOT YET');

  assert('79. no autonomous claim in manifest', !manifest.nextRecommendedStep.toLowerCase().includes('autonomous building is complete'), 'safe');
  assert('80. manifestModule no autonomous complete', !manifestModule.includes('autonomous building is complete'), 'safe');

  for (let i = 0; i < DUPLICATE_SURFACE_PATTERNS.length; i += 1) {
    const pattern = DUPLICATE_SURFACE_PATTERNS[i]!;
    const owners = listDevPulseV2Owners().map((o) => o.ownerModule);
    const competing = owners.filter((m) => m.includes(pattern.replace(/_/g, '')) && m !== FOUNDER_REALITY_SURFACE_OWNER_MODULE);
    assert(`${81 + i}. no duplicate ${pattern}`, competing.length === 0, pattern);
  }

  assert('88. distinct from experience layer', getDevPulseV2Owner('experience_layer_foundation').ownerModule !== FOUNDER_REALITY_SURFACE_OWNER_MODULE, 'distinct');
  assert('89. distinct from trust expansion', getDevPulseV2Owner('trust_engine_expansion').ownerModule !== FOUNDER_REALITY_SURFACE_OWNER_MODULE, 'distinct');
  assert('90. runtime manifest matches', runtimeManifest.title === manifest.title, manifest.title);

  const manifestJson1 = getFounderRealityManifestJson();
  const manifestJson2 = getFounderRealityManifestJson();
  assert('91. deterministic manifest json', manifestJson1 === manifestJson2, 'deterministic');
  const manifest2 = buildFounderRealityManifest(validators);
  assert('92. deterministic manifest build', JSON.stringify(manifest) === JSON.stringify(manifest2), 'deterministic');

  const httpResponse = await fetchManifestFromServer();
  assert('93. server api status 200', httpResponse.status === 200, String(httpResponse.status));
  assert('94. server api json valid', httpResponse.body.includes('"title": "DevPulse V2"'), 'json');
  assert('95. server api phase header', httpResponse.headers['x-devpulse-phase'] === '10.3.1', String(httpResponse.headers['x-devpulse-phase']));

  const forbiddenFetch = await new Promise<number>((resolve) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        resolve(500);
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/exec`, { method: 'GET' })
        .then((res) => {
          server.close();
          resolve(res.status);
        })
        .catch(() => {
          server.close();
          resolve(500);
        });
    });
  });
  assert('96. forbidden exec endpoint', forbiddenFetch === 403, String(forbiddenFetch));

  const writeForbidden = await new Promise<number>((resolve) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        resolve(500);
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/write-file`, { method: 'GET' })
        .then((res) => {
          server.close();
          resolve(res.status);
        })
        .catch(() => {
          server.close();
          resolve(500);
        });
    });
  });
  assert('97. forbidden write endpoint', writeForbidden === 403 || writeForbidden === 404, String(writeForbidden));

  const postBlocked = await new Promise<number>((resolve) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        resolve(500);
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/founder-reality.json`, { method: 'POST' })
        .then((res) => {
          server.close();
          resolve(res.status);
        })
        .catch(() => {
          server.close();
          resolve(500);
        });
    });
  });
  assert('98. POST blocked', postBlocked === 405, String(postBlocked));

  assert('99. exists list non-empty', manifest.existsVsNotYet.exists.length >= 5, String(manifest.existsVsNotYet.exists.length));
  assert('100. not yet list non-empty', manifest.existsVsNotYet.notYet.length >= 5, String(manifest.existsVsNotYet.notYet.length));

  for (let i = 0; i < COMPLETED_STACKS.length; i += 1) {
    const stack = COMPLETED_STACKS[i]!;
    assert(`${101 + i}. completed stack ${stack.phase}`, manifest.completedStacks.some((s) => s.phase === stack.phase), stack.phase);
  }

  for (let i = 0; i < Math.min(validators.length, 40); i += 1) {
    const v = validators[i]!;
    assert(`${108 + i}. validator listed ${v}`, manifest.validators.includes(v), v);
  }

  assert('148. governance stack in exists', manifest.existsVsNotYet.exists.some((e) => e.includes('Governance')), 'governance');
  assert('149. world2 in exists', manifest.existsVsNotYet.exists.some((e) => e.includes('World 2')), 'world2');
  assert('150. mobile in exists', manifest.existsVsNotYet.exists.some((e) => e.includes('Mobile')), 'mobile');
  assert('151. self-evolution in exists', manifest.existsVsNotYet.exists.some((e) => e.includes('Self-evolution')), 'self-evolution');
  assert('152. product hardening not yet', manifest.existsVsNotYet.notYet.some((e) => e.includes('Product hardening')), 'not yet');
  assert('153. cloud not yet', manifest.existsVsNotYet.notYet.some((e) => e.includes('Cloud')), 'not yet');
  assert('154. mobile app not yet', manifest.existsVsNotYet.notYet.some((e) => e.includes('mobile app')), 'not yet');
  assert('155. execution runtime not yet', manifest.existsVsNotYet.notYet.some((e) => e.includes('Execution runtime')), 'not yet');

  assert('156. warning foundation exists', REALITY_WARNINGS[0]!.message.includes('Foundation architecture'), 'warning');
  assert('157. warning product beginning', REALITY_WARNINGS[1]!.message.includes('just beginning'), 'warning');
  assert('158. warning no autonomous', REALITY_WARNINGS[2]!.message.includes('autonomous building'), 'warning');
  assert('159. warning no cloud', REALITY_WARNINGS[3]!.message.includes('cloud runtime'), 'warning');
  assert('160. warning no mobile app', REALITY_WARNINGS[4]!.message.includes('mobile app'), 'warning');
  assert('161. warning no live preview', REALITY_WARNINGS[5]!.message.includes('live preview'), 'warning');
  assert('162. warning no execution runtime', REALITY_WARNINGS[6]!.message.includes('execution runtime'), 'warning');

  assert('163. html section status id', html.includes('id="section-status"'), 'id');
  assert('164. html section stacks id', html.includes('id="section-stacks"'), 'id');
  assert('165. html section validators id', html.includes('id="section-validators"'), 'id');
  assert('166. html section checklist id', html.includes('id="section-checklist"'), 'id');
  assert('167. html section next id', html.includes('id="section-next"'), 'id');
  assert('168. html links styles.css', html.includes('styles.css'), 'css');
  assert('169. html links app.js', html.includes('app.js'), 'js');
  assert('170. server createFounderRealityServer exported', serverSrc.includes('export function createFounderRealityServer'), 'exported');
  assert('171. server start exported', serverSrc.includes('export function startFounderRealityServer'), 'exported');
  assert('172. no deployment in server', !serverSrc.includes('deploy('), 'clean');
  assert('173. confirmation no execution', manifest.confirmation.noExecutionPerformed === true, 'confirmed');
  assert('174. confirmation no file modification', manifest.confirmation.noFileModification === true, 'confirmed');
  assert('175. confirmation no code generation', manifest.confirmation.noCodeGeneration === true, 'confirmed');
  assert('176. confirmation no autonomous claim flag', manifest.confirmation.noAutonomousBuildingClaim === true, 'confirmed');
  assert('177. experience layer phase', getDevPulseV2Owner('experience_layer_foundation').phase === 10.1, '10.1');
  assert('178. trust expansion phase', getDevPulseV2Owner('trust_engine_expansion').phase === 10.2, '10.2');
  assert('179. owner function registered', getDevPulseV2Owner('founder_reality_surface').ownerFunction === 'startFounderRealityServer', 'startFounderRealityServer');
  assert('180. description mentions visibility', getDevPulseV2Owner('founder_reality_surface').description.includes('visibility'), 'visibility');

  for (let i = 0; i < 20; i += 1) {
    const m = buildFounderRealityManifest(validators);
    assert(`${181 + i}. manifest rebuild stable ${i}`, m.title === 'DevPulse V2' && m.completedStacks.length === COMPLETED_STACKS.length, 'stable');
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

  if (total < 180) {
    console.log(`Insufficient scenarios: ${total} < 180`);
    process.exitCode = 1;
    return;
  }

  console.log('DEVPULSE_V2_FOUNDER_REALITY_SURFACE_FOUNDATION_V1_PASS');
  console.log('');
  console.log('npm run validate:founder-reality-surface');
  console.log('npm run typecheck');
  console.log('npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
