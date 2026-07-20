/**
 * AIDEVENGINE_ADVERSARIAL_END_TO_END_GENERATION_AUDIT_V1 — workload.
 *
 * 55 novel products across required domains. Intentionally excludes HarborFlow,
 * LISA, ExpeditionOS, ResilienceOS, TempLink, CRM, and ERP Lite benchmarks.
 * Includes adversarial prompts (overlapping terms, banned words used legitimately,
 * ambiguous wording, multi-timeline concepts).
 */

export interface AdversarialWorkloadItem {
  readonly id: string;
  readonly domain: string;
  readonly category:
    | 'healthcare'
    | 'logistics'
    | 'agriculture'
    | 'finance'
    | 'manufacturing'
    | 'education'
    | 'legal'
    | 'hospitality'
    | 'marine'
    | 'aviation'
    | 'construction'
    | 'emergency'
    | 'insurance'
    | 'government'
    | 'retail'
    | 'scientific'
    | 'industrial'
    | 'entertainment'
    | 'sports'
    | 'accessibility';
  readonly label: string;
  readonly size: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';
  readonly style:
    | 'sentence'
    | 'paragraph'
    | 'bullets'
    | 'vague'
    | 'detailed'
    | 'jargon'
    | 'ambiguous'
    | 'adversarial'
    | 'short'
    | 'long';
  readonly adversarial: boolean;
  readonly prompt: string;
  /** Expected capability phrases for retention checks (not module allowlists). */
  readonly expectedCapabilities: readonly string[];
}

