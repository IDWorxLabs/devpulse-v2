/**
 * Intake Chain Simulator — upload through unified intake (V1).
 */

import { runRequirementCompletenessIntelligence } from '../requirement-completeness-intelligence/index.js';
import { runUnifiedIntakeIntelligence } from '../unified-intake-intelligence/index.js';
import {
  assessIntakeAlignment,
  applyAlignmentRepairToUnifiedIntake,
  computeSimulationAlignmentImpact,
} from '../intake-alignment-engine/index.js';
import { processUpload } from '../upload-system/index.js';
import { analyzeVisualReference } from '../visual-reference-intelligence/index.js';
import { analyzeVoiceNotes } from '../voice-notes-intelligence/index.js';
import { buildTranscriptWav, buildUiMockPng } from './simulation-scenario-library.js';
import type {
  FounderSimulationChainContext,
  FounderSimulationScenario,
  FounderSimulationStageResult,
} from './founder-simulation-types.js';

function stage(
  stageId: FounderSimulationStageResult['stageId'],
  status: FounderSimulationStageResult['status'],
  input: Partial<FounderSimulationStageResult>,
): FounderSimulationStageResult {
  return {
    readOnly: true,
    stageId,
    status,
    confidence: input.confidence ?? null,
    readiness: input.readiness ?? null,
    orchestrationState: input.orchestrationState ?? null,
    failureReason: input.failureReason ?? null,
    evidence: input.evidence ?? [],
  };
}

