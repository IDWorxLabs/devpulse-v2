/**
 * Feature Contract Reality V1 — renderability checks.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { moduleIdToPascalCase } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';

export function checkFeatureRenderReality(input: {
  workspaceDir: string;
  featureId: string;
}): {
  rendered: boolean;
  componentPath: string;
  evidencePaths: string[];
  missingEvidence: string[];
} {
  const pascal = moduleIdToPascalCase(input.featureId);
  const componentPath = join(input.workspaceDir, 'src/features', input.featureId, `${pascal}Feature.tsx`);
  if (!existsSync(componentPath)) {
    return {
      rendered: false,
      componentPath: '',
      evidencePaths: [],
      missingEvidence: [`src/features/${input.featureId}/${pascal}Feature.tsx`],
    };
  }

  const source = readFileSync(componentPath, 'utf8');
  const rendered =
    source.includes('data-feature-module') &&
    source.includes(`data-feature-module="${input.featureId}"`) &&
    (source.includes('return (') || source.includes('return(')) &&
    (source.includes('<section') || source.includes('<div'));

  return {
    rendered,
    componentPath: componentPath.replace(/\\/g, '/'),
    evidencePaths: [componentPath.replace(/\\/g, '/')],
    missingEvidence: rendered ? [] : ['renderable markup markers missing'],
  };
}
