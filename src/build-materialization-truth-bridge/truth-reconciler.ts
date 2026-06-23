/**

 * Build Materialization Truth Bridge — truth reconciler (Phase 26.75).

 * Applies reconciliation rules 1–4. Filesystem evidence is authoritative.

 */



import type { BuildMaterializationVerdict } from '../build-materialization-reality/build-materialization-reality-types.js';

import { BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION } from './build-materialization-truth-bridge-registry.js';

import type {

  BuildMaterializationFounderAnswers,

  BuildMaterializationTruthEvidence,

  BuildMaterializationTruthReconciliation,

  BuildTruthContradiction,

  BuildTruthContradictionKind,

  BuildTruthEvidencePriority,

  BuildTruthRootCause,

  BuildTruthVerdict,

} from './build-materialization-truth-bridge-types.js';



function mapMaterializationToBuildTruth(verdict: BuildMaterializationVerdict): BuildTruthVerdict {

  switch (verdict) {

    case 'BUILD_MATERIALIZATION_PROVEN':

      return 'BUILD_PROVEN';

    case 'EVIDENCE_PROPAGATION_FAILURE':

    case 'WORKSPACE_NOT_LINKED':

    case 'ARTIFACTS_GENERATED_NOT_LINKED':

      return 'BUILD_PARTIAL';

    default:

      return 'BUILD_NOT_PROVEN';

  }

}



function mapMaterializationToRootCause(verdict: BuildMaterializationVerdict): BuildTruthRootCause {

  switch (verdict) {

    case 'BUILD_MATERIALIZATION_PROVEN':

      return 'BUILD_MATERIALIZATION_PROVEN';

    case 'EVIDENCE_PROPAGATION_FAILURE':

      return 'EVIDENCE_PROPAGATION_FAILURE';

    case 'WORKSPACE_NOT_LINKED':

      return 'WORKSPACE_NOT_LINKED';

    case 'ARTIFACTS_GENERATED_NOT_LINKED':

      return 'ARTIFACTS_GENERATED_NOT_LINKED';

    case 'ARTIFACTS_NOT_GENERATED':

      return 'ARTIFACTS_NOT_GENERATED';

    default:

      return 'UNKNOWN';

  }

}



function mapFounderProofToBuildTruth(proofLevel: string): BuildTruthVerdict {

  if (proofLevel === 'PROVEN') return 'BUILD_PROVEN';

  if (proofLevel === 'PARTIAL') return 'BUILD_PARTIAL';

  return 'BUILD_NOT_PROVEN';

}



function pushContradiction(

  contradictions: BuildTruthContradiction[],

  kind: BuildTruthContradictionKind,

  detail: string,

  founderTestClaim: string,

  diskEvidence: string,

  lostEvidenceAuthority: string | null,

): void {

  if (kind === 'NONE') return;

  contradictions.push({

    readOnly: true,

    kind,

    detail,

    founderTestClaim,

    diskEvidence,

    lostEvidenceAuthority,

  });

}



function buildFounderAnswers(input: {

  snapshot: BuildMaterializationTruthEvidence['snapshot'];

  rootCause: BuildTruthRootCause;

  finalBuildTruth: BuildTruthVerdict;

  contradictions: readonly BuildTruthContradiction[];

  materializationReport: BuildMaterializationTruthEvidence['materializationReality']['report'];

}): BuildMaterializationFounderAnswers {

  const { snapshot, rootCause, finalBuildTruth, contradictions, materializationReport } = input;

  const didFilesExist = snapshot.existingArtifacts > 0 && snapshot.missingArtifacts === 0;

  const misreported = contradictions.some((c) => c.kind === 'ARTIFACTS_MISREPORTED_MISSING');

  const isProofBroken =

    rootCause === 'EVIDENCE_PROPAGATION_FAILURE' ||

    rootCause === 'WORKSPACE_NOT_LINKED' ||

    rootCause === 'ARTIFACTS_GENERATED_NOT_LINKED';

  const isBuildBroken =

    finalBuildTruth === 'BUILD_NOT_PROVEN' ||

    (finalBuildTruth === 'BUILD_PARTIAL' && rootCause === 'ARTIFACTS_NOT_GENERATED');



  const actions: string[] = [...materializationReport.recommendedNextActions];

  if (misreported) {

    actions.unshift(

      'Repair evidence propagation from disk scan into connected-build-execution and autonomous-build-execution-proof.',

    );

  }



  let recommendedFix = materializationReport.recommendedFix;

  if (rootCause === 'EVIDENCE_PROPAGATION_FAILURE') {

    recommendedFix =

      'Files exist on disk — fix evidence propagation so Founder Test and proof chain consume filesystem evidence.';

  } else if (rootCause === 'WORKSPACE_NOT_LINKED') {

    recommendedFix = 'Artifact files exist — connect workspace to execution proof chain.';

  } else if (rootCause === 'BUILD_MATERIALIZATION_PROVEN') {

    recommendedFix = 'Build materialization proven on disk — advance RUNTIME execution proof.';

  }



  return {

    readOnly: true,

    didFilesActuallyExist: didFilesExist,

    didFounderTestMisreportMissingArtifacts: misreported,

    whichAuthorityLostEvidence: materializationReport.verdictAnalysis.lostEvidenceAuthority,

    isBuildBroken,

    isProofPropagationBroken: isProofBroken,

    recommendedFix,

    recommendedNextActions: actions.slice(0, 6),

  };

}



