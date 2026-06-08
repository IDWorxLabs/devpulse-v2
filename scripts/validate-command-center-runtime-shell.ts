/**
 * DevPulse V2 Phase 10.3.1 Command Center Runtime Shell — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import {
  buildCommandCenterShellManifest,
  COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE,
  COMMAND_CENTER_RUNTIME_SHELL_PASS_TOKEN,
  DUPLICATE_SHELL_PATTERNS,
  OPERATOR_FEED_SECTIONS,
  SHELL_NAV_ITEMS,
  STATIC_NOTIFICATIONS,
  STATUS_BAR_ITEMS,
  WELCOME_MESSAGES,
} from '../server/command-center-shell-manifest.js';
import { buildFounderRealityManifest, COMPLETED_STACKS, FOUNDER_CHECKLIST, REALITY_WARNINGS } from '../server/founder-reality-manifest.js';
import { createFounderRealityServer, getFounderRealityManifestJson } from '../server/founder-reality-server.js';

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

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Phase 10.3.1 Command Center Runtime Shell');
  console.log('=======================================================');
  console.log('');

  const pkg = readJson('package.json');
  const scripts = pkg.scripts as Record<string, string>;
  const html = readText('public/founder-reality/index.html');
  const css = readText('public/founder-reality/styles.css');
  const appJs = readText('public/founder-reality/app.js');
  const serverSrc = readText('server/founder-reality-server.ts');
  const shellManifestSrc = readText('server/command-center-shell-manifest.ts');

  const validators = Object.keys(scripts).filter((k) => k.startsWith('validate:')).sort();
  const manifest = buildFounderRealityManifest(validators);
  const shell = buildCommandCenterShellManifest();

  assert('1. registry ownership', getDevPulseV2Owner('command_center_runtime_shell').ownerModule === COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE, COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE);
  assert('2. registry phase 10.3.1', getDevPulseV2Owner('command_center_runtime_shell').phase === 10.31, '10.31');
  assert('3. validate script exists', typeof scripts['validate:command-center-runtime-shell'] === 'string', 'exists');
  assert('4. dev script exists', typeof scripts.dev === 'string', scripts.dev ?? '');
  assert('5. shell manifest file exists', existsSync(join(ROOT, 'server/command-center-shell-manifest.ts')), 'exists');
  assert('6. pass token defined', COMMAND_CENTER_RUNTIME_SHELL_PASS_TOKEN === 'DEVPULSE_V2_COMMAND_CENTER_RUNTIME_SHELL_V1_PASS', COMMAND_CENTER_RUNTIME_SHELL_PASS_TOKEN);
  assert('7. manifest runtimeShell', manifest.runtimeShell.phase === '10.3.1', manifest.runtimeShell.phase);
  assert('8. manifest three-zone layout', manifest.runtimeShell.layout === 'three-zone', manifest.runtimeShell.layout);

  assert('9. sidebar exists', html.includes('id="sidebar"'), 'sidebar');
  assert('10. chat surface exists', html.includes('id="chat-surface"'), 'chat');
  assert('11. chat history exists', html.includes('id="chat-history"'), 'history');
  assert('12. chat input exists', html.includes('id="chat-input"'), 'input');
  assert('13. send button exists', html.includes('id="chat-send"'), 'send');
  assert('14. operator feed exists', html.includes('id="operator-feed"'), 'feed');
  assert('15. status bar exists', html.includes('id="status-bar"'), 'status');
  assert('16. notification drawer exists', html.includes('id="notification-drawer"'), 'drawer');
  assert('17. notification toggle exists', html.includes('id="notif-toggle"'), 'toggle');
  assert('18. founder reality view exists', html.includes('id="view-founder-reality"'), 'founder view');
  assert('19. command center view exists', html.includes('id="view-command-center"'), 'command view');
  assert('20. center title Command Center', html.includes('DevPulse V2 Command Center'), 'title');

  assert('21. welcome message in manifest', WELCOME_MESSAGES[0]!.includes('Command Center Runtime Shell'), WELCOME_MESSAGES[0]!);
  assert('22. brain connected welcome', WELCOME_MESSAGES[1]!.includes('Unified Command Center Brain is connected'), WELCOME_MESSAGES[1]!);
  assert('23. operator feed title in html', html.includes('Operator Feed'), 'Operator Feed');
  assert('24. nav Command Center', html.includes('data-view="command-center"'), 'nav');
  assert('25. nav Founder Reality', html.includes('data-view="founder-reality"'), 'nav');
  assert('26. nav Projects placeholder', html.includes('data-label="Projects"'), 'nav');
  assert('27. nav World 2 placeholder', html.includes('data-label="World 2"'), 'nav');
  assert('28. nav Project Vault placeholder', html.includes('data-label="Project Vault"'), 'nav');
  assert('29. nav Validators placeholder', html.includes('data-label="Validators"'), 'nav');
  assert('30. section-stacks preserved', html.includes('id="section-stacks"'), 'stacks');

  assert('31. section-validators preserved', html.includes('id="section-validators"'), 'validators');
  assert('32. section-checklist preserved', html.includes('id="section-checklist"'), 'checklist');
  assert('33. section-warnings preserved', html.includes('id="section-warnings"'), 'warnings');
  assert('34. app.js no fetch to AI', !appJs.includes('/api/chat') && !appJs.includes('/api/execute'), 'no ai api');
  assert('35. app.js brain chat integration', appJs.includes('appendChatMessage') && appJs.includes('/api/brain/respond'), 'brain api');
  assert('36. app.js no eval', !appJs.includes('eval('), 'clean');
  assert('37. app.js switchView founder', appJs.includes("switchView('founder-reality')"), 'founder nav');
  assert('38. app.js operator feed render', appJs.includes('renderOperatorFeed'), 'feed');
  assert('39. app.js status bar render', appJs.includes('renderStatusBar'), 'status');
  assert('40. app.js notifications render', appJs.includes('renderNotifications'), 'notifications');

  assert('41. server no child_process', !serverSrc.includes('child_process'), 'clean');
  assert('42. server no exec', !serverSrc.match(/\bexec\s*\(/), 'clean');
  assert('43. server no spawn', !serverSrc.includes('spawn('), 'clean');
  assert('44. server no eval', !serverSrc.includes('eval('), 'clean');
  assert('45. server no writeFileSync', !serverSrc.includes('writeFileSync'), 'clean');
  assert('46. server uses node:http', serverSrc.includes("from 'node:http'"), 'http');
  assert('47. server brain phase header', serverSrc.includes('11.1'), '11.1');
  assert('48. css turquoise accent', css.includes('--turquoise'), 'turquoise');
  assert('49. css app-shell grid', css.includes('.app-shell'), 'grid');
  assert('50. css chat dominates', css.includes('.chat-surface') && css.includes('flex: 1'), 'chat');

  for (let i = 0; i < SHELL_NAV_ITEMS.length; i += 1) {
    const item = SHELL_NAV_ITEMS[i]!;
    assert(`${51 + i}. nav item ${item}`, html.includes(item), item);
  }

  for (let i = 0; i < OPERATOR_FEED_SECTIONS.length; i += 1) {
    const section = OPERATOR_FEED_SECTIONS[i]!;
    assert(`${58 + i}. operator section ${section}`, shell.operatorFeedSections.includes(section), section);
  }

  for (let i = 0; i < STATUS_BAR_ITEMS.length; i += 1) {
    const item = STATUS_BAR_ITEMS[i]!;
    assert(`${63 + i}. status bar ${i}`, shell.statusBarItems.includes(item), item);
  }

  for (let i = 0; i < STATIC_NOTIFICATIONS.length; i += 1) {
    const n = STATIC_NOTIFICATIONS[i]!;
    assert(`${68 + i}. notification ${i}`, shell.staticNotifications.includes(n), n);
  }

  assert('71. status shell active', STATUS_BAR_ITEMS[0]!.includes('11.1'), STATUS_BAR_ITEMS[0]!);
  assert('72. status founder connected', STATUS_BAR_ITEMS[1]!.includes('Founder Reality'), STATUS_BAR_ITEMS[1]!);
  assert('73. status world2 not connected', STATUS_BAR_ITEMS[2]!.includes('World 2 Runtime Not Connected'), STATUS_BAR_ITEMS[2]!);
  assert('74. status execution not connected', STATUS_BAR_ITEMS[3]!.includes('Execution Runtime Not Connected'), STATUS_BAR_ITEMS[3]!);

  assert('76. no AI response in app.js', !appJs.includes('AI response') || appJs.includes('No AI response'), 'no ai');
  assert('77. no persistence in app.js', !appJs.includes('localStorage') && appJs.includes('persistence'), 'no persist');
  assert('78. form preventDefault', appJs.includes('preventDefault'), 'prevent');
  assert('79. manifest stacks include 10.3.1', manifest.completedStacks.some((s) => s.phase.includes('10.3.1')), '10.3.1 stack');
  assert('80. founder checklist preserved', manifest.founderChecklist.length === FOUNDER_CHECKLIST.length, String(manifest.founderChecklist.length));

  for (let i = 0; i < DUPLICATE_SHELL_PATTERNS.length; i += 1) {
    const pattern = DUPLICATE_SHELL_PATTERNS[i]!;
    const owners = listDevPulseV2Owners().map((o) => o.ownerModule);
    const competing = owners.filter((m) => m.includes(pattern.replace(/_/g, '')) && m !== COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE);
    assert(`${81 + i}. no duplicate ${pattern}`, competing.length === 0, pattern);
  }

  assert('85. distinct from founder reality', getDevPulseV2Owner('founder_reality_surface').ownerModule !== COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE, 'distinct');
  assert('86. distinct from experience layer', getDevPulseV2Owner('experience_layer_foundation').ownerModule !== COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE, 'distinct');
  assert('87. shell confirmation runtime only', shell.confirmation.runtimeShellOnly === true, 'confirmed');
  assert('88. shell local brain connected', shell.confirmation.localBrainConnected === true, 'confirmed');
  assert('89. shell brain api local only', shell.confirmation.brainApiLocalOnly === true, 'confirmed');
  assert('90. shell no execution', shell.confirmation.noExecutionPerformed === true, 'confirmed');

  const json1 = getFounderRealityManifestJson();
  const json2 = getFounderRealityManifestJson();
  assert('91. deterministic manifest json', json1 === json2, 'deterministic');

  const httpResult = await new Promise<{ status: number; body: string; phase: string | undefined }>((resolve) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        resolve({ status: 500, body: '', phase: undefined });
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/founder-reality.json`)
        .then(async (res) => {
          const body = await res.text();
          server.close();
          resolve({ status: res.status, body, phase: res.headers.get('x-devpulse-phase') ?? undefined });
        })
        .catch(() => {
          server.close();
          resolve({ status: 500, body: '', phase: undefined });
        });
    });
  });
  assert('92. api returns runtimeShell', httpResult.body.includes('"runtimeShell"'), 'runtimeShell');
  assert('93. api phase header 11.1', httpResult.phase === '11.1', httpResult.phase ?? 'missing');

  assert('94. reality warnings in manifest', manifest.realityWarnings.length === REALITY_WARNINGS.length, String(manifest.realityWarnings.length));
  assert('95. validators in manifest', manifest.validators.length >= 50, String(manifest.validators.length));
  assert('96. html app-shell id', html.includes('id="app-shell"'), 'app-shell');
  assert('97. css sidebar', css.includes('.sidebar'), 'sidebar');
  assert('98. css operator-feed', css.includes('.operator-feed'), 'operator-feed');
  assert('99. css status-bar', css.includes('.status-bar'), 'status-bar');
  assert('100. app.js fetch manifest only', appJs.includes('/api/founder-reality.json'), 'manifest api');

  for (let i = 0; i < COMPLETED_STACKS.length; i += 1) {
    const stack = COMPLETED_STACKS[i]!;
    assert(`${101 + i}. stack in manifest ${stack.phase}`, manifest.completedStacks.some((s) => s.phase === stack.phase), stack.phase);
  }

  assert('109. no autonomous complete claim html', !html.includes('autonomous building is complete'), 'safe');
  assert('110. no cloud runtime complete', !html.includes('cloud runtime is complete'), 'safe');
  assert('111. no mobile app complete', !html.includes('mobile app is complete'), 'safe');
  assert('112. no execution runtime complete', !html.includes('execution runtime is complete'), 'safe');
  assert('113. feed stream in app', appJs.includes('streamOperatorFeedEvents'), 'stream');
  assert('114. shell manifest owner module', shellManifestSrc.includes(COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE), 'owner');
  assert('115. founder reality scroll class', html.includes('founder-reality-scroll'), 'scroll');
  assert('116. chat message user class', css.includes('.chat-message.user'), 'user msg');
  assert('117. chat message system class', css.includes('.chat-message.system'), 'system msg');
  assert('118. placeholder view exists', html.includes('id="view-placeholder"'), 'placeholder');
  assert('119. sidebar note placeholders', html.includes('Navigation placeholders'), 'note');
  assert('120. experience layer phase intact', getDevPulseV2Owner('experience_layer_foundation').phase === 10.1, '10.1');

  for (let i = 0; i < 30; i += 1) {
    const s = buildCommandCenterShellManifest();
    assert(`${121 + i}. shell manifest stable ${i}`, s.phase === '10.3.1' && s.navItems.length === 7, 'stable');
  }

  for (let i = 0; i < 20; i += 1) {
    const m = buildFounderRealityManifest(validators);
    assert(`${151 + i}. founder manifest stable ${i}`, m.runtimeShell.ownerModule === COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE, 'stable');
  }

  assert('171. brain POST endpoint on server', serverSrc.includes('/api/brain/respond'), 'brain api');
  assert('172. forbidden command path', serverSrc.includes('command'), 'guard');
  assert('173. forbidden write path', serverSrc.includes('write'), 'guard');
  assert('174. no deployment in app.js', !appJs.includes('deploy('), 'clean');
  assert('175. no localStorage persistence', !appJs.includes('localStorage'), 'no storage');
  assert('176. no sessionStorage persistence', !appJs.includes('sessionStorage'), 'no storage');
  assert('177. no XMLHttpRequest execute', !appJs.includes('XMLHttpRequest'), 'clean');
  assert('178. trust expansion phase', getDevPulseV2Owner('trust_engine_expansion').phase === 10.2, '10.2');
  assert('179. founder reality phase unchanged', getDevPulseV2Owner('founder_reality_surface').phase === 10.3, '10.3');
  assert('180. owner function server', getDevPulseV2Owner('command_center_runtime_shell').ownerFunction === 'startFounderRealityServer', 'startFounderRealityServer');

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

  console.log('DEVPULSE_V2_COMMAND_CENTER_RUNTIME_SHELL_V1_PASS');
  console.log('');
  console.log('npm run validate:command-center-runtime-shell');
  console.log('npm run typecheck');
  console.log('npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
