/**
 * Clickability and visibility check engine — HTML/string snapshot based.
 */

import type { VisibleUiCheckResult, VisibleUiElementRecord } from './types.js';

function createCheckId(): string {
  return `ui-check-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSelector(selector: string): string {
  return selector.trim();
}

function selectorPresent(html: string, selector: string): boolean {
  const s = normalizeSelector(selector);
  if (!s) return false;
  if (html.includes(s)) return true;
  if (s.startsWith('#')) {
    const id = s.slice(1);
    return html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  }
  if (s.startsWith('.')) {
    const cls = s.slice(1);
    return html.includes(`class="${cls}"`) || html.includes(`class='${cls} `) || html.includes(` ${cls}"`);
  }
  if (s.startsWith('[data-')) {
    return html.includes(s);
  }
  return html.includes(s);
}

export function checkMountTarget(
  record: VisibleUiElementRecord,
  htmlOrDomSnapshot: string,
): boolean {
  return selectorPresent(htmlOrDomSnapshot, record.mountTarget);
}

export function checkExpectedSelector(
  record: VisibleUiElementRecord,
  htmlOrDomSnapshot: string,
): boolean {
  return selectorPresent(htmlOrDomSnapshot, record.expectedSelector);
}

export function checkClickability(
  record: VisibleUiElementRecord,
  htmlOrDomSnapshot: string,
): boolean {
  if (!record.interactive) return true;
  if (!checkExpectedSelector(record, htmlOrDomSnapshot)) return false;

  const html = htmlOrDomSnapshot;
  const selector = normalizeSelector(record.expectedSelector);
  const clickablePatterns = [
    '<button',
    'role="button"',
    "role='button'",
    'data-clickable="true"',
    "data-clickable='true'",
    'onclick=',
    'type="submit"',
    'type="button"',
  ];

  let startIndex = -1;
  if (selector.startsWith('#')) {
    const id = selector.slice(1);
    const idPatterns = [`id="${id}"`, `id='${id}'`, `<button id="${id}"`, `<button id='${id}'`];
    for (const p of idPatterns) {
      const idx = html.indexOf(p);
      if (idx >= 0) {
        startIndex = idx;
        break;
      }
    }
  } else {
    startIndex = html.indexOf(selector);
  }

  if (startIndex < 0) return false;

  const region = html.slice(startIndex, startIndex + 200);
  return clickablePatterns.some((p) => region.includes(p));
}

export function checkVisibleUiElement(
  record: VisibleUiElementRecord,
  htmlOrDomSnapshot: string,
): VisibleUiCheckResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const mountTargetFound = checkMountTarget(record, htmlOrDomSnapshot);
  const visible = checkExpectedSelector(record, htmlOrDomSnapshot);
  const clickable = checkClickability(record, htmlOrDomSnapshot);

  if (!mountTargetFound) {
    errors.push(`Mount target not found: ${record.mountTarget}`);
  }
  if (!visible) {
    errors.push(`Expected selector not visible: ${record.expectedSelector}`);
  }
  if (record.interactive && !clickable) {
    errors.push(`Interactive element not clickable: ${record.elementId}`);
  }
  if (record.requiredForPhase && !visible) {
    errors.push(`Required phase element missing from UI: ${record.elementId}`);
  }
  if (record.interactive && visible && clickable) {
    warnings.push('Interactive element passed visibility and clickability proof.');
  }
  if (!record.interactive && visible) {
    warnings.push('Non-interactive element passed visibility proof.');
  }

  let status: VisibleUiCheckResult['status'] = 'PASS';
  if (errors.length > 0) {
    status = 'FAIL';
  } else if (!visible && record.interactive) {
    status = 'WARN';
  }

  return {
    checkId: createCheckId(),
    elementId: record.elementId,
    visible,
    clickable,
    mountTargetFound,
    status,
    warnings,
    errors,
  };
}

export function summarizeUiChecks(results: VisibleUiCheckResult[]): string {
  const pass = results.filter((r) => r.status === 'PASS').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  return `UI checks: PASS=${pass} WARN=${warn} FAIL=${fail} total=${results.length}`;
}

export function runUiChecksForRegistry(
  records: VisibleUiElementRecord[],
  htmlOrDomSnapshot: string,
): VisibleUiCheckResult[] {
  return records.map((record) => checkVisibleUiElement(record, htmlOrDomSnapshot));
}
