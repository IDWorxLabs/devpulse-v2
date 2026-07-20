/**
 * Engineering Intelligence Runtime V1 — product domain classification from prompt semantics.
 */

import type { ProductDomain, ProfileDomainMismatch } from './engineering-intelligence-types.js';

interface DomainSignal {
  pattern: RegExp;
  weight: number;
  evidence: string;
}

interface DomainProfile {
  domain: ProductDomain;
  signals: readonly DomainSignal[];
  profileHints: readonly RegExp[];
  conflictingProfiles: readonly RegExp[];
}

const DOMAIN_PROFILES: readonly DomainProfile[] = [
  {
    domain: 'e-commerce',
    signals: [
      { pattern: /\bproduct\s+catalog\b/i, weight: 4, evidence: 'product catalog mentioned' },
      { pattern: /\bshopping\s+cart\b|\bcart\b/i, weight: 3, evidence: 'cart/shopping cart mentioned' },
      { pattern: /\bcheckout\b/i, weight: 4, evidence: 'checkout mentioned' },
      { pattern: /\border\s+history\b|\borders?\b/i, weight: 3, evidence: 'orders mentioned' },
      { pattern: /\be[\s-]?commerce\b|\bonline\s+store\b|\bstorefront\b/i, weight: 5, evidence: 'e-commerce/store context' },
      { pattern: /\binventory\b/i, weight: 2, evidence: 'inventory mentioned' },
    ],
    profileHints: [/GENERIC_CUSTOM_APP/i, /ECOMMERCE/i],
    conflictingProfiles: [/CRM_WEB/i, /EXPENSE/i],
  },
  {
    domain: 'marketplace',
    signals: [
      { pattern: /\bmarketplace\b/i, weight: 5, evidence: 'marketplace mentioned' },
      { pattern: /\bbuyers?\s+and\s+sellers?\b/i, weight: 4, evidence: 'buyers and sellers mentioned' },
      { pattern: /\blistings?\b/i, weight: 3, evidence: 'listings mentioned' },
      { pattern: /\btransaction\s+checkout\b/i, weight: 3, evidence: 'transaction checkout mentioned' },
    ],
    profileHints: [/GENERIC_CUSTOM_APP/i],
    conflictingProfiles: [/CRM_WEB/i],
  },
  {
    domain: 'crm',
    signals: [
      { pattern: /\bcrm\b|\bcustomer\s+relationship\b/i, weight: 5, evidence: 'CRM context' },
      { pattern: /\bcustomer\s+records?\b|\bcustomers?\b/i, weight: 3, evidence: 'customers mentioned' },
      { pattern: /\bdeal\s+pipeline\b|\bdeals?\b/i, weight: 3, evidence: 'deals mentioned' },
      { pattern: /\bactivity\s+timeline\b|\bactivities\b/i, weight: 3, evidence: 'activities mentioned' },
      { pattern: /\bsales\s+pipeline\b|\bleads?\b/i, weight: 2, evidence: 'sales/leads mentioned' },
    ],
    profileHints: [/CRM_WEB/i],
    conflictingProfiles: [/EXPENSE/i, /HR/i],
  },
  {
    domain: 'hr-admin',
    signals: [
      { pattern: /\bhr\s+admin\b|\bhuman\s+resources\b/i, weight: 5, evidence: 'HR admin context' },
      { pattern: /\bemployee\s+directory\b|\bemployees?\b/i, weight: 4, evidence: 'employees mentioned' },
      { pattern: /\bonboarding\s+checklist\b|\bonboarding\b/i, weight: 4, evidence: 'onboarding mentioned' },
      { pattern: /\btime[\s-]?off\b|\bpto\b|\bleave\s+requests?\b/i, weight: 4, evidence: 'time-off mentioned' },
      { pattern: /\bpayroll\b/i, weight: 4, evidence: 'payroll mentioned' },
    ],
    profileHints: [/CRM_WEB/i, /GENERIC_CUSTOM/i],
    conflictingProfiles: [/EXPENSE/i],
  },
  {
    domain: 'ai-chat',
    signals: [
      { pattern: /\bai\s+chat\b|\bchatbot\b|\bllm\b/i, weight: 5, evidence: 'AI chat context' },
      { pattern: /\bconversation\s+threads?\b|\bconversations?\b/i, weight: 4, evidence: 'conversations mentioned' },
      { pattern: /\bchat[\s-]?input\b|\bprompt\s+input\b/i, weight: 4, evidence: 'chat/prompt input mentioned' },
      { pattern: /\bmodel\s+responses?\b|\bresponses?\b/i, weight: 3, evidence: 'responses mentioned' },
      { pattern: /\bchat\s+history\b|\bhistory\s+sidebar\b/i, weight: 3, evidence: 'chat history mentioned' },
      { pattern: /\bstreaming\b/i, weight: 1, evidence: 'streaming mentioned' },
    ],
    profileHints: [/GENERIC_CUSTOM_APP/i],
    conflictingProfiles: [/CRM_WEB/i, /TASK_TRACKER/i],
  },
  {
    domain: 'assistive-communication',
    signals: [
      { pattern: /\bassistive\s+communication\b|\blocked[\s-]?in\s+syndrome\b/i, weight: 5, evidence: 'assistive communication context' },
      { pattern: /\beye[\s-]?track(?:ing)?\b|\bgaze\b/i, weight: 4, evidence: 'eye/gaze tracking mentioned' },
      { pattern: /\bblink\b/i, weight: 3, evidence: 'blink input mentioned' },
      { pattern: /\btext[\s-]?to[\s-]?speech\b|\btts\b/i, weight: 4, evidence: 'text-to-speech mentioned' },
      { pattern: /\bquick[\s-]?phrases?\b/i, weight: 3, evidence: 'quick phrases mentioned' },
      { pattern: /\bcaregiver\b/i, weight: 3, evidence: 'caregiver mentioned' },
      { pattern: /\bemergency\s+speech\b/i, weight: 3, evidence: 'emergency speech mentioned' },
      { pattern: /\bcalibration\b/i, weight: 3, evidence: 'calibration mentioned' },
      { pattern: /\baccessibility\s+settings\b/i, weight: 2, evidence: 'accessibility settings mentioned' },
    ],
    profileHints: [/ASSISTIVE/i, /GENERIC_CUSTOM/i],
    conflictingProfiles: [/CRM_WEB/i, /EXPENSE/i],
  },
  {
    domain: 'education-lms',
    signals: [
      { pattern: /\blms\b|\blearning\s+management\b/i, weight: 5, evidence: 'LMS context' },
      { pattern: /\bcourses?\b/i, weight: 3, evidence: 'courses mentioned' },
      { pattern: /\blessons?\b/i, weight: 3, evidence: 'lessons mentioned' },
      { pattern: /\benrollments?\b|\bstudents?\b/i, weight: 3, evidence: 'enrollments/students mentioned' },
      { pattern: /\bquizzes?\b/i, weight: 3, evidence: 'quizzes mentioned' },
      { pattern: /\bprogress\s+tracking\b|\bprogress\b/i, weight: 2, evidence: 'progress mentioned' },
    ],
    profileHints: [/SCHOOL/i, /GENERIC_CUSTOM/i],
    conflictingProfiles: [/CRM_WEB/i],
  },
  {
    domain: 'healthcare-portal',
    signals: [
      { pattern: /\bpatient\s+portal\b|\bhealthcare\b/i, weight: 5, evidence: 'healthcare portal context' },
      { pattern: /\bappointments?\b/i, weight: 3, evidence: 'appointments mentioned' },
      { pattern: /\bmedical\s+records?\b|\brecords?\b/i, weight: 3, evidence: 'medical records mentioned' },
      { pattern: /\bprescriptions?\b/i, weight: 3, evidence: 'prescriptions mentioned' },
      { pattern: /\bsecure\s+messaging\b|\bmessaging\b/i, weight: 2, evidence: 'messaging mentioned' },
    ],
    profileHints: [/GENERIC_CUSTOM/i],
    conflictingProfiles: [/CRM_WEB/i],
  },
  {
    domain: 'finance-expense',
    signals: [
      { pattern: /\bexpense\s+tracker\b|\bexpenses?\b|\bspending\b|\bbudget\b/i, weight: 5, evidence: 'expense context' },
      // Categories alone are universal tagging — only score with explicit finance language.
      { pattern: /\bcategor(?:y|ies|ize)\b/i, weight: 1, evidence: 'categories mentioned' },
      { pattern: /\bmonthly\s+totals?\b|\bincome\b/i, weight: 3, evidence: 'totals/income mentioned' },
      { pattern: /\bcharts?\b|\breports?\b/i, weight: 2, evidence: 'charts/reports mentioned' },
      { pattern: /\bcsv\s+export\b|\bexport\b/i, weight: 1, evidence: 'export mentioned' },
    ],
    profileHints: [/EXPENSE/i],
    conflictingProfiles: [/CRM_WEB/i],
  },
  {
    domain: 'booking-scheduling',
    signals: [
      { pattern: /\bbooking\b|\bscheduling\b|\bappointments?\b/i, weight: 4, evidence: 'booking/scheduling context' },
      { pattern: /\bcalendar\b|\bavailability\b/i, weight: 3, evidence: 'calendar/availability mentioned' },
      { pattern: /\breservations?\b/i, weight: 3, evidence: 'reservations mentioned' },
    ],
    profileHints: [/GENERIC_CUSTOM/i],
    conflictingProfiles: [],
  },
  {
    domain: 'social-community',
    signals: [
      { pattern: /\bcommunity\s+app\b|\bsocial\b/i, weight: 4, evidence: 'community/social context' },
      { pattern: /\buser\s+profiles?\b|\bprofiles?\b/i, weight: 3, evidence: 'profiles mentioned' },
      { pattern: /\bposts?\s+feed\b|\bposts?\b/i, weight: 3, evidence: 'posts mentioned' },
      { pattern: /\bcomments?\b/i, weight: 3, evidence: 'comments mentioned' },
      { pattern: /\blikes?\b/i, weight: 2, evidence: 'likes mentioned' },
      { pattern: /\bdirect\s+messages?\b|\bmessages?\b/i, weight: 3, evidence: 'messages mentioned' },
    ],
    profileHints: [/GENERIC_CUSTOM/i],
    conflictingProfiles: [/CRM_WEB/i],
  },
  {
    domain: 'developer-tool',
    signals: [
      { pattern: /\bapi\s+dashboard\b|\bdeveloper\s+tool\b/i, weight: 5, evidence: 'developer tool context' },
      { pattern: /\bapi\s+keys?\b/i, weight: 4, evidence: 'API keys mentioned' },
      { pattern: /\brequest\s+logs?\b/i, weight: 3, evidence: 'request logs mentioned' },
      { pattern: /\busage\s+metrics\b|\bmetrics\b/i, weight: 3, evidence: 'metrics mentioned' },
      { pattern: /\bendpoint\s+documentation\b|\bdocumentation\b/i, weight: 3, evidence: 'documentation mentioned' },
    ],
    profileHints: [/GENERIC_CUSTOM/i],
    conflictingProfiles: [/CRM_WEB/i],
  },
  {
    domain: 'internal-dashboard',
    signals: [
      { pattern: /\binternal\s+dashboard\b|\badmin\s+dashboard\b/i, weight: 4, evidence: 'internal dashboard context' },
      { pattern: /\bkpi\b|\banalytics\b|\bmetrics\s+overview\b/i, weight: 3, evidence: 'KPI/analytics mentioned' },
      { pattern: /\bteam\s+dashboard\b/i, weight: 2, evidence: 'team dashboard mentioned' },
    ],
    profileHints: [/GENERIC_CUSTOM/i, /TASK_TRACKER/i],
    conflictingProfiles: [],
  },
  {
    domain: 'game',
    signals: [
      { pattern: /\bgame\b|\bpuzzle\b/i, weight: 5, evidence: 'game/puzzle context' },
      { pattern: /\blevel\s+select\b|\blevels?\b/i, weight: 3, evidence: 'levels mentioned' },
      { pattern: /\bplay\s+board\b|\bgame[\s-]?board\b/i, weight: 3, evidence: 'game board mentioned' },
      { pattern: /\bscore\s+tracking\b|\bscore\b/i, weight: 3, evidence: 'score mentioned' },
    ],
    profileHints: [/GENERIC_CUSTOM/i],
    conflictingProfiles: [/CRM_WEB/i],
  },
];

