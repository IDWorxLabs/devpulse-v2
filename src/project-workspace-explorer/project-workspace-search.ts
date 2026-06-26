/**
 * Project Workspace Explorer V1 — workspace search.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ProjectWorkspaceContext,
  ProjectWorkspaceSearchMatch,
  ProjectWorkspaceSearchResult,
} from './project-workspace-types.js';
import { MAX_WORKSPACE_SEARCH_RESULTS, WORKSPACE_SKIP_DIRS } from './project-workspace-types.js';

const SEARCHABLE_TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.json',
  '.css',
  '.html',
  '.md',
  '.txt',
]);

function isSearchableFile(name: string): boolean {
  const lower = name.toLowerCase();
  for (const ext of SEARCHABLE_TEXT_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

function walkForSearch(
  baseDir: string,
  relativePrefix: string,
  matches: ProjectWorkspaceSearchMatch[],
  queryLower: string,
  symbolMode: boolean,
): void {
  if (matches.length >= MAX_WORKSPACE_SEARCH_RESULTS) return;
  if (!existsSync(baseDir)) return;

  for (const name of readdirSync(baseDir)) {
    if (matches.length >= MAX_WORKSPACE_SEARCH_RESULTS) return;
    if (WORKSPACE_SKIP_DIRS.has(name)) continue;

    const full = join(baseDir, name);
    const rel = relativePrefix ? `${relativePrefix}/${name}` : name;
    const stat = statSync(full);

    if (stat.isDirectory()) {
      if (name.toLowerCase().includes(queryLower)) {
        matches.push({
          readOnly: true,
          relativePath: rel.replace(/\\/g, '/'),
          name,
          matchType: 'folder',
          preview: null,
          lineNumber: null,
        });
      }
      walkForSearch(full, rel, matches, queryLower, symbolMode);
      continue;
    }

    if (name.toLowerCase().includes(queryLower)) {
      matches.push({
        readOnly: true,
        relativePath: rel.replace(/\\/g, '/'),
        name,
        matchType: 'filename',
        preview: null,
        lineNumber: null,
      });
      continue;
    }

    if (!isSearchableFile(name)) continue;

    const content = readFileSync(full, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      if (matches.length >= MAX_WORKSPACE_SEARCH_RESULTS) return;
      const line = lines[i] ?? '';
      const lineLower = line.toLowerCase();
      if (!lineLower.includes(queryLower)) continue;

      const symbolHit =
        symbolMode &&
        (new RegExp(`\\b(function|class|const|let|var|export|interface|type)\\s+${escapeRegExp(queryLower)}\\b`, 'i').test(
          line,
        ) ||
          new RegExp(`\\b${escapeRegExp(queryLower)}\\s*[(=:]`, 'i').test(line));

      matches.push({
        readOnly: true,
        relativePath: rel.replace(/\\/g, '/'),
        name,
        matchType: symbolHit ? 'symbol' : 'text',
        preview: line.trim().slice(0, 160),
        lineNumber: i + 1,
      });
      break;
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function searchProjectWorkspace(
  ctx: ProjectWorkspaceContext,
  query: string,
): ProjectWorkspaceSearchResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      readOnly: true,
      ok: true,
      projectId: ctx.projectId,
      query: '',
      matches: [],
      truncated: false,
    };
  }

  const queryLower = trimmed.toLowerCase();
  const symbolMode = /^[a-zA-Z_$][\w$]*$/.test(trimmed);
  const matches: ProjectWorkspaceSearchMatch[] = [];

  walkForSearch(ctx.workspaceRootAbs, '', matches, queryLower, symbolMode);

  return {
    readOnly: true,
    ok: true,
    projectId: ctx.projectId,
    query: trimmed,
    matches,
    truncated: matches.length >= MAX_WORKSPACE_SEARCH_RESULTS,
  };
}
