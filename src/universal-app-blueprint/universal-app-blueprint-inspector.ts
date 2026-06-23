/**
 * AiDevEngine Universal App Blueprint v1.0 — workspace inspector.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  UNIVERSAL_APP_BLUEPRINT_CONTENT_MARKERS,
  UNIVERSAL_APP_BLUEPRINT_REQUIRED_ARTIFACTS,
} from './universal-app-blueprint-registry.js';
import {
  UNIVERSAL_APP_BLUEPRINT_VERSION,
  type UniversalBlueprintInspectionResult,
} from './universal-app-blueprint-types.js';

export function inspectUniversalAppBlueprint(workspaceDir: string): UniversalBlueprintInspectionResult {
  const missingArtifacts: string[] = [];
  const missingPatterns: string[] = [];
  let combinedSource = '';

  for (const relativePath of UNIVERSAL_APP_BLUEPRINT_REQUIRED_ARTIFACTS) {
    const absolutePath = join(workspaceDir, relativePath);
    if (!existsSync(absolutePath)) {
      missingArtifacts.push(relativePath);
      continue;
    }
    combinedSource += readFileSync(absolutePath, 'utf8') + '\n';
  }

  const appPath = join(workspaceDir, 'src/App.tsx');
  if (existsSync(appPath)) {
    combinedSource += readFileSync(appPath, 'utf8') + '\n';
  } else {
    missingArtifacts.push('src/App.tsx');
  }

  for (const marker of UNIVERSAL_APP_BLUEPRINT_CONTENT_MARKERS) {
    if (!marker.pattern.test(combinedSource)) {
      missingPatterns.push(marker.label);
    }
  }

  return {
    readOnly: true,
    passed: missingArtifacts.length === 0 && missingPatterns.length === 0,
    version: UNIVERSAL_APP_BLUEPRINT_VERSION,
    missingArtifacts,
    missingPatterns,
    checkedArtifacts: UNIVERSAL_APP_BLUEPRINT_REQUIRED_ARTIFACTS.length + 1,
  };
}

export function assertUniversalAppBlueprint(workspaceDir: string): void {
  const result = inspectUniversalAppBlueprint(workspaceDir);
  if (result.passed) return;
  const parts: string[] = [];
  if (result.missingArtifacts.length > 0) {
    parts.push(`missing artifacts: ${result.missingArtifacts.join(', ')}`);
  }
  if (result.missingPatterns.length > 0) {
    parts.push(`missing patterns: ${result.missingPatterns.join(', ')}`);
  }
  throw new Error(`Universal App Blueprint v1.0 validation failed — ${parts.join('; ')}`);
}
