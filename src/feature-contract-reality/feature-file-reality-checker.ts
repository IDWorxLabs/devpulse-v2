/**
 * Feature Contract Reality V1 — disk file reality checks.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedFeatureModuleManifestEntry } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import { moduleIdToPascalCase } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';

export function checkFeatureFileReality(input: {
  workspaceDir: string;
  featureId: string;
  manifestEntry?: GeneratedFeatureModuleManifestEntry;
}): {
  filesPresent: boolean;
  generated: boolean;
  evidencePaths: string[];
  missingEvidence: string[];
} {
  const pascal = moduleIdToPascalCase(input.featureId);
  const folder = join(input.workspaceDir, 'src/features', input.featureId);
  const required = [
    join(folder, `${pascal}Feature.tsx`),
    join(folder, `${input.featureId}.types.ts`),
    join(folder, `${input.featureId}.service.ts`),
    join(folder, `${input.featureId}.validation.ts`),
    join(folder, 'index.ts'),
  ];

  const evidencePaths = required.filter((path) => existsSync(path));
  const missing = required.filter((path) => !existsSync(path));

  return {
    filesPresent: missing.length === 0,
    generated: existsSync(folder) && evidencePaths.length > 0,
    evidencePaths: evidencePaths.map((path) => path.replace(/\\/g, '/')),
    missingEvidence: missing.map((path) => path.replace(input.workspaceDir.replace(/\\/g, '/'), '').replace(/^\//, '')),
  };
}
