/**
 * Universal Workflow Generation Engine V1 — workflow UI generation.
 */

import type { UniversalWorkflowDescriptor } from './universal-workflow-types.js';
import { escWorkflowString } from './universal-workflow-types.js';

export function generateWorkflowPanelJsx(descriptors: readonly UniversalWorkflowDescriptor[]): string {
  if (descriptors.length === 0) return '';
  const primary = descriptors[0]!;
  const events = [...new Set(primary.transitions.map((t) => t.eventType))];

  const buttons = events
    .map(
      (event) => `<button
          type="button"
          data-interaction-control="true"
          data-universal-workflow-engine="v1"
          data-workflow-event="${event}"
          className="universal-workflow-btn"
          disabled={workflow.pending}
          onClick={() => workflow.dispatchEvent('${event}', { label: workflowInput })}
        >
          ${event.replace(/_/g, ' ')}
        </button>`,
    )
    .join('\n        ');

  return `
      <div className="universal-workflow-container" data-universal-workflow-engine="v1" data-workflow-id="${primary.workflowId}">
        <header className="universal-workflow-header">
          <h3>${escWorkflowString(primary.label)}</h3>
          <progress max={100} value={workflow.progressPercent} data-workflow-progress="true" />
          <span data-workflow-step="true">{workflow.currentStepLabel}</span>
          <span data-workflow-status="true">{workflow.status}</span>
        </header>
        <input
          data-interaction-control="true"
          value={workflowInput}
          onChange={(e) => setWorkflowInput(e.target.value)}
          placeholder="Step input"
          aria-label="Workflow step input"
        />
        <div className="universal-workflow-controls">
          ${buttons}
          <button type="button" data-interaction-control="true" className="universal-workflow-btn" onClick={() => workflow.resume()}>
            Resume
          </button>
        </div>
        {workflow.pending ? <p data-loading="true">Transition pending…</p> : null}
        {workflow.error ? <p className="universal-workflow-error" data-error="true">{workflow.error}</p> : null}
        {workflow.success ? <p className="universal-workflow-success" data-success="true">{workflow.success}</p> : null}
        {workflow.blockedReason ? <p className="universal-workflow-blocked" data-blocked="true">{workflow.blockedReason}</p> : null}
      </div>`;
}

export function generateWorkflowModuleCss(): string {
  return `.universal-workflow-container { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin: 0.75rem 0; }
.universal-workflow-header { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
.universal-workflow-controls { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
.universal-workflow-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 0.35rem 0.75rem; cursor: pointer; }
.universal-workflow-error { color: #dc2626; }
.universal-workflow-success { color: #16a34a; }
.universal-workflow-blocked { color: #991b1b; background: #fef2f2; padding: 0.5rem; border-radius: 8px; }
`;
}

export function detectStaticWorkflowShell(source: string): boolean {
  return (
    /<ol[^>]*>[\s\S]*<li/.test(source) &&
    !/dispatchEvent|data-workflow-event/.test(source)
  ) || /workflow timeline/i.test(source) && !/dispatchEvent/.test(source);
}
