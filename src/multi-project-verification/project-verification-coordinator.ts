/**
 * Multi Project Verification — coordination pipeline.
 */

import type {
  MultiProjectVerificationReport,
  PortfolioVerificationSummary,
  ProjectVerificationInput,
  ProjectVerificationRecord,
} from './multi-project-verification-types.js';
import { analyzeProjectVerificationEvidence } from './project-verification-evidence.js';
import { calculateProjectVerificationConfidence } from './project-verification-confidence.js';
import { calculateProjectVerificationRisk } from './project-verification-risk.js';
import { aggregateProjectVerification } from './project-verification-aggregator.js';
import { buildPortfolioVerificationSummary } from './project-verification-portfolio.js';
import {
  getProjectVerification,
  listProjectVerifications,
  registerProjectVerification,
} from './project-verification-registry.js';
import { recordProjectVerificationHistory } from './project-verification-history.js';
import { generateMultiProjectVerificationReport } from './project-verification-reporting.js';
import { trackMultiProjectVerificationRuntime } from './multi-project-verification.js';

export interface CoordinateProjectVerificationResult {
  record: ProjectVerificationRecord;
  portfolio: PortfolioVerificationSummary;
  report: MultiProjectVerificationReport;
}

export function coordinateProjectVerification(
  input: ProjectVerificationInput,
): CoordinateProjectVerificationResult {
  const previous = getProjectVerification(input.projectId);

  const evidence = analyzeProjectVerificationEvidence(input);
  const confidence = calculateProjectVerificationConfidence(input, evidence);
  const riskScore = calculateProjectVerificationRisk(input, evidence);
  const record = aggregateProjectVerification(input, evidence, confidence, riskScore);

  registerProjectVerification(record);

  const allRecords = listProjectVerifications();
  const portfolio = buildPortfolioVerificationSummary(allRecords);
  recordProjectVerificationHistory(record, portfolio, previous?.status);
  const report = generateMultiProjectVerificationReport(allRecords, portfolio);
  trackMultiProjectVerificationRuntime(allRecords.length, portfolio.totalProjects);

  return { record, portfolio, report };
}

export function coordinatePortfolioVerification(
  inputs: ProjectVerificationInput[],
): {
  records: ProjectVerificationRecord[];
  portfolio: PortfolioVerificationSummary;
  report: MultiProjectVerificationReport;
} {
  const records: ProjectVerificationRecord[] = [];

  for (const input of inputs) {
    const evidence = analyzeProjectVerificationEvidence(input);
    const confidence = calculateProjectVerificationConfidence(input, evidence);
    const riskScore = calculateProjectVerificationRisk(input, evidence);
    const record = aggregateProjectVerification(input, evidence, confidence, riskScore);
    registerProjectVerification(record);
    records.push(record);
  }

  const portfolio = buildPortfolioVerificationSummary(records);
  for (const record of records) {
    recordProjectVerificationHistory(record, portfolio);
  }

  const report = generateMultiProjectVerificationReport(records, portfolio);
  trackMultiProjectVerificationRuntime(records.length, portfolio.totalProjects);
  return { records, portfolio, report };
}
