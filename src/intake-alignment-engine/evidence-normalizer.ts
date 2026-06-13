/**
 * Evidence Normalizer — canonical concept normalization (V1).
 */

import type { NormalizedConcept, NormalizedRole, NormalizedPlatform } from './intake-alignment-types.js';

const ROLE_ALIASES: Record<NormalizedRole, readonly string[]> = {
  END_USER: ['user', 'customer', 'rider', 'passenger', 'buyer', 'member', 'founder'],
  TRANSPORT_OPERATOR: ['driver', 'courier', 'delivery driver', 'operator', 'vendor driver'],
  ADMIN: ['admin', 'administrator', 'owner'],
  VENDOR: ['vendor', 'seller', 'merchant', 'provider'],
  CUSTOMER: ['customer', 'client', 'shopper'],
  OPERATOR: ['operator', 'staff', 'agent'],
  UNKNOWN: [],
};

const WORKFLOW_ALIASES: Record<string, readonly string[]> = {
  onboarding: ['onboarding', 'signup', 'sign up', 'registration'],
  authentication: ['authentication', 'auth', 'login', 'oauth', 'signin'],
  checkout: ['checkout', 'payment', 'billing', 'purchase', 'ordering'],
  messaging: ['messaging', 'chat', 'communication'],
  ride_request: ['ride request', 'request ride', 'booking', 'dispatch'],
  tracking: ['tracking', 'track order', 'live tracking', 'gps'],
  administration: ['administration', 'admin', 'approval', 'management'],
};

export function normalizeRole(value: string): NormalizedRole {
  const lower = value.toLowerCase().trim();
  for (const [role, aliases] of Object.entries(ROLE_ALIASES) as [NormalizedRole, readonly string[]][]) {
    if (role === 'UNKNOWN') continue;
    if (aliases.some((a) => lower === a || lower.includes(a))) return role;
  }
  return 'UNKNOWN';
}

export function normalizePlatform(value: string): NormalizedPlatform | null {
  const upper = value.toUpperCase();
  if (/IOS|ANDROID|MOBILE|IPHONE|TRANSPORTATION/.test(upper)) return 'MOBILE';
  if (/WEB|BROWSER|SAAS/.test(upper) && !/MOBILE/.test(upper)) return 'WEB';
  if (/TABLET|IPAD/.test(upper)) return 'TABLET';
  if (/DESKTOP|WINDOWS|MAC/.test(upper)) return 'DESKTOP';
  if (upper === 'MOBILE' || upper === 'WEB' || upper === 'TABLET' || upper === 'DESKTOP') return upper as NormalizedPlatform;
  return null;
}

export function normalizeWorkflow(value: string): string {
  const lower = value.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(WORKFLOW_ALIASES)) {
    if (aliases.some((a) => lower.includes(a))) return canonical;
  }
  return lower.replace(/\s+/g, '_');
}

export function detectProductDomain(text: string): string | null {
  const lower = text.toLowerCase();
  if (/ride.?shar|uber|lyft|transport|driver|rider|dispatch/.test(lower)) return 'TRANSPORTATION';
  if (/marketplace|vendor|buyer|two.?sided/.test(lower)) return 'MARKETPLACE';
  if (/e.?commerce|checkout|cart|store/.test(lower)) return 'E_COMMERCE';
  if (/saas|dashboard|subscription|analytics/.test(lower)) return 'SAAS';
  if (/mobile app|ios|android/.test(lower)) return 'MOBILE_APP';
  return null;
}

export function normalizeEvidenceConcepts(input: {
  typedPrompt: string;
  roles: readonly string[];
  platforms: readonly string[];
  workflows: readonly string[];
  sources: readonly string[];
}): NormalizedConcept[] {
  const concepts: NormalizedConcept[] = [];

  for (const role of input.roles) {
    concepts.push({
      readOnly: true,
      canonical: normalizeRole(role),
      original: role,
      source: 'EVIDENCE',
      category: 'ROLE',
    });
  }

  for (const platform of input.platforms) {
    const normalized = normalizePlatform(platform);
    if (normalized) {
      concepts.push({
        readOnly: true,
        canonical: normalized,
        original: platform,
        source: 'EVIDENCE',
        category: 'PLATFORM',
      });
    }
  }

  for (const workflow of input.workflows) {
    concepts.push({
      readOnly: true,
      canonical: normalizeWorkflow(workflow),
      original: workflow,
      source: 'EVIDENCE',
      category: 'WORKFLOW',
    });
  }

  const domain = detectProductDomain(input.typedPrompt);
  if (domain) {
    concepts.push({
      readOnly: true,
      canonical: domain,
      original: input.typedPrompt.slice(0, 80),
      source: 'TYPED_PROMPT',
      category: 'PRODUCT',
    });
  }

  return concepts;
}

export function rolesAreComplementary(normalized: readonly NormalizedRole[]): boolean {
  const set = new Set(normalized.filter((r) => r !== 'UNKNOWN'));
  if (set.has('TRANSPORT_OPERATOR') && set.has('END_USER')) return true;
  if (set.has('VENDOR') && (set.has('CUSTOMER') || set.has('END_USER'))) return true;
  if (set.has('ADMIN') && set.has('END_USER')) return true;
  return set.size >= 2;
}