export function reconcileBuildMaterializationTruth(input: {

  evidence: BuildMaterializationTruthEvidence;

  reconciliationId: string;

}): BuildMaterializationTruthReconciliation {

  const { evidence, reconciliationId } = input;

  const { snapshot, materializationReality, connectedBuild, autonomousBuildProof } = evidence;

  const materializationVerdict = materializationReality.report.primaryVerdict;

  const materializationAnalysis = materializationReality.report.verdictAnalysis;



  const preReconciliationBuildVerdict = mapFounderProofToBuildTruth(snapshot.founderBuildProofLevel);

  const contradictions: BuildTruthContradiction[] = [];

  const rulesApplied: string[] = [];



  let rootCause = mapMaterializationToRootCause(materializationVerdict);

  let finalBuildTruth = mapMaterializationToBuildTruth(materializationVerdict);

  let authoritativeSource: BuildTruthEvidencePriority = 'DISK_EVIDENCE';

  let founderTestVerdictReconciled = false;

  let truthMatrixVerdictUpdated = false;



  const diskProvesFilesExist =

    snapshot.missingArtifacts === 0 &&

    snapshot.existingArtifacts > 0 &&

    snapshot.workspaceExists;



  const founderClaimsArtifactsBroken =

    snapshot.founderFirstBrokenLink === 'artifacts→files' ||

    connectedBuild?.linkageAnalysis.firstBrokenLink === 'artifacts→files';



  const founderBuildNotProven = snapshot.founderBuildProofLevel === 'NOT_PROVEN';

  const truthMatrixSaysNotProven = snapshot.truthMatrixBuildVerdict === 'NOT_PROVEN';



  // Rule 3 — filesystem evidence outranks stale proof snapshots (applied first)

  rulesApplied.push('Rule 3 — filesystem evidence outranks stale proof snapshots');

  finalBuildTruth = mapMaterializationToBuildTruth(materializationVerdict);

  rootCause = mapMaterializationToRootCause(materializationVerdict);

  authoritativeSource = 'DISK_EVIDENCE';



  // Rule 1 — ARTIFACTS_NOT_GENERATED cannot be root cause when disk proves files exist

  if (diskProvesFilesExist) {

    rulesApplied.push(

      'Rule 1 — missingArtifacts=0 + existingArtifacts>0 + workspaceExists: ARTIFACTS_NOT_GENERATED cannot be root cause',

    );



    if (rootCause === 'ARTIFACTS_NOT_GENERATED' || founderClaimsArtifactsBroken) {

      founderTestVerdictReconciled = true;



      if (materializationVerdict === 'WORKSPACE_NOT_LINKED') {

        rootCause = 'WORKSPACE_NOT_LINKED';

        finalBuildTruth = 'BUILD_PARTIAL';

        authoritativeSource = 'WORKSPACE_EVIDENCE';

      } else if (materializationVerdict === 'BUILD_MATERIALIZATION_PROVEN') {

        rootCause = 'BUILD_MATERIALIZATION_PROVEN';

        finalBuildTruth = 'BUILD_PROVEN';

      } else {

        rootCause = 'EVIDENCE_PROPAGATION_FAILURE';

        finalBuildTruth = 'BUILD_PARTIAL';

        authoritativeSource = 'DISK_EVIDENCE';

      }



      pushContradiction(

        contradictions,

        'ARTIFACTS_MISREPORTED_MISSING',

        'Founder Test reported artifacts→files broken but disk evidence shows files exist with missingArtifacts=0.',

        `BUILD ${snapshot.founderBuildProofLevel}, firstBrokenLink=${snapshot.founderFirstBrokenLink ?? 'none'}`,

        `existingArtifacts=${snapshot.existingArtifacts}, missingArtifacts=${snapshot.missingArtifacts}, workspaceCount=${snapshot.workspaceCount}`,

        materializationAnalysis.lostEvidenceAuthority ?? 'connected-build-execution',

      );

    }

  }



  // Rule 4 — files exist but downstream proof cannot see them

  if (

    snapshot.existingArtifacts > 0 &&

    snapshot.missingArtifacts === 0 &&

    (founderBuildNotProven || founderClaimsArtifactsBroken) &&

    materializationVerdict !== 'ARTIFACTS_NOT_GENERATED'

  ) {

    rulesApplied.push(

      'Rule 4 — files exist but downstream proof cannot see them: EVIDENCE_PROPAGATION_FAILURE not ARTIFACTS_NOT_GENERATED',

    );



    if (rootCause === 'ARTIFACTS_NOT_GENERATED') {

      rootCause = 'EVIDENCE_PROPAGATION_FAILURE';

      finalBuildTruth = 'BUILD_PARTIAL';

      founderTestVerdictReconciled = true;

    } else if (

      rootCause === 'EVIDENCE_PROPAGATION_FAILURE' ||

      rootCause === 'WORKSPACE_NOT_LINKED' ||

      rootCause === 'ARTIFACTS_GENERATED_NOT_LINKED'

    ) {

      finalBuildTruth = 'BUILD_PARTIAL';

    }



    if (founderClaimsArtifactsBroken) {

      pushContradiction(

        contradictions,

        'PROOF_STALE_VS_DISK',

        'Connected build proof stale relative to disk — downstream authorities cannot see existing files.',

        `connectedBuildProofLevel=${snapshot.connectedBuildProofLevel ?? 'n/a'}, firstBrokenLink=artifacts→files`,

        `existingArtifacts=${snapshot.existingArtifacts}, materializationVerdict=${materializationVerdict}`,

        materializationAnalysis.lostEvidenceAuthority ?? 'connected-build-execution',

      );

    }

  }



  // Rule 2 — BUILD_MATERIALIZATION_PROVEN cannot coexist with NOT_PROVEN without contradiction

  if (materializationVerdict === 'BUILD_MATERIALIZATION_PROVEN') {

    rulesApplied.push(

      'Rule 2 — BUILD_MATERIALIZATION_PROVEN: Truth Matrix must not classify BUILD as NOT_PROVEN without contradictory evidence',

    );



    if (founderBuildNotProven || truthMatrixSaysNotProven) {

      pushContradiction(

        contradictions,

        'BUILD_TRUTH_CONTRADICTION',

        'Disk proves BUILD_MATERIALIZATION_PROVEN but Founder Test or Truth Matrix classifies BUILD as NOT_PROVEN.',

        `founderBuild=${snapshot.founderBuildProofLevel}, truthMatrix=${snapshot.truthMatrixBuildVerdict ?? 'n/a'}`,

        `materializationVerdict=BUILD_MATERIALIZATION_PROVEN, existingArtifacts=${snapshot.existingArtifacts}`,

        materializationAnalysis.lostEvidenceAuthority ?? 'autonomous-build-execution-proof',

      );

      rootCause = 'BUILD_MATERIALIZATION_PROVEN';

      finalBuildTruth = 'BUILD_PROVEN';

      truthMatrixVerdictUpdated = truthMatrixSaysNotProven;

      founderTestVerdictReconciled = founderBuildNotProven;

    }

  }



  if (contradictions.length > 0 && rootCause !== 'BUILD_MATERIALIZATION_PROVEN') {

    if (founderTestVerdictReconciled && rootCause === 'EVIDENCE_PROPAGATION_FAILURE') {

      // keep propagation root cause

    } else if (contradictions.some((c) => c.kind === 'ARTIFACTS_MISREPORTED_MISSING')) {

      rootCause = 'FOUNDER_TEST_MISREPORT';

    }

  }



  const founderAnswers = buildFounderAnswers({

    snapshot,

    rootCause,

    finalBuildTruth,

    contradictions,

    materializationReport: materializationReality.report,

  });



  let recommendedFix = founderAnswers.recommendedFix;

  if (contradictions.some((c) => c.kind === 'BUILD_TRUTH_CONTRADICTION')) {

    recommendedFix =

      'Disk evidence proves build materialization — reconcile Founder Test and Truth Matrix to use filesystem-authoritative BUILD verdict.';

  }



  return {

    readOnly: true,

    operationId: BUILD_MATERIALIZATION_TRUTH_RECONCILIATION_OPERATION,

    reconciliationId,

    generatedAt: new Date().toISOString(),

    preReconciliationBuildVerdict,

    postReconciliationBuildVerdict: finalBuildTruth,

    rootCause,

    materializationVerdict,

    contradictions,

    contradictionCount: contradictions.length,

    rulesApplied,

    truthMatrixVerdictUpdated,

    founderTestVerdictReconciled,

    authoritativeSource,

    recommendedFix,

    founderAnswers,

  };

}



