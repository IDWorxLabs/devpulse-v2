/**
 * Universal Production Proof V1 — matrix formatting.
 */

import type {
  UniversalProductionProofMatrixRow,
  UniversalProductionProofStageStatus,
  UniversalProductionProofProfileVerdict,
} from './universal-production-proof-types.js';

export function buildUniversalProductionProofMatrixRow(input: {
  profile: string;
  classify: UniversalProductionProofStageStatus;
  generate: UniversalProductionProofStageStatus;
  modular: UniversalProductionProofStageStatus;
  build: UniversalProductionProofStageStatus;
  preview: UniversalProductionProofStageStatus;
  blueprint: UniversalProductionProofStageStatus;
  prodVal: UniversalProductionProofStageStatus;
  history: UniversalProductionProofStageStatus;
  persist: UniversalProductionProofStageStatus;
  score: number;
  featureReality: UniversalProductionProofStageStatus;
  workspaceAudit: UniversalProductionProofStageStatus;
  exportReady: UniversalProductionProofStageStatus;
  chat: UniversalProductionProofStageStatus;
  trace: UniversalProductionProofStageStatus;
  verdict: UniversalProductionProofProfileVerdict;
}): UniversalProductionProofMatrixRow {
  return {
    readOnly: true,
    profile: input.profile,
    classify: input.classify,
    generate: input.generate,
    modular: input.modular,
    build: input.build,
    preview: input.preview,
    blueprint: input.blueprint,
    prodVal: input.prodVal,
    history: input.history,
    persist: input.persist,
    score: `${input.score}%`,
    featureReality: input.featureReality,
    workspaceAudit: input.workspaceAudit,
    exportReady: input.exportReady,
    chat: input.chat,
    trace: input.trace,
    verdict: input.verdict,
  };
}

export function formatUniversalProductionProofMatrix(rows: UniversalProductionProofMatrixRow[]): string {
  const header = [
    'Profile'.padEnd(30),
    'Classify',
    'Generate',
    'Modular',
    'Build',
    'Preview',
    'Blueprint',
    'ProdVal',
    'History',
    'Persist',
    'Score',
    'FeatureReality',
    'WorkspaceAudit',
    'Export',
    'Chat',
    'Trace',
    'Verdict',
  ].join(' ');

  const lines = rows.map((row) =>
    [
      row.profile.padEnd(30),
      row.classify.padEnd(8),
      row.generate.padEnd(8),
      row.modular.padEnd(7),
      row.build.padEnd(5),
      row.preview.padEnd(7),
      row.blueprint.padEnd(9),
      row.prodVal.padEnd(7),
      row.history.padEnd(7),
      row.persist.padEnd(7),
      row.score.padEnd(5),
      row.featureReality.padEnd(14),
      row.workspaceAudit.padEnd(14),
      row.exportReady.padEnd(6),
      row.chat.padEnd(4),
      row.trace.padEnd(5),
      row.verdict,
    ].join(' '),
  );

  return [header, ...lines].join('\n');
}
