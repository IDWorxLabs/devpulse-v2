/**
 * Engineering Intelligence Runtime V1 — final report builder.
 */

import { createHash } from 'node:crypto';
import type {
  EngineeringFeatureContract,
  EngineeringIntelligenceReport,
  MissingCapabilityRuntimeResult,
  ProductDomain,
  ProfileDomainMismatch,
  PromptToFeatureFidelityResult,
  RequiredCapability,
} from './engineering-intelligence-types.js';
import { buildSafePaymentPlaceholderReportSection } from '../safe-payment-placeholder-policy/index.js';

let reportCounter = 0;

export function resetEngineeringIntelligenceReportForTests(): void {
  reportCounter = 0;
}

function nextReportId(rawPrompt: string): string {
  reportCounter += 1;
  const hash = createHash('sha256').update(rawPrompt.trim()).digest('hex').slice(0, 10);
  return `ei-report-${hash}-${reportCounter}`;
}

export function buildEngineeringIntelligenceReport(input: {
  rawPrompt: string;
  contract: EngineeringFeatureContract;
  selectedProfile: string;
  profileMismatch: ProfileDomainMismatch | null;
  generatedModules: readonly string[];
  fidelity: PromptToFeatureFidelityResult;
  repairResult?: MissingCapabilityRuntimeResult | null;
  rejectedFallbackModules?: readonly string[];
}): EngineeringIntelligenceReport {
  const repairsAttempted = input.repairResult?.repairAttempts.length ?? 0;
  const finalFidelity = input.repairResult?.finalFidelity ?? input.fidelity;

  let finalCapabilityCoverage: EngineeringIntelligenceReport['finalCapabilityCoverage'] = 'FAILED';
  if (finalFidelity.passed) finalCapabilityCoverage = 'FULL';
  else if (finalFidelity.productFidelityScore >= 50) finalCapabilityCoverage = 'PARTIAL';

  const paymentSection = buildSafePaymentPlaceholderReportSection(input.rawPrompt);

  return {
    readOnly: true,
    reportId: nextReportId(input.rawPrompt),
    detectedProductDomain: input.contract.productDomain,
    selectedProfile: input.selectedProfile,
    profileDomainMismatch: input.profileMismatch,
    requiredCapabilities: input.contract.requiredCapabilities,
    generatedModules: input.generatedModules,
    missingCapabilities: finalFidelity.missingCapabilities,
    rejectedFallbackModules: input.rejectedFallbackModules ?? input.contract.rejectedModules,
    productFidelityScore: finalFidelity.productFidelityScore,
    missingCapabilityRepairsAttempted: repairsAttempted,
    finalCapabilityCoverage: finalCapabilityCoverage,
    moduleContractStatus: finalFidelity.moduleContractStatus,
    paymentCapabilityClassification: paymentSection.classification,
    remainingIntegrationGaps: paymentSection.remainingIntegrationGaps,
    recordedAt: new Date().toISOString(),
  };
}

export function formatEngineeringIntelligenceReportMarkdown(
  report: EngineeringIntelligenceReport,
): string {
  const lines = [
    '# Engineering Intelligence Report',
    '',
    `- Detected product domain: **${report.detectedProductDomain}**`,
    `- Selected profile: **${report.selectedProfile}**`,
    report.profileDomainMismatch
      ? `- Profile/domain mismatch: **${report.profileDomainMismatch.code}** — ${report.profileDomainMismatch.message}`
      : '- Profile/domain mismatch: none',
    `- Product fidelity score: **${report.productFidelityScore}/100**`,
    `- Module contract status: **${report.moduleContractStatus}**`,
    `- Final capability coverage: **${report.finalCapabilityCoverage}**`,
    `- Missing capability repairs attempted: **${report.missingCapabilityRepairsAttempted}**`,
    report.paymentCapabilityClassification
      ? `- Payment capability classification: **${report.paymentCapabilityClassification}**`
      : '',
    '',
    '## Required capabilities',
    ...report.requiredCapabilities.map((c) => `- ${c.label} (${c.moduleIds.join(', ')})`),
    '',
    '## Generated modules',
    ...(report.generatedModules.length ? report.generatedModules.map((m) => `- ${m}`) : ['- none']),
    '',
    '## Missing capabilities',
    ...(report.missingCapabilities.length
      ? report.missingCapabilities.map((c: RequiredCapability) => `- ${c.label}`)
      : ['- none']),
    '',
    '## Rejected fallback modules',
    ...(report.rejectedFallbackModules.length
      ? report.rejectedFallbackModules.map((m) => `- ${m}`)
      : ['- none']),
    '',
    '## Remaining integration gaps',
    ...(report.remainingIntegrationGaps?.length
      ? report.remainingIntegrationGaps.map((gap) => `- ${gap}`)
      : ['- none']),
  ];
  return lines.join('\n');
}

export function summarizeDomainForAudit(domain: ProductDomain): string {
  return domain.replace(/-/g, ' ');
}
