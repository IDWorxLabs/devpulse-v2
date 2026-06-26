/**
 * Project Workspace Explorer V1 — read-only file reader.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import type {
  ProjectWorkspaceContext,
  ProjectWorkspaceFileReadResult,
  WorkspaceFileLanguage,
} from './project-workspace-types.js';
import { MAX_WORKSPACE_FILE_BYTES } from './project-workspace-types.js';
import { resolvePathWithinWorkspace } from './project-workspace-validator.js';

export function detectWorkspaceFileLanguage(fileName: string): WorkspaceFileLanguage {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.tsx')) return 'tsx';
  if (lower.endsWith('.ts')) return 'typescript';
  if (lower.endsWith('.jsx')) return 'jsx';
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'javascript';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.css') || lower.endsWith('.scss')) return 'css';
  if (lower.endsWith('.html')) return 'html';
  if (lower.endsWith('.md')) return 'markdown';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
  return 'text';
}

export function readWorkspaceFile(
  ctx: ProjectWorkspaceContext,
  relativePath: string,
): ProjectWorkspaceFileReadResult {
  const resolved = resolvePathWithinWorkspace(ctx.workspaceRootAbs, relativePath);
  if (!resolved.ok) {
    return {
      readOnly: true,
      ok: false,
      projectId: ctx.projectId,
      relativePath,
      contents: '',
      language: 'unknown',
      modifiedAt: new Date(0).toISOString(),
      size: 0,
      truncated: false,
    };
  }

  const abs = resolved.absolutePath;
  if (!existsSync(abs) || statSync(abs).isDirectory()) {
    return {
      readOnly: true,
      ok: false,
      projectId: ctx.projectId,
      relativePath: resolved.relativePath,
      contents: '',
      language: 'unknown',
      modifiedAt: new Date(0).toISOString(),
      size: 0,
      truncated: false,
    };
  }

  const stat = statSync(abs);
  const language = detectWorkspaceFileLanguage(resolved.relativePath.split('/').pop() ?? '');
  const truncated = stat.size > MAX_WORKSPACE_FILE_BYTES;
  const buffer = readFileSync(abs);
  const slice = truncated ? buffer.subarray(0, MAX_WORKSPACE_FILE_BYTES) : buffer;
  const contents = slice.toString('utf8');

  return {
    readOnly: true,
    ok: true,
    projectId: ctx.projectId,
    relativePath: resolved.relativePath,
    contents,
    language,
    modifiedAt: stat.mtime.toISOString(),
    size: stat.size,
    truncated,
  };
}
