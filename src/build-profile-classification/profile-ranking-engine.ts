/**
 * Build Profile Classification — ranked profile scoring (replaces first-match routing).
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type {
  ProfileAlignmentVerdict,
  ProfileKeywordRule,
  ProfileRankingConfidence,
  ProfileRankingResult,
  RejectedProfileRanking,
} from './profile-ranking-types.js';

interface ProfileRuleSet {
  profile: GeneratedAppProfile;
  intentLabel: string;
  keywords: ProfileKeywordRule[];
  /** If any match, profile score is zeroed (prevents false positives). */
  disqualifiers?: string[];
}

const GENERIC_NON_EVIDENCE = new Set([
  'build intent',
  'web app',
  'application',
  'dashboard',
  'records',
  'reports',
  'report',
  'system',
  'platform',
]);

const EXPENSE_STRONG_KEYWORDS = [
  'expense tracker',
  'expensetracker',
  'expense tracking',
  'expense tracking app',
  'finance tracker',
  'finance tracking',
  'financial tracker',
  'track expenses',
  'track income',
  'spending tracker',
];

const EXPENSE_KEYWORDS = [
  'income',
  'expense',
  'expenses',
  'transaction',
  'transactions',
  'balance',
  'budget',
  'budgets',
  'category',
  'categories',
  'receipt',
  'receipts',
  'spending',
  'savings',
  'financial',
  'finance',
  'csv export',
  'csv',
  'charts',
  'chart',
];

const CRM_STRICT_KEYWORDS = [
  'crm',
  'customer relationship',
  'sales pipeline',
  'manage customers',
  'customer management',
  'client management',
  'sales team',
  'leads',
  'contacts',
  'deals',
  'accounts',
  'follow-ups',
  'follow ups',
  'pipeline',
];

const PROFILE_RULES: ProfileRuleSet[] = [
  {
    profile: 'EXPENSE_TRACKER_WEB_V1',
    intentLabel: 'expense tracking',
    keywords: [
      ...EXPENSE_STRONG_KEYWORDS.map((term) => ({ term, weight: 12 })),
      ...EXPENSE_KEYWORDS.map((term) => ({ term, weight: term === 'expense' || term === 'expenses' ? 8 : 6 })),
    ],
    disqualifiers: CRM_STRICT_KEYWORDS.filter((k) => k !== 'accounts'),
  },
  {
    profile: 'FINANCE_TRACKER_WEB_V1',
    intentLabel: 'finance tracking',
    keywords: [
      { term: 'finance tracker', weight: 11 },
      { term: 'financial dashboard', weight: 10 },
      { term: 'personal finance', weight: 10 },
      { term: 'money management', weight: 9 },
      ...['income', 'balance', 'budget', 'budgets', 'transactions', 'savings', 'financial', 'finance', 'spending'].map(
        (term) => ({ term, weight: 7 }),
      ),
    ],
    disqualifiers: CRM_STRICT_KEYWORDS.filter((k) => k !== 'accounts'),
  },
  {
    profile: 'CRM_WEB_V1',
    intentLabel: 'customer relationship management',
    keywords: CRM_STRICT_KEYWORDS.map((term, index) => ({
      term,
      weight: term === 'crm' ? 12 : 10 - Math.min(index, 4),
    })),
    disqualifiers: [
      ...EXPENSE_STRONG_KEYWORDS,
      'expense tracker',
      'expensetracker',
      'expense tracking',
      'finance tracking',
      'finance tracker',
    ],
  },
  {
    profile: 'TASK_TRACKER_WEB_V1',
    intentLabel: 'task tracking',
    keywords: [
      { term: 'task tracker', weight: 12 },
      { term: 'todo app', weight: 11 },
      { term: 'to-do list', weight: 11 },
      { term: 'todo list', weight: 11 },
      { term: 'checklist', weight: 8 },
      { term: 'add tasks', weight: 9 },
      { term: 'mark them complete', weight: 9 },
      { term: 'mark complete', weight: 8 },
      { term: 'complete tasks', weight: 8 },
    ],
  },
  {
    profile: 'QR_APP',
    intentLabel: 'qr code application',
    keywords: [
      { term: 'qr code', weight: 12 },
      { term: 'qrcode', weight: 12 },
      { term: 'qr app', weight: 11 },
      { term: 'smartqr', weight: 11 },
      { term: 'barcode', weight: 8 },
      { term: 'scan code', weight: 9 },
    ],
  },
  {
    profile: 'INVENTORY_WEB_V1',
    intentLabel: 'inventory management',
    keywords: [
      { term: 'inventory system', weight: 11 },
      { term: 'inventory item', weight: 10 },
      { term: 'inventory', weight: 9 },
      { term: 'warehouse', weight: 8 },
      { term: 'stock', weight: 7 },
    ],
  },
  {
    profile: 'PROJECT_MANAGEMENT_WEB_V1',
    intentLabel: 'project management',
    keywords: [
      { term: 'project management', weight: 12 },
      { term: 'manage projects', weight: 11 },
      { term: 'kanban board', weight: 10 },
      { term: 'milestones', weight: 8 },
      { term: 'sprint', weight: 8 },
      { term: 'assign team', weight: 8 },
    ],
    disqualifiers: [...EXPENSE_STRONG_KEYWORDS, 'expense', 'expenses', 'finance tracking'],
  },
  {
    profile: 'SCHOOL_MANAGEMENT_WEB_V1',
    intentLabel: 'school management',
    keywords: [
      { term: 'school management', weight: 12 },
      { term: 'school system', weight: 11 },
      { term: 'students and teachers', weight: 10 },
      { term: 'classroom', weight: 7 },
      { term: 'teacher', weight: 6 },
      { term: 'student', weight: 6 },
    ],
  },
];

