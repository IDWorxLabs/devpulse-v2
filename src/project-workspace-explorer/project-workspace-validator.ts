/**
 * Project Workspace Explorer V1 — path sanitization and isolation guards.
 */

import { resolve, normalize } from 'node:path';

const PROJECT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

export function validateProjectId(projectId: string): boolean {
  const trimmed = projectId.trim();
  return Boolean(trimmed) && PROJECT_ID_PATTERN.test(trimmed);
}

export function sanitizeRelativeWorkspacePath(input: string): string | null {
  const raw = String(input ?? '').trim().replace(/\\/g, '/');
  if (!raw || raw === '.') return '';
  if (raw.includes('\0')) return null;
  if (raw.startsWith('/') || /^[a-zA-Z]:/.test(raw)) return null;

  const segments = raw.split('/').filter((segment) => segment.length > 0);
  for (const segment of segments) {
    if (segment === '..') return null;
    if (segment === '.') return null;
  }

  return segments.join('/');
}

export function resolvePathWithinWorkspace(
  workspaceRootAbs: string,
  relativePath: string,
): { ok: true; absolutePath: string; relativePath: string } | { ok: false; reason: string } {
  const sanitized = sanitizeRelativeWorkspacePath(relativePath);
  if (sanitized === null) {
    return { ok: false, reason: 'Invalid relative path' };
  }

  const root = resolve(workspaceRootAbs);
  const absolutePath = resolve(root, sanitized || '.');
  const normalizedRoot = root.endsWith('\\') ? root : `${root}\\`;
  const normalizedRootPosix = root.replace(/\\/g, '/');
  const absolutePosix = absolutePath.replace(/\\/g, '/');

  if (
    absolutePath !== root &&
    !absolutePath.startsWith(normalizedRoot) &&
    !absolutePosix.startsWith(`${normalizedRootPosix}/`)
  ) {
    return { ok: false, reason: 'Path escapes project workspace' };
  }

  return { ok: true, absolutePath, relativePath: sanitized };
}

export function isReadOnlyExplorerOperation(method: string): boolean {
  return method === 'GET' || method === 'HEAD';
}
