/**
 * Founder Test Launch Readiness — markdown report builder.
 */

import {
  FOUNDER_TEST_LAUNCH_READINESS_CORE_QUESTION,
  FOUNDER_TEST_LAUNCH_READINESS_PASS_TOKEN,
  FOUNDER_TEST_LAUNCH_READINESS_PHASE,
  FOUNDER_TEST_LAUNCH_READINESS_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  REQUIRED_ORCHESTRATION_AUTHORITIES,
} from './founder-test-launch-readiness-registry.js';
import { buildChatStressSimulationReportMarkdown } from '../founder-test-chat-stress-simulation/index.js';
import { buildProductReadinessReportMarkdown } from '../founder-test-product-readiness/index.js';
import { buildAutonomousBuildExecutionProofReportMarkdown } from '../autonomous-build-execution-proof/execution-proof-report-builder.js';
import { buildConnectedBuildExecutionReportMarkdown } from '../connected-build-execution/index.js';
import { buildRuntimeActivationProofReportMarkdown } from '../connected-runtime-activation-proof/index.js';
import { buildPreviewExperienceProofReportMarkdown } from '../connected-preview-experience-proof/index.js';
import { buildVerificationExecutionProofReportMarkdown } from '../connected-verification-execution-proof/index.js';
import { buildLaunchReadinessProofReportMarkdown } from '../connected-launch-readiness-proof/index.js';
import type { FounderTestLaunchReadinessReport } from './founder-test-launch-readiness-types.js';

