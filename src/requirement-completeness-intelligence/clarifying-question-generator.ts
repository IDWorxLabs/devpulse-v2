/**
 * Clarifying Question Generator — prioritized evidence-based questions (V1).
 */

import type {
  AnalysisDomain,
  CompletenessClarifyingQuestion,
  ConsolidatedRequirementEvidence,
  QuestionPriority,
  RequirementGap,
} from './requirement-completeness-types.js';

function pushQuestion(
  questions: CompletenessClarifyingQuestion[],
  question: string,
  category: AnalysisDomain | 'SCOPE',
  priority: QuestionPriority,
  evidence: string[],
  seen: Set<string>,
): void {
  const key = question.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  questions.push({ readOnly: true, question, category, priority, evidence });
}

const GAP_QUESTIONS: Record<string, { question: string; category: AnalysisDomain | 'SCOPE'; priority: QuestionPriority }> = {
  SCREENS_NOT_DEFINED: {
    question: 'Which primary screens or pages should the product include at launch?',
    category: 'UI_REQUIREMENTS',
    priority: 'CRITICAL',
  },
  NAVIGATION_NOT_DEFINED: {
    question: 'How should users navigate between the identified screens?',
    category: 'UI_REQUIREMENTS',
    priority: 'HIGH',
  },
  ONBOARDING_NOT_DEFINED: {
    question: 'Is an onboarding flow required for first-time users, and what steps should it include?',
    category: 'UI_REQUIREMENTS',
    priority: 'MEDIUM',
  },
  SETTINGS_NOT_DEFINED: {
    question: 'Should users have a settings area, and what preferences or account controls belong there?',
    category: 'UI_REQUIREMENTS',
    priority: 'MEDIUM',
  },
  WORKFLOWS_NOT_DEFINED: {
    question: 'What are the step-by-step workflows users must complete to achieve the core product outcome?',
    category: 'BUSINESS_LOGIC',
    priority: 'CRITICAL',
  },
  PERMISSIONS_NOT_DEFINED: {
    question: 'Which user roles exist and what is each role allowed to do?',
    category: 'BUSINESS_LOGIC',
    priority: 'CRITICAL',
  },
  PERMISSIONS_NOT_FULLY_DEFINED: {
    question: 'Can you define permission boundaries for each user role across key workflows?',
    category: 'BUSINESS_LOGIC',
    priority: 'HIGH',
  },
  APPROVAL_LOGIC_NOT_DEFINED: {
    question: 'What approval or review logic should occur before sensitive actions complete?',
    category: 'BUSINESS_LOGIC',
    priority: 'HIGH',
  },
  EDGE_CASES_NOT_DEFINED: {
    question: 'What edge cases, failure paths, or validation rules should the business logic handle?',
    category: 'BUSINESS_LOGIC',
    priority: 'MEDIUM',
  },
  LOGIN_NOT_DEFINED: {
    question: 'Will users create accounts, and if so how should login work?',
    category: 'AUTHENTICATION',
    priority: 'CRITICAL',
  },
  SIGNUP_NOT_DEFINED: {
    question: 'Should new users sign up directly, and what information is required at registration?',
    category: 'AUTHENTICATION',
    priority: 'CRITICAL',
  },
  ROLES_NOT_DEFINED: {
    question: 'Will users create accounts with distinct roles such as admin and customer?',
    category: 'AUTHENTICATION',
    priority: 'CRITICAL',
  },
  ENTITIES_NOT_DEFINED: {
    question: 'Which core data entities must the product store and manage?',
    category: 'DATA_MODEL',
    priority: 'HIGH',
  },
  ENTITY_RELATIONSHIPS_NOT_DEFINED: {
    question: 'How do the identified data entities relate to one another?',
    category: 'DATA_MODEL',
    priority: 'HIGH',
  },
  OWNERSHIP_NOT_DEFINED: {
    question: 'Who owns each data entity, and how is access scoped per user or organization?',
    category: 'DATA_MODEL',
    priority: 'HIGH',
  },
  EMAIL_NOT_DEFINED: {
    question: 'Should notifications be sent by email, push, SMS, or in-app alerts?',
    category: 'NOTIFICATIONS',
    priority: 'HIGH',
  },
  NOTIFICATION_CHANNELS_NOT_DEFINED: {
    question: 'Which notification channels are required and when should each be triggered?',
    category: 'NOTIFICATIONS',
    priority: 'HIGH',
  },
  INTEGRATION_DATA_MAPPING_NOT_DEFINED: {
    question: 'For each integration, what data should sync and under what conditions?',
    category: 'INTEGRATIONS',
    priority: 'HIGH',
  },
  PAYMENT_INTEGRATION_WITHOUT_CHECKOUT_FLOW: {
    question: 'What checkout or billing workflow should occur when payment integrations are used?',
    category: 'INTEGRATIONS',
    priority: 'CRITICAL',
  },
  PLATFORM_TARGETS_NOT_DEFINED: {
    question: 'Which platform targets apply: web, iOS, Android, or desktop?',
    category: 'PLATFORM_TARGETS',
    priority: 'CRITICAL',
  },
  PRODUCT_TYPE_NOT_DEFINED: {
    question: 'What type of product is being built (mobile app, web app, SaaS, internal tool)?',
    category: 'SCOPE',
    priority: 'HIGH',
  },
  NO_EVIDENCE_SOURCES: {
    question: 'Can you provide initial requirements via prompt, voice note, or visual reference?',
    category: 'SCOPE',
    priority: 'CRITICAL',
  },
  BROAD_UI_SCOPE_WITHOUT_WORKFLOWS: {
    question: 'Several screens were mentioned — what user workflows connect them end to end?',
    category: 'SCOPE',
    priority: 'HIGH',
  },
  INTEGRATION_HEAVY_SCOPE_WITHOUT_DATA_MODEL: {
    question: 'Integrations were mentioned — which data entities must exist to support them?',
    category: 'SCOPE',
    priority: 'HIGH',
  },
  SINGLE_SOURCE_PROMPT_ONLY: {
    question: 'Can you confirm requirements with additional detail on workflows, roles, or platform targets?',
    category: 'SCOPE',
    priority: 'MEDIUM',
  },
};

