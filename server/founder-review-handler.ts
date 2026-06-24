/**
 * Founder Review Operator Dashboard API — read-only AFLA visibility aggregation.
 * Does not perform reviews, validation, or launch decisions.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFounderReviewPayload,
  FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_PASS_TOKEN,
  listFounderReviewSuiteProfiles,
} from '../src/founder-review-operator-dashboard/index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');

export {
  FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_PASS_TOKEN,
  buildFounderReviewPayload,
  listFounderReviewSuiteProfiles,
};

export function sendFounderReviewJson(
  res: import('node:http').ServerResponse,
  profile?: string | null,
  rootDir = ROOT_DIR,
): void {
  const payload = buildFounderReviewPayload(rootDir, profile ?? null);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'founder-review-operator-dashboard',
    'X-DevPulse-Phase': '27.7',
  });
  res.end(JSON.stringify(payload));
}
