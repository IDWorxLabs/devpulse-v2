/**
 * Project Workspace Explorer V1 — file and folder icon mapping.
 */

const EXT_ICON: Record<string, string> = {
  ts: 'typescript',
  tsx: 'react',
  js: 'javascript',
  jsx: 'react',
  json: 'json',
  css: 'style',
  scss: 'style',
  html: 'html',
  md: 'markdown',
  mjs: 'javascript',
  svg: 'image',
  png: 'image',
  jpg: 'image',
  webp: 'image',
};

const FOLDER_ICON: Record<string, string> = {
  src: 'source',
  features: 'feature',
  components: 'component',
  services: 'service',
  routes: 'route',
  assets: 'asset',
  styles: 'style',
  '.aidev': 'metadata',
  source: 'workspace',
};

export function iconForFile(name: string): string {
  const lower = name.toLowerCase();
  if (lower === 'package.json') return 'package';
  if (lower === 'readme.md') return 'readme';
  if (lower.endsWith('.generated-app-manifest.json') || lower === 'manifest.json') return 'manifest';
  if (lower.includes('feature-contract')) return 'contract';
  if (lower.includes('workspace-reality')) return 'audit';
  if (lower.includes('materialization-quality')) return 'score';
  if (lower.includes('build-history')) return 'history';
  const ext = lower.includes('.') ? lower.split('.').pop() ?? '' : '';
  return EXT_ICON[ext] ?? 'file';
}

export function iconForFolder(name: string): string {
  const key = name.toLowerCase();
  return FOLDER_ICON[key] ?? 'folder';
}

export function iconClassFor(icon: string): string {
  return `pwe-icon pwe-icon-${icon}`;
}
