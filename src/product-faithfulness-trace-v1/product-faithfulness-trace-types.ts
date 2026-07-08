/**
 * PRODUCT_FAITHFULNESS_EVIDENCE_TRACE_V1 — types.
 *
 * This is a debugging/tracing tool, not a protection layer and not a new authority. It never
 * blocks, purges, repairs, or scores anything — it only records and reports what evidence actually
 * flowed through the real Product Faithfulness pipeline, so the exact point where stale evidence
 * enters can be identified with file/function-level precision.
 *
 * Nothing here branches on product domain. Every finding below is a generic pipeline-shape
 * observation (metadata mismatch, module-level mutable state, fallback/recovery code path,
 * generic keyword collision) — never a rule about any specific product.
 */

/** The pipeline stage an evidence object was observed entering or leaving. */
export type PipelineStage =
  | 'PROMPT_UNDERSTANDING'
  | 'CANONICAL_PRODUCT_CONTRACT'
  | 'CONCEPT_GRAPH'
  | 'ARCHITECTURE'
  | 'FEATURE_CONTRACT'
  | 'GENERATED_MODULES'
  | 'ROUTES'
  | 'NAVIGATION'
  | 'MATERIALIZATION_MANIFEST'
  | 'WORKSPACE'
  | 'PREVIEW_DOM'
  | 'PRODUCT_FAITHFULNESS';

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  'PROMPT_UNDERSTANDING',
  'CANONICAL_PRODUCT_CONTRACT',
  'CONCEPT_GRAPH',
  'ARCHITECTURE',
  'FEATURE_CONTRACT',
  'GENERATED_MODULES',
  'ROUTES',
  'NAVIGATION',
  'MATERIALIZATION_MANIFEST',
  'WORKSPACE',
  'PREVIEW_DOM',
  'PRODUCT_FAITHFULNESS',
];

/** One evidence object observed entering (or attempting to enter) Product Faithfulness. */
export interface EvidenceTraceEntry {
  readOnly: true;
  /** Deterministic sequence number within a single trace run — used for "earliest point" ordering. */
  sequence: number;
  stage: PipelineStage;
  requestId: string;
  buildId: string;
  projectId: string;
  promptHash: string;
  /** File that produced/owns this evidence, e.g. "src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts". */
  sourceFile: string;
  /** Function/module within sourceFile that produced this evidence. */
  sourceModule: string;
  /** "Owner" in the sense of which authority/module is responsible for this evidence's correctness. */
  owner: string;
  /** Best-effort product identity implied by this evidence at the time it was recorded. */
  productIdentity: string | null;
  /** Concept names present in this evidence object. */
  conceptList: string[];
  timestamp: string;
  /** Scope id this evidence claims to belong to (mirrors Fresh Build Artifact Isolation V4's scope ids, read-only reference — this module never mints or enforces scope). */
  scopeId: string | null;
  accepted: boolean;
  reasonAccepted: string | null;
  reasonRejected: string | null;
}

export type StaleEvidenceTraceMismatchField = 'requestId' | 'buildId' | 'projectId' | 'promptHash';

/** A detected mismatch between an evidence entry and the current build's own identity. */
export interface StaleEvidenceTraceDetection {
  readOnly: true;
  entrySequence: number;
  stage: PipelineStage;
  mismatchedFields: StaleEvidenceTraceMismatchField[];
  whichObject: string;
  whichSource: string;
  producingModule: string;
  whyAccepted: string;
  whyNotRejected: string;
}

export type GlobalStateKind =
  | 'MODULE_LEVEL_MUTABLE_SINGLETON'
  | 'PROCESS_WIDE_MAP_OR_SET'
  | 'ON_DISK_CACHE_READ_BACK';

export interface GlobalStateFinding {
  readOnly: true;
  file: string;
  line: number;
  symbol: string;
  kind: GlobalStateKind;
  snippet: string;
  survivesAcrossBuilds: boolean;
  note: string;
}

export interface FallbackPathFinding {
  readOnly: true;
  file: string;
  line: number;
  function: string;
  snippet: string;
  fallsBackTo: string;
  note: string;
}

export interface RecoveryPathFinding {
  readOnly: true;
  file: string;
  line: number;
  function: string;
  snippet: string;
  /** What collection of "other stage evidence" the recovered concept is actually pulled from. */
  sourceCollectionExplanation: string;
}

export interface HardcodedConceptListFinding {
  readOnly: true;
  file: string;
  line: number;
  domainLabel: string;
  triggerKeywords: string[];
  concepts: Array<{ concept: string; keywords: string[] }>;
  /** Keywords in this bundle that are generic enough (common English words) to plausibly appear in unrelated-domain prompts/evidence. */
  riskyGenericKeywords: string[];
}

/** Result of empirically running the real extractor against an unrelated-domain prompt. */
export interface DomainCollisionProbeResult {
  readOnly: true;
  probeName: string;
  prompt: string;
  producedDomainLabel: string | null;
  producedConceptNames: string[];
  collided: boolean;
  collisionExplanation: string | null;
}

/** Result of empirically exercising resolveProjectContext with an explicitly-supplied stale id. */
export interface ProjectContextReuseProbeResult {
  readOnly: true;
  firstBuildProjectId: string;
  secondBuildRequestedProjectId: string;
  secondBuildResolvedProjectId: string;
  secondBuildCreatedNewProject: boolean;
  blockActiveProjectFallbackWasSet: boolean;
  reused: boolean;
  explanation: string;
}

export interface EarliestEntryPoint {
  readOnly: true;
  file: string;
  function: string;
  line: number;
  stage: PipelineStage;
  description: string;
}

export interface RecommendedFixDescription {
  readOnly: true;
  targetFile: string;
  targetFunction: string;
  description: string;
}

export interface ProductFaithfulnessTraceReport {
  readOnly: true;
  generatedAt: string;
  tracedPipeline: PipelineStage[];
  evidenceTraceLog: EvidenceTraceEntry[];
  staleEvidenceDetections: StaleEvidenceTraceDetection[];
  globalStateFindings: GlobalStateFinding[];
  fallbackPathFindings: FallbackPathFinding[];
  recoveryPathFindings: RecoveryPathFinding[];
  hardcodedConceptListFindings: HardcodedConceptListFinding[];
  domainCollisionProbes: DomainCollisionProbeResult[];
  projectContextReuseProbe: ProjectContextReuseProbeResult;
  earliestEntryPoint: EarliestEntryPoint;
  contributingFindings: EarliestEntryPoint[];
  recommendedFixes: RecommendedFixDescription[];
}

export const PRODUCT_FAITHFULNESS_TRACE_V1_TOKEN = 'PRODUCT_FAITHFULNESS_EVIDENCE_TRACE_V1_COMPLETE';
