/**
 * Project answer composer — single compositional output from ReasoningResult.
 */

import { getCurrentProjectProfile } from './project-profile-store.js';
import type { ProjectBroadIntent, ReasoningResult } from './project-knowledge-model.js';

function section(title: string, lines: string[]): string[] {
  if (lines.length === 0) return [];
  return [title, ...lines, ''];
}

export function composeProjectAnswer(result: ReasoningResult): string {
  const profile = getCurrentProjectProfile();
  const summary = result.conclusions[0] ?? `${profile.name} project understanding response.`;

  const supporting =
    result.supportingEvidence.length > 0
      ? result.supportingEvidence.slice(0, 8).map((e) => `• ${e}`)
      : ['• No additional supporting facts selected.'];

  const warnings =
    result.warnings.length > 0
      ? result.warnings.map((w) => `• ${w}`)
      : [];

  const systems = result.relatedSystems.map((s) => `• ${s}`);

  const intentLabel = result.intent.replace(/_/g, ' ');

  const blocks: string[] = [
    `Project: ${profile.name}`,
    `Understanding Intent: ${intentLabel}`,
    `Confidence: ${result.confidence}`,
    '',
    'Summary:',
    summary,
    '',
  ];

  if (result.conclusions.length > 1) {
    blocks.push('Conclusions:');
    for (const c of result.conclusions.slice(1)) {
      blocks.push(`• ${c}`);
    }
    blocks.push('');
  }

  blocks.push(...section('Supporting Facts:', supporting));

  if (result.intent === 'PLANNING') {
    blocks.push('Next Recommended Step:');
    blocks.push(result.recommendedNextStep);
    blocks.push('');
  } else if (result.intent === 'GENERAL_PROJECT' || result.intent === 'UNKNOWN') {
    blocks.push('Recommended Next Step:');
    blocks.push(result.recommendedNextStep);
    blocks.push('');
  }

  if (warnings.length > 0 && (result.intent === 'RISKS' || result.intent === 'STATUS' || result.intent === 'PLANNING')) {
    blocks.push(...section('Warnings:', warnings));
  }

  if (result.intent === 'DEPENDENCIES' || result.intent === 'GENERAL_PROJECT') {
    blocks.push(...section('Related Systems:', systems));
  }

  if (result.intent === 'STATUS') {
    const gaps = result.selectedFacts.filter((f) => f.category === 'gap');
    if (gaps.length > 0) {
      blocks.push('Missing Capabilities:');
      for (const g of gaps.slice(0, 10)) {
        blocks.push(`• ${g.title}`);
      }
      blocks.push(`Gap Count: ${gaps.length}`);
      blocks.push('');
    }
  }

  if (result.intent === 'RISKS') {
    const risks = result.selectedFacts.filter((f) => f.category === 'risk');
    const blocked = result.selectedFacts.filter((f) => f.category === 'blocked');
    if (risks.length > 0) {
      blocks.push('Project Risks:');
      for (const r of risks) {
        blocks.push(`• ${r.statement}`);
      }
      blocks.push(`Risk Count: ${risks.length}`);
      blocks.push('');
    }
    if (blocked.length > 0) {
      blocks.push('Blocked Items:');
      for (const b of blocked) {
        blocks.push(`• ${b.statement}`);
      }
      blocks.push(`Blocked Count: ${blocked.length}`);
      blocks.push('');
    }
  }

  if (result.intent === 'PROGRESS') {
    const milestones = result.selectedFacts.filter((f) => f.category === 'milestone');
    if (milestones.length > 0) {
      blocks.push('Completed Milestones (sample):');
      for (const m of milestones.slice(0, 8)) {
        blocks.push(`• ${m.title}`);
      }
      blocks.push(`Completed Count: ${milestones.length}`);
      blocks.push('');
    }
  }

  if (result.intent === 'IDENTITY') {
    blocks.push('Summary Detail:');
    blocks.push(profile.summary);
    blocks.push('');
    blocks.push(`Current Phase: ${profile.currentPhase}`);
    blocks.push(`Goal: ${profile.goal}`);
    blocks.push('');
  }

  blocks.push('Project knowledge reasoning only — no execution, file modification, or persistence.');

  return blocks.join('\n');
}

export function composeLegacyCompatibleMarkers(result: ReasoningResult, text: string): string {
  const profile = getCurrentProjectProfile();
  let output = text;

  if (result.intent === 'STATUS' && !output.includes('Missing Capabilities')) {
    output += `\n\nMissing Capabilities:\n${profile.missingCapabilities.map((m) => `• ${m}`).join('\n')}\n\nGap Count: ${profile.missingCapabilities.length}`;
  }
  if (result.intent === 'RISKS' && !output.includes('Blocked Items') && result.warnings.some((w) => w.includes('blocked') || w.includes('Execution'))) {
    output += `\n\nBlocked Items:\n${profile.blockedItems.map((b) => `• ${b}`).join('\n')}`;
  }

  return output;
}

export function answerFromReasoning(result: ReasoningResult): string {
  return composeLegacyCompatibleMarkers(result, composeProjectAnswer(result));
}