export function buildTruthMatrixBuildClaimFromReconciliation(

  reconciliation: BuildMaterializationTruthReconciliation,

): {

  truthMatrixVerdict: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

  rootCause: 'EVIDENCE_PROPAGATION_FAILURE' | 'REAL_PRODUCT_GAP' | 'AUTHORITY_DISAGREEMENT' | 'UNKNOWN';

  contradictionDetected: boolean;

  contradictionReason: string;

} {

  const truthMatrixVerdict =

    reconciliation.postReconciliationBuildVerdict === 'BUILD_PROVEN'

      ? 'PROVEN'

      : reconciliation.postReconciliationBuildVerdict === 'BUILD_PARTIAL'

        ? 'PARTIAL'

        : 'NOT_PROVEN';



  let rootCause: 'EVIDENCE_PROPAGATION_FAILURE' | 'REAL_PRODUCT_GAP' | 'AUTHORITY_DISAGREEMENT' | 'UNKNOWN' =

    'UNKNOWN';

  if (

    reconciliation.rootCause === 'EVIDENCE_PROPAGATION_FAILURE' ||

    reconciliation.rootCause === 'WORKSPACE_NOT_LINKED' ||

    reconciliation.rootCause === 'ARTIFACTS_GENERATED_NOT_LINKED' ||

    reconciliation.rootCause === 'FOUNDER_TEST_MISREPORT'

  ) {

    rootCause = 'EVIDENCE_PROPAGATION_FAILURE';

  } else if (reconciliation.rootCause === 'BUILD_MATERIALIZATION_PROVEN') {

    rootCause = 'AUTHORITY_DISAGREEMENT';

  } else if (reconciliation.rootCause === 'ARTIFACTS_NOT_GENERATED') {

    rootCause = 'REAL_PRODUCT_GAP';

  }



  const contradictionDetected = reconciliation.contradictionCount > 0;

  const contradictionReason = reconciliation.contradictions

    .map((c) => `${c.kind}: ${c.detail}`)

    .join(' | ');



  return {

    truthMatrixVerdict,

    rootCause,

    contradictionDetected,

    contradictionReason: contradictionReason || 'BUILD_MATERIALIZATION_TRUTH reconciliation applied.',

  };

}



