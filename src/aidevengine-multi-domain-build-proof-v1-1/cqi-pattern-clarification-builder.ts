/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1 — CQI-pattern-aware clarification answers.
 * Mirrors task-tracker proof wording so CQI coverage/gap detectors recognize enriched evidence.
 */

export function buildCqiPatternClarificationAnswers(input: {
  businessLabel: string;
  usersDetail: string;
  rolesDetail: string;
  permissionsDetail: string;
  workflowDetail: string;
  dataDetail: string;
}): readonly string[] {
  return [
    `Business: Browser-based ${input.businessLabel} for founders and small teams with clear value proposition and target market.`,
    `Users: ${input.usersDetail}`,
    `Roles: ${input.rolesDetail}`,
    `Permissions: ${input.permissionsDetail}`,
    `Workflows: Core workflow process covers ${input.workflowDetail}.`,
    `Data: ${input.dataDetail}`,
    'Files: No file upload or document attachments required for MVP.',
    'Notifications: No email, SMS, push, alerts, or reminder notifications in MVP.',
    'Integrations: No email integration, calendar sync, or third-party API partner required; product does not integrate with external systems for MVP.',
    'AI: No AI, LLM, chatbot, or recommendation features in MVP.',
    'Monetization: Free productivity tool with no subscription, billing, or payments.',
    'Deployment: Static Vite React SPA for public launch in modern browsers; npm build produces dist/index.html for cloud hosting.',
  ];
}

export const SCENARIO_CQI_CLARIFICATIONS: Record<
  string,
  ReturnType<typeof buildCqiPatternClarificationAnswers>
> = {
  'crm-lite': buildCqiPatternClarificationAnswers({
    businessLabel: 'CRM for contacts and follow-ups',
    usersDetail: 'Individual users and team members who manage customer contacts in the browser.',
    rolesDetail: 'Single end-user role with member access; no separate admin portal for MVP.',
    permissionsDetail:
      'Users have full CRUD permissions and write access on contacts they create; read-only views for shared lists.',
    workflowDetail:
      'add contact, search contacts, add notes, follow-up status stages, and open follow-up count tracking',
    dataDetail:
      'Contact entity with id, name, notes, follow-up flag, and createdAt timestamp stored in client state records',
  }),
  'booking-system': buildCqiPatternClarificationAnswers({
    businessLabel: 'appointment booking platform for scheduling',
    usersDetail: 'Customers and staff users who create and manage bookings in the browser.',
    rolesDetail: 'Single end-user role for booking operators; no separate admin portal for MVP.',
    permissionsDetail:
      'Users have full CRUD permissions and write access on bookings they create with read access to schedules.',
    workflowDetail:
      'create booking, date/time selection stages, customer details capture, cancel booking, upcoming/past filter, next upcoming booking',
    dataDetail:
      'Booking entity with id, date, time, customer details, and status fields stored in client state records',
  }),
  'inventory-manager': buildCqiPatternClarificationAnswers({
    businessLabel: 'inventory and stock management system',
    usersDetail: 'Inventory managers and team members who track products in the browser.',
    rolesDetail: 'Single end-user role with warehouse member access; no separate admin portal for MVP.',
    permissionsDetail:
      'Users have full CRUD permissions and write access on inventory items they manage.',
    workflowDetail:
      'add product, update stock quantity stages, low-stock flag process, delete product, filter all/low-stock items, total inventory value',
    dataDetail:
      'Inventory item entity with id, name, quantity, price, low-stock flag stored in client state records and fields',
  }),
  'client-portal': buildCqiPatternClarificationAnswers({
    businessLabel: 'client portal for project management and customers',
    usersDetail: 'Client users and team members who manage clients and project requests in the browser.',
    rolesDetail: 'Single end-user role with member access; no separate admin portal for MVP.',
    permissionsDetail:
      'Users have full CRUD permissions and write access on clients and requests they create.',
    workflowDetail:
      'add client, create project request stages, update request status process, open/completed filter, open request count dashboard',
    dataDetail:
      'Client and project request entities with id, status, and createdAt fields stored in client state records',
  }),
  'field-service': buildCqiPatternClarificationAnswers({
    businessLabel: 'field service job tracker for technicians',
    usersDetail: 'Dispatchers and field technicians who manage jobs in the browser.',
    rolesDetail: 'Single end-user role with staff member access; no separate admin portal for MVP.',
    permissionsDetail:
      'Users have full CRUD permissions and write access on jobs they create with assign permissions for technicians.',
    workflowDetail:
      'create job, technician assignment process, job status update stages, scheduled/completed filter, delete job, active job count',
    dataDetail:
      'Job entity with id, technician name, status, and schedule fields stored in client state records',
  }),
};
