/**
 * CQI Maturity V1 — missing requirement detection.
 */

import type {
  CqiProductDomain,
  RequirementGap,
  RequirementGapCategory,
  RequirementGapSeverity,
} from './cqi-maturity-types.js';

export interface RequirementGapCategoryDefinition {
  category: RequirementGapCategory;
  critical: boolean;
  detectionPatterns: readonly RegExp[];
  partialPatterns: readonly RegExp[];
  gapSummary: string;
}

export const REQUIREMENT_GAP_CATEGORY_DEFINITIONS: readonly RequirementGapCategoryDefinition[] = [
  {
    category: 'Business',
    critical: true,
    detectionPatterns: [/\b(for (founders|teams|customers|users|businesses)|business model|target market|value proposition)\b/i],
    partialPatterns: [/\b(build|create|make)\b/i],
    gapSummary: 'Business purpose and target outcome are underspecified',
  },
  {
    category: 'Users',
    critical: true,
    detectionPatterns: [/\b(users?|customers?|students?|employees?|audience|who will use)\b/i],
    partialPatterns: [/\b(for my|for our)\b/i],
    gapSummary: 'Primary users are not clearly defined',
  },
  {
    category: 'Roles',
    critical: true,
    detectionPatterns: [/\b(roles?|admin|manager|member|teacher|seller|buyer|staff)\b/i],
    partialPatterns: [/\b(team|organization)\b/i],
    gapSummary: 'User roles and role count are unclear',
  },
  {
    category: 'Permissions',
    critical: true,
    detectionPatterns: [/\b(permissions?|access control|rbac|read.?only|write access)\b/i],
    partialPatterns: [/\b(role)\b/i],
    gapSummary: 'Permission boundaries are not defined',
  },
  {
    category: 'Workflows',
    critical: true,
    detectionPatterns: [/\b(workflow|pipeline|process|stages?|approval|booking|attendance|orders?)\b/i],
    partialPatterns: [/\b(manage|track|assign)\b/i],
    gapSummary: 'Core workflows are underspecified',
  },
  {
    category: 'Data',
    critical: false,
    detectionPatterns: [/\b(data|database|records?|fields?|entities?|store|persist)\b/i],
    partialPatterns: [/\b(notes?|history|profile)\b/i],
    gapSummary: 'Data entities and persistence needs are unclear',
  },
  {
    category: 'Files',
    critical: false,
    detectionPatterns: [/\b(files?|upload|documents?|attachments?|pdf|images?)\b/i],
    partialPatterns: [/\b(export|download)\b/i],
    gapSummary: 'File handling requirements are missing',
  },
  {
    category: 'Notifications',
    critical: false,
    detectionPatterns: [/\b(notifications?|alerts?|reminders?|email|sms|push)\b/i],
    partialPatterns: [/\b(notify|alert)\b/i],
    gapSummary: 'Notification expectations are unspecified',
  },
  {
    category: 'Integrations',
    critical: false,
    detectionPatterns: [/\b(integration|integrate with|connect to|sync with|api partner|email integration|shipping)\b/i],
    partialPatterns: [/\b(stripe|calendar|third.?party)\b/i],
    gapSummary: 'External integrations are not defined',
  },
  {
    category: 'AI',
    critical: false,
    detectionPatterns: [/\b(ai|artificial intelligence|llm|chatbot|recommendations?|machine learning)\b/i],
    partialPatterns: [/\b(smart|automated suggestions?)\b/i],
    gapSummary: 'AI capabilities are not specified',
  },
  {
    category: 'Monetization',
    critical: false,
    detectionPatterns: [/\b(paid|free|subscription|pricing|billing|payments?|monetiz)\b/i],
    partialPatterns: [/\b(marketplace|checkout)\b/i],
    gapSummary: 'Monetization model is unclear',
  },
  {
    category: 'Deployment',
    critical: false,
    detectionPatterns: [/\b(deploy|deployment|public launch|beta|internal|enterprise|cloud|hosting)\b/i],
    partialPatterns: [/\b(web|mobile|production)\b/i],
    gapSummary: 'Deployment target and launch scope are missing',
  },
] as const;

const DOMAIN_CATEGORY_BOOSTS: Partial<Record<CqiProductDomain, readonly RequirementGapCategory[]>> = {
  CRM: ['Roles', 'Workflows', 'Integrations'],
  MARKETPLACE: ['Users', 'Monetization', 'Integrations'],
  INVENTORY: ['Data', 'Workflows', 'Notifications'],
  SCHOOL_MANAGEMENT: ['Users', 'Roles', 'Workflows'],
  PROJECT_MANAGEMENT: ['Workflows', 'Permissions', 'Notifications'],
  BOOKING_PLATFORM: ['Users', 'Workflows', 'Notifications'],
  RESTAURANT_POS: ['Workflows', 'Integrations', 'Data'],
  LEARNING_PLATFORM: ['Roles', 'Workflows', 'Files'],
};

function severityFor(category: RequirementGapCategoryDefinition, complete: boolean, partial: boolean): RequirementGapSeverity | null {
  if (complete) return null;
  if (category.critical) return 'CRITICAL';
  if (partial) return 'HIGH';
  return category.critical ? 'CRITICAL' : 'MEDIUM';
}

export function detectRequirementGaps(input: {
  evidenceText: string;
  domain: CqiProductDomain;
}): RequirementGap[] {
  const gaps: RequirementGap[] = [];
  const boosted = new Set(DOMAIN_CATEGORY_BOOSTS[input.domain] ?? []);

  for (const categoryDef of REQUIREMENT_GAP_CATEGORY_DEFINITIONS) {
    const complete = categoryDef.detectionPatterns.some((pattern) => pattern.test(input.evidenceText));
    const partial = !complete && categoryDef.partialPatterns.some((pattern) => pattern.test(input.evidenceText));
    const severity = severityFor(categoryDef, complete, partial);
    if (severity === null) continue;

    const critical = categoryDef.critical || boosted.has(categoryDef.category);
    gaps.push({
      readOnly: true,
      category: categoryDef.category,
      gapId: `${categoryDef.category.toUpperCase()}_GAP`,
      summary: categoryDef.gapSummary,
      severity: critical && !partial ? 'CRITICAL' : severity,
      critical,
    });
  }

  return gaps;
}

export function scoreRequirementCategory(input: {
  evidenceText: string;
  category: RequirementGapCategoryDefinition;
}): number {
  const complete = input.category.detectionPatterns.some((pattern) => pattern.test(input.evidenceText));
  if (complete) return 100;
  const partial = input.category.partialPatterns.some((pattern) => pattern.test(input.evidenceText));
  if (partial) return 55;
  return 15;
}

export function buildCategoryScores(evidenceText: string): Record<RequirementGapCategory, number> {
  const scores = {} as Record<RequirementGapCategory, number>;
  for (const categoryDef of REQUIREMENT_GAP_CATEGORY_DEFINITIONS) {
    scores[categoryDef.category] = scoreRequirementCategory({ evidenceText, category: categoryDef });
  }
  return scores;
}
