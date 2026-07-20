/**
 * Real Production Generation Capability Audit V1 — main audit runner (read-only).
 */

import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildCanonicalProductContract } from '../product-faithfulness-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import { applyContractBoundGenerationToBuildPlan } from '../contract-bound-generation-authority-v4/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { AuditPromptScenario, RealProductionGenerationCapabilityAuditReport } from './real-production-generation-capability-types.js';
import { buildProductionGenerationCallGraph } from './production-call-graph.js';
import { buildGeneratorCapabilityInventory } from './generator-capability-inventory.js';
import {
  buildPromptMaterializationAudit,
  buildSilentSkipInventory,
  extractStaticShellFindings,
} from './feature-materialization-matrix.js';
import { buildMissingCapabilityInventory, buildRepairPathRealityAudit } from './repair-reality-audit.js';
import { buildPreviewVerificationQualityAudit } from './preview-verification-audit.js';
import { assembleAuditReport } from './real-production-generation-capability-report.js';

export const AUDIT_PROMPT_SCENARIOS: AuditPromptScenario[] = [
  {
    id: 'restaurant-ops',
    label: 'Restaurant operations platform',
    rawPrompt: `Build a modern, production-quality Restaurant Management Platform for independent restaurants.

The application should be fully responsive and optimized for desktop, tablet, and mobile devices.

Include reservations, table management, orders, kitchen display, staff scheduling, inventory tracking,
customer relationship management, and reporting dashboards. Build reusable components where appropriate.`,
  },
  {
    id: 'crm-sales',
    label: 'CRM / sales pipeline',
    rawPrompt: `Build a CRM and sales pipeline web application for a B2B sales team.

Track leads, contacts, accounts, opportunities, activities, quotes, and pipeline stages.
Include filtering, search, dashboards, and team performance reports. Fully responsive UI.`,
  },
  {
    id: 'appointment-booking',
    label: 'Appointment booking system',
    rawPrompt: `Build an appointment booking system for a medical clinic.

Patients can book appointments, staff manage availability calendars, providers set schedules,
appointments can be confirmed, rescheduled, and cancelled. Include reminders and a admin dashboard.`,
  },
  {
    id: 'inventory-mgmt',
    label: 'Inventory management system',
    rawPrompt: `Build an inventory management system for a warehouse operation.

Track products, stock levels, suppliers, purchase orders, receiving, picking, shipping,
low-stock alerts, and inventory valuation reports. Responsive web application.`,
  },
  {
    id: 'expense-tracker',
    label: 'Expense tracker',
    rawPrompt: `Build an expense tracker web application for personal and small business finance.

Track expenses, categories, budgets, recurring transactions, receipts, monthly summaries,
and export reports. Clean modern UI for desktop and mobile.`,
  },
  {
    id: 'notes-tasks',
    label: 'Notes / task management app',
    rawPrompt: `Build a notes and task management application.

Users can create tasks, organize lists, set due dates, mark complete, filter by status,
search notes, and view productivity dashboards. Responsive and accessible.`,
  },
  {
    id: 'unit-conversion',
    label: 'Unit conversion utility',
    rawPrompt: `Build a unit conversion utility web application.

Convert length, weight, temperature, volume, and area units with a clean calculator-style interface.
Show conversion history and favorite units. Works on mobile and desktop.`,
  },
  {
    id: 'custom-mixed',
    label: 'Custom domain mixed workflows',
    rawPrompt: `Build a field service operations hub for a renewable energy maintenance company.

Technicians receive work orders, log site visits, capture inspection checklists, schedule follow-ups,
track parts usage, and managers review compliance dashboards and SLA reports.
Multi-step workflows must connect scheduling, execution, and reporting.`,
  },
];

function writeTempWorkspace(tempDir: string, files: GeneratedWorkspaceFile[]): void {
  for (const file of files) {
    const abs = join(tempDir, file.relativePath);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, file.content, 'utf8');
  }
}

/** Runs the full read-only capability audit for all configured prompts. */
export function runRealProductionGenerationCapabilityAudit(repoRoot: string): RealProductionGenerationCapabilityAuditReport {
  const promptResults = [];
  const workspaceFilesByPrompt = new Map<string, GeneratedWorkspaceFile[]>();
  const tempDirs: string[] = [];

  try {
    for (const scenario of AUDIT_PROMPT_SCENARIOS) {
      const contract = buildCanonicalProductContract({ prompt: scenario.rawPrompt });
      const buildPlan = resolvePromptFaithfulBuildPlan(scenario.rawPrompt);
      const bound = applyContractBoundGenerationToBuildPlan(buildPlan, contract, {
        promptHash: `audit-${scenario.id}`,
        buildId: `audit-build-${scenario.id}`,
      });
      const envelope = bound.report.approvedProductionBuildEnvelope;

      const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
        contractId: `audit-${scenario.id}`,
        ideaId: 'audit-idea',
        buildUnits: ['unit-audit'],
        rawPrompt: scenario.rawPrompt,
        faithfulBuildPlan: bound.buildPlan,
        approvedProductionBuildEnvelope: envelope,
      });

      workspaceFilesByPrompt.set(scenario.id, workspaceFiles);

      const tempDir = mkdtempSync(join(tmpdir(), `aidev-cap-audit-${scenario.id}-`));
      tempDirs.push(tempDir);
      writeTempWorkspace(tempDir, workspaceFiles);

      promptResults.push(
        buildPromptMaterializationAudit({
          scenario,
          envelope,
          buildPlan: bound.buildPlan,
          workspaceFiles,
        }),
      );
    }
  } finally {
    for (const dir of tempDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* best-effort cleanup */
      }
    }
  }

  const staticShellInventory = extractStaticShellFindings(promptResults, workspaceFilesByPrompt);

  return assembleAuditReport({
    promptResults,
    callGraph: buildProductionGenerationCallGraph(),
    generatorCapabilityInventory: buildGeneratorCapabilityInventory(repoRoot),
    silentSkipInventory: buildSilentSkipInventory(),
    staticShellInventory,
    missingCapabilityInventory: buildMissingCapabilityInventory(promptResults),
    repairPathFindings: buildRepairPathRealityAudit(),
    previewVerificationFindings: buildPreviewVerificationQualityAudit(repoRoot),
  });
}

export { renderAuditReportMarkdown } from './real-production-generation-capability-report.js';
