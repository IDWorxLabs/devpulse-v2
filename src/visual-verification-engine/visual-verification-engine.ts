/**

 * Visual Verification Engine — Phase 16.6 orchestrator.

 * Pure function — visual outcome verification only, no UI modification.

 */



import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';

import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';

import { executeInteractionTesting } from '../interaction-testing-engine/interaction-testing-engine.js';
import { inspectUiSurface } from '../ui-inspection-engine/ui-inspection-engine.js';

import { getSelfVisionSession } from '../self-vision-runtime/self-vision-session-registry.js';

import { publishVisualVerificationFeedStages } from '../operator-feed/visual-verification-feed-bridge.js';

import { parseVisualVerificationQuery } from './visual-verification-request-parser.js';

import { classifyVerificationTargets } from './verification-target-classifier.js';

import { verifyLayoutTargets } from './layout-verification-engine.js';

import { verifyNavigationTargets } from './navigation-verification-engine.js';

import { verifyLoadingTargets } from './loading-verification-engine.js';

import { verifyResponsiveTargets } from './responsive-verification-engine.js';

import { verifyInteractionOutcomes } from './interaction-outcome-verifier.js';

import { buildVerificationEvidence } from './verification-evidence-builder.js';

import { classifyVerificationRisks } from './verification-risk-engine.js';

import {

  evaluateVisualVerificationGates,

  validateVisualVerification,

  deriveVerificationStatus,

} from './visual-verification-validator.js';

import {

  buildVisualVerificationReport,

  composeVisualVerificationResponse,

} from './visual-verification-report.js';

import {

  getVisualVerificationDiagnostics,

  updateVisualVerificationDiagnostics,

} from './visual-verification-diagnostics.js';

import {

  isDuplicateVisualVerificationQuestion,

  type VerifyVisualOutcomeInput,

  type VerifyVisualOutcomeResult,

  type VisualVerificationReport,

} from './types.js';

import type { InteractionTestingReport } from '../interaction-testing-engine/types.js';

import type { UiInspectionReport } from '../ui-inspection-engine/types.js';

import type { PreviewContextSnapshot } from '../ui-inspection-engine/types.js';

import type { SelfVisionSession } from '../self-vision-runtime/types.js';



function resolveInputFromQuery(

  query: string,

  overrides: Partial<VerifyVisualOutcomeInput> = {},

): VerifyVisualOutcomeInput {

  const snapshot = buildWorkspaceSnapshot();

  const project = resolveActiveProject(snapshot);

  const owner = getDevPulseV2Owner('visual_verification_engine');



  return {

    query,

    projectId: project.projectId,

    workspaceId: project.workspaceId,

    targetName: 'DevPulse V2 Web App',

    projectExists: project.projectId !== 'none',

    workspaceExists: project.workspaceId !== 'none',

    world1Protected: true,

    ownershipValid: owner.ownerModule === 'devpulse_v2_visual_verification_engine',

    ...overrides,

  };

}



function blockedReport(

  query: string,

  reason: string,

  partial: Partial<VisualVerificationReport> = {},

): VerifyVisualOutcomeResult {

  const report = buildVisualVerificationReport({

    inspectionId: null,

    interactionTestId: null,

    selfVisionSessionId: null,

    projectId: partial.projectId ?? 'unknown',

    workspaceId: partial.workspaceId ?? 'unknown',

    verificationStatus: 'VERIFICATION_BLOCKED',

    verificationTargets: [],

    verificationResults: [],

    verificationEvidence: [],

    verificationRisks: [],

    blockedReasons: [reason],

    warnings: [],

    ...partial,

  });

  updateVisualVerificationDiagnostics(query, 'VERIFICATION_BLOCKED', 0, 0);

  publishVisualVerificationFeedStages(query, false);

  return {

    visualVerificationReport: report,

    diagnostics: getVisualVerificationDiagnostics(),

    responseText: composeVisualVerificationResponse(query, report),

  };

}



