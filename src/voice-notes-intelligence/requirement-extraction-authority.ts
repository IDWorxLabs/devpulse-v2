/**
 * Requirement Extraction Authority — structured requirement mining from transcript (V1).
 */

import type { ClarifyingQuestion, ExtractedRequirements } from './voice-notes-types.js';

function extractList(text: string, patterns: RegExp[]): string[] {
  const found = new Set<string>();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = (match[1] ?? match[0]).trim();
      if (value.length > 0) found.add(value.replace(/\s+/g, ' '));
    }
  }
  return [...found];
}

export function extractRequirementsFromTranscript(transcriptText: string): ExtractedRequirements {
  const text = transcriptText.trim();

  const screens = extractList(text, [
    /\b(login|sign[- ]?in|signup|sign[- ]?up|dashboard|settings|profile|checkout|home|landing|admin|onboarding)\s*(screen|page|view)?\b/gi,
    /\b(screen|page)\s+(?:for\s+)?([a-z][a-z0-9\s-]{2,30})/gi,
  ]);

  const userRoles = extractList(text, [
    /\b(admin|administrator|customer|user|manager|founder|operator|vendor|seller|buyer)\b/gi,
    /\b(role[s]?\s+(?:for\s+)?([a-z][a-z0-9\s-]{2,20}))/gi,
  ]);

  const workflows = extractList(text, [
    /\b(sign[- ]?up|onboarding|checkout|authentication|approval|subscription|billing|search|messaging|notification)\s*(flow|workflow|process)?\b/gi,
    /\b(workflow[s]?\s+(?:for\s+)?([a-z][a-z0-9\s-]{2,30}))/gi,
  ]);

  const businessRules = extractList(text, [
    /\b(must|should not|only if|cannot|required to|no more than|at least)\b[^.!?]{0,80}/gi,
    /\b(business rule[s]?\s*:\s*([^.!?]{5,80}))/gi,
  ]);

  const integrations = extractList(text, [
    /\b(stripe|paypal|slack|github|google|apple|firebase|twilio|sendgrid|shopify|salesforce|hubspot|zapier)\b/gi,
    /\bintegrat(?:e|ion)\s+(?:with\s+)?([a-z][a-z0-9\s-]{2,24})/gi,
  ]);

  const notifications = extractList(text, [
    /\b(email|push notification|sms|alert|in-app notification|webhook)\b/gi,
    /\bnotify(?:ing|ication)?\s+(?:via\s+)?([a-z][a-z0-9\s-]{2,24})/gi,
  ]);

  const authentication = extractList(text, [
    /\b(oauth|sso|password|magic link|two-factor|2fa|biometric|jwt|login)\b/gi,
    /\bauth(?:entication|enticate)?\s+(?:with\s+)?([a-z][a-z0-9\s-]{2,24})/gi,
  ]);

  const dataEntities = extractList(text, [
    /\b(user|order|product|invoice|subscription|message|project|task|payment|profile|account)s?\b/gi,
    /\b(entity|model)\s+(?:for\s+)?([a-z][a-z0-9\s-]{2,24})/gi,
  ]);

  const dedupe = (items: string[]) => [...new Set(items.map((i) => i.trim()).filter(Boolean))];

  return {
    readOnly: true,
    screens: dedupe(screens),
    userRoles: dedupe(userRoles),
    workflows: dedupe(workflows),
    businessRules: dedupe(businessRules),
    integrations: dedupe(integrations),
    notifications: dedupe(notifications),
    authentication: dedupe(authentication),
    dataEntities: dedupe(dataEntities),
  };
}