export const ADVERSARIAL_WORKLOAD: readonly AdversarialWorkloadItem[] = [
  // ---- healthcare ----
  {
    id: 'dialysis-unit-scheduler',
    domain: 'Dialysis Unit',
    category: 'healthcare',
    label: 'Dialysis Unit Scheduler',
    size: 'medium',
    style: 'detailed',
    adversarial: false,
    prompt:
      'Build a dialysis unit scheduler for a hospital ward. Track dialysis chairs, patient sessions, machine assignments, nurse coverage, session status workflow (scheduled, in-progress, completed, cancelled), adverse event notes, and daily chair utilization. Include search by patient, filtering by chair and status, and local persistence.',
    expectedCapabilities: ['dialysis chairs', 'patient sessions', 'machine assignments', 'nurse coverage', 'adverse event'],
  },
  {
    id: 'blood-bank-inventory-data',
    domain: 'Blood Bank',
    category: 'healthcare',
    label: 'Blood Bank Ops',
    size: 'medium',
    style: 'adversarial',
    adversarial: true,
    prompt:
      'Create a blood bank operations console. Manage blood units, donors, crossmatch requests, transfusion orders, expiry tracking, and cold-chain temperature logs. The word inventory here means the blood-unit stock data table, not a generic retail inventory management module. Contacts means donor and clinician stakeholders, not a CRM. Include search, status filtering, and local persistence.',
    expectedCapabilities: ['blood units', 'donors', 'crossmatch', 'transfusion orders', 'expiry', 'cold-chain'],
  },
  {
    id: 'physio-rehab-tiny',
    domain: 'Physiotherapy',
    category: 'healthcare',
    label: 'Physio Session Log',
    size: 'tiny',
    style: 'short',
    adversarial: false,
    prompt: 'Tiny physio session logger: patients, therapists, sessions, exercises prescribed.',
    expectedCapabilities: ['patients', 'therapists', 'sessions', 'exercises'],
  },

  // ---- logistics ----
  {
    id: 'cold-chain-freight',
    domain: 'Cold Chain Freight',
    category: 'logistics',
    label: 'Cold Chain Freight Console',
    size: 'large',
    style: 'jargon',
    adversarial: false,
    prompt:
      'Provision a cold-chain freight operations console: refrigerated consignments, temperature excursion events, carrier handoffs, route legs, depot dwell times, delivery windows, proof-of-delivery photos, and exception escalation workflow. Include consignment-to-leg relationships, excursion flagging, search, and local persistence.',
    expectedCapabilities: ['consignments', 'temperature excursion', 'carrier handoffs', 'route legs', 'proof-of-delivery'],
  },
  {
    id: 'port-crane-dispatch',
    domain: 'Port Crane Dispatch',
    category: 'logistics',
    label: 'Port Crane Dispatch',
    size: 'medium',
    style: 'paragraph',
    adversarial: false,
    prompt:
      'We need software that dispatches quay cranes and yard trucks for container moves. Track vessels at berth, crane work orders, move instructions, yard slots, operator shifts, and delay reasons. Staff must filter work orders by crane and status and export a shift summary.',
    expectedCapabilities: ['vessels', 'crane work orders', 'move instructions', 'yard slots', 'operator shifts'],
  },

  // ---- agriculture ----
  {
    id: 'vineyard-spray-log',
    domain: 'Vineyard',
    category: 'agriculture',
    label: 'Vineyard Spray Log',
    size: 'small',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build a vineyard spray log with blocks, grape varieties, spray applications, weather conditions, re-entry intervals, and operator notes, plus search and filtering.',
    expectedCapabilities: ['blocks', 'grape varieties', 'spray applications', 're-entry intervals'],
  },
  {
    id: 'livestock-breeding-xl',
    domain: 'Livestock Breeding',
    category: 'agriculture',
    label: 'Livestock Breeding Registry',
    size: 'xlarge',
    style: 'long',
    adversarial: true,
    prompt:
      'Build a livestock breeding registry for a mixed cattle and sheep station. It must cover animal identities with ear tags, pedigrees, mating events, pregnancy checks, calving and lambing outcomes, weaning weights, veterinary treatments, pasture paddock rotations, feed rations, sale lots, and buyer stakeholders (contacts means sale buyers and vets, not CRM contacts). Also include an activity history of husbandry actions and a project history of seasonal breeding programs — these are domain histories, not a generic project-management timeline or tasks module. Provide search, filtering by species and paddock, relationships from animal to pedigree and treatments, CSV export of weaning weights, and local persistence.',
    expectedCapabilities: [
      'ear tags',
      'pedigrees',
      'mating events',
      'pregnancy checks',
      'weaning weights',
      'paddock rotations',
      'activity history',
      'project history',
    ],
  },

  // ---- finance ----
  {
    id: 'municipal-bond-desk',
    domain: 'Municipal Bonds',
    category: 'finance',
    label: 'Municipal Bond Desk',
    size: 'medium',
    style: 'jargon',
    adversarial: false,
    prompt:
      'Create a municipal bond trading desk ledger: issuers, series, coupon schedules, bid/ask blotter, settlement instructions, custody positions, and mark-to-market snapshots. Include series-to-coupon relationships and a positions board.',
    expectedCapabilities: ['issuers', 'coupon schedules', 'blotter', 'settlement', 'custody positions'],
  },
  {
    id: 'grant-disbursement',
    domain: 'Grant Finance',
    category: 'finance',
    label: 'Grant Disbursement Tracker',
    size: 'medium',
    style: 'detailed',
    adversarial: false,
    prompt:
      'Build a grant disbursement tracker with grant programs, applicants, award decisions, milestone-based draws, compliance checklists, clawback flags, and audit history of every financial decision. Support filtering by program status and local persistence.',
    expectedCapabilities: ['grant programs', 'applicants', 'award decisions', 'milestone draws', 'audit history'],
  },

  // ---- manufacturing ----
  {
    id: 'pcb-reflow-line',
    domain: 'PCB Reflow',
    category: 'manufacturing',
    label: 'PCB Reflow Line Monitor',
    size: 'medium',
    style: 'bullets',
    adversarial: false,
    prompt:
      'PCB reflow line monitor:\n- Board lots and panel IDs\n- Oven zones and temperature profiles\n- Defect codes and scrap reasons\n- Operator shift handovers\n- Maintenance closures for oven downtime\n- Search and filter by lot\n- Local persistence',
    expectedCapabilities: ['board lots', 'oven zones', 'defect codes', 'shift handovers', 'maintenance closures'],
  },
  {
    id: 'tooling-calibration',
    domain: 'Tool Calibration',
    category: 'manufacturing',
    label: 'Tooling Calibration Lab',
    size: 'small',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build a tooling calibration lab app with gauges, calibration certificates, due dates, technicians, and out-of-tolerance holds.',
    expectedCapabilities: ['gauges', 'calibration certificates', 'due dates', 'technicians'],
  },

  // ---- education ----
  {
    id: 'apprenticeship-hours',
    domain: 'Apprenticeship',
    category: 'education',
    label: 'Apprenticeship Hours Ledger',
    size: 'medium',
    style: 'paragraph',
    adversarial: false,
    prompt:
      'Trade schools need an apprenticeship hours ledger. Track apprentices, mentors, competency units, logged hours with approval workflow, exam attempts, and employer placements. Mentors filter by apprentice status; export hour totals.',
    expectedCapabilities: ['apprentices', 'mentors', 'competency units', 'logged hours', 'exam attempts'],
  },
  {
    id: 'field-course-roster',
    domain: 'Field Course',
    category: 'education',
    label: 'Field Course Roster',
    size: 'small',
    style: 'vague',
    adversarial: true,
    prompt:
      'Something for outdoor field courses — students, trips, gear checkouts, risk waivers. Maybe notes. Keep it simple but real.',
    expectedCapabilities: ['students', 'trips', 'gear checkouts', 'risk waivers'],
  },

  // ---- legal ----
  {
    id: 'immigration-case-timeline',
    domain: 'Immigration Cases',
    category: 'legal',
    label: 'Immigration Case Desk',
    size: 'large',
    style: 'adversarial',
    adversarial: true,
    prompt:
      'Build an immigration case desk. Capabilities: client matters, visa categories, filing deadlines, evidence checklists, hearing dates, and a case-timeline of procedural milestones for each matter. Also keep an activity-timeline of attorney actions (calls, filings, reviews). Do NOT invent a bare generic timeline module, tasks pack, or projects CRM. Contacts means clients and opposing counsel stakeholders. Include search, filtering by visa category, and local persistence.',
    expectedCapabilities: ['client matters', 'visa categories', 'filing deadlines', 'case-timeline', 'activity-timeline', 'evidence checklists'],
  },
  {
    id: 'notary-journal',
    domain: 'Notary',
    category: 'legal',
    label: 'Notary Journal',
    size: 'tiny',
    style: 'short',
    adversarial: false,
    prompt: 'Notary journal: notarizations, signers, ID verification, seal numbers.',
    expectedCapabilities: ['notarizations', 'signers', 'ID verification', 'seal numbers'],
  },

  // ---- hospitality ----
  {
    id: 'boutique-spa-bookings',
    domain: 'Spa',
    category: 'hospitality',
    label: 'Boutique Spa Bookings',
    size: 'medium',
    style: 'paragraph',
    adversarial: true,
    prompt:
      'Boutique spa booking system for treatments, therapists, rooms, and guest preferences. Appointments are spa treatment slots, not a generic appointments CRM. Inventory mentioned only as retail product stock for oils and lotions sold at checkout — not a warehouse WMS. Include waitlist, no-show tracking, and local persistence.',
    expectedCapabilities: ['treatments', 'therapists', 'rooms', 'guest preferences', 'waitlist', 'retail product stock'],
  },
  {
    id: 'hostel-bed-board',
    domain: 'Hostel',
    category: 'hospitality',
    label: 'Hostel Bed Board',
    size: 'small',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build a hostel bed board with dorm rooms, beds, guests, nightly occupancy, lockers, and check-in workflow.',
    expectedCapabilities: ['dorm rooms', 'beds', 'guests', 'occupancy', 'check-in'],
  },

  // ---- marine ----
  {
    id: 'fishery-quota-ledger',
    domain: 'Fishery Quotas',
    category: 'marine',
    label: 'Fishery Quota Ledger',
    size: 'medium',
    style: 'detailed',
    adversarial: false,
    prompt:
      'Build a fishery quota ledger with vessels, catch species, trip landings, quota balances, observer reports, and landing certificates. Support trip-to-landing relationships, filtering by species, and local persistence.',
    expectedCapabilities: ['vessels', 'catch species', 'trip landings', 'quota balances', 'observer reports'],
  },
  {
    id: 'dive-ops-board',
    domain: 'Commercial Dive Ops',
    category: 'marine',
    label: 'Commercial Dive Ops Board',
    size: 'medium',
    style: 'adversarial',
    adversarial: true,
    prompt:
      'Commercial dive operations board: dive teams, job sites, decompression schedules, equipment checkouts, and a delivery-timeline for equipment to vessels. Project history means prior dive jobs archive, not project management. Show events over time only as the delivery-timeline capability explicitly requested — do not create a bare timeline fallback.',
    expectedCapabilities: ['dive teams', 'job sites', 'decompression schedules', 'equipment checkouts', 'delivery-timeline'],
  },

  // ---- aviation ----
  {
    id: 'ga-maintenance-hangar',
    domain: 'GA Maintenance',
    category: 'aviation',
    label: 'GA Hangar Maintenance',
    size: 'large',
    style: 'jargon',
    adversarial: true,
    prompt:
      'General aviation hangar maintenance system: aircraft tails, squawk items, work orders, parts kits, A&P mechanic assignments, AD compliance, and a maintenance-timeline of airworthiness actions per tail. Maintenance history notes are narrative logs and must not auto-create a generic timeline module. Inventory means aircraft parts kits on the hangar shelf as data, not retail inventory management. Include search and local persistence.',
    expectedCapabilities: ['aircraft tails', 'squawk items', 'work orders', 'parts kits', 'maintenance-timeline', 'AD compliance'],
  },
  {
    id: 'fbo-fuel-desk',
    domain: 'FBO Fuel',
    category: 'aviation',
    label: 'FBO Fuel Desk',
    size: 'small',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build an FBO fuel desk with aircraft, fuel uplifts, tankers, pump meters, and invoicing to operators.',
    expectedCapabilities: ['aircraft', 'fuel uplifts', 'tankers', 'pump meters', 'invoicing'],
  },

  // ---- construction ----
  {
    id: 'scaffold-inspection',
    domain: 'Scaffold Safety',
    category: 'construction',
    label: 'Scaffold Inspection Log',
    size: 'medium',
    style: 'bullets',
    adversarial: false,
    prompt:
      'Scaffold inspection log:\n- Sites and scaffold tags\n- Daily inspection checklists\n- Defect findings and hold points\n- Competent person sign-off\n- Photo notes\n- Filter by site status\n- Local persistence',
    expectedCapabilities: ['scaffold tags', 'inspection checklists', 'defect findings', 'competent person'],
  },
  {
    id: 'concrete-pour-schedule',
    domain: 'Concrete Pours',
    category: 'construction',
    label: 'Concrete Pour Scheduler',
    size: 'medium',
    style: 'paragraph',
    adversarial: false,
    prompt:
      'Concrete pour scheduler for mid-rise builds. Track pour events, mix designs, truck tickets, cylinder samples, cure strength results, and weather holds. Link samples to pours; export a pour register.',
    expectedCapabilities: ['pour events', 'mix designs', 'truck tickets', 'cylinder samples', 'cure strength'],
  },

  // ---- emergency services ----
  {
    id: 'wildfire-incident-timeline',
    domain: 'Wildfire Response',
    category: 'emergency',
    label: 'Wildfire Incident Desk',
    size: 'xlarge',
    style: 'adversarial',
    adversarial: true,
    prompt:
      'Wildfire incident command desk spanning multiple overlapping concepts: incident-timeline of fire progression, activity-timeline of crew deployments, resource requests, evacuation zones, weather observations, and mutual-aid partners. The prompt contains the word timeline twice for two distinct capabilities — do not approve every *-timeline sibling or a bare timeline. Also mentions projects only as burn-project polygons on the map, not a projects module. Tasks means crew tasking assignments specific to the incident, justified explicitly — not a generic tasks fallback pack. Contacts are agency liaisons. Local persistence required.',
    expectedCapabilities: [
      'incident-timeline',
      'activity-timeline',
      'resource requests',
      'evacuation zones',
      'weather observations',
      'crew tasking',
    ],
  },
  {
    id: 'ambulance-shift-board',
    domain: 'Ambulance',
    category: 'emergency',
    label: 'Ambulance Shift Board',
    size: 'small',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build an ambulance shift board with units, crews, call signs, shift handovers, and vehicle readiness checks.',
    expectedCapabilities: ['units', 'crews', 'call signs', 'shift handovers', 'vehicle readiness'],
  },

  // ---- insurance ----
  {
    id: 'crop-insurance-claims',
    domain: 'Crop Insurance',
    category: 'insurance',
    label: 'Crop Insurance Claims',
    size: 'medium',
    style: 'detailed',
    adversarial: false,
    prompt:
      'Build a crop insurance claims desk with policies, insured fields, loss notices, adjuster visits, indemnity calculations, and settlement status workflow. Include field-to-policy relationships and filtering by crop season.',
    expectedCapabilities: ['policies', 'insured fields', 'loss notices', 'adjuster visits', 'indemnity'],
  },
  {
    id: 'cyber-risk-questionnaire',
    domain: 'Cyber Risk',
    category: 'insurance',
    label: 'Cyber Risk Questionnaire',
    size: 'small',
    style: 'short',
    adversarial: false,
    prompt: 'Cyber risk underwriting questionnaire: insureds, control answers, scoring, referrals.',
    expectedCapabilities: ['insureds', 'control answers', 'scoring', 'referrals'],
  },

  // ---- government ----
  {
    id: 'permit-counter',
    domain: 'Building Permits',
    category: 'government',
    label: 'Building Permit Counter',
    size: 'large',
    style: 'long',
    adversarial: true,
    prompt:
      'Municipal building permit counter application. Track permit applications, plan reviews, inspection scheduling, fee payments, stop-work orders, and an audit-timeline of regulatory decisions. Dashboard is only a status board of open permits — do not invent unrelated business modules like deals or leads. Reports means permit register exports, not a generic reports app. Notes are review comments on plan sets. Include search, filtering by permit type, and local persistence.',
    expectedCapabilities: ['permit applications', 'plan reviews', 'inspection scheduling', 'fee payments', 'audit-timeline'],
  },
  {
    id: 'voter-roll-tiny',
    domain: 'Voter Roll',
    category: 'government',
    label: 'Precinct Voter Roll',
    size: 'tiny',
    style: 'short',
    adversarial: false,
    prompt: 'Precinct voter roll helper: voters, precincts, absentee requests, poll workers.',
    expectedCapabilities: ['voters', 'precincts', 'absentee requests', 'poll workers'],
  },

  // ---- retail ----
  {
    id: 'farmers-market-stalls',
    domain: 'Farmers Market',
    category: 'retail',
    label: 'Farmers Market Stall Manager',
    size: 'medium',
    style: 'paragraph',
    adversarial: false,
    prompt:
      'Farmers market stall manager for vendors, stall assignments, produce listings, weekly fees, and market-day check-ins. Managers filter stalls by aisle and export a vendor roster.',
    expectedCapabilities: ['vendors', 'stall assignments', 'produce listings', 'weekly fees', 'check-ins'],
  },
  {
    id: 'consignment-boutique',
    domain: 'Consignment',
    category: 'retail',
    label: 'Consignment Boutique',
    size: 'medium',
    style: 'adversarial',
    adversarial: true,
    prompt:
      'Consignment boutique POS: garments, consignors, split settlements, and floor stock. Inventory is the garment floor stock data — justify stock tracking as consignable items, not a banned generic inventory fallback without ancestry. Team means boutique associates on shift, not a team module. Include sales tickets and local persistence.',
    expectedCapabilities: ['garments', 'consignors', 'split settlements', 'floor stock', 'sales tickets'],
  },

  // ---- scientific research ----
  {
    id: 'cryo-sample-registry',
    domain: 'Cryo Samples',
    category: 'scientific',
    label: 'Cryo Sample Registry',
    size: 'large',
    style: 'jargon',
    adversarial: false,
    prompt:
      'Cryogenic biobank sample registry: freezer racks, vial positions, consent forms, aliquot lineages, thaw events, and researcher checkout requests with approval workflow. Include vial-to-rack relationships and abnormal temperature flags.',
    expectedCapabilities: ['freezer racks', 'vial positions', 'consent forms', 'aliquot lineages', 'thaw events'],
  },
  {
    id: 'telescope-queue',
    domain: 'Observatory',
    category: 'scientific',
    label: 'Telescope Observation Queue',
    size: 'medium',
    style: 'detailed',
    adversarial: true,
    prompt:
      'Observatory observation queue with proposals, targets, instrument configurations, scheduling-timeline of nights awarded, and weather scrub history. Scheduling-timeline is the exact capability; do not also invent delivery-timeline or bare timeline. Project history is prior observing seasons archive.',
    expectedCapabilities: ['proposals', 'targets', 'instrument configurations', 'scheduling-timeline', 'weather scrub'],
  },

  // ---- industrial automation ----
  {
    id: 'plc-alarm-historian',
    domain: 'PLC Alarms',
    category: 'industrial',
    label: 'PLC Alarm Historian',
    size: 'medium',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build a PLC alarm historian with sites, controllers, alarm tags, acknowledgment workflow, and root-cause annotations, plus filtering by severity.',
    expectedCapabilities: ['controllers', 'alarm tags', 'acknowledgment', 'root-cause annotations'],
  },
  {
    id: 'robot-cell-oee',
    domain: 'Robot Cell OEE',
    category: 'industrial',
    label: 'Robot Cell OEE Board',
    size: 'medium',
    style: 'paragraph',
    adversarial: false,
    prompt:
      'Robot cell OEE board tracking cells, cycles, scrap counts, downtime codes, shift KPIs, and maintenance work requests. Export OEE by cell.',
    expectedCapabilities: ['cells', 'cycles', 'scrap counts', 'downtime codes', 'OEE'],
  },

  // ---- entertainment ----
  {
    id: 'indie-festival-runsheet',
    domain: 'Indie Festival',
    category: 'entertainment',
    label: 'Indie Festival Run Sheet',
    size: 'large',
    style: 'long',
    adversarial: true,
    prompt:
      'Independent music festival run sheet: stages, artists, set times, load-in windows, volunteer shifts, hospitality riders, and a communication-timeline of stage manager radio calls. Also an activity-timeline of production changes. Two timeline compounds only — never a bare timeline. Notes are rider comments. Booking means artist bookings for this festival only. Local persistence.',
    expectedCapabilities: [
      'stages',
      'artists',
      'set times',
      'volunteer shifts',
      'communication-timeline',
      'activity-timeline',
    ],
  },
  {
    id: 'tabletop-rpg-sessions',
    domain: 'Tabletop RPG',
    category: 'entertainment',
    label: 'Tabletop RPG Session Log',
    size: 'tiny',
    style: 'short',
    adversarial: false,
    prompt: 'Tabletop RPG session log: campaigns, characters, sessions, loot.',
    expectedCapabilities: ['campaigns', 'characters', 'sessions', 'loot'],
  },

  // ---- sports ----
  {
    id: 'youth-league-fixtures',
    domain: 'Youth League',
    category: 'sports',
    label: 'Youth League Fixtures',
    size: 'medium',
    style: 'bullets',
    adversarial: false,
    prompt:
      'Youth sports league fixtures:\n- Teams and age brackets\n- Fixtures and venues\n- Referees\n- Results and standings\n- Discipline incidents\n- Filter by bracket\n- Local persistence',
    expectedCapabilities: ['teams', 'fixtures', 'venues', 'referees', 'standings', 'discipline incidents'],
  },
  {
    id: 'climbing-gym-routes',
    domain: 'Climbing Gym',
    category: 'sports',
    label: 'Climbing Route Setter',
    size: 'small',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build a climbing gym route setter app with walls, routes, grades, setters, and takedown schedule.',
    expectedCapabilities: ['walls', 'routes', 'grades', 'setters', 'takedown'],
  },

  // ---- accessibility ----
  {
    id: 'captioning-desk',
    domain: 'Live Captioning',
    category: 'accessibility',
    label: 'Live Captioning Desk',
    size: 'medium',
    style: 'detailed',
    adversarial: false,
    prompt:
      'Live captioning operations desk with events, captioners, glossaries, shift assignments, quality review scores, and delivery status to broadcast partners. Include glossary-to-event relationships and local persistence.',
    expectedCapabilities: ['events', 'captioners', 'glossaries', 'shift assignments', 'quality review'],
  },
  {
    id: 'aac-phrase-board',
    domain: 'AAC Phrases',
    category: 'accessibility',
    label: 'AAC Phrase Board Builder',
    size: 'small',
    style: 'ambiguous',
    adversarial: true,
    prompt:
      'Help someone communicate with boards and phrases and maybe categories. Also quick phrases. Not a task tracker. Not a CRM. AAC phrase boards for speech support.',
    expectedCapabilities: ['phrase boards', 'phrases', 'categories', 'quick phrases'],
  },

  // ---- extra coverage for size/adversarial variety ----
  {
    id: 'beekeeping-apiary',
    domain: 'Beekeeping',
    category: 'agriculture',
    label: 'Apiary Hive Log',
    size: 'small',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build an apiary hive log with hives, inspections, mite treatments, honey harvests, and queen lineage notes.',
    expectedCapabilities: ['hives', 'inspections', 'mite treatments', 'honey harvests', 'queen lineage'],
  },
  {
    id: 'rail-yard-switching',
    domain: 'Rail Yard',
    category: 'logistics',
    label: 'Rail Yard Switching Plan',
    size: 'medium',
    style: 'jargon',
    adversarial: false,
    prompt:
      'Rail yard switching plan: tracks, cars, consists, switch moves, locomotive assignments, and dwell timers with status workflow.',
    expectedCapabilities: ['tracks', 'cars', 'consists', 'switch moves', 'locomotive assignments'],
  },
  {
    id: 'museum-loan-desk',
    domain: 'Museum Loans',
    category: 'entertainment',
    label: 'Museum Loan Desk',
    size: 'medium',
    style: 'paragraph',
    adversarial: false,
    prompt:
      'Museum outbound loan desk managing artifacts, borrowing institutions, loan agreements, courier logistics, condition reports, and return receipts. Filter by loan status; link condition reports to artifacts.',
    expectedCapabilities: ['artifacts', 'borrowing institutions', 'loan agreements', 'condition reports', 'return receipts'],
  },
  {
    id: 'stormwater-asset',
    domain: 'Stormwater Assets',
    category: 'government',
    label: 'Stormwater Asset Register',
    size: 'medium',
    style: 'detailed',
    adversarial: false,
    prompt:
      'Stormwater asset register with catch basins, outfalls, CCTV inspections, blockage work orders, and rainfall event correlations. Include asset-to-inspection relationships and local persistence.',
    expectedCapabilities: ['catch basins', 'outfalls', 'CCTV inspections', 'blockage work orders'],
  },
  {
    id: 'clinical-trial-randomization',
    domain: 'Clinical Trials',
    category: 'healthcare',
    label: 'Trial Randomization Desk',
    size: 'large',
    style: 'jargon',
    adversarial: true,
    prompt:
      'Clinical trial randomization desk: protocols, sites, subjects, stratification factors, kit assignments, and an audit-timeline of randomization decisions. Inventory means randomization kit packs as study materials data — not retail inventory management. Team means site investigators, justified as study staff directory, not a banned team fallback without ancestry. Local persistence.',
    expectedCapabilities: ['protocols', 'sites', 'subjects', 'stratification', 'kit assignments', 'audit-timeline'],
  },
  {
    id: 'wind-turbine-scada-lite',
    domain: 'Wind Turbines',
    category: 'industrial',
    label: 'Wind Turbine SCADA Lite',
    size: 'medium',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build a wind turbine SCADA lite with turbines, power curves, fault codes, curtailment events, and technician dispatches.',
    expectedCapabilities: ['turbines', 'power curves', 'fault codes', 'curtailment', 'technician dispatches'],
  },
  {
    id: 'orphanage-sponsorship',
    domain: 'Child Sponsorship',
    category: 'government',
    label: 'Sponsorship Matching Desk',
    size: 'medium',
    style: 'paragraph',
    adversarial: false,
    prompt:
      'Child sponsorship matching desk for sponsors, children, monthly updates, gift requests, and correspondence logs. Staff search children and filter by sponsorship status.',
    expectedCapabilities: ['sponsors', 'children', 'monthly updates', 'gift requests', 'correspondence'],
  },
  {
    id: 'esports-tournament-bracket',
    domain: 'Esports',
    category: 'sports',
    label: 'Esports Tournament Bracket',
    size: 'medium',
    style: 'bullets',
    adversarial: false,
    prompt:
      'Esports tournament bracket:\n- Teams and players\n- Brackets and matches\n- Check-in workflow\n- Stream assignments\n- Dispute tickets\n- Filter by stage\n- Local persistence',
    expectedCapabilities: ['teams', 'players', 'brackets', 'matches', 'check-in', 'dispute tickets'],
  },
  {
    id: 'desert-greenhouse',
    domain: 'Desert Greenhouse',
    category: 'agriculture',
    label: 'Desert Greenhouse Climate',
    size: 'small',
    style: 'vague',
    adversarial: true,
    prompt:
      'Greenhouse in the desert somehow — climate readings, irrigation cycles, shade cloth positions, crop batches. Business-y language about operations and dashboards but keep it greenhouse-specific only.',
    expectedCapabilities: ['climate readings', 'irrigation cycles', 'shade cloth', 'crop batches'],
  },
  {
    id: 'ferry-manifest',
    domain: 'Ferry Ops',
    category: 'marine',
    label: 'Ferry Manifest Desk',
    size: 'medium',
    style: 'detailed',
    adversarial: false,
    prompt:
      'Ferry manifest desk with sailings, vehicles, passengers, hazardous declarations, standby lists, and boarding status workflow. Include sailing-to-vehicle relationships and local persistence.',
    expectedCapabilities: ['sailings', 'vehicles', 'passengers', 'hazardous declarations', 'standby lists'],
  },
  {
    id: 'court-transcription',
    domain: 'Court Transcription',
    category: 'legal',
    label: 'Court Transcription Queue',
    size: 'small',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Build a court transcription queue with hearings, audio files, transcriptionists, turnaround SLAs, and certified transcript delivery.',
    expectedCapabilities: ['hearings', 'audio files', 'transcriptionists', 'SLAs', 'certified transcripts'],
  },
  {
    id: 'airport-gate-turn',
    domain: 'Gate Turns',
    category: 'aviation',
    label: 'Airport Gate Turn Tracker',
    size: 'medium',
    style: 'adversarial',
    adversarial: true,
    prompt:
      'Airport gate turn tracker: flights, gates, turn milestones, ground crews, and a delivery-timeline for catering and fueling carts. Overlapping terms: timeline, schedule, projects (as turn projects meaning a single gate turn instance — not a projects module). Do not emit bare timeline or projects fallbacks. Contacts are airline station managers.',
    expectedCapabilities: ['flights', 'gates', 'turn milestones', 'ground crews', 'delivery-timeline'],
  },
  {
    id: 'microbrewery-batch',
    domain: 'Microbrewery',
    category: 'manufacturing',
    label: 'Microbrewery Batch Log',
    size: 'medium',
    style: 'paragraph',
    adversarial: false,
    prompt:
      'Microbrewery batch log for recipes, brew batches, fermentation readings, packaging runs, and taproom taps. Link readings to batches; export a batch register.',
    expectedCapabilities: ['recipes', 'brew batches', 'fermentation readings', 'packaging runs', 'taproom taps'],
  },
  {
    id: 'sign-language-class',
    domain: 'Sign Language Classes',
    category: 'accessibility',
    label: 'Sign Language Class Roster',
    size: 'small',
    style: 'sentence',
    adversarial: false,
    prompt:
      'Sign language class roster with courses, learners, interpreters, attendance, and practice video submissions.',
    expectedCapabilities: ['courses', 'learners', 'interpreters', 'attendance', 'practice videos'],
  },
  {
    id: 'reinsurance-bordereau',
    domain: 'Reinsurance',
    category: 'insurance',
    label: 'Reinsurance Bordereau',
    size: 'large',
    style: 'jargon',
    adversarial: false,
    prompt:
      'Reinsurance bordereau processor: treaties, cedents, premium bordereaux, loss bordereaux, cash calls, and settlement cycles with status workflow and audit history.',
    expectedCapabilities: ['treaties', 'cedents', 'premium bordereaux', 'loss bordereaux', 'cash calls'],
  },
];

export function assertWorkloadConstraints(): void {
  if (ADVERSARIAL_WORKLOAD.length < 50) {
    throw new Error(`Workload must have >= 50 products, got ${ADVERSARIAL_WORKLOAD.length}`);
  }
  // Identity/id reuse only — prompts may mention banned product names as negative constraints.
  const bannedReuse = /harborflow|lisa|expeditionos|resilienceos|templink|erp[\s-]?lite/i;
  for (const item of ADVERSARIAL_WORKLOAD) {
    if (bannedReuse.test(item.id) || bannedReuse.test(item.label)) {
      throw new Error(`Workload item reuses banned benchmark identity: ${item.id}`);
    }
  }
  const ids = new Set<string>();
  for (const item of ADVERSARIAL_WORKLOAD) {
    if (ids.has(item.id)) throw new Error(`Duplicate workload id: ${item.id}`);
    ids.add(item.id);
  }
}
