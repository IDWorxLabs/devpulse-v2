/**
 * Generic preview readiness contract — hydration / route-ready handshake for generated apps.
 * Domain-agnostic: no product-specific copy. Bound to project id + workspace hash.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const PREVIEW_READY_ATTR = 'data-aidev-preview-ready' as const;
export const PREVIEW_HYDRATED_ATTR = 'data-aidev-preview-hydrated' as const;
export const PREVIEW_ROUTE_READY_ATTR = 'data-aidev-preview-route-ready' as const;
export const PREVIEW_PROJECT_ID_ATTR = 'data-aidev-project-id' as const;
export const PREVIEW_WORKSPACE_HASH_ATTR = 'data-aidev-workspace-hash' as const;

export const PREVIEW_READY_SELECTOR = `[${PREVIEW_READY_ATTR}="1"]` as const;
export const PREVIEW_HYDRATED_SELECTOR = `[${PREVIEW_HYDRATED_ATTR}="1"]` as const;

export type PreviewReadinessFailureClass =
  | 'PREVIEW_SERVER_UNAVAILABLE'
  | 'WRONG_PREVIEW_IDENTITY'
  | 'HTML_SHELL_NOT_HYDRATED'
  | 'HYDRATED_ROUTE_UNRESOLVED'
  | 'APPLICATION_RUNTIME_EXCEPTION'
  | 'EXPECTED_FEATURE_DOM_MISSING'
  | 'INTERACTION_CONTROL_UNAVAILABLE'
  | 'INTERACTION_FAILED'
  | 'STALE_PREVIEW_TARGET'
  | 'BROWSER_AUTOMATION_FAILURE'
  | null;

const HANDSHAKE_MARKER = '/* AIDEVENGINE_PREVIEW_READINESS_HANDSHAKE_V1 */';

function buildHandshakeSnippet(projectId: string, workspaceHash: string): string {
  const safeProjectId = JSON.stringify(projectId);
  const safeHash = JSON.stringify(workspaceHash);
  return `
${HANDSHAKE_MARKER}
function __aidevSignalPreviewReady() {
  try {
    const root = document.documentElement;
    root.setAttribute('${PREVIEW_HYDRATED_ATTR}', '1');
    root.setAttribute('${PREVIEW_ROUTE_READY_ATTR}', '1');
    root.setAttribute('${PREVIEW_READY_ATTR}', '1');
    root.setAttribute('${PREVIEW_PROJECT_ID_ATTR}', ${safeProjectId});
    root.setAttribute('${PREVIEW_WORKSPACE_HASH_ATTR}', ${safeHash});
    const mount = document.getElementById('root');
    if (mount) {
      mount.setAttribute('${PREVIEW_READY_ATTR}', '1');
      mount.setAttribute('${PREVIEW_PROJECT_ID_ATTR}', ${safeProjectId});
    }
  } catch {
    // Preview readiness is best-effort — never block rendering.
  }
}
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    __aidevSignalPreviewReady();
  });
});
`;
}

/**
 * Ensures generated `src/main.tsx` signals hydration after the first paint.
 * Idempotent — safe to call on every forensic manifest completion.
 */
export function ensurePreviewReadinessHandshake(input: {
  workspaceDir: string;
  projectId: string;
  workspaceHash: string;
}): { patched: boolean; path: string | null } {
  const mainPath = join(input.workspaceDir, 'src', 'main.tsx');
  if (!existsSync(mainPath)) {
    return { patched: false, path: null };
  }
  let source = readFileSync(mainPath, 'utf8');
  const snippet = buildHandshakeSnippet(input.projectId, input.workspaceHash);

  if (source.includes(HANDSHAKE_MARKER)) {
    // Refresh identity attributes if project/hash changed.
    source = source.replace(
      /\/\* AIDEVENGINE_PREVIEW_READINESS_HANDSHAKE_V1 \*\/[\s\S]*$/m,
      snippet.trimStart(),
    );
    writeFileSync(mainPath, source, 'utf8');
    return { patched: true, path: mainPath };
  }

  if (!/createRoot\s*\(/.test(source)) {
    return { patched: false, path: mainPath };
  }

  const trimmed = source.replace(/\s*$/, '');
  writeFileSync(mainPath, `${trimmed}\n${snippet}`, 'utf8');
  return { patched: true, path: mainPath };
}

export function htmlSignalsPreviewReady(html: string): boolean {
  const corpus = html.toLowerCase();
  return (
    corpus.includes(`${PREVIEW_READY_ATTR}="1"`) ||
    corpus.includes(`${PREVIEW_READY_ATTR}='1'`) ||
    corpus.includes(`${PREVIEW_HYDRATED_ATTR}="1"`)
  );
}

export function readPreviewProjectIdFromHtml(html: string): string | null {
  const attr = html.match(
    new RegExp(`${PREVIEW_PROJECT_ID_ATTR}=["']([^"']+)["']`, 'i'),
  );
  if (attr?.[1]) return attr[1];
  const meta = html.match(
    /<meta[^>]+name=["']aidevengine-project-id["'][^>]+content=["']([^"']+)["']/i,
  );
  return meta?.[1] ?? null;
}

export function classifyPreviewDomFailure(input: {
  html: string;
  bodyText: string;
  expectedProjectId: string | null;
  httpOk: boolean;
  consoleErrors?: string[];
}): PreviewReadinessFailureClass {
  if (!input.httpOk) return 'PREVIEW_SERVER_UNAVAILABLE';
  const servedId = readPreviewProjectIdFromHtml(input.html);
  if (
    input.expectedProjectId &&
    servedId &&
    servedId.toLowerCase() !== input.expectedProjectId.toLowerCase()
  ) {
    return 'WRONG_PREVIEW_IDENTITY';
  }
  if ((input.consoleErrors ?? []).some((e) => /error|exception|failed to fetch/i.test(e))) {
    return 'APPLICATION_RUNTIME_EXCEPTION';
  }
  if (!htmlSignalsPreviewReady(input.html)) {
    const hasRoot = /id=["']root["']/.test(input.html);
    if (hasRoot) return 'HTML_SHELL_NOT_HYDRATED';
    return 'BROWSER_AUTOMATION_FAILURE';
  }
  return 'EXPECTED_FEATURE_DOM_MISSING';
}
