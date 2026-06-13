/**

 * Phase 26 — LLM chat brain shared types.

 */



import type { LlmProvider, LlmProviderName } from './llm-provider-types.js';

import type { DevPulseContextPackage } from './devpulse-context-package.js';

import type { LlmAnswerJudgement } from './llm-answer-judge.js';



export interface LlmChatBrainInput {

  message: string;

  draftResponse?: string;

  rootDir?: string;

  timestamp?: number;

  /** Test injection only — never set in production routes */

  providerOverride?: LlmProvider;

}



export interface LlmChatBrainMetadata {

  readOnly: true;

  usedLlm: boolean;

  llmConnected: boolean;

  fallbackUsed: boolean;

  provider: LlmProviderName | null;

  model: string | null;

  contextIncluded: boolean;

  evidenceIncluded: boolean;

  judgeScore: number | null;

  warnings: string[];

  repaired: boolean;

  repairAttempted: boolean;

  contextSourcesUsed: string[];

  lastContextHydration: 'SUCCESS' | 'PARTIAL' | 'SKIPPED' | null;

  hydratedFactCount: number;

  contextConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;

  identityLoaded: boolean;

  founderLoaded: boolean;

  productLoaded: boolean;

  historyLoaded: boolean;

  selfEvolutionLoaded: boolean;

  identityVersion: string | null;

  founderVersion: string | null;

  productVersion: string | null;

  currentProductIdentity: string | null;

  founderIdentity: string | null;

  companyIdentity: string | null;

  legacyIdentity: string | null;

}



export interface LlmChatBrainResponse {

  readOnly: true;

  finalAnswer: string;

  metadata: LlmChatBrainMetadata;

  judgement?: LlmAnswerJudgement;

  contextPackage?: DevPulseContextPackage;

}



export interface LlmChatBrainDiagnostics {

  readOnly: true;

  usedLlm: boolean;

  llmConnected: boolean;

  fallbackUsed: boolean;

  provider: string | null;

  model: string | null;

  contextIncluded: boolean;

  evidenceIncluded: boolean;

  judgeScore: number | null;

  warnings: string[];

  repaired: boolean;

  repairAttempted: boolean;

  contextSourcesUsed: string[];

  lastContextHydration: 'SUCCESS' | 'PARTIAL' | 'SKIPPED' | null;

  hydratedFactCount: number;

  contextConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;

  identityLoaded: boolean;

  founderLoaded: boolean;

  productLoaded: boolean;

  historyLoaded: boolean;

  selfEvolutionLoaded: boolean;

  identityVersion: string | null;

  founderVersion: string | null;

  productVersion: string | null;

  currentProductIdentity: string | null;

  founderIdentity: string | null;

  companyIdentity: string | null;

  legacyIdentity: string | null;

}



export function metadataFromContextPackage(

  contextPackage?: DevPulseContextPackage,

): Pick<

  LlmChatBrainMetadata,

  | 'contextIncluded'

  | 'evidenceIncluded'

  | 'contextSourcesUsed'

  | 'lastContextHydration'

  | 'hydratedFactCount'

  | 'contextConfidence'

  | 'identityLoaded'

  | 'founderLoaded'

  | 'productLoaded'

  | 'historyLoaded'

  | 'selfEvolutionLoaded'

  | 'identityVersion'

  | 'founderVersion'

  | 'productVersion'

  | 'currentProductIdentity'

  | 'founderIdentity'

  | 'companyIdentity'

  | 'legacyIdentity'

> {

  const fd = contextPackage?.foundationDiagnostics;

  return {

    contextIncluded: contextPackage?.contextIncluded ?? false,

    evidenceIncluded: contextPackage?.evidence.some((e) => e.level !== 'UNKNOWN') ?? false,

    contextSourcesUsed: contextPackage?.contextSourcesUsed ?? [],

    lastContextHydration: contextPackage?.hydration?.status ?? null,

    hydratedFactCount: contextPackage?.hydratedFactCount ?? 0,

    contextConfidence: contextPackage?.contextConfidence ?? null,

    identityLoaded: fd?.identityLoaded ?? false,

    founderLoaded: fd?.founderLoaded ?? false,

    productLoaded: fd?.productLoaded ?? false,

    historyLoaded: fd?.historyLoaded ?? false,

    selfEvolutionLoaded: fd?.selfEvolutionLoaded ?? false,

    identityVersion: fd?.identityVersion ?? null,

    founderVersion: fd?.founderVersion ?? null,

    productVersion: fd?.productVersion ?? null,

    currentProductIdentity: fd?.currentProductIdentity ?? null,

    founderIdentity: fd?.founderIdentity ?? null,

    companyIdentity: fd?.companyIdentity ?? null,

    legacyIdentity: fd?.legacyIdentity ?? null,

  };

}



export function toLlmChatBrainDiagnostics(metadata: LlmChatBrainMetadata): LlmChatBrainDiagnostics {

  return {

    readOnly: true,

    usedLlm: metadata.usedLlm,

    llmConnected: metadata.llmConnected,

    fallbackUsed: metadata.fallbackUsed,

    provider: metadata.provider,

    model: metadata.model,

    contextIncluded: metadata.contextIncluded,

    evidenceIncluded: metadata.evidenceIncluded,

    judgeScore: metadata.judgeScore,

    warnings: metadata.warnings,

    repaired: metadata.repaired,

    repairAttempted: metadata.repairAttempted,

    contextSourcesUsed: metadata.contextSourcesUsed,

    lastContextHydration: metadata.lastContextHydration,

    hydratedFactCount: metadata.hydratedFactCount,

    contextConfidence: metadata.contextConfidence,

    identityLoaded: metadata.identityLoaded,

    founderLoaded: metadata.founderLoaded,

    productLoaded: metadata.productLoaded,

    historyLoaded: metadata.historyLoaded,

    selfEvolutionLoaded: metadata.selfEvolutionLoaded,

    identityVersion: metadata.identityVersion,

    founderVersion: metadata.founderVersion,

    productVersion: metadata.productVersion,

    currentProductIdentity: metadata.currentProductIdentity,

    founderIdentity: metadata.founderIdentity,

    companyIdentity: metadata.companyIdentity,

    legacyIdentity: metadata.legacyIdentity,

  };

}



export const REAL_LLM_CHAT_BRAIN_INTEGRATION_PASS_TOKEN = 'REAL_LLM_CHAT_BRAIN_INTEGRATION_PASS';

