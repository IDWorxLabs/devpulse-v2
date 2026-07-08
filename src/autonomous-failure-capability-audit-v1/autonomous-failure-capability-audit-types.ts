/**
 * Autonomous Failure Diagnosis + Capability Detection Audit V1 — types.
 *
 * This module is an AUDIT TOOL ONLY. It inspects real files already on disk (existence, content,
 * and real import graphs) and reports what it finds. It does not modify generation behavior, does
 * not apply any repair, and does not create any new authority/protection layer of its own — it is
 * read-only, deterministic, and only describes what already exists in the codebase.
 */

export const AUTONOMOUS_FAILURE_CAPABILITY_AUDIT_V1_CONTRACT =
  'AUTONOMOUS_FAILURE_CAPABILITY_AUDIT_V1' as const;

/** The high-level question each catalogued system is meant to answer. */
export type AuditSystemCategory =
  | 'FAILURE_DIAGNOSIS'
  | 'REPAIR'
  | 'CAPABILITY_DETECTION'
  | 'SUPPORTING_INFRASTRUCTURE';

/** One of the seven failure classes the audit brief asked whether the engine can distinguish. */
export type AuditFailureClass =
  | 'COMPILER_ERROR'
  | 'RUNTIME_HANG'
  | 'PRODUCT_DRIFT'
  | 'STALE_EVIDENCE'
  | 'CONTRACT_DRIFT'
  | 'MISSING_MODULE'
  | 'PREVIEW_FAILURE';

/** Real, on-disk evidence backing a single claim in the report — always cites a real file. */
export interface AuditEvidenceCitation {
  readOnly: true;
  file: string;
  /** Exact line number when known, null when the evidence is "file exists" / "file absent". */
  line: number | null;
  /** Short quoted/paraphrased snippet or marker that was actually found (or NOT found) in the file. */
  detail: string;
}

/** One entry in the system catalog this audit inspects. */
export interface AuditCandidateSystemDefinition {
  readOnly: true;
  id: string;
  displayName: string;
  category: AuditSystemCategory;
  /** Module directory relative to repo root, e.g. "src/autonomous-recovery-authority". */
  moduleDir: string;
  /** One-line description of what the module's name/docstring claims to do. */
  claim: string;
  /** Optional specific file (relative to moduleDir) + marker regex source used to confirm real logic. */
  realLogicProbe: { relativeFile: string; markerPattern: string; markerDescription: string } | null;
  /**
   * Optional probe proving the module's function is not merely import-reachable but is literally
   * INVOKED (a real call expression, e.g. "someFn(") at a specific real file, outside its own
   * directory. Import-graph reachability alone is a weak signal in this codebase (almost 60% of
   * all src/ modules are transitively import-reachable from the entrypoint through long, often
   * unrelated chains) — this stronger probe is what actually distinguishes "part of the real
   * failure/repair decision path" from "merely bundled in".
   */
  callSiteProbe: { file: string; markerPattern: string; markerDescription: string } | null;
}

/** Computed, real-file-grounded verdict for one candidate system. */
export interface AuditCandidateSystemResult {
  readOnly: true;
  definition: AuditCandidateSystemDefinition;
  existsOnDisk: boolean;
  fileCount: number;
  /** True when the real-logic probe matched, or (when no probe defined) a heuristic found non-trivial exports. */
  hasRealLogicEvidence: boolean;
  realLogicCitation: AuditEvidenceCitation | null;
  /** True when this module is reachable, via real import statements, from the confirmed production entrypoint. */
  wiredIntoProduction: boolean;
  /** Import chain from the entrypoint to this module, when wired (shortest path found by the BFS). */
  wiringPathFromEntrypoint: readonly string[];
  /** True only when callSiteProbe matched a real invocation outside the module's own directory. */
  directlyInvokedEvidence: boolean;
  directlyInvokedCitation: AuditEvidenceCitation | null;
  verdict: 'WIRED_AND_REAL' | 'REAL_BUT_UNUSED' | 'EXISTS_BUT_NO_REAL_LOGIC_FOUND' | 'MISSING';
  oneLineFinding: string;
}

/** Computed, real-file-grounded verdict for one of the seven requested failure classes. */
export interface AuditFailureClassCoverageResult {
  readOnly: true;
  failureClass: AuditFailureClass;
  handled: boolean;
  citation: AuditEvidenceCitation | null;
  ownerModule: string | null;
  note: string;
}

/** The exact reachability computation proving (or disproving) "wired into the real build path". */
export interface AuditProductionReachabilityReport {
  readOnly: true;
  entrypointFile: string;
  entrypointExists: boolean;
  filesVisited: number;
  modulesReached: readonly string[];
  computedDeterministically: true;
}

export interface AuditRecommendedStep {
  readOnly: true;
  order: number;
  title: string;
  rationale: string;
  dependsOnExistingSystems: readonly string[];
}

export interface AutonomousFailureCapabilityAuditReport {
  readOnly: true;
  contractVersion: typeof AUTONOMOUS_FAILURE_CAPABILITY_AUDIT_V1_CONTRACT;
  generatedAt: string;
  repoRoot: string;
  reachability: AuditProductionReachabilityReport;
  systems: readonly AuditCandidateSystemResult[];
  failureClassCoverage: readonly AuditFailureClassCoverageResult[];
  existingFailureDiagnosisSystems: readonly AuditCandidateSystemResult[];
  existingRepairSystems: readonly AuditCandidateSystemResult[];
  existingCapabilityDetectionSystems: readonly AuditCandidateSystemResult[];
  wiredIntoProduction: readonly AuditCandidateSystemResult[];
  existsButUnused: readonly AuditCandidateSystemResult[];
  missingOrNotFound: readonly AuditCandidateSystemResult[];
  failureClassesHandled: readonly AuditFailureClass[];
  failureClassesNotHandled: readonly AuditFailureClass[];
  /** Answers audit questions 7-11 with direct file:line citations, description-only (no fix applied). */
  earliestStoppingPoint: {
    readOnly: true;
    file: string;
    functionName: string;
    description: string;
    citation: AuditEvidenceCitation;
  };
  missingCapabilityEvolutionGapFinding: {
    readOnly: true;
    description: string;
    wiredCitation: AuditEvidenceCitation;
    notWiredCitation: AuditEvidenceCitation;
  };
  contractBoundGenerationAuthorityAssessment: {
    readOnly: true;
    alreadyImplied: boolean;
    reasoning: string;
    supportingCitations: readonly AuditEvidenceCitation[];
  };
  recommendedImplementationOrder: readonly AuditRecommendedStep[];
}
