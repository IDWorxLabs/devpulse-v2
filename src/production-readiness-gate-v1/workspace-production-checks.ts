/**
 * Production Readiness Gate V1 — workspace production checks.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface WorkspaceProductionSignals {
  readOnly: true;
  hasBuildOutput: boolean;
  hasBuildScript: boolean;
  hasStartScript: boolean;
  hasEnvExample: boolean;
  usesProcessEnv: boolean;
  hasHardcodedSecrets: boolean;
  hasAuthPatterns: boolean;
  hasErrorBoundary: boolean;
  hasLogging: boolean;
  hasHealthIndicator: boolean;
  hasReadme: boolean;
  hasLocalStorage: boolean;
  hasModularStructure: boolean;
  sourceFileCount: number;
}

const SECRET_PATTERNS = [
  /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
  /password\s*=\s*['"][^'"]+['"]/i,
  /secret\s*=\s*['"][^'"]+['"]/i,
  /sk_live_[a-zA-Z0-9]+/,
  /AKIA[0-9A-Z]{16}/,
];

function readSourceBundle(workspaceDir: string): { combined: string; fileCount: number } {
  const parts: string[] = [];
  let fileCount = 0;
  const srcDir = join(workspaceDir, 'src');
  if (!existsSync(srcDir)) return { combined: '', fileCount: 0 };

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?|html|json|md)$/i.test(entry.name)) {
        fileCount += 1;
        try {
          parts.push(readFileSync(full, 'utf8'));
        } catch {
          // skip
        }
      }
    }
  };
  walk(srcDir);
  return { combined: parts.join('\n'), fileCount };
}

export function analyzeWorkspaceProductionSignals(workspaceDir: string): WorkspaceProductionSignals {
  const distIndex = join(workspaceDir, 'dist', 'index.html');
  const pkgPath = join(workspaceDir, 'package.json');
  const envExample = join(workspaceDir, '.env.example');
  const readme = join(workspaceDir, 'README.md');

  let hasBuildScript = false;
  let hasStartScript = false;
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
      hasBuildScript = Boolean(pkg.scripts?.build);
      hasStartScript = Boolean(pkg.scripts?.start || pkg.scripts?.preview);
    } catch {
      // ignore
    }
  }

  const { combined, fileCount } = readSourceBundle(workspaceDir);
  const hasHardcodedSecrets = SECRET_PATTERNS.some((pattern) => pattern.test(combined));

  return {
    readOnly: true,
    hasBuildOutput: existsSync(distIndex),
    hasBuildScript,
    hasStartScript,
    hasEnvExample: existsSync(envExample),
    usesProcessEnv: /process\.env|import\.meta\.env/i.test(combined),
    hasHardcodedSecrets,
    hasAuthPatterns: /auth|login|signin|session|jwt|protected/i.test(combined),
    hasErrorBoundary: /ErrorBoundary|componentDidCatch|error boundary/i.test(combined),
    hasLogging: /console\.(log|error|warn)|logger|winston|pino/i.test(combined),
    hasHealthIndicator: /health|ready|alive|status/i.test(combined),
    hasReadme: existsSync(readme),
    hasLocalStorage: /localStorage|sessionStorage/i.test(combined),
    hasModularStructure: fileCount >= 3 && /components|pages|routes|hooks/i.test(combined),
    sourceFileCount: fileCount,
  };
}
