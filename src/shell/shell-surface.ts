/**
 * DevPulse V2 minimal shell surface — placeholders only, no functionality.
 */

import { getFirstClickableControlId } from './clickability-tracker.js';
import type { ShellStatus } from './types.js';

export interface ShellSurfaceModel {
  title: string;
  status: ShellStatus;
}

export function renderShellSurface(model: ShellSurfaceModel): string {
  const controlId = getFirstClickableControlId();

  return [
    '<div class="devpulse-v2-shell" data-devpulse-shell="true">',
    `  <header class="devpulse-v2-shell-header">`,
    `    <h1>${escapeHtml(model.title)}</h1>`,
    `    <p class="devpulse-v2-shell-status">Status: ${escapeHtml(model.status)}</p>`,
    `  </header>`,
    `  <main class="devpulse-v2-shell-main">`,
    `    <section class="devpulse-v2-shell-placeholder" aria-hidden="true">`,
    `      [ Chat Surface Placeholder ]`,
    `    </section>`,
    `    <section class="devpulse-v2-shell-placeholder" aria-hidden="true">`,
    `      [ Operator Feed Placeholder ]`,
    `    </section>`,
    `  </main>`,
    `  <button id="${controlId}" type="button" class="devpulse-v2-shell-primary" tabindex="0">`,
    `    Shell Ready`,
    `  </button>`,
    `</div>`,
  ].join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const SHELL_CHAT_PLACEHOLDER_MARKER = '[ Chat Surface Placeholder ]';

export function injectChatSurfaceIntoShell(shellHtml: string, chatHtml: string): string {
  if (!shellHtml.includes(SHELL_CHAT_PLACEHOLDER_MARKER)) {
    return shellHtml;
  }

  return shellHtml.replace(
    `    <section class="devpulse-v2-shell-placeholder" aria-hidden="true">\n      ${SHELL_CHAT_PLACEHOLDER_MARKER}\n    </section>`,
    `    <section class="devpulse-v2-shell-chat-mount" data-devpulse-chat-mount="true">\n${chatHtml}\n    </section>`,
  );
}
export function getShellSurfaceSnapshot(model: ShellSurfaceModel): {
  html: string;
  hasChatPlaceholder: boolean;
  hasFeedPlaceholder: boolean;
  hasPrimaryControl: boolean;
} {
  const html = renderShellSurface(model);
  return {
    html,
    hasChatPlaceholder: html.includes('[ Chat Surface Placeholder ]'),
    hasFeedPlaceholder: html.includes('[ Operator Feed Placeholder ]'),
    hasPrimaryControl: html.includes(getFirstClickableControlId()),
  };
}
