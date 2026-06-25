/**
 * Workspace File Discovery Engine — disk-only inventory, never inferred.
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { classifyGeneratedFile } from './file-category-classifier.js';
import type {
  GeneratedFileInventoryEntry,
  WorkspaceDiscoveryResult,
} from './materialization-evidence-types.js';

const SKIP_DIR_NAMES = new Set(['node_modules', '.git', 'dist', '.vite']);
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.css',
  '.html',
  '.md',
  '.mjs',
  '.cjs',
  '.txt',
  '.svg',
]);

function countLines(content: string): number {
  if (!content) return 0;
  return content.split('\n').length;
}

function hashContent(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

function scanDirectory(
  workspaceDir: string,
  absoluteDir: string,
  files: GeneratedFileInventoryEntry[],
  directories: Set<string>,
): void {
  if (!existsSync(absoluteDir)) return;

  let entries: string[];
  try {
    entries = readdirSync(absoluteDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const absolutePath = join(absoluteDir, entry);
    let stat;
    try {
      stat = statSync(absolutePath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry)) continue;
      const relDir = relative(workspaceDir, absolutePath).replace(/\\/g, '/');
      if (relDir && relDir !== '.') directories.add(relDir);
      scanDirectory(workspaceDir, absolutePath, files, directories);
      continue;
    }

    if (!stat.isFile()) continue;

    const relPath = relative(workspaceDir, absolutePath).replace(/\\/g, '/');
    const extension = extname(relPath).toLowerCase();
    let lines = 0;
    let hash = createHash('sha256').update(`${relPath}:${stat.size}`).digest('hex');

    if (TEXT_EXTENSIONS.has(extension) && stat.size <= 2_000_000) {
      try {
        const content = readFileSync(absolutePath, 'utf8');
        lines = countLines(content);
        hash = hashContent(content);
      } catch {
        try {
          const buffer = readFileSync(absolutePath);
          hash = hashContent(buffer);
        } catch {
          /* keep size-based hash */
        }
      }
    } else if (stat.size <= 5_000_000) {
      try {
        hash = hashContent(readFileSync(absolutePath));
      } catch {
        /* keep size-based hash */
      }
    }

    files.push({
      path: relPath,
      size: stat.size,
      extension,
      lines,
      category: classifyGeneratedFile(relPath),
      hash,
    });
  }
}

export function discoverWorkspaceFiles(workspaceDir: string): WorkspaceDiscoveryResult {
  const files: GeneratedFileInventoryEntry[] = [];
  const directories = new Set<string>();

  if (existsSync(workspaceDir)) {
    scanDirectory(workspaceDir, workspaceDir, files, directories);
  }

  files.sort((a, b) => a.path.localeCompare(b.path));

  const workspaceSizeBytes = files.reduce((sum, file) => sum + file.size, 0);
  const totalLinesGenerated = files.reduce((sum, file) => sum + file.lines, 0);
  const largestFile =
    files.length > 0 ? files.reduce((max, file) => (file.size > max.size ? file : max), files[0]!) : null;
  const smallestFile =
    files.length > 0 ? files.reduce((min, file) => (file.size < min.size ? file : min), files[0]!) : null;
  const averageFileSizeBytes = files.length > 0 ? Math.round(workspaceSizeBytes / files.length) : 0;

  const components = files.filter((f) => f.category === 'Component').length;
  const pages = files.filter((f) => f.category === 'Page').length;
  const features = files.filter((f) => f.category === 'Feature').length;
  const routes = files.filter((f) => f.category === 'Route').length;
  const services = files.filter((f) => f.category === 'Service').length;
  const models = files.filter((f) => f.category === 'Model').length;
  const assets = files.filter((f) => f.category === 'Asset').length;
  const styles = files.filter((f) => f.category === 'Style').length;
  const tests = files.filter((f) => f.category === 'Test').length;

  return {
    readOnly: true,
    files,
    directories: [...directories].sort(),
    workspaceSizeBytes,
    largestFile,
    smallestFile,
    averageFileSizeBytes,
    totalLinesGenerated,
    generatedComponentsCount: components,
    generatedPagesCount: pages,
    generatedFeatureModulesCount: features,
    generatedRoutesCount: routes,
    generatedServicesCount: services,
    generatedModelsCount: models,
    generatedAssetsCount: assets,
    generatedStylesCount: styles,
    generatedTestsCount: tests,
    generatedFilesCount: files.length,
    generatedDirectoriesCount: directories.size,
  };
}

export function countWorkspaceFilesOnDisk(workspaceDir: string): number {
  return discoverWorkspaceFiles(workspaceDir).generatedFilesCount;
}

export function countWorkspaceDirectoriesOnDisk(workspaceDir: string): number {
  return discoverWorkspaceFiles(workspaceDir).generatedDirectoriesCount;
}
