/**
 * Command Center Chat Execution Audit V1 — HTTP handler.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { readRequestBody } from './brain-api-handler.js';
import {
  COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH,
  finalizeChatExecutionAudit,
  getLatestChatExecutionAudit,
  getChatExecutionAuditTrail,
  recordChatExecutionAuditEvent,
  startChatExecutionAudit,
} from '../src/command-center-chat-execution-audit-v1/index.js';

function sendAuditJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Audit': 'command-center-chat-execution',
  });
  res.end(JSON.stringify(payload));
}

export async function handleChatExecutionAuditEventRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const raw = await readRequestBody(req);
    const body = JSON.parse(raw) as {
      auditId?: string;
      layer?: 'browser' | 'network' | 'server' | 'bridge' | 'trace_ui';
      name?: string;
      detail?: string;
      metadata?: Record<string, string | number | boolean | null | string[]>;
      messagePreview?: string;
      activeProjectId?: string | null;
      activeSessionId?: string | null;
      projectName?: string | null;
      start?: boolean;
      finalize?: { outcome?: string; noOpReason?: string | null };
    };

    if (!body.auditId?.trim()) {
      sendAuditJson(res, 400, { error: 'auditId is required' });
      return;
    }

    const auditId = body.auditId.trim();

    if (body.start) {
      startChatExecutionAudit({
        auditId,
        messagePreview: body.messagePreview ?? body.detail ?? '',
        activeProjectId: body.activeProjectId ?? null,
        activeSessionId: body.activeSessionId ?? null,
        projectName: body.projectName ?? null,
      });
    }

    if (body.name && body.detail) {
      recordChatExecutionAuditEvent({
        auditId,
        layer: body.layer ?? 'browser',
        name: body.name,
        detail: body.detail,
        metadata: body.metadata,
      });
    }

    if (body.finalize?.outcome) {
      finalizeChatExecutionAudit({
        auditId,
        outcome: body.finalize.outcome as Parameters<typeof finalizeChatExecutionAudit>[0]['outcome'],
        noOpReason: body.finalize.noOpReason ?? null,
      });
    }

    sendAuditJson(res, 200, {
      ok: true,
      audit: getChatExecutionAuditTrail(auditId),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid audit event request';
    sendAuditJson(res, 400, { error: message });
  }
}

export function handleChatExecutionAuditLatestRequest(_req: IncomingMessage, res: ServerResponse): void {
  const latest = getLatestChatExecutionAudit();
  sendAuditJson(res, 200, {
    ok: true,
    endpoint: COMMAND_CENTER_CHAT_EXECUTION_AUDIT_LATEST_PATH,
    audit: latest,
  });
}
