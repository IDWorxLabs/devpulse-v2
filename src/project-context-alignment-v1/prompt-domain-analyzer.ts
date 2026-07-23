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
import { maskNegatedProductPhrases } from '../product-faithfulness-v1/product-faithfulness-feature-extractor.js';
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
  // "checklist" alone (runbook step checklists) must not classify ContinuityHub as a task tracker.
  // Prefer explicit multi-word task-product phrases over bare "checklist".
  {
    id: 'task',
    label: 'task tracking',
    appType: 'task tracker',
    proposedName: 'TaskTracker',
    patterns: [/\b(task tracker|todo|to-do|add tasks|mark them complete|generic todo list)\b/i],
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
    // Retail/warehouse inventory — not "inventory means failover capacity" continuity phrasing.
    patterns: [/\b(inventory management|warehouse inventory|stock levels|sku inventory)\b/i],
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

/**
 * Strip ban-list / "do not inject … (tasks, expenses, …)" clauses so domain tagging does not
 * treat disclaimers as affirmative product signals (e.g. ContinuityHub → ExpenseTracker).
 */
function maskBanListAndNegationClauses(text: string): string {
  return maskNegatedProductPhrases(text)
    .replace(/\bdo\s+not\s+inject\b[^.\n]*/gi, ' ')
    .replace(/\bbanned\s+fallback\s+shells?\b[^.\n]*/gi, ' ')
    .replace(/\bwithout\s+inventing\b[^.\n]*/gi, ' ')
    .replace(/\bno\s+(?:payments|ecommerce\s+inventory|crm(?:\s+pipeline)?|generic\s+todo\s+list)\b[^.\n]*/gi, ' ');
}

function domainLabelFromTags(tags: DomainTag[]): string {
  if (!tags.length) return 'general application';
  return tags.map((tag) => tag.label).join(', ');
}

function proposedNameFromTags(tags: DomainTag[]): string | null {
  if (!tags.length) return null;
  return tags[0]!.proposedName;
}

const BUILD_TARGET_VERB =
  /^(?:please\s+)?(?:build|create|make|generate|implement|develop|design|finish|rebuild|scaffold)\b/i;

/**
 * Derive a human-readable project name from imperative build prompts without domain-tag hardcoding.
 * e.g. "Build a calculator app." -> "Calculator App"
 */
export function extractGenericBuildTargetName(prompt: string): string | null {
  const normalized = prompt.trim().replace(/\s+/g, ' ');
  if (!normalized || !BUILD_TARGET_VERB.test(normalized)) return null;

  const match = normalized.match(
    /^(?:please\s+)?(?:build|create|make|generate|implement|develop|design|finish|rebuild|scaffold)\s+(?:a|an|the|this|my|our|new)?\s+(.+?)(?:[.!?]+)?$/i,
  );
  if (!match?.[1]) return null;

  let target = match[1]
    .trim()
    .replace(/\s*(?:with|including|that includes|featuring)\s+.+$/i, '')
    .replace(/[.!?]+$/g, '')
    .trim();
  if (!target || /^new\s+project$/i.test(target)) return null;

  const titled = target
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();

  return titled || null;
}

export function extractPromptDomainSignals(
  prompt: string,
  options?: { activeProjectName?: string | null },
): PromptDomainSignals {
  const normalized = prompt.replace(/^\uFEFF/, '').trim();
  const affirmative = maskBanListAndNegationClauses(normalized);
  const tags = matchDomainTags(affirmative);
  // Only scan the opening build line for name-token domain expansion — full-prompt tokenization
  // falsely promotes words like "Inventory" from definitional disclaimers into domain tags.
  const openingLine = affirmative.split(/\r?\n/, 1)[0] ?? affirmative;
  const nameTokens = splitProjectNameTokens(openingLine);
  const profile = resolveBuildIntentProfile(affirmative);
  const activeProjectName = options?.activeProjectName?.trim() || null;

  let domainIds = [...new Set(tags.map((tag) => tag.id))];
  for (const token of nameTokens) {
    for (const tag of DOMAIN_TAGS) {
      if (tag.id === token || tag.patterns.some((pattern) => pattern.test(token))) {
        if (!domainIds.includes(tag.id)) domainIds.push(tag.id);
      }
    }
  }

  domainIds = filterMisplacedTaskDomainIds(domainIds, affirmative, activeProjectName);
  if (promptMentionsLisaOrAccessibility(normalized) && !domainIds.includes('accessibility')) {
    domainIds.push('accessibility');
  }

  const filteredTags = DOMAIN_TAGS.filter((tag) => domainIds.includes(tag.id));
  let proposedProjectName = proposedNameFromTags(filteredTags);
  if (proposedNameShouldNotBeTaskTracker(affirmative, proposedProjectName)) {
    proposedProjectName = promptMentionsLisaOrAccessibility(normalized) ? 'LISA' : null;
  }
  if (!proposedProjectName) {
    proposedProjectName = extractGenericBuildTargetName(normalized);
  }

  let keywords = [
    ...new Set([
      ...domainIds,
      ...nameTokens,
      ...(profile ? [profile.toLowerCase()] : []),
    ]),
  ];
  keywords = filterTaskTrackingKeywordsFromBoilerplate(affirmative, keywords);

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

export { normalizeProjectRegistryName } from '../project-registry-sovereignty/registry-classifier.js';