export interface ProductDomainClassification {
  readOnly: true;
  domain: ProductDomain;
  confidence: number;
  score: number;
  evidence: readonly string[];
  runnerUp: ProductDomain | null;
}

export function classifyProductDomain(rawPrompt: string): ProductDomainClassification {
  const normalized = rawPrompt.trim();
  let best: ProductDomainClassification = {
    readOnly: true,
    domain: 'custom-general',
    confidence: 0.35,
    score: 0,
    evidence: ['No strong domain signals — classified as custom/general.'],
    runnerUp: null,
  };

  // Multi-entity contact/task/notes products are custom-general unless explicit finance/CRM language
  // is present. Prevents `categories` alone from collapsing them into expense-tracker baseline.
  const multiEntityContactTask =
    /\bcontacts?\b/i.test(normalized) &&
    /\btasks?\b/i.test(normalized) &&
    !/\bexpenses?\b|\bspending\b|\bbudget\b|\bcrm\b|\bdeal\s+pipeline\b/i.test(normalized);
  if (multiEntityContactTask) {
    return {
      readOnly: true,
      domain: 'custom-general',
      confidence: 0.82,
      score: 8,
      evidence: ['Contact/task multi-entity product — custom/general composition path.'],
      runnerUp: null,
    };
  }

  const scores: Array<{ domain: ProductDomain; score: number; evidence: string[] }> = [];

  for (const profile of DOMAIN_PROFILES) {
    let score = 0;
    const evidence: string[] = [];
    for (const signal of profile.signals) {
      if (signal.pattern.test(normalized)) {
        score += signal.weight;
        evidence.push(signal.evidence);
      }
    }
    // Finance domain requires an explicit expense/income/budget signal — categories alone is never enough.
    if (profile.domain === 'finance-expense' && !/\bexpenses?\b|\bspending\b|\bbudget\b|\bincome\b|expense\s+tracker/i.test(normalized)) {
      score = 0;
    }
    if (score > 0) scores.push({ domain: profile.domain, score, evidence });
  }

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  const second = scores[1];

  if (top) {
    const maxPossible = DOMAIN_PROFILES.find((p) => p.domain === top.domain)?.signals.reduce((s, sig) => s + sig.weight, 0) ?? top.score;
    best = {
      readOnly: true,
      domain: top.domain,
      score: top.score,
      confidence: Math.min(0.98, 0.45 + top.score / Math.max(maxPossible, 1) * 0.5),
      evidence: top.evidence,
      runnerUp: second && second.score >= top.score * 0.6 ? second.domain : null,
    };
  }

  return best;
}

export function detectProfileDomainMismatch(input: {
  rawPrompt: string;
  selectedProfile: string;
  classification: ProductDomainClassification;
}): ProfileDomainMismatch | null {
  const profile = input.selectedProfile.toUpperCase();
  const domainProfile = DOMAIN_PROFILES.find((p) => p.domain === input.classification.domain);
  if (!domainProfile || input.classification.domain === 'custom-general') return null;

  const profileMatchesDomain = domainProfile.profileHints.some((hint) => hint.test(profile));
  const profileConflicts = domainProfile.conflictingProfiles.some((hint) => hint.test(profile));

  if (profileMatchesDomain || !profileConflicts) return null;

  return {
    readOnly: true,
    code: 'PROFILE_DOMAIN_MISMATCH',
    selectedProfile: input.selectedProfile,
    detectedDomain: input.classification.domain,
    severity: input.classification.confidence >= 0.7 ? 'WARNING' : 'INFO',
    message: `Selected profile "${input.selectedProfile}" may not match detected product domain "${input.classification.domain}".`,
  };
}

export function domainExpectsRichProductModules(domain: ProductDomain): boolean {
  return domain !== 'custom-general' && domain !== 'internal-dashboard';
}
