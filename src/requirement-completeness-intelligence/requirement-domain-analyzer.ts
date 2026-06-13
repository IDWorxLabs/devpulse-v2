/**
 * Requirement Domain Analyzer — per-domain completeness checks (V1).
 */

import type {
  AnalysisDomain,
  ConsolidatedRequirementEvidence,
  DomainAnalysisResult,
} from './requirement-completeness-types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasMatch(items: readonly string[], pattern: RegExp): boolean {
  return items.some((item) => pattern.test(item));
}

function analyzeUiRequirements(evidence: ConsolidatedRequirementEvidence): DomainAnalysisResult {
  const covered: string[] = [];
  const gaps: string[] = [];
  const domainEvidence: string[] = [];

  if (evidence.screens.length > 0) {
    covered.push('SCREENS_DEFINED');
    domainEvidence.push(`SCREEN_COUNT_${evidence.screens.length}`);
  } else {
    gaps.push('SCREENS_NOT_DEFINED');
  }

  if (hasMatch(evidence.visualComponents, /NAVIGATION|SIDEBAR|BOTTOM_NAV/) || hasMatch(evidence.screens, /nav/i)) {
    covered.push('NAVIGATION_DEFINED');
  } else if (evidence.screens.length >= 2) {
    gaps.push('NAVIGATION_NOT_DEFINED');
  }

  if (hasMatch(evidence.inferredFlows, /ONBOARDING/i) || hasMatch(evidence.workflows, /onboarding/i)) {
    covered.push('ONBOARDING_DEFINED');
  } else if (evidence.screens.length >= 1) {
    gaps.push('ONBOARDING_NOT_DEFINED');
  }

  if (hasMatch(evidence.inferredFlows, /SETTINGS/i) || hasMatch(evidence.screens, /settings/i)) {
    covered.push('SETTINGS_DEFINED');
  } else if (evidence.screens.length >= 3) {
    gaps.push('SETTINGS_NOT_DEFINED');
  }

  let score = 20;
  score += covered.length * 18;
  score -= gaps.length * 10;

  return {
    readOnly: true,
    domain: 'UI_REQUIREMENTS',
    score: clamp(score),
    covered,
    gaps,
    evidence: domainEvidence,
  };
}

function analyzeBusinessLogic(evidence: ConsolidatedRequirementEvidence): DomainAnalysisResult {
  const covered: string[] = [];
  const gaps: string[] = [];

  if (evidence.workflows.length > 0) {
    covered.push('WORKFLOWS_DEFINED');
  } else {
    gaps.push('WORKFLOWS_NOT_DEFINED');
  }

  if (evidence.userRoles.length >= 2 || hasMatch(evidence.businessRules, /permission|role|admin/i)) {
    covered.push('PERMISSIONS_DEFINED');
  } else if (evidence.userRoles.length >= 1) {
    gaps.push('PERMISSIONS_NOT_FULLY_DEFINED');
  } else {
    gaps.push('PERMISSIONS_NOT_DEFINED');
  }

  if (hasMatch(evidence.businessRules, /approv/i) || hasMatch(evidence.workflows, /approv/i)) {
    covered.push('APPROVAL_LOGIC_DEFINED');
  } else if (evidence.workflows.some((w) => /checkout|billing|order/i.test(w))) {
    gaps.push('APPROVAL_LOGIC_NOT_DEFINED');
  }

  if (evidence.businessRules.length > 0) {
    covered.push('BUSINESS_RULES_PRESENT');
  } else if (evidence.workflows.length >= 2) {
    gaps.push('EDGE_CASES_NOT_DEFINED');
  }

  let score = 15;
  score += covered.length * 20;
  score -= gaps.length * 12;

  return {
    readOnly: true,
    domain: 'BUSINESS_LOGIC',
    score: clamp(score),
    covered,
    gaps,
    evidence: [`WORKFLOW_COUNT_${evidence.workflows.length}`, `RULE_COUNT_${evidence.businessRules.length}`],
  };
}

