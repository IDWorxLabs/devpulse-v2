/**

 * Build Materialization Truth Bridge — report builder (Phase 26.75).

 */



import {

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_PHASE,

  BUILD_MATERIALIZATION_TRUTH_BRIDGE_REPORT_TITLE,

  BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT_TITLE,

  EVIDENCE_PRIORITY_ORDER,

  FOUNDER_BUILD_TRUTH_QUESTIONS,

  INTEGRATION_TARGET_AUTHORITIES,

  ORCHESTRATION_FLOW,

  RECONCILIATION_RULES,

  SAFETY_GUARANTEES,

} from './build-materialization-truth-bridge-registry.js';

import type { BuildMaterializationTruthBridgeReport } from './build-materialization-truth-bridge-types.js';



export function buildBuildMaterializationTruthBridgeReportMarkdown(

  report: BuildMaterializationTruthBridgeReport,

): string {

  const { evidence, reconciliation } = report;

  const snap = evidence.snapshot;



  const lines: string[] = [

    `# ${BUILD_MATERIALIZATION_TRUTH_BRIDGE_REPORT_TITLE}`,

    '',

    `**Bridge:** ${report.bridgeId}`,

    `**Generated:** ${report.generatedAt}`,

    `**Final BUILD truth:** ${report.finalBuildTruth}`,

    '',

    '## Core question',

    '',

    BUILD_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,

    '',

    '## Phase',

    '',

    BUILD_MATERIALIZATION_TRUTH_BRIDGE_PHASE,

    '',

    '## Safety guarantees',

    '',

    ...SAFETY_GUARANTEES.map((g) => `- ${g}`),

    '',

    '## Orchestration flow',

    '',

    ...ORCHESTRATION_FLOW.map((step, i) => `${i + 1}. ${step}`),

    '',

    '## Integration targets',

    '',

    ...INTEGRATION_TARGET_AUTHORITIES.map((a) => `- ${a}`),

    '',

    '## Filesystem evidence',

    '',

    report.filesystemEvidenceSummary,

    '',

    `- workspaceCount: **${snap.workspaceCount}**`,

    `- existingArtifacts: **${snap.existingArtifacts}**`,

    `- missingArtifacts: **${snap.missingArtifacts}**`,

    `- workspaceExists: **${snap.workspaceExists}**`,

    `- materializationVerdict: **${snap.materializationVerdict}**`,

    `- connectedBuildProofLevel: **${snap.connectedBuildProofLevel ?? 'n/a'}**`,

    '',

    '## Founder Test verdict',

    '',

    report.founderTestVerdictSummary,

    '',

    `- founderBuildProofLevel: **${snap.founderBuildProofLevel}**`,

    `- founderFirstBrokenLink: **${snap.founderFirstBrokenLink ?? 'none'}**`,

    `- preReconciliationBuildVerdict: **${reconciliation.preReconciliationBuildVerdict}**`,

    '',

    '## Truth Matrix verdict',

    '',

    report.truthMatrixVerdictSummary,

    '',

    `- truthMatrixBuildVerdict: **${snap.truthMatrixBuildVerdict ?? 'not assessed'}**`,

    `- truthMatrixVerdictUpdated: **${reconciliation.truthMatrixVerdictUpdated ? 'yes' : 'no'}**`,

    '',

    '## BUILD_MATERIALIZATION_TRUTH reconciliation',

    '',

    `Operation: **${reconciliation.operationId}**`,

    `Root cause: **${reconciliation.rootCause}**`,

    `Authoritative source: **${reconciliation.authoritativeSource}**`,

    `Founder Test reconciled: **${reconciliation.founderTestVerdictReconciled ? 'yes' : 'no'}**`,

    `Recommended fix: ${reconciliation.recommendedFix}`,

    '',

    '### Reconciliation rules applied',

    '',

    ...reconciliation.rulesApplied.map((r) => `- ${r}`),

    '',

    '### Contradictions detected',

    '',

  ];



  if (reconciliation.contradictions.length === 0) {

    lines.push('- none');

  } else {

    for (const c of reconciliation.contradictions) {

      lines.push(`- **${c.kind}**: ${c.detail}`);

      lines.push(`  - Founder claim: ${c.founderTestClaim}`);

      lines.push(`  - Disk evidence: ${c.diskEvidence}`);

      if (c.lostEvidenceAuthority) {

        lines.push(`  - Lost evidence authority: ${c.lostEvidenceAuthority}`);

      }

    }

  }



  lines.push('');

  lines.push('## Founder questions');

  lines.push('');



  const answers = reconciliation.founderAnswers;

  const qa: Array<[string, string]> = [

    [FOUNDER_BUILD_TRUTH_QUESTIONS[0]!, answers.didFilesActuallyExist ? 'YES' : 'NO'],

    [FOUNDER_BUILD_TRUTH_QUESTIONS[1]!, answers.didFounderTestMisreportMissingArtifacts ? 'YES' : 'NO'],

    [FOUNDER_BUILD_TRUTH_QUESTIONS[2]!, answers.whichAuthorityLostEvidence ?? 'none'],

    [FOUNDER_BUILD_TRUTH_QUESTIONS[3]!, answers.isBuildBroken ? 'YES' : 'NO'],

    [FOUNDER_BUILD_TRUTH_QUESTIONS[4]!, answers.isProofPropagationBroken ? 'YES' : 'NO'],

    [FOUNDER_BUILD_TRUTH_QUESTIONS[5]!, answers.recommendedFix],

  ];

  for (const [q, a] of qa) {

    lines.push(`- **${q}** → ${a}`);

  }



  lines.push('');

  lines.push('### Recommended next actions');

  lines.push('');

  for (const action of answers.recommendedNextActions) {

    lines.push(`- ${action}`);

  }



  lines.push('');

  lines.push('## Evidence priority order');

  lines.push('');

  for (const [i, priority] of EVIDENCE_PRIORITY_ORDER.entries()) {

    lines.push(`${i + 1}. ${priority}`);

  }



  return lines.join('\n');

}