export function identifyMissingRequirements(requirements: ExtractedRequirements): {
  missingScreens: string[];
  missingFlows: string[];
  missingBusinessLogic: string[];
  unclearRequirements: string[];
} {
  const missingScreens: string[] = [];
  const missingFlows: string[] = [];
  const missingBusinessLogic: string[] = [];
  const unclearRequirements: string[] = [];

  const screenText = requirements.screens.join(' ').toLowerCase();
  const workflowText = requirements.workflows.join(' ').toLowerCase();
  const authText = requirements.authentication.join(' ').toLowerCase();

  if (requirements.workflows.some((w) => /sign.?up|onboarding/i.test(w)) && !/login|sign.?in/i.test(screenText)) {
    missingScreens.push('LOGIN_OR_SIGNIN_SCREEN_FOR_ONBOARDING_FLOW');
  }
  if (requirements.integrations.length > 0 && requirements.dataEntities.length === 0) {
    missingBusinessLogic.push('INTEGRATION_DATA_MODEL_UNDEFINED');
  }
  if (/checkout|billing|payment/i.test(workflowText) && !/checkout|payment|billing/i.test(screenText)) {
    missingScreens.push('CHECKOUT_OR_BILLING_SCREEN');
  }
  if (authText.length > 0 && requirements.userRoles.length === 0) {
    unclearRequirements.push('AUTHENTICATION_MENTIONED_WITHOUT_USER_ROLES');
  }
  if (requirements.screens.length >= 2 && requirements.workflows.length === 0) {
    missingFlows.push('MULTI_SCREEN_REFERENCE_WITHOUT_WORKFLOW');
  }
  if (requirements.businessRules.length === 0 && requirements.dataEntities.length >= 2) {
    missingBusinessLogic.push('DATA_ENTITIES_WITHOUT_BUSINESS_RULES');
  }
  if (requirements.notifications.length > 0 && !requirements.workflows.some((w) => /notification|alert/i.test(w))) {
    missingFlows.push('NOTIFICATION_DELIVERY_WORKFLOW');
  }

  return { missingScreens, missingFlows, missingBusinessLogic, unclearRequirements };
}

export function buildClarifyingQuestions(input: {
  requirements: ExtractedRequirements;
  platformTargets: readonly string[];
  missingScreens: readonly string[];
  missingFlows: readonly string[];
  missingBusinessLogic: readonly string[];
  unclearRequirements: readonly string[];
}): ClarifyingQuestion[] {
  const questions: ClarifyingQuestion[] = [];

  const push = (
    question: string,
    category: string,
    priority: 'HIGH' | 'MEDIUM' | 'LOW',
    evidence: string[],
  ) => {
    questions.push({ readOnly: true, question, category, priority, evidence });
  };

  for (const gap of input.missingScreens) {
    push(
      'Which screens should exist for the referenced user journey, and what is the primary action on each screen?',
      'screens',
      'HIGH',
      [gap],
    );
  }
  for (const gap of input.missingFlows) {
    push(
      'Can you walk through the step-by-step workflow from entry point to completion, including success and failure paths?',
      'workflows',
      'HIGH',
      [gap],
    );
  }
  for (const gap of input.missingBusinessLogic) {
    push(
      'What business rules or constraints govern this behavior (permissions, limits, validations, edge cases)?',
      'business_rules',
      'HIGH',
      [gap],
    );
  }
  for (const gap of input.unclearRequirements) {
    push(
      'Can you clarify the ambiguous requirement so we can map it to concrete product behavior?',
      'clarity',
      'MEDIUM',
      [gap],
    );
  }
  if (input.platformTargets.length === 0 && input.requirements.screens.length > 0) {
    push(
      'Which platform targets apply (web, iOS, Android, desktop), and should the experience differ by platform?',
      'platform',
      'MEDIUM',
      ['PLATFORM_TARGET_NOT_STATED'],
    );
  }
  if (input.requirements.integrations.length > 0) {
    push(
      'For each integration mentioned, what data should sync, how often, and who authorizes the connection?',
      'integrations',
      'MEDIUM',
      ['INTEGRATION_SCOPE_UNCLEAR'],
    );
  }
  if (input.requirements.authentication.length > 0 && input.requirements.userRoles.length <= 1) {
    push(
      'Which user roles exist and what should each role be allowed to do after authentication?',
      'authentication',
      'HIGH',
      ['ROLE_PERMISSIONS_UNCLEAR'],
    );
  }

  if (questions.length === 0) {
    push(
      'Are there any edge cases, non-happy-path scenarios, or launch constraints we should capture before planning?',
      'completeness',
      'LOW',
      ['NO_MAJOR_GAPS_DETECTED'],
    );
  }

  return questions;
}