function analyzeAuthentication(evidence: ConsolidatedRequirementEvidence): DomainAnalysisResult {
  const covered: string[] = [];
  const gaps: string[] = [];

  const needsAuth =
    evidence.authentication.length > 0 ||
    hasMatch(evidence.inferredFlows, /AUTHENTICATION/i) ||
    hasMatch(evidence.workflows, /sign.?up|login|auth/i);

  if (!needsAuth) {
    return {
      readOnly: true,
      domain: 'AUTHENTICATION',
      score: 70,
      covered: ['AUTH_NOT_REQUIRED_BY_EVIDENCE'],
      gaps: [],
      evidence: ['NO_AUTH_SIGNALS'],
    };
  }

  if (hasMatch(evidence.authentication, /login|sign.?in/i) || hasMatch(evidence.screens, /login/i)) {
    covered.push('LOGIN_DEFINED');
  } else {
    gaps.push('LOGIN_NOT_DEFINED');
  }

  if (hasMatch(evidence.authentication, /sign.?up|signup|register/i) || hasMatch(evidence.workflows, /sign.?up/i)) {
    covered.push('SIGNUP_DEFINED');
  } else {
    gaps.push('SIGNUP_NOT_DEFINED');
  }

  if (evidence.userRoles.length > 0) {
    covered.push('ROLES_DEFINED');
  } else {
    gaps.push('ROLES_NOT_DEFINED');
  }

  if (hasMatch(evidence.authentication, /oauth|social|google|apple/i)) {
    covered.push('SOCIAL_AUTH_DEFINED');
  }

  let score = 10;
  score += covered.length * 22;
  score -= gaps.length * 15;

  return {
    readOnly: true,
    domain: 'AUTHENTICATION',
    score: clamp(score),
    covered,
    gaps,
    evidence: [`AUTH_SIGNAL_COUNT_${evidence.authentication.length}`],
  };
}

function analyzeDataModel(evidence: ConsolidatedRequirementEvidence): DomainAnalysisResult {
  const covered: string[] = [];
  const gaps: string[] = [];

  if (evidence.dataEntities.length >= 2) {
    covered.push('ENTITIES_DEFINED');
  } else if (evidence.dataEntities.length === 1) {
    covered.push('ENTITIES_PARTIAL');
    gaps.push('ENTITY_RELATIONSHIPS_NOT_DEFINED');
  } else {
    gaps.push('ENTITIES_NOT_DEFINED');
  }

  if (evidence.dataEntities.length >= 3) {
    covered.push('MULTI_ENTITY_MODEL');
  }

  if (hasMatch(evidence.businessRules, /owner|belongs to|assigned to/i)) {
    covered.push('OWNERSHIP_DEFINED');
  } else if (evidence.dataEntities.length >= 2) {
    gaps.push('OWNERSHIP_NOT_DEFINED');
  }

  let score = 15;
  score += covered.length * 25;
  score -= gaps.length * 14;

  return {
    readOnly: true,
    domain: 'DATA_MODEL',
    score: clamp(score),
    covered,
    gaps,
    evidence: [`ENTITY_COUNT_${evidence.dataEntities.length}`],
  };
}

