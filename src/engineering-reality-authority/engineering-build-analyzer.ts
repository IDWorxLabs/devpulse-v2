/**
 * Engineering Reality Authority V1 — build output analysis.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { runNpmCommandSync } from '../one-prompt-live-preview/child-process-teardown.js';
import { SECRET_PATTERNS } from './engineering-reality-registry.js';
import type { EngineeringBuildAnalysis, EngineeringRealityCheck } from './engineering-reality-types.js';

function record(
  checks: EngineeringRealityCheck[],
  input: Omit<EngineeringRealityCheck, 'passed'> & { passed: boolean },
): void {
  checks.push({ ...input, passed: input.passed });
}

function collectOutputBytes(workspaceDir: string): number {
  const distDir = join(workspaceDir, 'dist');
  if (!existsSync(distDir)) return 0;
  let total = 0;
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else total += statSync(fullPath).size;
    }
  };
  walk(distDir);
  return total;
}

function scanArtifactsForSecrets(workspaceDir: string): string[] {
  const findings: string[] = [];
  const targets = ['package.json', 'index.html', 'src/App.tsx'];
  for (const relativePath of targets) {
    const fullPath = join(workspaceDir, relativePath);
    if (!existsSync(fullPath)) continue;
    const source = readFileSync(fullPath, 'utf8');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(source)) {
        findings.push(`Potential secret pattern in ${relativePath}`);
      }
    }
  }
  return findings;
}

export function analyzeEngineeringBuild(input: {
  workspaceDir: string;
  checks: EngineeringRealityCheck[];
}): EngineeringBuildAnalysis {
  const build = runNpmCommandSync({
    cwd: input.workspaceDir,
    args: ['run', 'build'],
    timeoutMs: 180_000,
  });

  const outputBytes = collectOutputBytes(input.workspaceDir);
  const warnings: string[] = [];
  if (build.stderr) {
    for (const line of build.stderr.split('\n')) {
      if (/warn|chunk|large|kB/i.test(line)) warnings.push(line.trim());
    }
  }

  const artifactSecrets = scanArtifactsForSecrets(input.workspaceDir);
  record(input.checks, {
    id: 'build-succeeds',
    category: 'build',
    label: 'Production build completes successfully',
    passed: build.status === 0,
    detail: build.status === 0 ? 'npm run build exit 0' : `Build failed with exit ${build.status}`,
    critical: true,
  });

  record(input.checks, {
    id: 'build-output-present',
    category: 'build',
    label: 'Build output artifacts generated',
    passed: outputBytes > 0,
    detail: outputBytes > 0 ? `${outputBytes} bytes in dist/` : 'dist/ missing or empty',
    critical: true,
  });

  record(input.checks, {
    id: 'build-bundle-size-reasonable',
    category: 'performance',
    label: 'Bundle output size within reasonable bounds',
    passed: outputBytes === 0 || outputBytes <= 2_000_000,
    detail:
      outputBytes <= 2_000_000
        ? `${outputBytes} bytes total build output`
        : `Build output ${outputBytes} bytes exceeds 2MB threshold`,
    critical: false,
  });

  record(input.checks, {
    id: 'artifact-secrets-not-exposed',
    category: 'security',
    label: 'Generated artifacts do not expose obvious secrets',
    passed: artifactSecrets.length === 0,
    detail:
      artifactSecrets.length === 0
        ? 'No secret patterns in key generated artifacts'
        : artifactSecrets.join('; '),
    critical: true,
  });

  if (warnings.length > 0) {
    record(input.checks, {
      id: 'build-warnings-budget',
      category: 'performance',
      label: 'Build warnings within acceptable budget',
      passed: warnings.length <= 5,
      detail: `${warnings.length} build warnings`,
      critical: false,
    });
  }

  return {
    passed: build.status === 0 && outputBytes > 0 && artifactSecrets.length === 0,
    exitCode: build.status ?? 1,
    outputBytes,
    warnings: warnings.slice(0, 8),
    detail:
      build.status === 0
        ? `Build succeeded (${outputBytes} bytes)`
        : `Build failed (exit ${build.status ?? 1})`,
  };
}
