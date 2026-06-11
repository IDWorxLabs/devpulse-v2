/**
 * Clarifying Question Intelligence — bounded requirement categories.
 */

import type { RequirementCategoryDefinition } from './clarifying-question-types.js';

export const REQUIREMENT_CATEGORY_DEFINITIONS: readonly RequirementCategoryDefinition[] = [
  {
    id: 'PRODUCT_PURPOSE',
    label: 'Product Purpose',
    critical: true,
    detectionPatterns: [
      /\bfor (founders|teams|customers|users|enterprises)\b/i,
      /\b(task management|project management|saas|marketplace|platform)\b/i,
      /\bwhy\b.*\b(build|create|need)\b/i,
      /\bwhat (?:is|are) (?:we|you) building\b/i,
      /\bproduct purpose\b/i,
    ],
    sampleQuestion: {
      category: 'PRODUCT_PURPOSE',
      priority: 'CRITICAL',
      question: 'Who is this product for and what outcome should it deliver?',
      whyItMatters: 'Product purpose and audience are not fully specified.',
      consequenceIfAssumed: 'The system may build the wrong product for the wrong user.',
    },
  },
  {
    id: 'USERS_ROLES',
    label: 'Users & Roles',
    critical: true,
    detectionPatterns: [
      /\b(admin|manager|member|guest|role|team|organization)\b/i,
      /\bindividual\b|\bteam\b/i,
      /\bpermission\b|\baccess level\b/i,
    ],
    sampleQuestion: {
      category: 'USERS_ROLES',
      priority: 'CRITICAL',
      question: 'Who will use this product and what roles or permissions do they need?',
      whyItMatters: 'User roles and permission boundaries are unspecified.',
      consequenceIfAssumed: 'The system may invent admin, manager, or guest roles incorrectly.',
    },
  },
  {
    id: 'AUTHENTICATION',
    label: 'Authentication',
    critical: true,
    detectionPatterns: [
      /\b(login|log in|sign in|signup|sign up|register|authentication|password|oauth|social login)\b/i,
    ],
    sampleQuestion: {
      category: 'AUTHENTICATION',
      priority: 'CRITICAL',
      question: 'Should users sign up and log in? What authentication method is required?',
      whyItMatters: 'Authentication requirements were never specified.',
      consequenceIfAssumed: 'The system may add or omit login flows inappropriately.',
    },
  },
  {
    id: 'UI_BRANDING',
    label: 'UI & Branding',
    critical: false,
    detectionPatterns: [
      /\b(color|colour|theme|brand|logo|dark mode|light mode|palette|visual style)\b/i,
    ],
    sampleQuestion: {
      category: 'UI_BRANDING',
      priority: 'IMPORTANT',
      question: 'What color scheme, theme, or branding should the product use?',
      whyItMatters: 'Brand identity and visual preferences are not specified.',
      consequenceIfAssumed: 'The system may generate an unwanted visual style.',
    },
  },
  {
    id: 'FEATURES',
    label: 'Features',
    critical: true,
    detectionPatterns: [
      /\b(must.?have|required feature|core feature|functionality|capabilities)\b/i,
      /\b(task|todo|notification|dashboard|report|search|filter)\b/i,
      /\bbuild (?:a|an|the) .+\b/i,
    ],
    sampleQuestion: {
      category: 'FEATURES',
      priority: 'CRITICAL',
      question: 'What are the must-have features versus nice-to-have features?',
      whyItMatters: 'Required functionality is underspecified.',
      consequenceIfAssumed: 'The system may omit critical features or overbuild the wrong ones.',
    },
  },
  {
    id: 'BEHAVIORS',
    label: 'Behaviors',
    critical: true,
    detectionPatterns: [
      /\b(when .+ fails|error handling|notification|automation|escalation|workflow|behavior)\b/i,
      /\b(should not|must not|avoid|undesired)\b/i,
      /\b(on success|on failure|retry)\b/i,
    ],
    sampleQuestion: {
      category: 'BEHAVIORS',
      priority: 'CRITICAL',
      question: 'What should happen when tasks fail, errors occur, or users need notifications?',
      whyItMatters: 'Desired and undesired behaviors are not fully explained.',
      consequenceIfAssumed: 'Failure handling and automation rules may be guessed incorrectly.',
    },
  },
  {
    id: 'PLATFORM',
    label: 'Platform',
    critical: true,
    detectionPatterns: [
      /\b(web|mobile|ios|android|desktop|api|cloud|browser|native app)\b/i,
    ],
    sampleQuestion: {
      category: 'PLATFORM',
      priority: 'CRITICAL',
      question: 'Should this be web, mobile, desktop, API, or a combination?',
      whyItMatters: 'Target platform is not specified.',
      consequenceIfAssumed: 'The system may choose the wrong deployment surface.',
    },
  },
  {
    id: 'DATA_STORAGE',
    label: 'Data & Storage',
    critical: false,
    detectionPatterns: [
      /\b(database|storage|upload|file|analytics|persist|account data)\b/i,
    ],
    sampleQuestion: {
      category: 'DATA_STORAGE',
      priority: 'IMPORTANT',
      question: 'What data must be stored, uploaded, or analyzed?',
      whyItMatters: 'Data and storage expectations are unclear.',
      consequenceIfAssumed: 'Persistence, uploads, or analytics may be built without intent.',
    },
  },
  {
    id: 'PAYMENTS',
    label: 'Payments',
    critical: false,
    detectionPatterns: [
      /\b(payment|subscription|paid|free tier|billing|stripe|checkout|pricing)\b/i,
    ],
    sampleQuestion: {
      category: 'PAYMENTS',
      priority: 'IMPORTANT',
      question: 'Will this product be free, paid, or subscription-based?',
      whyItMatters: 'Monetization model is not specified.',
      consequenceIfAssumed: 'The system may invent payment flows that were never requested.',
    },
  },
  {
    id: 'LAUNCH_REQUIREMENTS',
    label: 'Launch Requirements',
    critical: false,
    detectionPatterns: [
      /\b(public launch|beta|internal tool|enterprise|pilot|limited customers|mvp)\b/i,
    ],
    sampleQuestion: {
      category: 'LAUNCH_REQUIREMENTS',
      priority: 'IMPORTANT',
      question: 'Is this for public launch, private beta, internal use, or enterprise deployment?',
      whyItMatters: 'Launch scope affects requirements and quality bar.',
      consequenceIfAssumed: 'Build scope may not match intended launch stage.',
    },
  },
] as const;

export const MAX_REQUIREMENT_CATEGORIES = REQUIREMENT_CATEGORY_DEFINITIONS.length;

export const ASSUMPTION_PREVENTION_BY_CATEGORY: Readonly<Record<string, string>> = {
  PRODUCT_PURPOSE: 'Assumed product audience and purpose without confirmation',
  USERS_ROLES: 'Assumed user roles or permission model',
  AUTHENTICATION: 'Assumed login, signup, or auth mechanism',
  UI_BRANDING: 'Assumed colors, theme, branding, or dark mode preference',
  FEATURES: 'Assumed must-have feature scope',
  BEHAVIORS: 'Assumed failure handling, notifications, or automation rules',
  PLATFORM: 'Assumed web/mobile/desktop/API target',
  DATA_STORAGE: 'Assumed database, uploads, or analytics needs',
  PAYMENTS: 'Assumed payment or subscription model',
  LAUNCH_REQUIREMENTS: 'Assumed launch stage (public beta vs internal tool)',
};
