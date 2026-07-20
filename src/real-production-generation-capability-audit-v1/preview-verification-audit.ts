/**
 * Real Production Generation Capability Audit V1 — preview verification quality (read-only).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PreviewVerificationFinding } from './real-production-generation-capability-types.js';

export function buildPreviewVerificationQualityAudit(repoRoot: string): PreviewVerificationFinding[] {
  const playwright = readFileSafe(repoRoot, 'src/live-preview-interaction-proof-v1/live-preview-interaction-proof-engine.ts');
  const aseInteraction = readFileSafe(repoRoot, 'src/interaction-proof-engine/interaction-proof-engine.ts');
  const featureInteraction = readFileSafe(repoRoot, 'src/feature-contract-reality/feature-interaction-reality-checker.ts');
  const livePreviewGate = readFileSafe(repoRoot, 'src/live-preview-gate/live-preview-gate-evaluator.ts');

  return [
    {
      layer: 'live-preview-interaction-proof-v1 (Playwright, post-handler)',
      depth: playwright.includes('stateChanged') ? 'BEHAVIORAL' : 'STRUCTURAL_ONLY',
      verifies: [
        'Page load via previewUrl',
        'Root UI presence',
        'Primary feature text visibility',
        'Console errors',
        'Generic click/fill/toggle on first controls',
        'Body text or control value change after interaction',
      ],
      doesNotVerify: [
        'Per-module approved workflow steps',
        'Contract coreActions individually',
        'Persistence after mutation',
        'Multi-step forms',
        'Navigation to every approved module',
      ],
      severity: 'MEDIUM',
    },
    {
      layer: 'interaction-proof-engine (ASE pipeline artifact)',
      depth: 'SYNTHETIC',
      verifies: [
        'Pipeline readiness flags',
        'Discovered interaction surfaces from prompt intelligence',
        'Simulated handler binding records from upstream artifacts',
      ],
      doesNotVerify: [
        'Live browser DOM',
        'Real state mutation',
        'Approved envelope modules individually',
      ],
      severity: 'HIGH',
    },
    {
      layer: 'feature-contract-reality (static workspace audit)',
      depth: 'STRUCTURAL_ONLY',
      verifies: [
        'Feature files on disk',
        'Registry and route string presence',
        'data-interaction-control marker in source',
        'Render markers in component source',
      ],
      doesNotVerify: [
        'Handler execution',
        'Service persistence',
        'Preview render of each module',
      ],
      severity: 'MEDIUM',
    },
    {
      layer: 'live-preview-gate (orchestrator)',
      depth: livePreviewGate.includes('INTERACTION_PROOF') ? 'SYNTHETIC' : 'STRUCTURAL_ONLY',
      verifies: [
        '12 evidence collections including ASE interaction proof',
        'Build/npm/preview readiness bundle',
      ],
      doesNotVerify: [
        'Playwright behavioral proof (runs later in handler)',
        'Per-feature functional completeness',
      ],
      severity: 'HIGH',
    },
    {
      layer: 'This audit script (offline materialization)',
      depth: 'NOT_RUN',
      verifies: ['In-memory materialization vs envelope module plan'],
      doesNotVerify: ['npm build', 'dev server', 'Playwright', 'runtime persistence'],
      severity: 'INFORMATIONAL',
    },
  ];
}

function readFileSafe(repoRoot: string, rel: string): string {
  try {
    return readFileSync(join(repoRoot, rel), 'utf8');
  } catch {
    return '';
  }
}
