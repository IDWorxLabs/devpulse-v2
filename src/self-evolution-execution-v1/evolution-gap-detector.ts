/**
 * Self-Evolution Execution V1 — gap detection from authoritative evidence.
 */

import { buildMissingCapabilitiesReport } from '../capability-audit-v3/missing-capabilities.js';
import { loadPipelineEvidenceBundle } from '../large-scale-pipeline-integration-v1/pipeline-evidence-loader.js';
import { isMobileRuntimeValidationProven } from '../mobile-runtime-validation-at-scale-v1/index.js';
import { isWorld2RealInstantiationProven } from '../world2-real-instantiation-v1/index.js';
import type { EvolutionGapAssessment, EvolutionGapClass, EvolutionGapEntry } from './self-evolution-execution-v1-types.js';

function classifyGap(focusArea: string, capability: string): EvolutionGapClass {
  const text = `${focusArea} ${capability}`.toLowerCase();
  if (text.includes('mobile')) return 'Mobile Gap';
  if (text.includes('verification') || text.includes('uvl')) return 'Verification Gap';
  if (text.includes('generation') || text.includes('code gen')) return 'Generation Gap';
  if (text.includes('cloud') || text.includes('runtime') || text.includes('world2')) return 'Runtime Gap';
  if (text.includes('production')) return 'Production Gap';
  if (text.includes('workflow') || text.includes('pipeline') || text.includes('scale')) return 'Workflow Gap';
  if (text.includes('architecture') || text.includes('ownership') || text.includes('canonical')) {
    return 'Architecture Gap';
  }
  if (text.includes('parallel') || text.includes('performance')) return 'Performance Gap';
  if (text.includes('self-evolution') || text.includes('self-modification')) return 'Architecture Gap';
  return 'Workflow Gap';
}

function buildEvidenceSources(projectRootDir: string): string[] {
  const sources: string[] = ['Capability Audit V3.1'];
  const bundle = loadPipelineEvidenceBundle(projectRootDir);
  for (const src of bundle.evidenceSources) {
    if (src.evidenceAvailable) sources.push(src.system);
  }
  if (isWorld2RealInstantiationProven(projectRootDir)) sources.push('World2 Real Instantiation V1');
  if (isMobileRuntimeValidationProven(projectRootDir)) sources.push('Mobile Runtime Validation at Scale V1');
  sources.push('Validation Runtime Governance V1');
  return sources;
}

export function buildEvolutionGapAssessment(projectRootDir: string): EvolutionGapAssessment {
  const generatedAt = new Date().toISOString();
  const report = buildMissingCapabilitiesReport({ projectRootDir });
  const evidenceSources = buildEvidenceSources(projectRootDir);

  const gaps: EvolutionGapEntry[] = report.entries.map((entry, index) => ({
    readOnly: true,
    gapId: `gap-${index + 1}-${entry.focusArea.toLowerCase().replace(/\s+/g, '-')}`,
    capability: entry.capability,
    focusArea: entry.focusArea,
    severity: entry.severity,
    gapClass: classifyGap(entry.focusArea, entry.capability),
    detail: entry.detail,
    evidenceSources,
  }));

  return {
    readOnly: true,
    generatedAt,
    gapsDetected: gaps.length,
    gaps,
    highestPriorityGap: report.highestPriorityGap,
  };
}
