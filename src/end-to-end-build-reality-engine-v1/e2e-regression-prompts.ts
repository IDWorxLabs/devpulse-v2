/**
 * Regression prompt registry — prompts only, no application-specific validator logic.
 */

export interface E2ERegressionPromptEntry {
  readOnly: true;
  id: string;
  prompt: string;
  /** Optional tag for reporting only */
  classLabel: string;
}

export const E2E_REGRESSION_PROMPT_SUITE: E2ERegressionPromptEntry[] = [
  { readOnly: true, id: 'calculator', prompt: 'build a calculator app', classLabel: 'Calculator' },
  { readOnly: true, id: 'todo', prompt: 'build a todo list app', classLabel: 'Todo' },
  { readOnly: true, id: 'expense-tracker', prompt: 'build an expense tracker app', classLabel: 'Expense Tracker' },
  { readOnly: true, id: 'inventory', prompt: 'build an inventory management app', classLabel: 'Inventory' },
  { readOnly: true, id: 'crm', prompt: 'build a CRM app for managing customer contacts', classLabel: 'CRM' },
  { readOnly: true, id: 'booking', prompt: 'build a booking app for scheduling appointments', classLabel: 'Booking' },
  { readOnly: true, id: 'chat', prompt: 'build a chat app for messaging', classLabel: 'Chat' },
  { readOnly: true, id: 'qr-generator', prompt: 'build a QR code generator app', classLabel: 'QR Generator' },
  { readOnly: true, id: 'portfolio', prompt: 'build a portfolio website app', classLabel: 'Portfolio' },
  { readOnly: true, id: 'admin-dashboard', prompt: 'build an admin dashboard app', classLabel: 'Admin Dashboard' },
  { readOnly: true, id: 'restaurant', prompt: 'build a restaurant ordering app', classLabel: 'Restaurant' },
  { readOnly: true, id: 'weather', prompt: 'build a weather app', classLabel: 'Weather' },
  { readOnly: true, id: 'blog', prompt: 'build a blog app', classLabel: 'Blog' },
  { readOnly: true, id: 'notes', prompt: 'build a notes app', classLabel: 'Notes' },
  { readOnly: true, id: 'kanban', prompt: 'build a kanban board app', classLabel: 'Kanban' },
  { readOnly: true, id: 'finance', prompt: 'build a personal finance tracker app', classLabel: 'Finance' },
  {
    readOnly: true,
    id: 'lisa',
    prompt:
      'Build LISA, an assistive communication web application for non-verbal users with eye-tracking input, caregiver dashboard, emergency speech, and communication history.',
    classLabel: 'LISA',
  },
];

/** Subset used in CI validation — still generic, prompts only. */
export const E2E_REGRESSION_CI_PROMPTS: E2ERegressionPromptEntry[] = E2E_REGRESSION_PROMPT_SUITE.filter(
  (entry) => ['calculator', 'todo', 'expense-tracker'].includes(entry.id),
);