function normalizePrompt(rawPrompt: string): string {
  return rawPrompt.trim().toLowerCase().replace(/\s+/g, ' ');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Word-boundary match for single tokens; phrase match for multi-word keywords. */
export function matchProfileKeyword(text: string, keyword: string): boolean {
  const normalized = keyword.toLowerCase().trim();
  if (!normalized) return false;
  if (normalized.includes(' ')) {
    return text.includes(normalized);
  }
  return new RegExp(`\\b${escapeRegex(normalized)}\\b`, 'i').test(text);
}

function collectMatchedKeywords(text: string, rules: ProfileKeywordRule[]): string[] {
  const matched: string[] = [];
  for (const rule of rules) {
    if (matchProfileKeyword(text, rule.term)) {
      matched.push(rule.term);
    }
  }
  return matched;
}

function scoreProfile(text: string, ruleSet: ProfileRuleSet): { score: number; matchedKeywords: string[] } {
  const disqualifierHit = (ruleSet.disqualifiers ?? []).some((term) => matchProfileKeyword(text, term));
  if (disqualifierHit) {
    return { score: 0, matchedKeywords: [] };
  }

  const matchedKeywords = collectMatchedKeywords(text, ruleSet.keywords);
  let score = 0;
  for (const rule of ruleSet.keywords) {
    if (matchedKeywords.includes(rule.term)) {
      score += rule.weight;
    }
  }

  const namedExpenseTracker = /\bexpensetracker\b/i.test(text) || /\bexpense tracker\b/i.test(text);
  if (namedExpenseTracker && (ruleSet.profile === 'EXPENSE_TRACKER_WEB_V1' || ruleSet.profile === 'FINANCE_TRACKER_WEB_V1')) {
    score += 15;
    if (!matchedKeywords.includes('expensetracker') && !matchedKeywords.includes('expense tracker')) {
      matchedKeywords.push(/\bexpensetracker\b/i.test(text) ? 'expensetracker' : 'expense tracker');
    }
  }

  const namedSmartQr = /\bsmartqr\b/i.test(text);
  if (namedSmartQr && ruleSet.profile === 'QR_APP') {
    score += 12;
    if (!matchedKeywords.includes('smartqr')) matchedKeywords.push('smartqr');
  }

  return { score, matchedKeywords };
}

function computeConfidence(topScore: number, secondScore: number): ProfileRankingConfidence {
  if (topScore >= 10 && topScore - secondScore >= 5) return 'HIGH';
  if (topScore >= 6 && topScore - secondScore >= 3) return 'MEDIUM';
  if (topScore >= 4) return 'LOW';
  return 'LOW';
}

function inferProductIntent(text: string, selected: GeneratedAppProfile | null): string | null {
  if (/\bexpensetracker\b/i.test(text) || /\bexpense tracker\b/i.test(text)) return 'expense tracking';
  if (EXPENSE_KEYWORDS.some((k) => matchProfileKeyword(text, k))) return 'expense tracking';
  if (CRM_STRICT_KEYWORDS.some((k) => matchProfileKeyword(text, k))) return 'customer relationship management';
  if (matchProfileKeyword(text, 'qr code') || matchProfileKeyword(text, 'qrcode') || matchProfileKeyword(text, 'smartqr')) {
    return 'qr code application';
  }
  if (matchProfileKeyword(text, 'task tracker') || matchProfileKeyword(text, 'todo')) return 'task tracking';
  if (matchProfileKeyword(text, 'inventory')) return 'inventory management';
  if (matchProfileKeyword(text, 'school')) return 'school management';
  if (matchProfileKeyword(text, 'project management')) return 'project management';
  if (selected) {
    const rule = PROFILE_RULES.find((entry) => entry.profile === selected);
    return rule?.intentLabel ?? null;
  }
  return null;
}

function detectProfileMismatchWarnings(
  text: string,
  selectedProfile: GeneratedAppProfile | null,
  inferredIntent: string | null,
): string[] {
  const warnings: string[] = [];
  const hasExpenseIntent =
    inferredIntent === 'expense tracking' ||
    EXPENSE_STRONG_KEYWORDS.some((k) => matchProfileKeyword(text, k)) ||
    /\bexpensetracker\b/i.test(text);
  const hasCrmIntent = CRM_STRICT_KEYWORDS.some((k) => matchProfileKeyword(text, k));
  const namedExpenseTracker = /\bexpensetracker\b/i.test(text) || /\bexpense tracker\b/i.test(text);

  if (hasExpenseIntent && selectedProfile === 'CRM_WEB_V1') {
    warnings.push(
      'Prompt describes expense or finance tracking, but CRM_WEB_V1 was selected — this is a profile mismatch.',
    );
  }
  if (namedExpenseTracker && selectedProfile === 'CRM_WEB_V1') {
    warnings.push('ExpenseTracker was named in the prompt but CRM_WEB_V1 was selected.');
  }
  if (hasExpenseIntent && selectedProfile === 'PROJECT_MANAGEMENT_WEB_V1') {
    warnings.push('Expense/finance intent detected but PROJECT_MANAGEMENT_WEB_V1 was selected instead of an expense profile.');
  }
  if (hasCrmIntent && selectedProfile === 'EXPENSE_TRACKER_WEB_V1') {
    warnings.push('CRM keywords detected but EXPENSE_TRACKER_WEB_V1 was selected — review profile choice.');
  }
  if (inferredIntent === 'expense tracking' && selectedProfile === 'CRM_WEB_V1') {
    warnings.push('Inferred product intent is expense tracking while CRM_WEB_V1 was selected.');
  }

  return warnings;
}

function assessAlignment(
  text: string,
  selectedProfile: GeneratedAppProfile | null,
  topRanking: ProfileRankingResult['rankings'][number] | null,
  mismatchWarnings: string[],
  confidence: ProfileRankingConfidence,
): { verdict: ProfileAlignmentVerdict; reason: string } {
  if (mismatchWarnings.length > 0) {
    return {
      verdict: 'PROFILE_MISMATCH',
      reason: mismatchWarnings[0] ?? 'Selected profile does not match request intent.',
    };
  }

  if (!selectedProfile || !topRanking) {
    return {
      verdict: 'NOT_ALIGNED',
      reason: 'No supported application profile could be ranked from the request.',
    };
  }

  if (topRanking.profile !== selectedProfile) {
    return {
      verdict: 'PROFILE_MISMATCH',
      reason: `Request ranking expects ${topRanking.profile} but ${selectedProfile} was selected.`,
    };
  }

  if (confidence === 'LOW') {
    return {
      verdict: 'NOT_ALIGNED',
      reason: `Profile ${selectedProfile} was selected with low confidence — keyword evidence is weak.`,
    };
  }

  const namedExpenseTracker = /\bexpensetracker\b/i.test(text) || /\bexpense tracker\b/i.test(text);
  if (
    namedExpenseTracker &&
    selectedProfile !== 'EXPENSE_TRACKER_WEB_V1' &&
    selectedProfile !== 'FINANCE_TRACKER_WEB_V1'
  ) {
    return {
      verdict: 'PROFILE_MISMATCH',
      reason: `ExpenseTracker was requested but ${selectedProfile} was selected.`,
    };
  }

  return {
    verdict: 'ALIGNED',
    reason: `Profile ${selectedProfile} matches request keywords: ${topRanking.matchedKeywords.join(', ')}.`,
  };
}

export function rankBuildProfiles(rawPrompt: string): ProfileRankingResult {
  const text = normalizePrompt(rawPrompt);
  const rankings = PROFILE_RULES.map((ruleSet) => {
    const scored = scoreProfile(text, ruleSet);
    return {
      profile: ruleSet.profile,
      score: scored.score,
      matchedKeywords: scored.matchedKeywords,
    };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = rankings[0] ?? null;
  const second = rankings[1] ?? null;
  const selectedProfile = top?.profile ?? null;
  const matchedKeywords = top?.matchedKeywords ?? [];
  const confidence = top ? computeConfidence(top.score, second?.score ?? 0) : 'LOW';

  const rejectedProfiles: RejectedProfileRanking[] = rankings.slice(1).map((entry) => ({
    profile: entry.profile,
    score: entry.score,
    matchedKeywords: entry.matchedKeywords,
    rejectionReason:
      top && entry.score < top.score
        ? `Score ${entry.score} lost to ${top.profile} (${top.score}) — weaker keyword evidence`
        : 'Not selected',
  }));

  const rejectionReasons = rejectedProfiles.map(
    (entry) => `${entry.profile}: ${entry.rejectionReason} [${entry.matchedKeywords.join(', ') || 'no keywords'}]`,
  );

  const inferredProductIntent = inferProductIntent(text, selectedProfile);
  const profileMismatchWarnings = detectProfileMismatchWarnings(text, selectedProfile, inferredProductIntent);
  const alignment = assessAlignment(text, selectedProfile, top, profileMismatchWarnings, confidence);

  const fallbackReason =
    confidence === 'LOW' && selectedProfile
      ? `Low-confidence profile selection for ${selectedProfile} — review keyword evidence before trusting build output.`
      : null;

  const reason =
    selectedProfile && matchedKeywords.length
      ? `Ranked profile ${selectedProfile} (${confidence} confidence) from keywords: ${matchedKeywords.join(', ')}`
      : selectedProfile
        ? `Ranked profile ${selectedProfile} with weak keyword evidence`
        : 'No profile reached minimum keyword score';

  return {
    readOnly: true,
    selectedProfile,
    confidence,
    matchedKeywords: matchedKeywords.filter((k) => !GENERIC_NON_EVIDENCE.has(k)),
    rejectedProfiles,
    rejectionReasons,
    fallbackReason,
    rankings,
    inferredProductIntent,
    profileMismatchWarnings,
    alignmentVerdict: alignment.verdict,
    alignmentReason: alignment.reason,
    reason,
  };
}

export function rankBuildProfilesForSelected(
  rawPrompt: string,
  selectedProfile: GeneratedAppProfile | null,
): ProfileRankingResult {
  const ranked = rankBuildProfiles(rawPrompt);
  if (!selectedProfile) return ranked;

  const text = normalizePrompt(rawPrompt);
  const expectedTop = ranked.rankings[0] ?? null;
  const selectedRanking = ranked.rankings.find((entry) => entry.profile === selectedProfile) ?? null;
  const mismatchWarnings = detectProfileMismatchWarnings(text, selectedProfile, ranked.inferredProductIntent);
  const alignment = assessAlignment(
    text,
    selectedProfile,
    expectedTop,
    mismatchWarnings,
    selectedRanking
      ? computeConfidence(selectedRanking.score, ranked.rankings.find((entry) => entry.profile !== selectedProfile)?.score ?? 0)
      : ranked.confidence,
  );

  return {
    ...ranked,
    matchedKeywords: (selectedRanking?.matchedKeywords ?? []).filter((k) => !GENERIC_NON_EVIDENCE.has(k)),
    profileMismatchWarnings: mismatchWarnings,
    alignmentVerdict: alignment.verdict,
    alignmentReason: alignment.reason,
    reason:
      selectedRanking && selectedRanking.matchedKeywords.length
        ? `Build used ${selectedProfile} with keyword evidence: ${selectedRanking.matchedKeywords.join(', ')}`
        : ranked.reason,
  };
}
