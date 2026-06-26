/**
 * Persistent Project Reality V1 — export readiness metadata.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  PersistentProjectExportMetadata,
  PersistentProjectFileIndex,
} from './persistent-project-reality-types.js';

const EXCLUDED = ['node_modules', 'dist', '.git', '.generated-app-manifest.json'];

export function buildExportMetadata(input: {
  sourceRoot: string;
  fileIndex: PersistentProjectFileIndex;
}): PersistentProjectExportMetadata {
  const failureReasons: string[] = [];
  const packageJsonPath = join(input.sourceRoot, 'package.json');
  const srcDir = join(input.sourceRoot, 'src');
  const hasPackageJson = existsSync(packageJsonPath);
  const hasSrc = existsSync(srcDir);

  if (!hasPackageJson) failureReasons.push('package.json missing in source root');
  if (!hasSrc) failureReasons.push('src/ missing in source root');

  let detectedFramework = 'unknown';
  let buildCommand = 'npm run build';
  let devCommand = 'npm run dev';
  if (hasPackageJson) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        scripts?: Record<string, string>;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      if (pkg.dependencies?.react || pkg.devDependencies?.vite) {
        detectedFramework = 'vite-react';
      }
      buildCommand = pkg.scripts?.build ? 'npm run build' : buildCommand;
      devCommand = pkg.scripts?.dev ? 'npm run dev' : devCommand;
    } catch {
      failureReasons.push('package.json parse error');
    }
  }

  const includedFiles = [
    ...input.fileIndex.sourceFiles,
    ...input.fileIndex.configFiles,
    ...input.fileIndex.publicAssets,
    ...input.fileIndex.featureModules,
    ...input.fileIndex.registryFiles,
    ...input.fileIndex.styles,
  ].map((entry) => entry.relativePath);

  const exportReady = hasPackageJson && hasSrc && failureReasons.length === 0;
  const deploymentReady = exportReady && includedFiles.some((path) => path.includes('src/features/'));

  return {
    readOnly: true,
    exportReady,
    exportableSourceRoot: input.sourceRoot.replace(/\\/g, '/'),
    includedFiles,
    excludedFiles: EXCLUDED,
    requiredCommands: ['npm install', buildCommand, devCommand],
    detectedFramework,
    packageManager: 'npm',
    buildCommand,
    devCommand,
    zipSafe: exportReady,
    deploymentReady,
    failureReasons,
  };
}
