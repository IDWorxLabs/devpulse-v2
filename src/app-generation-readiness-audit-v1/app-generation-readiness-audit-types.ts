/**
 * App Generation Readiness Audit V1 — types.
 *
 * This module is read-only and observational. It inspects the existing AiDevEngine V4
 * generation pipeline (server routes, orchestrator, materialization engine, faithfulness
 * engines, live preview) and records evidence-backed findings about why the engine can fail
 * to reliably build complete, correct applications from user prompts.
 *
 * It does not import, call, or mutate any generation-pipeline module. It does not branch on
 * product domain (calculator/restaurant/booking/CRM/etc.) — any product names that appear in
 * this module are quoted as *evidence of an observed failure pattern*, never as conditional
 * logic that changes behavior for that domain.
 */

/** The 17 stages of the app-generation pipeline this audit is required to cover. */
export type PipelineStageId =
  | 'USER_PROMPT_INTAKE'
  | 'PROJECT_CONTEXT_RESOLUTION'
  | 'PROMPT_RESET_NEW_BUILD_DETECTION'
  | 'CANONICAL_PRODUCT_CONTRACT_CREATION'
  | 'PRODUCT_IDENTITY_PRESERVATION'
  | 'PLANNING'
  | 'ARCHITECTURE_GENERATION'
  | 'UNIVERSAL_FEATURE_CONTRACT_GENERATION'
  | 'MODULE_SELECTION'
  | 'GENERATED_MODULES'
  | 'ROUTES'
  | 'NAVIGATION'
  | 'MATERIALIZATION_MANIFEST'
  | 'RUNTIME_ACTIVATION'
  | 'LIVE_PREVIEW_PROOF'
  | 'PRODUCT_FAITHFULNESS_EVALUATION'
  | 'FAILURE_REPORTING';

export interface EvidenceCitation {
  /** Repository-relative path, forward-slashed, e.g. "src/one-prompt-live-preview/one-prompt-build-orchestrator.ts". */
  file: string;
  function?: string;
  /** Human-readable line hint captured at audit time (source drifts; treat as approximate). */
  lines?: string;
  note: string;
}

export interface PipelineStageEvidence {
  id: PipelineStageId;
  order: number;
  name: string;
  description: string;
  primaryFiles: string[];
  primaryFunctions: string[];
  /** The module/authority that owns this stage's pass/fail decision, if any single one exists. */
  ownedBy: string;
  /** Whether this audit found a single, unambiguous owner for this stage's success/failure verdict. */
  hasUnambiguousOwner: boolean;
  evidence: EvidenceCitation[];
}

export interface StateStoreEntry {
  store: string;
  file: string;
  scopeKey: 'PROJECT_ID' | 'PROCESS_GLOBAL' | 'SESSION' | 'NONE';
  scopedCorrectly: boolean;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: EvidenceCitation[];
}

export type FindingCategory =
  | 'PROJECT_CONTEXT_ISOLATION'
  | 'STALE_CONTEXT_CONTAMINATION'
  | 'FALLBACK_MODULE_CONTAMINATION'
  | 'CONTRACT_DRIFT'
  | 'FAITHFULNESS_LATE_DETECTION'
  | 'REPAIR_LIMITATION'
  | 'RUNTIME_FAILURE_OWNERSHIP'
  | 'MISSING_AUTHORITY';

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  summary: string;
  relatedStages: PipelineStageId[];
  evidence: EvidenceCitation[];
  filesResponsible: string[];
  functionsResponsible: string[];
}

export interface MissingAuthority {
  id: string;
  title: string;
  description: string;
  evidence: EvidenceCitation[];
}

export interface FixSequenceStep {
  order: number;
  title: string;
  rationale: string;
  addressesFindingIds: string[];
}

export interface RiskRankEntry {
  findingId: string;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  justification: string;
}

export interface AppGenerationReadinessAuditAssessment {
  pipelineStages: PipelineStageEvidence[];
  stateOwnershipMap: StateStoreEntry[];
  currentPromptEvidenceSources: EvidenceCitation[];
  previousProjectEvidenceSources: EvidenceCitation[];
  findings: Finding[];
  missingAuthorities: MissingAuthority[];
  fixSequence: FixSequenceStep[];
  riskRanking: RiskRankEntry[];

  /** Deduplicated, sorted list of every file path cited anywhere in this assessment. */
  filesInspected: string[];
  evidenceFilesChecked: number;
  evidenceFilesFound: number;
  evidenceFileExistenceRatio: number;

  stagesCovered: number;
  totalStagesRequired: number;

  categoriesIdentified: FindingCategory[];

  /** Structural guarantees, true by construction of this module (see index.ts self-check in the validator). */
  noAppSpecificFixesApplied: true;
  noProductDomainsHardcoded: true;
  noExistingBehaviorModified: true;
  noValidatorsWeakened: true;

  auditProofStatus: 'PROVEN' | 'INCOMPLETE';
  passToken: string;
}
