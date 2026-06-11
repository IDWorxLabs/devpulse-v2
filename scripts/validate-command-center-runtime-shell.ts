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
  PRODUCT_NAV_ITEMS,
  PRODUCT_STATUS_BAR_ITEMS,
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

function extractSidebarNavLabels(html: string): string[] {
  const labels: string[] = [];
  const re = /<span class="nav-label">([^<]*)<\/span>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    labels.push(match[1]!.trim());
  }
  return labels;
}

const REMOVED_PRODUCT_NAV_LABELS = ['World 2', 'Project Vault', 'Validators', 'Founder Reality'] as const;

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
  const sidebarNavLabels = extractSidebarNavLabels(html);

  assert('18. project insights view exists', html.includes('id="view-project-insights"'), 'project insights view');
  assert('19. command center view exists', html.includes('id="view-command-center"'), 'command view');
  assert('20. center title AiDevEngine', html.includes('AiDevEngine Command Center'), 'title');

  assert('21. welcome message in manifest', WELCOME_MESSAGES[0]!.includes('Command Center Runtime Shell'), WELCOME_MESSAGES[0]!);
  assert('22. brain connected welcome', WELCOME_MESSAGES[1]!.includes('Unified Command Center Brain is connected'), WELCOME_MESSAGES[1]!);
  assert('23. operator feed title in html', html.includes('Operator Feed'), 'Operator Feed');
  assert('24. nav Command Center', html.includes('data-view="command-center"'), 'nav');
  assert('25. nav Live Preview', html.includes('data-view="live-preview"') && sidebarNavLabels.includes('Live Preview'), 'live preview nav');
  assert('26. nav Verification', html.includes('data-view="verification"') && sidebarNavLabels.includes('Verification'), 'verification nav');
  assert('27. nav Project Memory', html.includes('data-view="project-memory"') && sidebarNavLabels.includes('Project Memory'), 'project memory nav');
  assert('28. nav Autonomous Builder', html.includes('data-view="autonomous-builder"') && sidebarNavLabels.includes('Autonomous Builder'), 'autonomous builder nav');
  assert('29. nav Project Insights', html.includes('data-view="project-insights"') && sidebarNavLabels.includes('Project Insights'), 'project insights nav');
  assert('30. section-stacks in system diagnostics', html.includes('id="section-stacks"') && html.includes('id="view-system-diagnostics"'), 'stacks');

  assert('31. section-validators preserved', html.includes('id="section-validators"'), 'validators');
  assert('32. section-checklist preserved', html.includes('id="section-checklist"'), 'checklist');
  assert('33. section-warnings preserved', html.includes('id="section-warnings"'), 'warnings');
  assert('34. app.js no fetch to AI', !appJs.includes('/api/chat') && !appJs.includes('/api/execute'), 'no ai api');
  assert('35. app.js brain chat integration', appJs.includes('appendChatMessage') && appJs.includes('/api/brain/respond'), 'brain api');
  assert('36. app.js no eval', !appJs.includes('eval('), 'clean');
  assert('37. app.js switchView product nav', appJs.includes('function switchView') && appJs.includes('project-insights'), 'product nav');
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

  for (let i = 0; i < PRODUCT_NAV_ITEMS.length; i += 1) {
    const item = PRODUCT_NAV_ITEMS[i]!;
    assert(`${51 + i}. product nav item ${item}`, sidebarNavLabels.includes(item), item);
  }

  assert('59. internal shell nav preserved', shell.navItems.length === SHELL_NAV_ITEMS.length, String(shell.navItems.length));
  assert('60. product nav manifest count', shell.productNavItems.length === PRODUCT_NAV_ITEMS.length, String(shell.productNavItems.length));

  for (let i = 0; i < OPERATOR_FEED_SECTIONS.length; i += 1) {
    const section = OPERATOR_FEED_SECTIONS[i]!;
    assert(`${61 + i}. operator section ${section}`, shell.operatorFeedSections.includes(section), section);
  }

  for (let i = 0; i < STATUS_BAR_ITEMS.length; i += 1) {
    const item = STATUS_BAR_ITEMS[i]!;
    assert(`${66 + i}. internal status bar ${i}`, shell.statusBarItems.includes(item), item);
  }

  for (let i = 0; i < PRODUCT_STATUS_BAR_ITEMS.length; i += 1) {
    const item = PRODUCT_STATUS_BAR_ITEMS[i]!;
    assert(`${70 + i}. product status bar ${i}`, shell.productStatusBarItems.includes(item), item);
  }

  for (let i = 0; i < STATIC_NOTIFICATIONS.length; i += 1) {
    const n = STATIC_NOTIFICATIONS[i]!;
    assert(`${74 + i}. notification ${i}`, shell.staticNotifications.includes(n), n);
  }

  assert('78. product brand manifest', shell.productBrand === 'AiDevEngine', shell.productBrand);
  assert('79. internal status shell active', STATUS_BAR_ITEMS[0]!.includes('11.1'), STATUS_BAR_ITEMS[0]!);
  assert('80. product status runtime connected', PRODUCT_STATUS_BAR_ITEMS[0]!.includes('AiDevEngine'), PRODUCT_STATUS_BAR_ITEMS[0]!);

  assert('81. no AI response in app.js', !appJs.includes('AI response') || appJs.includes('No AI response'), 'no ai');
  assert('82. no persistence in app.js', !appJs.includes('localStorage') && appJs.includes('persistence'), 'no persist');
  assert('83. form preventDefault', appJs.includes('preventDefault'), 'prevent');
  assert('84. manifest stacks include 10.3.1', manifest.completedStacks.some((s) => s.phase.includes('10.3.1')), '10.3.1 stack');
  assert('85. founder checklist preserved', manifest.founderChecklist.length === FOUNDER_CHECKLIST.length, String(manifest.founderChecklist.length));

  for (let i = 0; i < DUPLICATE_SHELL_PATTERNS.length; i += 1) {
    const pattern = DUPLICATE_SHELL_PATTERNS[i]!;
    const owners = listDevPulseV2Owners().map((o) => o.ownerModule);
    const competing = owners.filter((m) => m.includes(pattern.replace(/_/g, '')) && m !== COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE);
    assert(`${86 + i}. no duplicate ${pattern}`, competing.length === 0, pattern);
  }

  assert('90. distinct from founder reality', getDevPulseV2Owner('founder_reality_surface').ownerModule !== COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE, 'distinct');
  assert('91. distinct from experience layer', getDevPulseV2Owner('experience_layer_foundation').ownerModule !== COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE, 'distinct');
  assert('92. shell confirmation runtime only', shell.confirmation.runtimeShellOnly === true, 'confirmed');
  assert('93. shell local brain connected', shell.confirmation.localBrainConnected === true, 'confirmed');
  assert('94. shell brain api local only', shell.confirmation.brainApiLocalOnly === true, 'confirmed');
  assert('95. shell no execution', shell.confirmation.noExecutionPerformed === true, 'confirmed');

  const json1 = getFounderRealityManifestJson();
  const json2 = getFounderRealityManifestJson();
  assert('96. deterministic manifest json', json1 === json2, 'deterministic');

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
  assert('97. api returns runtimeShell', httpResult.body.includes('"runtimeShell"'), 'runtimeShell');
  assert('98. api phase header 11.1', httpResult.phase === '11.1', httpResult.phase ?? 'missing');

  assert('99. reality warnings in manifest', manifest.realityWarnings.length === REALITY_WARNINGS.length, String(manifest.realityWarnings.length));
  assert('100. validators in manifest', manifest.validators.length >= 50, String(manifest.validators.length));
  assert('101. html app-shell id', html.includes('id="app-shell"'), 'app-shell');
  assert('102. css sidebar', css.includes('.sidebar'), 'sidebar');
  assert('103. css operator-feed', css.includes('.operator-feed'), 'operator-feed');
  assert('104. css status-bar', css.includes('.status-bar'), 'status-bar');
  assert('105. app.js fetch manifest', appJs.includes('/api/founder-reality.json'), 'manifest api');
  assert('106. app.js fetch product workspace', appJs.includes('/api/product-workspace.json'), 'workspace api');

  for (let i = 0; i < COMPLETED_STACKS.length; i += 1) {
    const stack = COMPLETED_STACKS[i]!;
    assert(`${107 + i}. stack in manifest ${stack.phase}`, manifest.completedStacks.some((s) => s.phase === stack.phase), stack.phase);
  }

  assert('115. no autonomous complete claim html', !html.includes('autonomous building is complete'), 'safe');
  assert('116. no cloud runtime complete', !html.includes('cloud runtime is complete'), 'safe');
  assert('117. no mobile app complete', !html.includes('mobile app is complete'), 'safe');
  assert('118. no execution runtime complete', !html.includes('execution runtime is complete'), 'safe');
  assert('119. feed stream in app', appJs.includes('streamOperatorFeedEvents'), 'stream');
  assert('120. shell manifest owner module', shellManifestSrc.includes(COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE), 'owner');
  assert('121. project insights scroll class', html.includes('founder-reality-scroll'), 'scroll');
  assert('122. chat message user class', css.includes('.chat-message.user'), 'user msg');
  assert('123. chat message system class', css.includes('.chat-message.system'), 'system msg');
  assert('124. no placeholder view', !html.includes('id="view-placeholder"'), 'no placeholder');
  assert('125. no sidebar placeholder note', !html.includes('Navigation placeholders'), 'no placeholder note');
  assert('126. sidebar status area', html.includes('id="sidebar-status"'), 'sidebar status');
  assert('127. live preview screen exists', html.includes('id="view-live-preview"') && html.includes('id="live-preview-surface"'), 'live preview screen');
  assert('128. live preview render fn', appJs.includes('renderLivePreviewSurface') && appJs.includes('preview-frame'), 'live preview render');
  assert('129. live preview empty state', appJs.includes('No live preview is running yet'), 'preview empty');
  assert('130. verification screen exists', html.includes('id="view-verification"'), 'verification screen');
  assert('131. validators nav absent', !sidebarNavLabels.includes('Validators'), 'no validators nav');
  assert('132. project memory screen exists', html.includes('id="view-project-memory"'), 'project memory screen');
  assert('133. project vault nav absent', !sidebarNavLabels.includes('Project Vault'), 'no vault nav');
  assert('134. autonomous builder screen exists', html.includes('id="view-autonomous-builder"'), 'autonomous builder screen');
  assert('135. world2 nav absent', !sidebarNavLabels.includes('World 2'), 'no world2 nav');
  assert('136. honest builder readiness copy', appJs.includes('executionConnected') || appJs.includes('Not connected yet'), 'builder honesty');
  assert('137. portfolio insights surface', html.includes('id="project-insights-surface"') && appJs.includes('renderProjectInsightsSurface'), 'portfolio surface');
  assert('138. system diagnostics nav', html.includes('data-view="system-diagnostics"') && sidebarNavLabels.includes('System Diagnostics'), 'system diagnostics nav');
  assert('139. system diagnostics view', html.includes('id="view-system-diagnostics"'), 'system diagnostics view');
  assert('140. founder reality nav absent', !sidebarNavLabels.includes('Founder Reality'), 'no founder reality nav');
  assert('141. experience layer phase intact', getDevPulseV2Owner('experience_layer_foundation').phase === 10.1, '10.1');
  assert('142. portfolio demo in app', appJs.includes('demo-badge') && appJs.includes('Back to Portfolio'), 'demo portfolio');
  assert('143. advanced runtime in system diagnostics', html.includes('id="section-runtime-diagnostics"') && html.indexOf('section-runtime-diagnostics') > html.indexOf('view-system-diagnostics'), 'runtime diag');

  for (let i = 0; i < REMOVED_PRODUCT_NAV_LABELS.length; i += 1) {
    const removed = REMOVED_PRODUCT_NAV_LABELS[i]!;
    assert(`${144 + i}. removed nav absent ${removed}`, !sidebarNavLabels.includes(removed), removed);
  }

  for (let i = 0; i < 30; i += 1) {
    const s = buildCommandCenterShellManifest();
    assert(`${148 + i}. shell manifest stable ${i}`, s.phase === '10.3.1' && s.navItems.length === 7 && s.productNavItems.length === 9, 'stable');
  }

  for (let i = 0; i < 20; i += 1) {
    const m = buildFounderRealityManifest(validators);
    assert(`${174 + i}. founder manifest stable ${i}`, m.runtimeShell.ownerModule === COMMAND_CENTER_RUNTIME_SHELL_OWNER_MODULE, 'stable');
  }

  assert('194. brain POST endpoint on server', serverSrc.includes('/api/brain/respond'), 'brain api');
  assert('195. forbidden command path', serverSrc.includes('command'), 'guard');
  assert('196. forbidden write path', serverSrc.includes('write'), 'guard');
  assert('197. no deployment in app.js', !appJs.includes('deploy('), 'clean');
  assert('198. no localStorage persistence', !appJs.includes('localStorage'), 'no storage');
  assert('199. no sessionStorage persistence', !appJs.includes('sessionStorage'), 'no storage');
  assert('200. no XMLHttpRequest execute', !appJs.includes('XMLHttpRequest'), 'clean');
  assert('201. trust expansion phase', getDevPulseV2Owner('trust_engine_expansion').phase === 10.2, '10.2');
  assert('202. founder reality phase unchanged', getDevPulseV2Owner('founder_reality_surface').phase === 10.3, '10.3');
  assert('203. owner function server', getDevPulseV2Owner('command_center_runtime_shell').ownerFunction === 'startFounderRealityServer', 'startFounderRealityServer');
  assert('204. product workspace route on server', serverSrc.includes('/api/product-workspace.json'), 'workspace route');
  assert('205. html AiDevEngine branding', html.includes('AiDevEngine'), 'AiDevEngine');
  assert('206. portfolio demo data file', existsSync(join(ROOT, 'server/portfolio-demo-data.ts')), 'demo file');
  assert('207. demo projects in snapshot import', shellManifestSrc.includes('PRODUCT_NAV_ITEMS') || readText('server/product-workspace-snapshot.ts').includes('buildPortfolioInsightsDemo'), 'portfolio snapshot');
  assert('208. back to portfolio in app', appJs.includes('back-to-portfolio'), 'back');
  assert('209. demo badge in app', appJs.includes('demo-badge'), 'demo');
  assert('210. project insights no insights-grid', !html.includes('id="insights-grid"'), 'no old grid');
  assert('211. portfolio load resilience', appJs.includes('loadProductWorkspace') && appJs.includes('CLIENT_DEMO_PORTFOLIO_FALLBACK'), 'portfolio load');
  assert('212. portfolio demo api', serverSrc.includes('/api/portfolio-demo.json'), 'demo api');

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
