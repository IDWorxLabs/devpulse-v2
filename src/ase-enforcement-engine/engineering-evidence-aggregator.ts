/**
 * ASE Enforcement — evidence aggregation from upstream engineering sources.
 */

import type { AutonomousSoftwareEngineeringPipelineResult } from '../autonomous-software-engineering-engine/ase-types.js';
import type { EngineeringEvidenceBundle } from './ase-enforcement-engine-types.js';

const EVIDENCE_SOURCES = [
  'Intent Understanding',
  'Prompt Faithfulness',
  'Capability Planning',
  'Incremental Builder',
  'Behavior Simulation',
  'Virtual User',
  'Virtual Device',
  'Interaction Proof',
  'Autonomous Debugging',
  'Missing Capability Evolution',
  'Continuous Product Improvement',
  'Launch Readiness',
  'Founder Test',
  'UVL',
  'Workspace Reality',
  'Execution Trace',
  'Materialization',
  'Feature Contract Reality',
] as const;

export function aggregateEngineeringEvidence(
  pipeline: AutonomousSoftwareEngineeringPipelineResult,
): EngineeringEvidenceBundle {
  const launchVerdict = pipeline.launchReadiness.verdict.verdict;
  const readyForLaunch =
    launchVerdict === 'LAUNCH_READY' ||
    pipeline.readyForPreview ||
    pipeline.overallStatus === 'PREVIEW_UNLOCKED' ||
    pipeline.overallStatus === 'LAUNCH_READY';

  return {
    readOnly: true,
    sources: [...EVIDENCE_SOURCES],
    blockers: [...pipeline.blockers],
    warnings: [...pipeline.warnings],
    confidence: pipeline.statusCard.overallProgress / 100,
    readyForGeneration: pipeline.artifacts.promptFaithfulness.readyForGeneration,
    readyForMaterialization: pipeline.readyForMaterialization,
    readyForLaunch,
    humanReviewRequired: pipeline.overallStatus === 'HUMAN_REVIEW_REQUIRED',
  };
}
