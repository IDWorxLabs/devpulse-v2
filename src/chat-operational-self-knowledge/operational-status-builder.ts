/**
 * Operational Status Builder — shared execution truth formatting (Phase 26.84).
 */

import type { OperationalTruthContext } from './chat-operational-self-knowledge-types.js';

function bullet(items: string[]): string {
  return items.map((item) => `• ${item}`).join('\n');
}

export function buildExecutionTruthSummaryLines(context: OperationalTruthContext): string[] {
  const truth = context.executionChainTruth;
  return [
    `Requirements proven: ${truth.requirementsProven ? 'yes' : 'no'}`,
    `Plan proven: ${truth.planProven ? 'yes' : 'no'}`,
    `Build proven: ${truth.buildProven ? 'yes' : 'no'}`,
    `Runtime proven: ${truth.runtimeProven ? 'yes' : 'no'}`,
    `Preview proven: ${truth.previewProven ? 'yes' : 'no'}`,
    `Verification proven: ${truth.verificationProven ? 'yes' : 'no'}`,
    `Launch proven: ${truth.launchProven ? 'yes' : 'no'}`,
    `Chain connected: ${truth.chainConnected ? 'yes' : 'no'}`,
    `First broken stage: ${truth.firstBrokenStage ?? 'none'}`,
  ];
}

export function buildExecutionTruthSummary(context: OperationalTruthContext): string {
  return bullet(buildExecutionTruthSummaryLines(context));
}

export function buildExecutionStageInventoryAnswer(context: OperationalTruthContext): string {
  return [
    'Execution stages from synchronized ConnectedExecutionChainTruth:',
    '',
    ...context.stageInventory.map(
      (stage) => `• ${stage.label}: ${stage.status} (source: ${stage.source})`,
    ),
    '',
    `First broken stage: ${context.firstBrokenStage ?? 'none'}.`,
    `Chain connected: ${context.chainConnected ? 'yes' : 'no'}.`,
    '',
    `Truth source: ${context.executionTruthSource}.`,
    `Generated: ${context.executionTruthGeneratedAt}.`,
  ].join('\n');
}

export function buildTruthSourceAnswer(context: OperationalTruthContext): string {
  return [
    'Current execution truth source for operational answers:',
    '',
    bullet([
      `Primary execution truth source: ${context.executionTruthSource}`,
      `Operational truth context version: ${context.version}`,
      `Execution truth generated: ${context.executionTruthGeneratedAt}`,
      `Snapshot generated: ${context.generatedAt}`,
      `Repository typecheck source: ${context.repositoryTypecheckReality.source}`,
      context.founderTestReality.available
        ? `Founder Test source: ${context.founderTestReality.source} (${context.founderTestReality.verdict})`
        : 'Founder Test: not recorded in this session',
      context.productReadinessReality.available
        ? `Product readiness source: ${context.productReadinessReality.source} (${context.productReadinessReality.verdict})`
        : 'Product readiness: not recorded in this session',
      `Chat intelligence source: ${context.chatIntelligenceReality.source}`,
    ]),
    '',
    'All execution-stage, capability inventory, launch, and first-broken-stage answers use this same synchronized context.',
    '',
    buildExecutionTruthSummary(context),
  ].join('\n');
}

export function buildEvidenceBasisAnswer(context: OperationalTruthContext): string {
  return [
    'I know this from synchronized DevPulse proof authorities — not from chat confidence alone.',
    '',
    buildTruthSourceAnswer(context),
  ].join('\n');
}

export function buildRuntimeCapabilityAnswer(context: OperationalTruthContext): string {
  const proven = context.executionChainTruth.runtimeProven;
  return [
    proven
      ? 'Yes — synchronized execution chain truth reports runtime execution as PROVEN.'
      : 'Not yet — synchronized execution chain truth does not report runtime execution as PROVEN.',
    `Runtime proven: ${proven}.`,
    '',
    `Truth source: ${context.executionTruthSource}.`,
  ].join('\n');
}

export function buildPreviewCapabilityAnswer(context: OperationalTruthContext): string {
  const proven = context.executionChainTruth.previewProven;
  return [
    proven
      ? 'Yes — synchronized execution chain truth reports preview execution as PROVEN.'
      : 'Not yet — synchronized execution chain truth does not report preview execution as PROVEN.',
    `Preview proven: ${proven}.`,
    '',
    `Truth source: ${context.executionTruthSource}.`,
  ].join('\n');
}

export function buildFirstBrokenStageAnswer(context: OperationalTruthContext): string {
  if (!context.firstBrokenStage) {
    return context.chainConnected
      ? 'No broken stage recorded — connected execution chain truth reports chain connected. Verify with Founder Test before launch claims.'
      : 'Execution chain is not fully connected, but no single first-broken stage was recorded. Run Founder Test for the authoritative chain report.';
  }
  return [
    `First broken execution stage: ${context.firstBrokenStage}.`,
    `Chain connected: ${context.chainConnected ? 'yes' : 'no'}.`,
    '',
    'Downstream stages after this break should be treated as unproven until connected evidence passes.',
    '',
    `Evidence source: ${context.executionTruthSource}.`,
  ].join('\n');
}