export function buildBuildMaterializationTruthReconciliationReportMarkdown(

  report: BuildMaterializationTruthBridgeReport,

): string {

  const { reconciliation, evidence } = report;

  const snap = evidence.snapshot;



  return [

    `# ${BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_REPORT_TITLE}`,

    '',

    `Generated: ${report.generatedAt}`,

    '',

    '## Objective',

    '',

    'Reconcile Founder Test BUILD verdicts with filesystem evidence from Build Materialization Reality.',

    '',

    '## Reconciliation rules',

    '',

    ...RECONCILIATION_RULES.map((r) => `- ${r}`),

    '',

    '## Pre vs post reconciliation',

    '',

    `| Field | Pre | Post |`,

    `|-------|-----|------|`,

    `| BUILD truth | ${reconciliation.preReconciliationBuildVerdict} | **${reconciliation.postReconciliationBuildVerdict}** |`,

    `| Root cause | — | **${reconciliation.rootCause}** |`,

    `| Materialization verdict | — | **${reconciliation.materializationVerdict}** |`,

    '',

    '## Filesystem evidence vs Founder Test',

    '',

    '| Signal | Value |',

    '|--------|-------|',

    `| workspaceCount | ${snap.workspaceCount} |`,

    `| existingArtifacts | ${snap.existingArtifacts} |`,

    `| missingArtifacts | ${snap.missingArtifacts} |`,

    `| workspaceExists | ${snap.workspaceExists} |`,

    `| materializationVerdict | ${snap.materializationVerdict} |`,

    `| founderBuildProofLevel | ${snap.founderBuildProofLevel} |`,

    `| founderFirstBrokenLink | ${snap.founderFirstBrokenLink ?? 'none'} |`,

    `| truthMatrixBuildVerdict | ${snap.truthMatrixBuildVerdict ?? 'n/a'} |`,

    '',

    '## Contradictions',

    '',

    reconciliation.contradictions.length === 0

      ? '- None detected'

      : reconciliation.contradictions

          .map(

            (c) =>

              `- **${c.kind}**: ${c.detail}\n  - Founder: ${c.founderTestClaim}\n  - Disk: ${c.diskEvidence}`,

          )

          .join('\n'),

    '',

    '## Final BUILD truth',

    '',

    `**${report.finalBuildTruth}** (rootCause=${reconciliation.rootCause})`,

    '',

    '## Recommended fix',

    '',

    reconciliation.recommendedFix,

    '',

  ].join('\n');

}


