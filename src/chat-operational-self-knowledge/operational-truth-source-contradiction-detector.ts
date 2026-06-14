/**
 * Operational Truth Source Contradiction Detector — stale legacy proof vs chain truth (Phase 26.82).
 */

import { CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE } from '../founder-test-integration/connected-execution-chain-truth.js';
import type { ConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import {
  OPERATIONAL_TRUTH_SOURCE_CONTRADICTION,
  type OperationalTruthSourceContradiction,
} from './chat-operational-self-knowledge-types.js';

export { OPERATIONAL_TRUTH_SOURCE_CONTRADICTION };

const STAGE_TO_CAPABILITY: Array<{
  stage: string;
  capability: string;
  truthKey: keyof Pick<
    ConnectedExecutionChainTruth,
    'buildProven' | 'runtimeProven' | 'previewProven' | 'verificationProven' | 'launchProven'
  >;
}> = [
  { stage: 'BUILD', capability: 'build_materialization', truthKey: 'buildProven' },
  { stage: 'RUNTIME', capability: 'runtime_execution', truthKey: 'runtimeProven' },
  { stage: 'PREVIEW', capability: 'preview_execution', truthKey: 'previewProven' },
  { stage: 'VERIFY', capability: 'verification_execution', truthKey: 'verificationProven' },
  { stage: 'LAUNCH', capability: 'launch_execution', truthKey: 'launchProven' },
];

function mapProofLevel(proofLevel: string | undefined): OperationalTruthSourceContradiction['staleValue'] {
  if (proofLevel === 'PARTIAL') return 'PARTIAL';
  if (proofLevel === 'NOT_PROVEN') return 'NOT_PROVEN';
  return 'UNKNOWN';
}

export function detectOperationalTruthSourceContradictions(input: {
  executionChainTruth: ConnectedExecutionChainTruth;
  legacyStageProofLevels: Readonly<Record<string, string | undefined>>;
}): OperationalTruthSourceContradiction[] {
  const contradictions: OperationalTruthSourceContradiction[] = [];

  for (const mapping of STAGE_TO_CAPABILITY) {
    const truthProven = input.executionChainTruth[mapping.truthKey];
    if (!truthProven) continue;

    const legacyLevel = input.legacyStageProofLevels[mapping.stage];
    if (legacyLevel === 'PROVEN') continue;

    contradictions.push({
      readOnly: true,
      kind: OPERATIONAL_TRUTH_SOURCE_CONTRADICTION,
      capability: mapping.capability,
      staleSource: 'autonomous-build-execution-proof',
      truthSource: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
      staleValue: mapProofLevel(legacyLevel),
      truthValue: 'PROVEN',
    });
  }

  return contradictions;
}

export function responseContradictsExecutionTruth(input: {
  executionChainTruth: ConnectedExecutionChainTruth;
  responseText: string;
}): OperationalTruthSourceContradiction[] {
  const contradictions: OperationalTruthSourceContradiction[] = [];
  const text = input.responseText;

  const checks: Array<{
    capability: string;
    truthProven: boolean;
    patterns: RegExp[];
  }> = [
    {
      capability: 'runtime_execution',
      truthProven: input.executionChainTruth.runtimeProven,
      patterns: [
        /\bruntime execution\b.*\bNOT_PROVEN\b/i,
        /\bruntime execution\b.*\bnot proven\b/i,
        /\bno proven running application\b/i,
        /\bruntime\s*=\s*not[_\s-]?proven\b/i,
      ],
    },
    {
      capability: 'preview_execution',
      truthProven: input.executionChainTruth.previewProven,
      patterns: [
        /\bpreview execution\b.*\bNOT_PROVEN\b/i,
        /\bpreview execution\b.*\bnot proven\b/i,
        /\bdevice frame preview is not proven\b/i,
        /\bpreview\s*=\s*not[_\s-]?proven\b/i,
      ],
    },
    {
      capability: 'verification_execution',
      truthProven: input.executionChainTruth.verificationProven,
      patterns: [
        /\bverification execution\b.*\bNOT_PROVEN\b/i,
        /\bverification\s*=\s*not[_\s-]?proven\b/i,
      ],
    },
    {
      capability: 'launch_execution',
      truthProven: input.executionChainTruth.launchProven,
      patterns: [
        /\blaunch execution\b.*\bNOT_PROVEN\b/i,
        /\blaunch\s*=\s*not[_\s-]?proven\b/i,
      ],
    },
    {
      capability: 'build_materialization',
      truthProven: input.executionChainTruth.buildProven,
      patterns: [
        /\bbuild materialization\b.*\bNOT_PROVEN\b/i,
        /\bbuild\s*=\s*not[_\s-]?proven\b/i,
      ],
    },
  ];

  for (const check of checks) {
    if (!check.truthProven) continue;
    if (!check.patterns.some((pattern) => pattern.test(text))) continue;
    contradictions.push({
      readOnly: true,
      kind: OPERATIONAL_TRUTH_SOURCE_CONTRADICTION,
      capability: check.capability,
      staleSource: 'operational-response-composer',
      truthSource: CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE,
      staleValue: 'NOT_PROVEN',
      truthValue: 'PROVEN',
    });
  }

  return contradictions;
}