export function simulateIntakeChain(input: {
  scenario: FounderSimulationScenario;
  log?: (message: string) => void;
  applyAlignmentRepair?: boolean;
}): {
  stages: FounderSimulationStageResult[];
  context: FounderSimulationChainContext;
  alignmentImpact: import('../intake-alignment-engine/intake-alignment-types.js').SimulationAlignmentImpact | null;
} {
  const stages: FounderSimulationStageResult[] = [];
  const log = input.log ?? (() => undefined);

  let uploadId: string | null = null;
  let visualAnalysis = null;
  let voiceAnalysis = null;
  let completenessAnalysis = null;
  let unifiedIntakeAnalysis = null;

  if (input.scenario.includeVisualUpload || input.scenario.includeVoiceUpload) {
    log('Processing founder upload');
    const png = buildUiMockPng();
    const upload = processUpload({
      candidate: {
        filename: input.scenario.includeVisualUpload ? 'ui-reference.png' : 'voice-note.wav',
        mimeType: input.scenario.includeVisualUpload ? 'image/png' : 'audio/wav',
        sizeBytes: png.length,
        content: input.scenario.includeVisualUpload ? png : buildTranscriptWav(input.scenario.voiceTranscript ?? 'mobile app'),
      },
      skipHistoryRecording: true,
    });
    uploadId = upload.uploadId;
    stages.push(
      stage('UPLOAD_SYSTEM', upload.acceptance.verdict === 'UPLOAD_ACCEPTED' ? 'PASSED' : 'FAILED', {
        orchestrationState: upload.acceptance.verdict,
        confidence: upload.acceptance.verdict === 'UPLOAD_ACCEPTED' ? 90 : 0,
        evidence: [upload.acceptance.verdict],
        failureReason: upload.acceptance.rejectionReason,
      }),
    );
  } else {
    stages.push(stage('UPLOAD_SYSTEM', 'SKIPPED', { evidence: ['NO_UPLOAD_REQUIRED'] }));
  }

  if (input.scenario.includeVisualUpload) {
    log('Analyzing visual reference');
    visualAnalysis = analyzeVisualReference({
      uploadId: uploadId ?? undefined,
      content: buildUiMockPng(),
      filename: 'ui-reference.png',
      mimeType: 'image/png',
      skipHistoryRecording: true,
    });
    stages.push(
      stage('VISUAL_REFERENCE_INTELLIGENCE', visualAnalysis ? 'PASSED' : 'FAILED', {
        confidence: visualAnalysis?.confidenceScore ?? 0,
        orchestrationState: visualAnalysis ? 'VISUAL_REFERENCE_INTELLIGENCE_COMPLETE' : 'FAILED',
        evidence: visualAnalysis ? ['VISUAL_ANALYSIS_PRODUCED'] : ['VISUAL_ANALYSIS_NULL'],
      }),
    );
  } else {
    stages.push(stage('VISUAL_REFERENCE_INTELLIGENCE', 'SKIPPED', { evidence: ['NO_VISUAL_INPUT'] }));
  }

  if (input.scenario.includeVoiceUpload) {
    log('Analyzing voice notes');
    voiceAnalysis = analyzeVoiceNotes({
      uploadId: uploadId ?? undefined,
      content: buildTranscriptWav(input.scenario.voiceTranscript ?? 'Build a mobile app'),
      filename: 'requirements.wav',
      mimeType: 'audio/wav',
      transcriptFixture: input.scenario.voiceTranscript,
      skipHistoryRecording: true,
    });
    stages.push(
      stage('VOICE_NOTES_INTELLIGENCE', voiceAnalysis ? 'PASSED' : 'FAILED', {
        confidence: voiceAnalysis?.transcript.confidence ?? 0,
        orchestrationState: voiceAnalysis ? 'VOICE_NOTES_INTELLIGENCE_COMPLETE' : 'FAILED',
        evidence: voiceAnalysis ? ['VOICE_ANALYSIS_PRODUCED'] : ['VOICE_ANALYSIS_NULL'],
      }),
    );
  } else {
    stages.push(stage('VOICE_NOTES_INTELLIGENCE', 'SKIPPED', { evidence: ['NO_VOICE_INPUT'] }));
  }

  log('Assessing requirement completeness');
  const completeness = runRequirementCompletenessIntelligence({
    typedRequirements: {
      rawPrompt: input.scenario.typedPrompt,
      ...input.scenario.structuredPrompt,
    },
    voiceNotesAnalysis: voiceAnalysis,
    visualReferenceAnalysis: visualAnalysis,
    skipHistoryRecording: true,
  });
  completenessAnalysis = completeness.analysis;
  stages.push(
    stage(
      'REQUIREMENT_COMPLETENESS_INTELLIGENCE',
      completeness.orchestrationState === 'REQUIREMENT_COMPLETENESS_INTELLIGENCE_COMPLETE' && completenessAnalysis
        ? completenessAnalysis.completenessScore < 35
          ? 'LOW_CONFIDENCE'
          : 'PASSED'
        : 'FAILED',
      {
        confidence: completenessAnalysis?.completenessScore ?? 0,
        readiness: completenessAnalysis?.projectRequirementReadiness ?? null,
        orchestrationState: completeness.orchestrationState,
        failureReason: completeness.failureReason,
        evidence: completenessAnalysis ? ['COMPLETENESS_ANALYSIS_PRODUCED'] : ['COMPLETENESS_NULL'],
      },
    ),
  );

  log('Running unified intake intelligence');
  const intake = runUnifiedIntakeIntelligence({
    typedPrompt: {
      rawPrompt: input.scenario.typedPrompt,
      ...input.scenario.structuredPrompt,
    },
    voiceNotesAnalysis: voiceAnalysis,
    visualReferenceAnalysis: visualAnalysis,
    requirementCompletenessAnalysis: completenessAnalysis,
    skipHistoryRecording: true,
  });
  unifiedIntakeAnalysis = intake.analysis;

  if (input.scenario.scenarioType === 'CONFLICTING_EVIDENCE' && voiceAnalysis && visualAnalysis) {
    const conflictIntake = runUnifiedIntakeIntelligence({
      typedPrompt: { rawPrompt: input.scenario.conflictingWebPrompt ?? input.scenario.typedPrompt },
      voiceNotesAnalysis: voiceAnalysis,
      visualReferenceAnalysis: visualAnalysis,
      skipHistoryRecording: true,
    });
    unifiedIntakeAnalysis = conflictIntake.analysis;
  }

  const unifiedIntakeAnalysisBeforeRepair = unifiedIntakeAnalysis;
  let intakeAlignmentAnalysis = null;
  let alignmentRepairApplied = false;
  let alignmentImpact = null;

  if (unifiedIntakeAnalysis && input.applyAlignmentRepair !== false) {
    log('Assessing multi-source intake alignment');
    intakeAlignmentAnalysis = assessIntakeAlignment({
      unifiedIntakeAnalysis,
      voiceNotesAnalysis: voiceAnalysis,
      visualReferenceAnalysis: visualAnalysis,
      requirementCompletenessAnalysis: completenessAnalysis,
      typedPrompt: input.scenario.typedPrompt,
      skipHistoryRecording: true,
    });

    if (intakeAlignmentAnalysis) {
      alignmentImpact = computeSimulationAlignmentImpact({
        scenarioType: input.scenario.scenarioType,
        unifiedIntakeAnalysis: unifiedIntakeAnalysisBeforeRepair,
        voiceNotesAnalysis: voiceAnalysis,
        visualReferenceAnalysis: visualAnalysis,
        requirementCompletenessAnalysis: completenessAnalysis,
        typedPrompt: input.scenario.typedPrompt,
      });

      if (intakeAlignmentAnalysis.falseConflictCount > 0 || intakeAlignmentAnalysis.alignmentScore >= 70) {
        unifiedIntakeAnalysis = applyAlignmentRepairToUnifiedIntake(unifiedIntakeAnalysis, intakeAlignmentAnalysis);
        alignmentRepairApplied = true;
        log('Applied intake alignment repair — false conflicts removed, confidence repaired');
      }
    }
  }

  const intakeStatus =
    intake.orchestrationState !== 'UNIFIED_INTAKE_INTELLIGENCE_COMPLETE' || !unifiedIntakeAnalysis
      ? 'FAILED'
      : unifiedIntakeAnalysis.evidenceConflicts.length > 0
        ? 'LOW_CONFIDENCE'
        : unifiedIntakeAnalysis.unifiedIntakeConfidence < 45
          ? 'LOW_CONFIDENCE'
          : 'PASSED';

  stages.push(
    stage('UNIFIED_INTAKE_INTELLIGENCE', intakeStatus, {
      confidence: unifiedIntakeAnalysis?.unifiedIntakeConfidence ?? 0,
      readiness: unifiedIntakeAnalysis?.intakeReadinessCategory ?? null,
      orchestrationState: intake.orchestrationState,
      failureReason: intake.failureReason,
      evidence: unifiedIntakeAnalysis
        ? [
            `CONFLICTS_${unifiedIntakeAnalysis.evidenceConflicts.length}`,
            `GAPS_${unifiedIntakeAnalysis.intakeGaps.length}`,
            ...(alignmentRepairApplied ? ['ALIGNMENT_REPAIR_APPLIED'] : []),
          ]
        : ['INTAKE_NULL'],
    }),
  );

  return {
    stages,
    context: {
      readOnly: true,
      uploadId,
      visualAnalysis,
      voiceAnalysis,
      completenessAnalysis,
      unifiedIntakeAnalysis,
      unifiedIntakeAnalysisBeforeRepair: alignmentRepairApplied ? unifiedIntakeAnalysisBeforeRepair : null,
      planningGateAnalysis: null,
      planningBrief: null,
      architectureBrief: null,
      buildPlan: null,
      founderTestAnalysis: null,
      intakeAlignmentAnalysis,
      alignmentRepairApplied,
    },
    alignmentImpact,
  };
}