export function verifyVisualOutcome(input: VerifyVisualOutcomeInput): VerifyVisualOutcomeResult {

  const query = input.query ?? 'What verification passed?';



  if (isDuplicateVisualVerificationQuestion(query)) {

    return blockedReport(

      query,

      'Duplicate engine rejected — use visual_verification_engine extension only',

      {

        projectId: input.projectId ?? 'unknown',

        workspaceId: input.workspaceId ?? 'unknown',

      },

    );

  }



  parseVisualVerificationQuery(query);



  let inspectionReport: UiInspectionReport | null = input.inspectionReport ?? null;

  let interactionReport: InteractionTestingReport | null = input.interactionTestingReport ?? null;

  let selfVisionSession: SelfVisionSession | null = input.selfVisionSession ?? null;

  let previewContext: PreviewContextSnapshot | null = input.previewContext ?? null;



  if (!input.suppressRuntimeBootstrap) {
    if (!inspectionReport) {
      const inspection = inspectUiSurface({
        query,
        projectId: input.projectId ?? 'unknown',
        workspaceId: input.workspaceId ?? 'unknown',
        targetName: input.targetName ?? 'DevPulse V2 Web App',
        projectExists: input.projectExists ?? true,
        workspaceExists: input.workspaceExists ?? true,
        world1Protected: input.world1Protected ?? true,
        ownershipValid: true,
      });
      inspectionReport = inspection.inspectionReport;
    }

    selfVisionSession =
      selfVisionSession ??
      (inspectionReport?.selfVisionSessionId
        ? getSelfVisionSession(inspectionReport.selfVisionSessionId)
        : null);

    previewContext = previewContext ?? {
      projectId: input.projectId ?? inspectionReport?.projectId ?? 'unknown',
      workspaceId: input.workspaceId ?? inspectionReport?.workspaceId ?? 'unknown',
      targetType: selfVisionSession?.targetType ?? 'WEB_APP',
      targetName: input.targetName ?? 'DevPulse V2 Web App',
      previewUrl: null,
      previewSessionId: selfVisionSession?.previewSessionId ?? null,
    };

    if (!interactionReport) {
      const interaction = executeInteractionTesting({
        query,
        inspectionReport,
        selfVisionSession,
        previewContext,
        projectId: input.projectId ?? inspectionReport?.projectId,
        workspaceId: input.workspaceId ?? inspectionReport?.workspaceId,
        targetName: input.targetName,
        projectExists: input.projectExists,
        workspaceExists: input.workspaceExists,
        world1Protected: input.world1Protected,
        ownershipValid: true,
      });
      interactionReport = interaction.interactionTestingReport;
    }
  }



  const inspectionReportExists =

    input.inspectionReportExists ??

    (inspectionReport !== null && inspectionReport.inspectionState !== 'INSPECTION_BLOCKED');

  const interactionReportExists =

    input.interactionReportExists ??

    (interactionReport !== null && interactionReport.interactionState !== 'BLOCKED');

  const selfVisionSessionExists =

    input.selfVisionSessionExists ??

    (selfVisionSession !== null && selfVisionSession.observationState !== 'OBSERVATION_BLOCKED');

  const previewContextExists = input.previewContextExists ?? previewContext !== null;



  const gateReport = evaluateVisualVerificationGates(input, {

    inspectionReportExists,

    interactionReportExists,

    selfVisionSessionExists,

    previewContextExists,

  });



  const validation = validateVisualVerification({

    gateReport,

    inspectionReport,

    interactionReport,

    session: selfVisionSession,

  });



  const verificationTargets =

    inspectionReportExists || interactionReportExists

      ? classifyVerificationTargets(inspectionReport, interactionReport)

      : [];



  let verificationResults: VisualVerificationReport['verificationResults'] = [];



  if (validation.valid && verificationTargets.length > 0) {

    verificationResults = [

      ...verifyLayoutTargets(verificationTargets, inspectionReport),

      ...verifyNavigationTargets(verificationTargets, inspectionReport),

      ...verifyLoadingTargets(verificationTargets, inspectionReport),

      ...verifyResponsiveTargets(verificationTargets, inspectionReport),

      ...verifyInteractionOutcomes(verificationTargets, interactionReport),

    ];

  }



  const verificationEvidence =

    validation.valid && verificationResults.length > 0

      ? buildVerificationEvidence(verificationResults, selfVisionSession)

      : [];



  const verificationRisks =

    validation.valid && verificationResults.length > 0

      ? classifyVerificationRisks(verificationResults, verificationEvidence)

      : [];



  const valid =

    validation.valid &&

    inspectionReportExists &&

    interactionReportExists &&

    selfVisionSessionExists &&

    previewContextExists;



  const verificationStatus = deriveVerificationStatus(verificationResults, !valid);

  const verifiedCount = verificationResults.filter((r) => r.status === 'VERIFIED').length;



  const report = buildVisualVerificationReport({

    inspectionId: inspectionReport?.inspectionId ?? interactionReport?.inspectionId ?? null,

    interactionTestId: interactionReport?.interactionTestId ?? null,

    selfVisionSessionId:

      selfVisionSession?.selfVisionSessionId ?? interactionReport?.selfVisionSessionId ?? null,

    projectId: previewContext?.projectId ?? input.projectId ?? 'unknown',

    workspaceId: previewContext?.workspaceId ?? input.workspaceId ?? 'unknown',

    verificationStatus,

    verificationTargets,

    verificationResults,

    verificationEvidence,

    verificationRisks,

    blockedReasons: valid ? [] : validation.blockers,

    warnings: validation.warnings,

  });



  publishVisualVerificationFeedStages(query, valid);

  updateVisualVerificationDiagnostics(query, verificationStatus, verificationTargets.length, verifiedCount);



  return {

    visualVerificationReport: report,

    diagnostics: getVisualVerificationDiagnostics(),

    responseText: composeVisualVerificationResponse(query, report),

  };

}



export function processVisualVerificationRequest(query: string): VerifyVisualOutcomeResult {

  return verifyVisualOutcome(resolveInputFromQuery(query));

}



export function getVisualVerificationContext(query: string): VerifyVisualOutcomeResult {

  return processVisualVerificationRequest(query);

}


