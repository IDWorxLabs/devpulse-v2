/**
 * Phase 26.3 — Product memory foundation loader for LLM context.
 */

import { loadIdentityFoundation, serializeIdentityForLlm } from '../identity-foundation/index.js';
import { loadFounderFoundation, serializeFounderForLlm } from '../founder-foundation/index.js';
import { loadProductFoundation, serializeProductForLlm } from '../product-foundation/index.js';
import {
  loadHistoryFoundation,
  serializeHistoryForLlm,
} from '../history-foundation/index.js';
import {
  loadSelfEvolutionFoundation,
  serializeSelfEvolutionForLlm,
} from '../self-evolution-foundation/index.js';
import { IDENTITY_FOUNDATION_VERSION } from '../identity-foundation/identity-foundation-types.js';
import {
  COMPANY_IDENTITY,
  CURRENT_PRODUCT_NAME,
  FOUNDER_IDENTITY,
  isLegacyProductQuestion,
  LEGACY_PRODUCT_NAME,
} from '../identity-foundation/legacy-product-identity.js';
import { FOUNDER_FOUNDATION_VERSION } from '../founder-foundation/founder-profile.js';
import { PRODUCT_FOUNDATION_VERSION } from '../product-foundation/product-profile.js';
import { HISTORY_FOUNDATION_VERSION } from '../history-foundation/history-memory-types.js';
import { SELF_EVOLUTION_FOUNDATION_VERSION } from '../self-evolution-foundation/self-evolution-profile.js';

export interface ProductMemoryFoundationDiagnostics {
  readOnly: true;
  identityLoaded: boolean;
  founderLoaded: boolean;
  productLoaded: boolean;
  historyLoaded: boolean;
  selfEvolutionLoaded: boolean;
  identityVersion: string;
  founderVersion: string;
  productVersion: string;
  historyVersion: string | null;
  selfEvolutionVersion: string | null;
  currentProductIdentity: string;
  founderIdentity: string;
  companyIdentity: string;
  legacyIdentity: string;
}

export interface ProductMemoryFoundationBundle {
  readOnly: true;
  identityText: string;
  founderText: string;
  productText: string;
  historyText: string | null;
  selfEvolutionText: string | null;
  diagnostics: ProductMemoryFoundationDiagnostics;
}

export function selectOptionalProductMemoryFoundations(message: string): {
  history: boolean;
  selfEvolution: boolean;
} {
  const lower = message.toLowerCase();

  const history =
    isLegacyProductQuestion(message) ||
    /\b(what did we fix|fix today|what changed|recent phases|completed phases|history|checkpoint|rollback|milestone|breakthrough)\b/i.test(
      lower,
    );

  const selfEvolution =
    /\b(weakness(?:es)?|weak point|where are you lacking|what are you bad at|what do you struggle|your capabilities|what can you do|how can you help|self aware|self-aware|gaps?|deficien|architectural risk)\b/i.test(
      lower,
    ) && !/\b(project|devpulse|launch ready|blocking us)\b/i.test(lower);

  return { history, selfEvolution };
}

export function loadProductMemoryFoundations(input?: {
  message?: string;
}): ProductMemoryFoundationBundle {
  const message = input?.message?.trim() ?? '';
  const optional = message ? selectOptionalProductMemoryFoundations(message) : { history: true, selfEvolution: true };

  const identity = loadIdentityFoundation();
  const founder = loadFounderFoundation();
  const product = loadProductFoundation();

  const history = optional.history ? loadHistoryFoundation(message || 'default') : null;
  const selfEvolution = optional.selfEvolution ? loadSelfEvolutionFoundation() : null;

  return {
    readOnly: true,
    identityText: serializeIdentityForLlm(identity.profile),
    founderText: serializeFounderForLlm(founder.profile),
    productText: serializeProductForLlm(product.profile),
    historyText: history ? serializeHistoryForLlm(history.summary) : null,
    selfEvolutionText: selfEvolution ? serializeSelfEvolutionForLlm(selfEvolution.profile) : null,
    diagnostics: {
      readOnly: true,
      identityLoaded: true,
      founderLoaded: true,
      productLoaded: true,
      historyLoaded: Boolean(history),
      selfEvolutionLoaded: Boolean(selfEvolution),
      identityVersion: IDENTITY_FOUNDATION_VERSION,
      founderVersion: FOUNDER_FOUNDATION_VERSION,
      productVersion: PRODUCT_FOUNDATION_VERSION,
      historyVersion: history ? HISTORY_FOUNDATION_VERSION : null,
      selfEvolutionVersion: selfEvolution ? SELF_EVOLUTION_FOUNDATION_VERSION : null,
      currentProductIdentity: CURRENT_PRODUCT_NAME,
      founderIdentity: FOUNDER_IDENTITY,
      companyIdentity: COMPANY_IDENTITY,
      legacyIdentity: LEGACY_PRODUCT_NAME,
    },
  };
}

export function serializeProductMemoryForLlm(bundle: ProductMemoryFoundationBundle): string {
  const lines: string[] = [
    '=== Product Memory Foundation (factual — do not invent beyond this) ===',
    '',
    '--- Identity Foundation ---',
    bundle.identityText,
    '',
    '--- Founder Foundation ---',
    bundle.founderText,
    '',
    '--- Product Foundation ---',
    bundle.productText,
  ];

  if (bundle.historyText) {
    lines.push('', '--- History Foundation ---', bundle.historyText);
  }
  if (bundle.selfEvolutionText) {
    lines.push('', '--- Self-Evolution Foundation ---', bundle.selfEvolutionText);
  }

  lines.push(
    '',
    `Identity rules: ${CURRENT_PRODUCT_NAME} is the current product. Created by ${FOUNDER_IDENTITY}. Product of ${COMPANY_IDENTITY}. ${LEGACY_PRODUCT_NAME} is historical only. Not human conscious.`,
  );

  return lines.join('\n');
}
