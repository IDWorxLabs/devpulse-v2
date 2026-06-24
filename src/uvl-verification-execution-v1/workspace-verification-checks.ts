/**
 * UVL Verification Execution V1 — workspace validation checks against live preview evidence.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join } from 'node:path';
import { VERIFICATION_PROBE_TIMEOUT_MS } from './uvl-verification-execution-v1-bounds.js';

export interface WorkspaceValidationResults {
  buildSuccess: boolean;
  previewLoads: boolean;
  navigationWorks: boolean;
  coreFeatureWorks: boolean;
  blueprintValidationPasses: boolean;
  featureRealityPasses: boolean;
  engineeringRealityPasses: boolean;
  previewBody: string;
  missingEvidence: string[];
}

function probePreviewUrl(previewUrl: string): Promise<{ ok: boolean; body: string; statusCode: number }> {
  return new Promise((resolve) => {
    const req = httpGet(previewUrl, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const statusCode = res.statusCode ?? 0;
        resolve({
          ok: statusCode >= 200 && statusCode < 300 && body.length > 50,
          body,
          statusCode,
        });
      });
    });
    req.on('error', () => resolve({ ok: false, body: '', statusCode: 0 }));
    req.setTimeout(VERIFICATION_PROBE_TIMEOUT_MS, () => {
      req.destroy();
      resolve({ ok: false, body: '', statusCode: 0 });
    });
  });
}

function readSourceBundle(workspaceDir: string): string {
  const parts: string[] = [];
  const srcDir = join(workspaceDir, 'src');
  if (!existsSync(srcDir)) return '';
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, name.name);
      if (name.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?|html)$/i.test(name.name)) {
        try {
          parts.push(readFileSync(full, 'utf8'));
        } catch {
          // skip unreadable
        }
      }
    }
  };
  walk(srcDir);
  return parts.join('\n');
}

export async function runWorkspaceVerificationChecks(input: {
  workspaceDir: string;
  previewUrl: string;
}): Promise<WorkspaceValidationResults> {
  const missingEvidence: string[] = [];
  const distIndex = join(input.workspaceDir, 'dist', 'index.html');
  const buildSuccess = existsSync(distIndex);

  if (!buildSuccess) missingEvidence.push('Application build output');

  const probe = await probePreviewUrl(input.previewUrl);
  const previewLoads = buildSuccess && probe.ok;
  if (!previewLoads) missingEvidence.push('Preview load');

  const html = buildSuccess ? readFileSync(distIndex, 'utf8') : '';
  const source = readSourceBundle(input.workspaceDir);
  const combined = `${html}\n${source}\n${probe.body}`;

  const navigationWorks =
    previewLoads &&
    (/nav|sidebar|route|AppShell|menu/i.test(combined) ||
      /<nav|role=["']navigation["']/i.test(combined));

  const coreFeatureWorks =
    previewLoads &&
    (/feature|task|crm|inventory|project|student|entity|customer|order|course/i.test(combined) ||
      /data-testid=/i.test(combined));

  const blueprintValidationPasses =
    buildSuccess &&
    (/AppShell|UniversalApp|blueprint|onboarding|auth/i.test(combined) ||
      (existsSync(join(input.workspaceDir, 'src', 'App.tsx')) &&
        existsSync(join(input.workspaceDir, 'package.json'))));

  const assetsDir = join(input.workspaceDir, 'dist', 'assets');
  const hasBundledAssets =
    existsSync(assetsDir) && readdirSync(assetsDir).some((n) => n.endsWith('.js'));

  const featureRealityPasses =
    previewLoads &&
    navigationWorks &&
    coreFeatureWorks &&
    (/create|edit|delete|search|add|filter/i.test(combined) || /data-testid=/i.test(combined));

  const pkgPath = join(input.workspaceDir, 'package.json');
  const pkgOk = existsSync(pkgPath);
  let hasBuildScript = false;
  if (pkgOk) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
      hasBuildScript = Boolean(pkg.scripts?.build);
    } catch {
      hasBuildScript = false;
    }
  }

  const engineeringRealityPasses =
    buildSuccess &&
    pkgOk &&
    hasBuildScript &&
    hasBundledAssets &&
    probe.ok;

  if (!navigationWorks) missingEvidence.push('Navigation');
  if (!coreFeatureWorks) missingEvidence.push('Core feature');
  if (!blueprintValidationPasses) missingEvidence.push('Blueprint validation');
  if (!featureRealityPasses) missingEvidence.push('Feature reality');
  if (!engineeringRealityPasses) missingEvidence.push('Engineering reality');

  return {
    buildSuccess,
    previewLoads,
    navigationWorks,
    coreFeatureWorks,
    blueprintValidationPasses,
    featureRealityPasses,
    engineeringRealityPasses,
    previewBody: probe.body.slice(0, 500),
    missingEvidence,
  };
}
