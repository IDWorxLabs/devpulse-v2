/**
 * Preview workspace identity — stamps and verifies workspace hash + App.tsx checksum in served HTML.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensurePreviewReadinessHandshake } from './preview-readiness-contract.js';

export const PREVIEW_WORKSPACE_HASH_META = 'aidevengine-workspace-hash';
export const PREVIEW_PROJECT_ID_META = 'aidevengine-project-id';
export const PREVIEW_APP_TSX_CHECKSUM_META = 'aidevengine-app-tsx-checksum';

export interface PreviewWorkspaceIdentity {
  readOnly: true;
  workspaceHash: string;
  projectId: string;
  appTsxChecksum: string;
}

function readAppTsxPath(workspaceDir: string): string | null {
  for (const rel of ['src/App.tsx', 'src/App.jsx']) {
    const full = join(workspaceDir, rel);
    if (existsSync(full)) return full;
  }
  return null;
}

export function computeAppTsxChecksum(workspaceDir: string): string | null {
  const appPath = readAppTsxPath(workspaceDir);
  if (!appPath) return null;
  return createHash('sha256').update(readFileSync(appPath, 'utf8')).digest('hex').slice(0, 16);
}

function upsertMetaTag(html: string, name: string, content: string): string {
  const tag = `<meta name="${name}" content="${content}" />`;
  const pattern = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i');
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  if (html.includes('</head>')) {
    return html.replace('</head>', `  ${tag}\n</head>`);
  }
  return `${tag}\n${html}`;
}

export function stampPreviewWorkspaceIdentity(input: {
  workspaceDir: string;
  workspaceHash: string;
  projectId: string;
}): PreviewWorkspaceIdentity | null {
  const indexPath = join(input.workspaceDir, 'index.html');
  if (!existsSync(indexPath)) return null;
  const appTsxChecksum = computeAppTsxChecksum(input.workspaceDir);
  if (!appTsxChecksum) return null;

  let html = readFileSync(indexPath, 'utf8');
  html = upsertMetaTag(html, PREVIEW_WORKSPACE_HASH_META, input.workspaceHash);
  html = upsertMetaTag(html, PREVIEW_PROJECT_ID_META, input.projectId);
  html = upsertMetaTag(html, PREVIEW_APP_TSX_CHECKSUM_META, appTsxChecksum);
  writeFileSync(indexPath, html, 'utf8');

  // Runtime handshake: signals HYDRATED/ROUTE_READY after React paints (generic, not product-specific).
  ensurePreviewReadinessHandshake({
    workspaceDir: input.workspaceDir,
    projectId: input.projectId,
    workspaceHash: input.workspaceHash,
  });

  return {
    readOnly: true,
    workspaceHash: input.workspaceHash,
    projectId: input.projectId,
    appTsxChecksum,
  };
}

export function readPreviewIdentityFromHtml(html: string): Partial<PreviewWorkspaceIdentity> {
  const readMeta = (name: string): string | null => {
    const match = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'));
    return match?.[1] ?? null;
  };
  return {
    workspaceHash: readMeta(PREVIEW_WORKSPACE_HASH_META) ?? undefined,
    projectId: readMeta(PREVIEW_PROJECT_ID_META) ?? undefined,
    appTsxChecksum: readMeta(PREVIEW_APP_TSX_CHECKSUM_META) ?? undefined,
  };
}

export async function fetchPreviewIdentityFromUrl(
  previewUrl: string,
): Promise<Partial<PreviewWorkspaceIdentity> & { bodyText: string; html: string }> {
  const res = await fetch(previewUrl, { cache: 'no-store' });
  const html = await res.text();
  const identity = readPreviewIdentityFromHtml(html);
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
  return { ...identity, bodyText, html };
}
