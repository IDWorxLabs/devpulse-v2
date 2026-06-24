/**
 * Large-Scale Multi-App Validation V1 — 50+ category suite registry.
 */

import type { LargeScaleCategoryDefinition, LargeScaleCategoryGroup } from './large-scale-multi-app-validation-types.js';

function entry(
  profile: string,
  domain: string,
  productName: string,
  prompt: string,
  categoryGroup: LargeScaleCategoryGroup,
): LargeScaleCategoryDefinition {
  return { profile, domain, productName, prompt, categoryGroup };
}

export const LARGE_SCALE_VALIDATION_SUITE: readonly LargeScaleCategoryDefinition[] = [
  // Business Systems
  entry('CRM_WEB_V1', 'CRM', 'CRM', 'Build a CRM to manage customers with create, edit, delete, and search customer records.', 'Business Systems'),
  entry('PROJECT_MANAGEMENT_WEB_V1', 'PROJECT_MANAGEMENT', 'Project Management', 'Build a project management system to create projects, edit them, delete them, search projects, and assign team members.', 'Business Systems'),
  entry('INVENTORY_WEB_V1', 'INVENTORY', 'Inventory', 'Build an inventory system to add items, edit items, remove items, and search inventory.', 'Business Systems'),
  entry('ERP_WEB_V1', 'ERP', 'ERP', 'Build an ERP platform for finance, inventory, HR, and operations with role-based workflows.', 'Business Systems'),
  entry('HR_PLATFORM_WEB_V1', 'HR_PLATFORM', 'HR Platform', 'Build an HR platform with employee records, onboarding, time tracking, and payroll workflows.', 'Business Systems'),
  entry('CUSTOMER_SUPPORT_WEB_V1', 'CUSTOMER_SUPPORT', 'Customer Support', 'Build a customer support platform with tickets, agent queues, knowledge base, and SLA tracking.', 'Business Systems'),
  entry('FLEET_MANAGEMENT_WEB_V1', 'FLEET_MANAGEMENT', 'Fleet Management', 'Build a fleet management system for vehicles, drivers, routes, and maintenance tracking.', 'Business Systems'),
  entry('INSURANCE_CRM_WEB_V1', 'INSURANCE_CRM', 'Insurance CRM', 'Build an insurance CRM for policies, claims, agents, and customer lifecycle management.', 'Business Systems'),
  entry('ACCOUNTING_PLATFORM_WEB_V1', 'ACCOUNTING_PLATFORM', 'Accounting Platform', 'Build an accounting platform with ledgers, invoices, expenses, and financial reporting.', 'Business Systems'),
  entry('PROCUREMENT_SYSTEM_WEB_V1', 'PROCUREMENT_SYSTEM', 'Procurement System', 'Build a procurement system for vendor management, purchase orders, and approval workflows.', 'Business Systems'),

  // Marketplace Systems
  entry('MARKETPLACE_WEB_V1', 'MARKETPLACE', 'Marketplace', 'Build a marketplace for buyers and sellers with listings, search, and transactions.', 'Marketplace Systems'),
  entry('E_COMMERCE_PLATFORM_WEB_V1', 'E_COMMERCE_PLATFORM', 'E-Commerce Platform', 'Build an e-commerce platform with product catalog, cart, checkout, and order management.', 'Marketplace Systems'),
  entry('B2B_MARKETPLACE_WEB_V1', 'B2B_MARKETPLACE', 'B2B Marketplace', 'Build a B2B marketplace for wholesale buyers and suppliers with bulk ordering.', 'Marketplace Systems'),
  entry('RENTAL_MARKETPLACE_WEB_V1', 'RENTAL_MARKETPLACE', 'Rental Marketplace', 'Build a rental marketplace for equipment and property with availability and bookings.', 'Marketplace Systems'),
  entry('JOB_BOARD_WEB_V1', 'JOB_BOARD', 'Job Board', 'Build a job board with job listings, employer profiles, applications, and candidate search.', 'Marketplace Systems'),
  entry('FREELANCER_PLATFORM_WEB_V1', 'FREELANCER_PLATFORM', 'Freelancer Platform', 'Build a freelancer platform with gigs, proposals, contracts, and payments.', 'Marketplace Systems'),
  entry('PROPERTY_LISTINGS_WEB_V1', 'PROPERTY_LISTINGS', 'Property Listings', 'Build a property listings platform with search, filters, agent profiles, and inquiries.', 'Marketplace Systems'),

  // Education Systems
  entry('SCHOOL_MANAGEMENT_WEB_V1', 'SCHOOL_MANAGEMENT', 'School Management', 'Build a school management system for students, teachers, and classes with create, edit, delete, and assign workflows.', 'Education Systems'),
  entry('LEARNING_PLATFORM_WEB_V1', 'LEARNING_PLATFORM', 'Learning Platform', 'Build a learning platform with courses, lessons, student progress, and assessments.', 'Education Systems'),
  entry('ONLINE_COURSES_WEB_V1', 'ONLINE_COURSES', 'Online Courses', 'Build an online courses platform with course creation, enrollment, and progress tracking.', 'Education Systems'),
  entry('UNIVERSITY_PORTAL_WEB_V1', 'UNIVERSITY_PORTAL', 'University Portal', 'Build a university portal for students, faculty, courses, and academic records.', 'Education Systems'),
  entry('TRAINING_PLATFORM_WEB_V1', 'TRAINING_PLATFORM', 'Training Platform', 'Build a corporate training platform with modules, quizzes, and certification tracking.', 'Education Systems'),
  entry('CERTIFICATION_SYSTEM_WEB_V1', 'CERTIFICATION_SYSTEM', 'Certification System', 'Build a certification system with exams, credentials, and renewal workflows.', 'Education Systems'),

  // Healthcare Systems
  entry('HEALTHCARE_PORTAL_WEB_V1', 'HEALTHCARE_PORTAL', 'Healthcare Portal', 'Build a healthcare portal for patients, appointments, medical records, and provider messaging.', 'Healthcare Systems'),
  entry('PATIENT_MANAGEMENT_WEB_V1', 'PATIENT_MANAGEMENT', 'Patient Management', 'Build a patient management system with demographics, history, and care plans.', 'Healthcare Systems'),
  entry('APPOINTMENT_BOOKING_WEB_V1', 'APPOINTMENT_BOOKING', 'Appointment Booking', 'Build an appointment booking system for clinics with calendar and reminders.', 'Healthcare Systems'),
  entry('TELEMEDICINE_WEB_V1', 'TELEMEDICINE', 'Telemedicine', 'Build a telemedicine platform with video visits, prescriptions, and patient messaging.', 'Healthcare Systems'),
  entry('MEDICAL_RECORDS_WEB_V1', 'MEDICAL_RECORDS', 'Medical Records', 'Build a medical records system with secure charting, labs, and provider notes.', 'Healthcare Systems'),
  entry('CLINIC_OPERATIONS_WEB_V1', 'CLINIC_OPERATIONS', 'Clinic Operations', 'Build a clinic operations platform for scheduling, billing, and staff coordination.', 'Healthcare Systems'),

  // Finance Systems
  entry('FINANCE_TRACKER_WEB_V1', 'FINANCE_TRACKER', 'Finance Tracker', 'Build a finance tracker with budgets, transactions, categories, and spending reports.', 'Finance Systems'),
  entry('EXPENSE_TRACKER_WEB_V1', 'EXPENSE_TRACKER', 'Expense Tracker', 'Build an expense tracker with receipts, categories, approvals, and reimbursements.', 'Finance Systems'),
  entry('BUDGET_PLANNER_WEB_V1', 'BUDGET_PLANNER', 'Budget Planner', 'Build a budget planner with goals, forecasts, and category limits.', 'Finance Systems'),
  entry('INVOICE_PLATFORM_WEB_V1', 'INVOICE_PLATFORM', 'Invoice Platform', 'Build an invoice platform with clients, line items, payments, and reminders.', 'Finance Systems'),
  entry('SUBSCRIPTION_MANAGER_WEB_V1', 'SUBSCRIPTION_MANAGER', 'Subscription Manager', 'Build a subscription manager with plans, billing cycles, and churn tracking.', 'Finance Systems'),

  // Hospitality Systems
  entry('RESTAURANT_POS_WEB_V1', 'RESTAURANT_POS', 'Restaurant POS', 'Build a restaurant POS with orders, menu management, table service, and payment processing.', 'Hospitality Systems'),
  entry('HOTEL_MANAGEMENT_WEB_V1', 'HOTEL_MANAGEMENT', 'Hotel Management', 'Build a hotel management system with rooms, reservations, housekeeping, and billing.', 'Hospitality Systems'),
  entry('RESERVATION_PLATFORM_WEB_V1', 'RESERVATION_PLATFORM', 'Reservation Platform', 'Build a reservation platform with availability, bookings, and customer profiles.', 'Hospitality Systems'),
  entry('TRAVEL_PLANNER_WEB_V1', 'TRAVEL_PLANNER', 'Travel Planner', 'Build a travel planner with itineraries, bookings, and expense tracking.', 'Hospitality Systems'),
  entry('TOUR_BOOKING_WEB_V1', 'TOUR_BOOKING', 'Tour Booking', 'Build a tour booking platform with packages, schedules, and guide assignments.', 'Hospitality Systems'),

  // Community Platforms
  entry('SOCIAL_PLATFORM_WEB_V1', 'SOCIAL_PLATFORM', 'Social Platform', 'Build a social platform with profiles, posts, comments, likes, and friend connections.', 'Community Platforms'),
  entry('FORUM_PLATFORM_WEB_V1', 'FORUM_PLATFORM', 'Forum Platform', 'Build a forum platform with topics, threads, moderation, and user reputation.', 'Community Platforms'),
  entry('MEMBERSHIP_PLATFORM_WEB_V1', 'MEMBERSHIP_PLATFORM', 'Membership Platform', 'Build a membership platform with tiers, benefits, and member directories.', 'Community Platforms'),
  entry('COMMUNITY_PORTAL_WEB_V1', 'COMMUNITY_PORTAL', 'Community Portal', 'Build a community portal with events, discussions, and resource libraries.', 'Community Platforms'),
  entry('EVENT_PLATFORM_WEB_V1', 'EVENT_PLATFORM', 'Event Platform', 'Build an event platform with event creation, ticketing, schedules, and attendee management.', 'Community Platforms'),

  // Operations Platforms
  entry('WAREHOUSE_MANAGEMENT_WEB_V1', 'WAREHOUSE_MANAGEMENT', 'Warehouse Management', 'Build a warehouse management system with inventory zones, shipments, and picking workflows.', 'Operations Platforms'),
  entry('CONSTRUCTION_MANAGEMENT_WEB_V1', 'CONSTRUCTION_MANAGEMENT', 'Construction Management', 'Build a construction management platform with projects, crews, materials, and timelines.', 'Operations Platforms'),
  entry('MAINTENANCE_TRACKING_WEB_V1', 'MAINTENANCE_TRACKING', 'Maintenance Tracking', 'Build a maintenance tracking system for work orders, assets, and technician schedules.', 'Operations Platforms'),
  entry('ASSET_MANAGEMENT_WEB_V1', 'ASSET_MANAGEMENT', 'Asset Management', 'Build an asset management platform with depreciation, assignments, and audits.', 'Operations Platforms'),
  entry('COMPLIANCE_TRACKING_WEB_V1', 'COMPLIANCE_TRACKING', 'Compliance Tracking', 'Build a compliance tracking system with policies, audits, and remediation tasks.', 'Operations Platforms'),

  // Extended Categories (breadth beyond core groups)
  entry('BOOKING_PLATFORM_WEB_V1', 'BOOKING_PLATFORM', 'Booking Platform', 'Build a booking platform with calendar scheduling, reservations, and availability management.', 'Extended Categories'),
  entry('FITNESS_APP_WEB_V1', 'FITNESS_APP', 'Fitness App', 'Build a fitness app with workouts, exercise tracking, progress charts, and goal setting.', 'Extended Categories'),
  entry('PROPERTY_MANAGEMENT_WEB_V1', 'PROPERTY_MANAGEMENT', 'Property Management', 'Build a property management system for listings, tenants, leases, and maintenance requests.', 'Extended Categories'),
  entry('LEGAL_CASE_MANAGEMENT_WEB_V1', 'LEGAL_CASE_MANAGEMENT', 'Legal Case Management', 'Build a legal case management system with cases, documents, and client billing.', 'Extended Categories'),
  entry('LOGISTICS_PLATFORM_WEB_V1', 'LOGISTICS_PLATFORM', 'Logistics Platform', 'Build a logistics platform with shipments, routes, carriers, and delivery tracking.', 'Extended Categories'),
  entry('AGRICULTURE_MANAGEMENT_WEB_V1', 'AGRICULTURE_MANAGEMENT', 'Agriculture Management', 'Build an agriculture management system for crops, fields, harvests, and equipment.', 'Extended Categories'),
  entry('REAL_ESTATE_CRM_WEB_V1', 'REAL_ESTATE_CRM', 'Real Estate CRM', 'Build a real estate CRM with listings, leads, showings, and closing workflows.', 'Extended Categories'),
  entry('DONATION_PLATFORM_WEB_V1', 'DONATION_PLATFORM', 'Donation Platform', 'Build a donation platform with campaigns, donors, and recurring contributions.', 'Extended Categories'),
  entry('LIBRARY_SYSTEM_WEB_V1', 'LIBRARY_SYSTEM', 'Library System', 'Build a library system with catalog, lending, members, and overdue tracking.', 'Extended Categories'),
] as const;

export function resolveLargeScaleCategory(profile?: string | null): LargeScaleCategoryDefinition {
  const match = LARGE_SCALE_VALIDATION_SUITE.find((cat) => cat.profile === profile);
  return match ?? LARGE_SCALE_VALIDATION_SUITE[0];
}

export function listLargeScaleCategoryGroups(): readonly LargeScaleCategoryGroup[] {
  const groups = new Set<LargeScaleCategoryGroup>();
  for (const cat of LARGE_SCALE_VALIDATION_SUITE) {
    groups.add(cat.categoryGroup);
  }
  return [...groups];
}