export function generateClarifyingQuestions(input: {
  gaps: readonly RequirementGap[];
  evidence: ConsolidatedRequirementEvidence;
}): CompletenessClarifyingQuestion[] {
  const questions: CompletenessClarifyingQuestion[] = [];
  const seen = new Set<string>();

  const sortedGaps = [...input.gaps].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });

  for (const gap of sortedGaps) {
    const template = GAP_QUESTIONS[gap.gapId];
    if (template) {
      pushQuestion(
        questions,
        template.question,
        template.category,
        template.priority,
        [gap.gapId, ...gap.evidence],
        seen,
      );
    }
  }

  if (input.evidence.authentication.length > 0 && input.evidence.userRoles.length <= 1) {
    pushQuestion(
      questions,
      'Will users create accounts with distinct roles, and what should each role be allowed to do?',
      'AUTHENTICATION',
      'CRITICAL',
      ['AUTH_WITHOUT_ROLE_CLARITY'],
      seen,
    );
  }

  if (input.evidence.integrations.some((i) => /stripe|paypal/i.test(i)) && input.evidence.notifications.length === 0) {
    pushQuestion(
      questions,
      'Should payment or billing events trigger email or push notifications to users?',
      'NOTIFICATIONS',
      'HIGH',
      ['PAYMENT_WITHOUT_NOTIFICATION_CHANNEL'],
      seen,
    );
  }

  if (questions.length === 0) {
    pushQuestion(
      questions,
      'Are there any launch constraints, compliance requirements, or non-happy-path scenarios we should capture before planning?',
      'SCOPE',
      'LOW',
      ['NO_MAJOR_GAPS_DETECTED'],
      seen,
    );
  }

  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return questions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 12);
}
