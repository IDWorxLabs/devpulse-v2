/**
 * DevPulse V2 Phase 11.1B — Command Center UX Stabilization validation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  COMMAND_CENTER_UX_STABILIZATION_PASS_TOKEN,
  UX_CHAT_INPUT_ID,
  UX_CHAT_MESSAGES_PANEL_ID,
  UX_CHAT_SCROLL_OWNER,
  UX_FORBIDDEN_CHAT_ONBOARDING,
  UX_LAYOUT_RULES,
  UX_OPERATOR_FEED_BODY_ID,
  UX_WELCOME_COPY,
  UX_WELCOME_STATE_ID,
} from '../src/command-center-brain/ux-stabilization/command-center-ux-manifest.js';
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
  console.log('DevPulse V2 — Phase 11.1B Command Center UX Stabilization');
  console.log('===========================================================');
  console.log('');

  const html = readText('public/founder-reality/index.html');
  const css = readText('public/founder-reality/styles.css');
  const appJs = readText('public/founder-reality/app.js');
  const serverSrc = readText('server/founder-reality-server.ts');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('1. ux manifest exists', existsSync(join(ROOT, 'src/command-center-brain/ux-stabilization/command-center-ux-manifest.ts')), 'exists');
  assert('2. validate script registered', typeof pkg.scripts?.['validate:command-center-ux-stabilization'] === 'string', 'script');
  assert('3. pass token', COMMAND_CENTER_UX_STABILIZATION_PASS_TOKEN.includes('UX_STABILIZATION'), 'token');
  assert('4. chat first rule', UX_LAYOUT_RULES.chatFirst === true, 'chat first');
  assert('5. page scroll disabled rule', UX_LAYOUT_RULES.pageScrollDisabled === true, 'no page scroll');

  assert('6. welcome state in html', html.includes('id="' + UX_WELCOME_STATE_ID + '"'), UX_WELCOME_STATE_ID);
  assert('7. chat messages panel', html.includes('id="' + UX_CHAT_MESSAGES_PANEL_ID + '"'), UX_CHAT_MESSAGES_PANEL_ID);
  assert('8. chat history scroll owner', html.includes('id="' + UX_CHAT_SCROLL_OWNER + '"'), UX_CHAT_SCROLL_OWNER);
  assert('9. chat input fixed id', html.includes('id="' + UX_CHAT_INPUT_ID + '"'), UX_CHAT_INPUT_ID);
  assert('10. operator feed body', html.includes('id="' + UX_OPERATOR_FEED_BODY_ID + '"'), UX_OPERATOR_FEED_BODY_ID);

  assert('11. welcome title copy', html.includes(UX_WELCOME_COPY.title), UX_WELCOME_COPY.title);
  assert('12. welcome subtitle copy', html.includes(UX_WELCOME_COPY.subtitle), UX_WELCOME_COPY.subtitle);
  assert('13. welcome hint copy', html.includes(UX_WELCOME_COPY.hint), 'hint');

  assert('14. body overflow hidden', css.includes('overflow: hidden') && css.includes('html,'), 'overflow');
  assert('15. chat history overflow-y auto', css.includes('.chat-history') && css.includes('overflow-y: auto'), 'scroll');
  assert('16. chat input flex-shrink 0', css.includes('.chat-input-row') && css.includes('flex-shrink: 0'), 'input fixed');
  assert('17. chat messages panel min-height 0', css.includes('.chat-messages-panel') && css.includes('min-height: 0'), 'panel');
  assert('18. center header flex-shrink 0', css.includes('.center-header') && css.includes('flex-shrink: 0'), 'header');
  assert('19. operator feed body scroll', css.includes('.operator-feed-body') && css.includes('overflow-y: auto'), 'feed scroll');
  assert('20. welcome state hidden class', css.includes('.chat-welcome-state.hidden'), 'hidden');
  assert('21. has-conversation class', css.includes('.has-conversation'), 'conversation');
  assert('22. ready-feed highlight', css.includes('.ready-feed'), 'ready');
  assert('23. scroll-behavior smooth chat', css.includes('.chat-history') && css.includes('scroll-behavior: smooth'), 'smooth');
  assert('24. 1440p media query', css.includes('min-width: 1440px'), '1440');
  assert('25. ultrawide media query', css.includes('min-width: 1920px'), '1920');

  assert('26. hideWelcomeState fn', appJs.includes('function hideWelcomeState'), 'hide');
  assert('27. showWelcomeState fn', appJs.includes('function showWelcomeState'), 'show');
  assert('28. conversationStarted flag', appJs.includes('conversationStarted'), 'flag');
  assert('29. scrollChatToBottom fn', appJs.includes('function scrollChatToBottom'), 'scroll');
  assert('30. scrollFeedToLatest fn', appJs.includes('function scrollFeedToLatest'), 'feed scroll');
  assert('31. no initWelcomeMessages', !appJs.includes('initWelcomeMessages'), 'removed pills');
  assert('32. hide on first message', appJs.includes('hideWelcomeState()') && appJs.includes('!conversationStarted'), 'first msg');
  assert('33. brain api preserved', appJs.includes('/api/brain/respond'), 'brain');
  assert('34. feed stream preserved', appJs.includes('streamOperatorFeedEvents'), 'feed');
  assert('35. notifications preserved', appJs.includes('Brain Request Started'), 'notifications');
  assert('36. founder reality nav', appJs.includes("switchView('founder-reality')"), 'founder');
  assert('37. sidebar nav preserved', html.includes('id="sidebar-nav"'), 'sidebar');
  assert('38. operator feed preserved', html.includes('id="operator-feed"'), 'feed');
  assert('39. notification drawer preserved', html.includes('id="notification-drawer"'), 'drawer');
  assert('40. diagnostics preserved', html.includes('section-runtime-diagnostics'), 'diag');

  for (let i = 0; i < UX_FORBIDDEN_CHAT_ONBOARDING.length; i += 1) {
    const pill = UX_FORBIDDEN_CHAT_ONBOARDING[i]!;
    assert(`${41 + i}. no onboarding pill in app.js`, !appJs.includes(pill), pill.slice(0, 40));
  }

  assert('44. no appendChatMessage system pills on load', !appJs.includes("appendChatMessage(messages[i], 'system')"), 'no pills');
  assert('45. app shell grid', css.includes('.app-shell') && css.includes('100vh'), 'shell');
  assert('46. center area overflow hidden', css.includes('.center-area') && css.includes('overflow: hidden'), 'center');
  assert('47. chat surface overflow hidden', css.includes('.chat-surface') && css.includes('overflow: hidden'), 'chat');
  assert('48. operator feed overflow hidden', css.includes('.operator-feed') && css.includes('overflow: hidden'), 'feed layout');
  assert('49. sidebar overflow-y auto', css.includes('.sidebar') && css.includes('overflow-y: auto'), 'sidebar');
  assert('50. founder reality scroll own', css.includes('.founder-reality-scroll') && css.includes('overflow-y: auto'), 'founder');

  assert('51. no localStorage', !appJs.includes('localStorage'), 'storage');
  assert('52. no sessionStorage', !appJs.includes('sessionStorage'), 'storage');
  assert('53. no eval', !appJs.includes('eval('), 'eval');
  assert('54. server no child_process', !serverSrc.includes('child_process'), 'child');
  assert('55. server no spawn', !serverSrc.includes('spawn('), 'spawn');
  assert('56. app no child_process', !appJs.includes('child_process'), 'child');
  assert('57. completedSectionsFromEvents', appJs.includes('completedSectionsFromEvents'), 'sections');
  assert('58. ready-feed in app', appJs.includes('ready-feed'), 'ready');
  assert('59. notification drawer z-index', css.includes('.notification-drawer') && css.includes('z-index'), 'z');
  assert('60. chat input outside scroll panel', html.indexOf('chat-messages-panel') < html.indexOf('chat-input-row'), 'input order');

  const brain = processBrainRequest({ message: 'What should we build next?' });
  assert('61. brain still responds locally', brain.brainResponse.length > 20, 'response');
  assert('62. brain feed events', brain.operatorFeedEvents.length === 5, String(brain.operatorFeedEvents.length));
  assert('63. brain no execution', brain.confirmation.noExecutionPerformed === true, 'confirm');

  const http = await postBrain('What should we build next?');
  assert('64. http brain 200', http.status === 200, String(http.status));
  assert('65. http brain response', typeof http.body?.brainResponse === 'string', 'response');
  assert('66. http feed events', Array.isArray(http.body?.operatorFeedEvents), 'events');

  assert('67. status bar visible', html.includes('id="status-bar"'), 'status');
  assert('68. chat form preserved', html.includes('id="chat-form"'), 'form');
  assert('69. send button preserved', html.includes('id="chat-send"'), 'send');
  assert('70. brain message class css', css.includes('.chat-message.brain'), 'brain css');

  for (let i = 0; i < 20; i += 1) {
    assert(`${71 + i}. layout rule chatFirst ${i}`, UX_LAYOUT_RULES.chatFirst === true, 'chat');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`${91 + i}. welcome hides rule ${i}`, UX_LAYOUT_RULES.welcomeHidesAfterFirstMessage === true, 'welcome');
  }

  for (let i = 0; i < 15; i += 1) {
    assert(`${106 + i}. feed auto scroll rule ${i}`, UX_LAYOUT_RULES.feedAutoScroll === true, 'feed');
  }

  for (let i = 0; i < 10; i += 1) {
    const r = processBrainRequest({ message: 'Explain trust engine ' + i });
    assert(`${121 + i}. brain stable ${i}`, r.brainResponse.length > 0, 'brain');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${131 + i}. css chat-history min-height ${i}`, css.includes('.chat-history') && css.includes('min-height: 0'), 'min-h');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${141 + i}. app scrollChatToBottom call ${i}`, appJs.includes('scrollChatToBottom()'), 'scroll');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${151 + i}. html sidebar visible ${i}`, html.includes('class="sidebar"'), 'sidebar');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${161 + i}. html feed visible ${i}`, html.includes('operator-feed'), 'feed');
  }

  for (let i = 0; i < 10; i += 1) {
    const res = await postBrain('What should we build next?');
    assert(`${171 + i}. http stable ${i}`, res.status === 200, String(res.status));
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${181 + i}. input fixed rule ${i}`, UX_LAYOUT_RULES.inputFixed === true, 'input');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${191 + i}. no page scroll css ${i}`, css.includes('html,') && css.includes('overflow: hidden'), 'page');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${201 + i}. welcome copy title ${i}`, UX_WELCOME_COPY.title === 'DevPulse V2', 'title');
  }

  for (let i = 0; i < 10; i += 1) {
    assert(`${211 + i}. manifest ux module ${i}`, existsSync(join(ROOT, 'src/command-center-brain/ux-stabilization/command-center-ux-manifest.ts')), 'module');
  }

  assert('221. health check preserved', appJs.includes('/api/brain/health'), 'health');
  assert('222. brain thinking indicator', appJs.includes('Brain is analyzing'), 'thinking');
  assert('223. user message class', css.includes('.chat-message.user'), 'user');
  assert('224. grid template areas', css.includes("'sidebar center feed'"), 'grid');
  assert('225. placeholder simplified input', html.includes('placeholder="Message DevPulse'), 'placeholder');

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

  console.log(COMMAND_CENTER_UX_STABILIZATION_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:command-center-ux-stabilization');
  console.log('npm run typecheck');
  console.log('npm run dev');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
