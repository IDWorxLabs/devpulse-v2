# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1783408787090
- **Created:** 2026-07-07T07:19:46.771Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Simple Weather Dashboard App Showing Current Temperature And A 5 Day Forecast For A City The User Enters
- **Status:** validation=PARTIAL production=PENDING
- **Immutable:** true
- **Manifest hash:** `93a2b9f9a56a75b1cfecf77091599035904d8428247cbe99b75138449418e3c5`
- **Workspace hash:** `0d56c8086b08ccb5f999f78d184c2aa8265dd1511131f438836bf92b053962ca`
- **Comparison fingerprint:** `e62aceb59c59beead489c4abe3be2f3319801b53a36e72ffb504fb4c81f69ac5`

## Prompt

Build a modern appointment booking system for a hair salon.

Requirements:

Create a clean, responsive web application.

Pages:
- Dashboard
- Appointments
- Customers
- Services
- Calendar
- Settings

Dashboard:
- Today's appointments
- Upcoming appointments
- Total customers
- Revenue today
- Quick action cards

Appointments:
- List all appointments
- Search appointments
- Filter by date
- Filter by status
- Create appointment
- Edit appointment
- Cancel appointment
- Mark appointment completed

Customers:
- Add customer
- Edit customer
- Delete customer
- Search customers
- Customer profile with appointment history

Services:
- Haircut
- Beard Trim
- Hair Colour
- Wash
- Styling

Allow adding, editing and deleting services.

Booking Form:
- Customer
- Service
- Staff member
- Date
- Time
- Notes

Prevent double-booking of the same staff member at the same date and time.

Calendar:
- Day view
- Week view
- Month view
- Click a booking to edit it

Navigation:
Use a sidebar with clear navigation between all pages.

UI:
- Modern
- Clean
- Dark sidebar
- White content area
- Responsive
- Professional business styling

Use realistic sample data.

The application should be fully interactive without requiring a backend. Store data in browser memory.

The finished application should feel like a real salon management system rather than a simple CRUD demo.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-weather-dashboard-app-showing-cur-1783372717262-4/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-weather-dashboard-app-showing-cur-1783372717262-4/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-weather-dashboard-app-showing-cur-1783372717262-4/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/simple-weather-dashboard-app-showing-cur-1783372717262-4/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1783408787090

## Failure Reasons

- prompt alignment failed without blueprint leakage: Only 1/3 required UI terms detected in generated source.

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=1369 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 165 files, 34 directories |
| Manifest written | PASS | manifestHash=93a2b9f9a56a… |
| Feature modules generated | PASS | 19 modules |
| Build executed | PASS | npmBuildDurationMs=5169 |
| Preview verified | FAIL | http://127.0.0.1:5174/ |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PARTIAL |
