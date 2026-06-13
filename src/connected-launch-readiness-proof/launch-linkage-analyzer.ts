/**
 * Launch Linkage Analyzer — verify full requirements-to-launch evidence chain.
 */

import type { AutonomousBuildExecutionProofReport, StageExecutionProof } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import type { LaunchLinkageAnalysis } from './connected-launch-readiness-proof-types.js';
import type { LaunchReadinessAssessment } from './connected-launch-readiness-proof-types.js';
import { isLaunchReadyState } from './launch-readiness-analyzer.js';

const STAGE_ORDER = [
  'REQUIREMENTS',
  'PLAN',
  'BUILD',
  'RUNTIME',
  'PREVIEW',
  'VERIFY',
  'LAUNCH',
] as const;

export function analyzeLaunchLinkage(input: {
  executionProof: AutonomousBuildExecutionProofReport | null;
  coreStageProofs?: StageExecutionProof[];
  readiness: LaunchReadinessAssessment;
  launchProofProven: boolean;
}): LaunchLinkageAnalysis {
  const stageProofs = input.executionProof?.stageProofs ?? input.coreStageProofs ?? [];
  const stageMap = new Map(stageProofs.map((s) => [s.stage, s.proofLevel === 'PROVEN']));

  const requirementsToPlan = stageMap.get('REQUIREMENTS') === true && stageMap.get('PLAN') === true;
  const planToBuild = stageMap.get('PLAN') === true && stageMap.get('BUILD') === true;
  const buildToRuntime = stageMap.get('BUILD') === true && stageMap.get('RUNTIME') === true;
  const runtimeToPreview = stageMap.get('RUNTIME') === true && stageMap.get('PREVIEW') === true;
  const previewToVerify = stageMap.get('PREVIEW') === true && stageMap.get('VERIFY') === true;
  const verifyToLaunch =
    stageMap.get('VERIFY') === true &&
    (input.launchProofProven || isLaunchReadyState(input.readiness.readinessState));

  const links = [
    { key: 'requirements→plan', ok: requirementsToPlan },
    { key: 'plan→build', ok: planToBuild },
    { key: 'build→runtime', ok: buildToRuntime },
    { key: 'runtime→preview', ok: runtimeToPreview },
    { key: 'preview→verify', ok: previewToVerify },
    { key: 'verify→launch', ok: verifyToLaunch },
  ];

  const missingLinks: string[] = [];
  let firstBrokenLaunchLink: string | null = null;
  for (const link of links) {
    if (!link.ok) {
      missingLinks.push(`Broken link: ${link.key}`);
      if (firstBrokenLaunchLink === null) firstBrokenLaunchLink = link.key;
    }
  }

  const passed = links.filter((l) => l.ok).length;
  const traceabilityScore = Math.round((passed / links.length) * 100);
  const launchLinkageConnected = links.every((l) => l.ok);

  return {
    readOnly: true,
    launchLinkageConnected,
    firstBrokenLaunchLink,
    missingLinks,
    traceabilityScore,
    requirementsToPlan,
    planToBuild,
    buildToRuntime,
    runtimeToPreview,
    previewToVerify,
    verifyToLaunch,
  };
}