export function derivePreReconciliationBuildVerdict(

  evidence: BuildMaterializationTruthEvidence,

): BuildTruthVerdict {

  return mapFounderProofToBuildTruth(evidence.snapshot.founderBuildProofLevel);

}



export function shouldSuppressArtifactsBrokenBlocker(

  reconciliation: BuildMaterializationTruthReconciliation,

): boolean {

  return (

    reconciliation.founderTestVerdictReconciled &&

    reconciliation.founderAnswers.didFilesActuallyExist &&

    (reconciliation.rootCause === 'EVIDENCE_PROPAGATION_FAILURE' ||

      reconciliation.rootCause === 'WORKSPACE_NOT_LINKED' ||

      reconciliation.rootCause === 'BUILD_MATERIALIZATION_PROVEN' ||

      reconciliation.rootCause === 'FOUNDER_TEST_MISREPORT')

  );

}

export function applyBuildMaterializationTruthToClaims<T extends {
  claimId: string;
  truthMatrixVerdict: string;
  rootCause: string;
  launchImpact: string;
  contradictionDetected: boolean;
  contradictionReason: string;
}>(
  claims: T[],
  reconciliation: BuildMaterializationTruthReconciliation,
): T[] {
  const buildClaimPatch = buildTruthMatrixBuildClaimFromReconciliation(reconciliation);
  return claims.map((claim) => {
    if (claim.claimId !== 'AIDEVENGINE_BUILDS_APPLICATIONS') return claim;
    const launchImpact =
      buildClaimPatch.rootCause === 'EVIDENCE_PROPAGATION_FAILURE'
        ? 'HIGH'
        : buildClaimPatch.rootCause === 'REAL_PRODUCT_GAP'
          ? claim.launchImpact
          : buildClaimPatch.truthMatrixVerdict === 'PROVEN'
            ? 'NONE'
            : 'MEDIUM';
    return {
      ...claim,
      truthMatrixVerdict: buildClaimPatch.truthMatrixVerdict,
      rootCause: buildClaimPatch.rootCause,
      launchImpact,
      contradictionDetected:
        claim.contradictionDetected || buildClaimPatch.contradictionDetected,
      contradictionReason: buildClaimPatch.contradictionReason,
    };
  });
}


