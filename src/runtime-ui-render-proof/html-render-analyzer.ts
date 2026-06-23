/**
 * HTML render analyzer — mount, bundle, and content signals (Phase 26.84).
 */

import type { UiRenderProbeResult, UiRenderProbeVerdict } from './runtime-ui-render-proof-types.js';

const ROOT_MOUNT_PATTERNS = [
  /id\s*=\s*["']root["']/i,
  /id\s*=\s*["']app["']/i,
  /id\s*=\s*["']__next["']/i,
  /data-reactroot/i,
  /data-root/i,
];

const SCRIPT_BUNDLE_PATTERNS = [
  /<script[^>]+type\s*=\s*["']module["']/i,
  /<script[^>]+src\s*=\s*["'][^"']*(?:assets|src|main|index|bundle|chunk)[^"']*["']/i,
  /src\s*=\s*["']\/@vite\/client["']/i,
  /src\s*=\s*["']\/src\/main\.(?:tsx|jsx|ts|js)["']/i,
];

const VISIBLE_TEXT_PATTERN = /<(?:h1|h2|h3|p|button|nav|main|article)[^>]*>[^<\s][^<]{0,200}/i;

export function isJsonContent(contentType: string | null, body: string | null): boolean {
  const ct = (contentType ?? '').toLowerCase();
  const trimmed = (body ?? '').trim();
  if (ct.includes('json')) return true;
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return true;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return true;
  return false;
}

export function isHtmlContent(contentType: string | null, body: string | null): boolean {
  const ct = (contentType ?? '').toLowerCase();
  const trimmed = (body ?? '').trim().toLowerCase();
  if (ct.includes('html')) return true;
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html');
}

export function detectRootMount(body: string | null): boolean {
  if (!body) return false;
  return ROOT_MOUNT_PATTERNS.some((p) => p.test(body));
}

export function detectScriptBundle(body: string | null): boolean {
  if (!body) return false;
  return SCRIPT_BUNDLE_PATTERNS.some((p) => p.test(body));
}

export function detectVisibleText(body: string | null): boolean {
  if (!body) return false;
  const stripped = body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  if (VISIBLE_TEXT_PATTERN.test(stripped)) return true;
  const textOnly = stripped.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return textOnly.length > 12;
}

export function isBlankHtml(body: string | null): boolean {
  if (!body) return true;
  const stripped = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length === 0;
}

function deriveVerdict(input: {
  statusCode: number | null;
  isHtml: boolean;
  isJsonOnly: boolean;
  hasRootMount: boolean;
  hasScriptBundle: boolean;
  blankHtml: boolean;
  responded: boolean;
  timedOut?: boolean;
}): UiRenderProbeVerdict {
  if (input.timedOut) return 'TIMEOUT';
  if (!input.responded) return 'NO_RESPONSE';
  if (input.statusCode === 404) return 'NOT_FOUND';
  if (input.statusCode !== null && input.statusCode >= 500) return 'SERVER_ERROR';
  if (input.isJsonOnly) return 'JSON_ONLY';
  if (!input.isHtml) return 'HTML_INCOMPLETE';
  if (input.hasRootMount && input.hasScriptBundle) return 'UI_RENDERED';
  if (input.blankHtml) return 'BLANK_HTML';
  return 'HTML_INCOMPLETE';
}

export function analyzeHtmlRender(input: {
  path: string;
  statusCode: number | null;
  contentType: string | null;
  bodyExcerpt: string | null;
  elapsedMs: number;
  responded?: boolean;
  timedOut?: boolean;
}): UiRenderProbeResult {
  const isJsonOnly = isJsonContent(input.contentType, input.bodyExcerpt);
  const isHtml = !isJsonOnly && isHtmlContent(input.contentType, input.bodyExcerpt);
  const hasRootMount = isHtml ? detectRootMount(input.bodyExcerpt) : false;
  const hasScriptBundle = isHtml ? detectScriptBundle(input.bodyExcerpt) : false;
  const blankHtml = isHtml ? isBlankHtml(input.bodyExcerpt) : false;
  const hasVisibleText = isHtml ? detectVisibleText(input.bodyExcerpt) : false;

  return {
    readOnly: true,
    path: input.path,
    statusCode: input.statusCode,
    contentType: input.contentType,
    bodyExcerpt: input.bodyExcerpt,
    isHtml,
    isJsonOnly,
    hasRootMount,
    hasScriptBundle,
    hasVisibleText,
    blankHtml,
    verdict: deriveVerdict({
      statusCode: input.statusCode,
      isHtml,
      isJsonOnly,
      hasRootMount,
      hasScriptBundle,
      blankHtml,
      responded: input.responded !== false,
      timedOut: input.timedOut,
    }),
    elapsedMs: input.elapsedMs,
  };
}

export function isUiRenderedProbe(probe: UiRenderProbeResult): boolean {
  return probe.verdict === 'UI_RENDERED';
}
