/**
 * Founder Testing Mode API — POST /api/founder-test/run (read-only).
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runFounderTestingMode,
  runFounderTestingModeV2,
  runFounderTestingModeV3,
  runFounderTestingModeV4,
} from '../src/founder-testing-mode/index.js';
import {
  assessChangeIntelligenceVisibility,
  getChangeIntelligenceHistory,
  recordFounderTestChangeSnapshot,
} from '../src/change-intelligence-visibility/index.js';
import { assessFounderActionCenter } from '../src/founder-action-center/index.js';
import { buildProductWorkspaceSnapshot } from './product-workspace-snapshot.js';
import { setLastVerificationResultsFromV4Report } from '../src/verification-results-visibility/index.js';
import type { LiveScreenResultInput } from '../src/founder-testing-mode/founder-testing-types.js';
import { readRequestBody } from './brain-api-handler.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');

export function sendFounderTestJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  version: 'v1' | 'v2' | 'v3' | 'v4' = 'v1',
): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'founder-reality',
    'X-DevPulse-Founder-Test': `${version}-read-only`,
  });
  res.end(JSON.stringify(body));
}

export async function handleFounderTestRunRequest(
  req: IncomingMessage,
  res: ServerResponse,
  validatorScripts: string[],
): Promise<void> {
  try {
    let liveResults: LiveScreenResultInput[] | undefined;
    let liveSection: string | undefined;

    if (req.method === 'POST') {
      const raw = await readRequestBody(req);
      if (raw.trim()) {
        const body = JSON.parse(raw) as {
          liveResults?: LiveScreenResultInput[];
          liveSection?: string;
        };
        liveResults = body.liveResults;
        liveSection = body.liveSection;
      }
    }

    const report = runFounderTestingMode({
      rootDir: ROOT_DIR,
      validatorScripts,
      liveResults,
      liveSection,
    });

    sendFounderTestJson(res, 200, {
      ok: true,
      readOnly: true,
      report,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'founder test failed';
    sendFounderTestJson(res, 500, {
      ok: false,
      readOnly: true,
      error: message,
    });
  }
}

export async function handleFounderTestRunV2Request(
  req: IncomingMessage,
  res: ServerResponse,
  validatorScripts: string[],
): Promise<void> {
  try {
    let liveResults: LiveScreenResultInput[] | undefined;
    let liveSection: string | undefined;

    if (req.method === 'POST') {
      const raw = await readRequestBody(req);
      if (raw.trim()) {
        const body = JSON.parse(raw) as {
          liveResults?: LiveScreenResultInput[];
          liveSection?: string;
        };
        liveResults = body.liveResults;
        liveSection = body.liveSection;
      }
    }

    const report = runFounderTestingModeV2({
      rootDir: ROOT_DIR,
      validatorScripts,
      liveResults,
      liveSection,
    });

    sendFounderTestJson(
      res,
      200,
      {
        ok: true,
        readOnly: true,
        mode: 'founder-testing-v2',
        report,
      },
      'v2',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'founder test v2 failed';
    sendFounderTestJson(
      res,
      500,
      {
        ok: false,
        readOnly: true,
        error: message,
      },
      'v2',
    );
  }
}

export async function handleFounderTestRunV3Request(
  req: IncomingMessage,
  res: ServerResponse,
  validatorScripts: string[],
): Promise<void> {
  try {
    let liveResults: LiveScreenResultInput[] | undefined;
    let liveSection: string | undefined;

    if (req.method === 'POST') {
      const raw = await readRequestBody(req);
      if (raw.trim()) {
        const body = JSON.parse(raw) as {
          liveResults?: LiveScreenResultInput[];
          liveSection?: string;
        };
        liveResults = body.liveResults;
        liveSection = body.liveSection;
      }
    }

    const report = runFounderTestingModeV3({
      rootDir: ROOT_DIR,
      validatorScripts,
      liveResults,
      liveSection,
    });

    sendFounderTestJson(
      res,
      200,
      {
        ok: true,
        readOnly: true,
        mode: 'founder-testing-v3',
        report,
      },
      'v3',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'founder test v3 failed';
    sendFounderTestJson(
      res,
      500,
      {
        ok: false,
        readOnly: true,
        error: message,
      },
      'v3',
    );
  }
}

export async function handleFounderTestRunV4Request(
  req: IncomingMessage,
  res: ServerResponse,
  validatorScripts: string[],
): Promise<void> {
  try {
    let liveResults: LiveScreenResultInput[] | undefined;
    let liveSection: string | undefined;

    if (req.method === 'POST') {
      const raw = await readRequestBody(req);
      if (raw.trim()) {
        const body = JSON.parse(raw) as {
          liveResults?: LiveScreenResultInput[];
          liveSection?: string;
        };
        liveResults = body.liveResults;
        liveSection = body.liveSection;
      }
    }

    const report = runFounderTestingModeV4({
      rootDir: ROOT_DIR,
      validatorScripts,
      liveResults,
      liveSection,
    });
    const verificationResults = setLastVerificationResultsFromV4Report(report);
    const workspace = buildProductWorkspaceSnapshot(validatorScripts);
    recordFounderTestChangeSnapshot(
      { ...workspace, verificationResults },
      verificationResults.summary.readinessScore,
      report.launchReadinessReality.launchReadinessRealityScore,
    );

    const changeIntelligence = assessChangeIntelligenceVisibility(getChangeIntelligenceHistory());
    const founderActionCenter = assessFounderActionCenter({
      ...workspace,
      verificationResults,
      changeIntelligence,
    });

    sendFounderTestJson(
      res,
      200,
      {
        ok: true,
        readOnly: true,
        mode: 'founder-testing-v4',
        report,
        verificationResults,
        changeIntelligence,
        founderActionCenter,
      },
      'v4',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'founder test v4 failed';
    sendFounderTestJson(
      res,
      500,
      {
        ok: false,
        readOnly: true,
        error: message,
      },
      'v4',
    );
  }
}