function analyzeNotifications(evidence: ConsolidatedRequirementEvidence): DomainAnalysisResult {
  const covered: string[] = [];
  const gaps: string[] = [];

  const needsNotifications =
    evidence.notifications.length > 0 ||
    hasMatch(evidence.workflows, /notification|alert|email|push/i) ||
    hasMatch(evidence.integrations, /twilio|sendgrid|firebase/i);

  if (!needsNotifications) {
    return {
      readOnly: true,
      domain: 'NOTIFICATIONS',
      score: 75,
      covered: ['NOTIFICATIONS_NOT_REQUIRED_BY_EVIDENCE'],
      gaps: [],
      evidence: ['NO_NOTIFICATION_SIGNALS'],
    };
  }

  if (hasMatch(evidence.notifications, /email/i)) covered.push('EMAIL_DEFINED');
  else gaps.push('EMAIL_NOT_DEFINED');

  if (hasMatch(evidence.notifications, /push/i)) covered.push('PUSH_DEFINED');
  if (hasMatch(evidence.notifications, /sms/i)) covered.push('SMS_DEFINED');
  if (hasMatch(evidence.notifications, /in-app/i)) covered.push('IN_APP_DEFINED');

  if (covered.length === 0) gaps.push('NOTIFICATION_CHANNELS_NOT_DEFINED');

  let score = 20;
  score += covered.length * 20;
  score -= gaps.length * 15;

  return {
    readOnly: true,
    domain: 'NOTIFICATIONS',
    score: clamp(score),
    covered,
    gaps,
    evidence: [`NOTIFICATION_COUNT_${evidence.notifications.length}`],
  };
}

function analyzeIntegrations(evidence: ConsolidatedRequirementEvidence): DomainAnalysisResult {
  const covered: string[] = [];
  const gaps: string[] = [];

  if (evidence.integrations.length === 0) {
    return {
      readOnly: true,
      domain: 'INTEGRATIONS',
      score: 80,
      covered: ['INTEGRATIONS_NOT_REQUIRED_BY_EVIDENCE'],
      gaps: [],
      evidence: ['NO_INTEGRATION_SIGNALS'],
    };
  }

  for (const integration of evidence.integrations) {
    covered.push(`INTEGRATION_${integration.toUpperCase().replace(/\s+/g, '_')}`);
  }

  if (evidence.integrations.length >= 1 && evidence.dataEntities.length === 0) {
    gaps.push('INTEGRATION_DATA_MAPPING_NOT_DEFINED');
  }

  if (hasMatch(evidence.integrations, /stripe|paypal/i) && !hasMatch(evidence.workflows, /checkout|billing|payment/i)) {
    gaps.push('PAYMENT_INTEGRATION_WITHOUT_CHECKOUT_FLOW');
  }

  let score = 30;
  score += Math.min(40, evidence.integrations.length * 15);
  score -= gaps.length * 18;

  return {
    readOnly: true,
    domain: 'INTEGRATIONS',
    score: clamp(score),
    covered,
    gaps,
    evidence: [`INTEGRATION_COUNT_${evidence.integrations.length}`],
  };
}

function analyzePlatformTargets(evidence: ConsolidatedRequirementEvidence): DomainAnalysisResult {
  const covered: string[] = [];
  const gaps: string[] = [];

  if (evidence.platformTargets.length > 0) {
    covered.push('PLATFORM_TARGETS_DEFINED');
    for (const platform of evidence.platformTargets) {
      covered.push(`PLATFORM_${platform.toUpperCase()}`);
    }
  } else {
    gaps.push('PLATFORM_TARGETS_NOT_DEFINED');
  }

  if (evidence.productType && evidence.productType !== 'UNKNOWN') {
    covered.push(`PRODUCT_TYPE_${evidence.productType}`);
  } else if (evidence.screens.length >= 2) {
    gaps.push('PRODUCT_TYPE_NOT_DEFINED');
  }

  let score = 20;
  score += covered.length * 15;
  score -= gaps.length * 20;

  return {
    readOnly: true,
    domain: 'PLATFORM_TARGETS',
    score: clamp(score),
    covered,
    gaps,
    evidence: [`PLATFORM_COUNT_${evidence.platformTargets.length}`],
  };
}

export function analyzeRequirementDomains(
  evidence: ConsolidatedRequirementEvidence,
): DomainAnalysisResult[] {
  return [
    analyzeUiRequirements(evidence),
    analyzeBusinessLogic(evidence),
    analyzeAuthentication(evidence),
    analyzeDataModel(evidence),
    analyzeNotifications(evidence),
    analyzeIntegrations(evidence),
    analyzePlatformTargets(evidence),
  ];
}