export function buildFounderTestLaunchReadinessReportMarkdown(
  report: FounderTestLaunchReadinessReport,
): string {
  const lines: string[] = [
    `# ${FOUNDER_TEST_LAUNCH_READINESS_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    FOUNDER_TEST_LAUNCH_READINESS_CORE_QUESTION,
    '',
    '## Phase',
    '',
    FOUNDER_TEST_LAUNCH_READINESS_PHASE,
    '',
    '## Orchestration Flow',
    '',
    ...ORCHESTRATION_FLOW.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Participating Authorities',
    '',
    ...REQUIRED_ORCHESTRATION_AUTHORITIES.map((authority) => `- ${authority}`),
    '',
    '## Founder Readiness Score',
    '',
    `**${report.founderReadinessScore}/100**`,
    '',
    '## Founder Acceptance State',
    '',
    `**${report.founderAcceptanceState}**`,
    '',
    '## Launch Readiness Verdict',
    '',
    `**${report.launchReadinessVerdict}**`,
    '',
    '## Confidence Level',
    '',
    report.confidenceLevel,
    '',
    '## Authority Coverage',
    '',
    `${report.inputSnapshot.availableAuthorityCount}/${report.inputSnapshot.participatingAuthorityCount} authorities available (${report.inputSnapshot.authorityCoverage}%)`,
    '',
    '## Authority Summaries',
    '',
    '| Authority | Score | Available |',
    '|-----------|-------|-----------|',
  ];

  for (const summary of report.inputSnapshot.authoritySummaries) {
    lines.push(`| ${summary.displayName} | ${summary.score}/100 | ${summary.available ? 'yes' : 'no'} |`);
  }

  lines.push('');
  lines.push('## Execution Proof Evolution (24E) Summary');
  lines.push('');
  lines.push(report.executionProofSummary);
  lines.push('');
  lines.push('## Founder Execution Proof (25.31) Summary');
  lines.push('');
  lines.push(report.founderExecutionProofSummary);
  lines.push('');
  lines.push('## Runtime Founder Execution Proof Hydration');
  lines.push('');
  lines.push(report.runtimeProofHydrationSummary);
  lines.push('');
  lines.push(`- hydrated: ${report.runtimeProofHydration.hydrated ? 'yes' : 'no'}`);
  lines.push(`- source: ${report.runtimeProofHydration.source}`);
  if (report.runtimeProofHydration.missing.length > 0) {
    lines.push(`- missing evidence: ${report.runtimeProofHydration.missing.join(', ')}`);
  }
  if (report.runtimeProofHydration.warnings.length > 0) {
    lines.push(`- warnings: ${report.runtimeProofHydration.warnings.slice(0, 5).join('; ')}`);
  }
  lines.push(
    `- executionConnected source: ${report.runtimeProofHydration.executionConnectedSource}`,
  );
  lines.push('');
  lines.push('## Founder Simulation Summary');
  lines.push('');
  lines.push(report.founderSimulationSummary);
  lines.push('');

  if (report.chatStressSimulation) {
    lines.push(buildChatStressSimulationReportMarkdown(report.chatStressSimulation));
  } else {
    lines.push('## Chat Stress Simulation');
    lines.push('');
    lines.push('Not run in this assessment.');
    lines.push('');
  }

  if (report.productReadinessSimulation) {
    lines.push(buildProductReadinessReportMarkdown(report.productReadinessSimulation));
  } else {
    lines.push('## FULL PRODUCT READINESS SIMULATION');
    lines.push('');
    lines.push('Not run in this assessment.');
    lines.push('');
  }

  if (report.autonomousBuildExecutionProof) {
    lines.push(buildAutonomousBuildExecutionProofReportMarkdown(report.autonomousBuildExecutionProof));
  } else {
    lines.push('## AUTONOMOUS BUILD EXECUTION PROOF');
    lines.push('');
    lines.push('Not run in this assessment.');
    lines.push('');
  }

  if (report.connectedBuildExecution) {
    lines.push(buildConnectedBuildExecutionReportMarkdown(report.connectedBuildExecution));
  } else {
    lines.push('## CONNECTED BUILD EXECUTION');
    lines.push('');
    lines.push('Not run in this assessment.');
    lines.push('');
  }

  if (report.connectedRuntimeActivationProof) {
    lines.push(buildRuntimeActivationProofReportMarkdown(report.connectedRuntimeActivationProof));
  } else {
    lines.push('## CONNECTED RUNTIME ACTIVATION PROOF');
    lines.push('');
    lines.push('Not run in this assessment.');
    lines.push('');
  }

  if (report.connectedPreviewExperienceProof) {
    lines.push(buildPreviewExperienceProofReportMarkdown(report.connectedPreviewExperienceProof));
  } else {
    lines.push('## CONNECTED PREVIEW EXPERIENCE PROOF');
    lines.push('');
    lines.push('Not run in this assessment.');
    lines.push('');
  }

  if (report.connectedVerificationExecutionProof) {
    lines.push(buildVerificationExecutionProofReportMarkdown(report.connectedVerificationExecutionProof));
  } else {
    lines.push('## CONNECTED VERIFICATION EXECUTION PROOF');
    lines.push('');
    lines.push('Not run in this assessment.');
    lines.push('');
  }

  if (report.connectedLaunchReadinessProof) {
    lines.push(buildLaunchReadinessProofReportMarkdown(report.connectedLaunchReadinessProof));
  } else {
    lines.push('## CONNECTED LAUNCH READINESS PROOF');
    lines.push('');
    lines.push('Not run in this assessment.');
    lines.push('');
  }

  lines.push('## Requirement Reality Summary');
  lines.push('');
  lines.push(report.requirementRealitySummary);
  lines.push('');
  lines.push('## Verification Reality Summary');
  lines.push('');
  lines.push(report.verificationRealitySummary);
  lines.push('');
  lines.push('## Live Preview Summary');
  lines.push('');
  lines.push(report.livePreviewSummary);
  lines.push('');
  lines.push('## Mobile Runtime Summary');
  lines.push('');
  lines.push(report.mobileRuntimeSummary);
  lines.push('');
  lines.push('## Launch Council Summary');
  lines.push('');
  lines.push(report.launchCouncilSummary);
  lines.push('');
  lines.push('## Founder Acceptance Orchestrator (24.8)');
  lines.push('');
  lines.push(`Verdict: ${report.orchestratorVerdict} — Score: ${report.orchestratorScore}/100`);
  lines.push('');
  lines.push('## Top Blockers');
  lines.push('');

  if (report.topBlockers.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of report.topBlockers) {
      lines.push(
        `- **[${blocker.severity}] ${blocker.sourceAuthority}:** ${blocker.explanation} → ${blocker.recommendedAction}`,
      );
    }
  }

  lines.push('');
  lines.push('## Top Warnings');
  lines.push('');

  if (report.topWarnings.length === 0) {
    lines.push('- None');
  } else {
    for (const warning of report.topWarnings) {
      lines.push(`- **${warning.sourceAuthority}:** ${warning.explanation} → ${warning.recommendation}`);
    }
  }

  lines.push('');
  lines.push('## Top Recommended Actions');
  lines.push('');

  for (const action of report.topRecommendedActions) {
    lines.push(`- **${action.sourceAuthority}:** ${action.action} (priority ${action.priorityScore})`);
  }

  lines.push('');
  lines.push('## Top Missing Capabilities');
  lines.push('');

  if (report.topMissingCapabilities.length === 0) {
    lines.push('- None');
  } else {
    for (const missing of report.topMissingCapabilities) {
      lines.push(`- ${missing}`);
    }
  }

  lines.push('');
  lines.push('## Pass Token');
  lines.push('');
  lines.push(FOUNDER_TEST_LAUNCH_READINESS_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}
