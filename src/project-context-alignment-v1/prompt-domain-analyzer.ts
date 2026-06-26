/**
 * Extract domain / profile signals from prompts and project names.
 */

import { resolveBuildIntentProfile } from '../build-intent-routing/build-intent-detector.js';
import {
  filterMisplacedTaskDomainIds,
  filterTaskTrackingKeywordsFromBoilerplate,
  isLisaProjectName,
  LISA_DOMAIN_LABEL,
  promptMentionsLisaOrAccessibility,
  proposedNameShouldNotBeTaskTracker,
  resolveLisaProjectDomain,
} from '../project-context-switching/project-context-classifier-guard.js';
import type { PromptDomainSignals } from './project-context-alignment-types.js';

interface DomainTag {
  id: string;
  label: string;
  appType: string;
  proposedName: string;
  patterns: RegExp[];
}

const DOMAIN_TAGS: readonly DomainTag[] = [
  {
    id: 'qr',
    label: 'QR / barcode scanning',
    appType: 'QR code app',
    proposedName: 'SmartQR',
    patterns: [/\b(qr|qrcode|qr code|barcode|scan code|smartqr)\b/i],
  },
  {
    id: 'expense',
    label: 'expense tracking',
    appType: 'expense tracker',
    proposedName: 'ExpenseTracker',
    patterns: [/\b(expense|expenses|spending|receipt|budget|finance tracker)\b/i],
  },
  {
    id: 'task',
    label: 'task tracking',
    appType: 'task tracker',
    proposedName: 'TaskTracker',
    patterns: [/\b(task tracker|todo|to-do|checklist|add tasks|mark them complete)\b/i],
  },
  {
    id: 'crm',
    label: 'CRM / sales',
    appType: 'CRM',
    proposedName: 'CRM',
    patterns: [/\b(crm|customer relationship|sales pipeline|manage customers)\b/i],
  },
  {
    id: 'inventory',
    label: 'inventory management',
    appType: 'inventory manager',
    proposedName: 'InventoryManager',
    patterns: [/\b(inventory|stock|warehouse)\b/i],
  },
  {
    id: 'booking',
    label: 'booking / scheduling',
    appType: 'booking platform',
    proposedName: 'BookingPlatform',
    patterns: [/\b(booking|appointment|calendar|schedule|reservation)\b/i],
  },
  {
    id: 'portal',
    label: 'customer portal',
    appType: 'customer portal',
    proposedName: 'CustomerPortal',
    patterns: [/\b(customer portal|self-service portal|client portal)\b/i],
  },
  {
    id: 'accessibility',
    label: 'accessibility / assistive communication',
    appType: 'assistive communication app',
    proposedName: 'LISA',
    patterns: [
      /\b(lisa|locked[\s-]?in[\s-]?syndrome|assistive communication|eye tracking|eye movement|gaze|blink|blinks|text[\s-]?to[\s-]?speech|communication board|caregiver|calibration|health accessibility)\b/i,
    ],
  },
];

function splitProjectNameTokens(name: string): string[] {
  const spaced = name.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function matchDomainTags(text: string): DomainTag[] {
  const matches: DomainTag[] = [];
  for (const tag of DOMAIN_TAGS) {
    if (tag.patterns.some((pattern) => pattern.test(text))) {
      matches.push(tag);
    }
  }
  return matches;
}

function domainLabelFromTags(tags: DomainTag[]): string {
  if (!tags.length) return 'general application';
  return tags.map((tag) => tag.label).join(', ');
}

function proposedNameFromTags(tags: DomainTag[]): string | null {
  if (!tags.length) return null;
  return tags[0]!.proposedName;
}

export function extractPromptDomainSignals(
  prompt: string,
  options?: { activeProjectName?: string | null },
): PromptDomainSignals {
  const normalized = prompt.trim();
  const tags = matchDomainTags(normalized);
  const nameTokens = splitProjectNameTokens(normalized);
  const profile = resolveBuildIntentProfile(normalized);
  const activeProjectName = options?.activeProjectName?.trim() || null;

  let domainIds = [...new Set(tags.map((tag) => tag.id))];
  for (const token of nameTokens) {
    for (const tag of DOMAIN_TAGS) {
      if (tag.id === token || tag.patterns.some((pattern) => pattern.test(token))) {
        if (!domainIds.includes(tag.id)) domainIds.push(tag.id);
      }
    }
  }

  domainIds = filterMisplacedTaskDomainIds(domainIds, normalized, activeProjectName);
  if (promptMentionsLisaOrAccessibility(normalized) && !domainIds.includes('accessibility')) {
    domainIds.push('accessibility');
  }

  const filteredTags = DOMAIN_TAGS.filter((tag) => domainIds.includes(tag.id));
  let proposedProjectName = proposedNameFromTags(filteredTags);
  if (proposedNameShouldNotBeTaskTracker(normalized, proposedProjectName)) {
    proposedProjectName = promptMentionsLisaOrAccessibility(normalized) ? 'LISA' : null;
  }

  let keywords = [
    ...new Set([
      ...domainIds,
      ...nameTokens,
      ...(profile ? [profile.toLowerCase()] : []),
    ]),
  ];
  keywords = filterTaskTrackingKeywordsFromBoilerplate(normalized, keywords);

  const domainLabel =
    promptMentionsLisaOrAccessibility(normalized) || (activeProjectName && isLisaProjectName(activeProjectName))
      ? LISA_DOMAIN_LABEL
      : domainLabelFromTags(filteredTags);

  return {
    readOnly: true,
    domainIds,
    domainLabel,
    keywords,
    profile,
    appType:
      filteredTags[0]?.appType ??
      (promptMentionsLisaOrAccessibility(normalized) ? 'assistive communication app' : null) ??
      (profile ? profile.replace(/_/g, ' ').toLowerCase() : null),
    proposedProjectName,
  };
}

export function extractProjectNameDomainSignals(projectName: string): PromptDomainSignals {
  const normalized = projectName.trim();
  const tags = matchDomainTags(normalized);
  const nameTokens = splitProjectNameTokens(normalized);

  const domainIds = [...new Set(tags.map((tag) => tag.id))];
  for (const token of nameTokens) {
    for (const tag of DOMAIN_TAGS) {
      if (
        tag.id === token ||
        tag.proposedName.toLowerCase().includes(token) ||
        token.includes(tag.id)
      ) {
        if (!domainIds.includes(tag.id)) domainIds.push(tag.id);
      }
    }
  }

  if (/\bqr\b/i.test(normalized) && !domainIds.includes('qr')) domainIds.push('qr');
  if (/\bexpense/i.test(normalized) && !domainIds.includes('expense')) domainIds.push('expense');
  if (isLisaProjectName(normalized) && !domainIds.includes('accessibility')) domainIds.push('accessibility');

  const lisaDomain = resolveLisaProjectDomain(normalized);
  const resolvedDomainLabel =
    lisaDomain ??
    domainLabelFromTags(DOMAIN_TAGS.filter((tag) => domainIds.includes(tag.id)));

  return {
    readOnly: true,
    domainIds,
    domainLabel: resolvedDomainLabel,
    keywords: [...new Set([...domainIds, ...nameTokens])],
    profile: null,
    appType: tags[0]?.appType ?? null,
    proposedProjectName: null,
  };
}

export function domainOverlapScore(left: string[], right: string[]): number {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  const overlap = left.filter((id) => rightSet.has(id)).length;
  return overlap / Math.max(left.length, right.length);
}

export function normalizeProjectDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, '');
}
