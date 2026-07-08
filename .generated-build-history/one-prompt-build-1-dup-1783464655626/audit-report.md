# Build History Audit Report

- **Run ID:** one-prompt-build-1-dup-1783464655626
- **Created:** 2026-07-07T22:50:55.463Z
- **Profile:** GENERIC_CUSTOM_APP_V1
- **App:** Modern Unit Converter Web Application. The Application Should Allow Users To Convert Between: - Length (meters, Kilometers, Miles, Feet) - Weight (grams, Kilograms, Pounds) - Temperature (celsius, Fahrenheit, Kelvin) Requirements: - Two Input Fields (value And Converted Value) - Dropdowns For Selecting Units - Swap Units Button - Real-time Conversion While Typing - Clear Button - Responsive Layout - Clean Modern Design The Application Should Be Fully Interactive And Run Entirely In The Browser Without A Backend-rebuild-1783464627948
- **Status:** validation=PARTIAL production=PENDING
- **Immutable:** true
- **Manifest hash:** `ecfff390150adecf02840458a6a2083ea8ad34601cd529ec452d7270f75ae0a6`
- **Workspace hash:** `1ab379c4b0baa85eb4bdd2d2187fd13992a92636baf51741fd483f0803e19135`
- **Comparison fingerprint:** `469e42bb9cc18175ca6d5887a3a4793a921cd392acdaa341556e48e544f3deec`

## Prompt

Build a modern, production-quality Restaurant Management Platform for independent restaurants.

The application should be fully responsive and optimized for desktop, tablet, and mobile devices.

The goal is to produce a complete, coherent application with connected features, consistent navigation, reusable components, and a professional user experience.

Do not generate placeholder pages or disconnected screens. Every feature should integrate naturally into the overall product.

The application must include the following functionality:

Dashboard:
- Display today's revenue
- Display today's orders
- Display active tables
- Display pending kitchen orders
- Display today's reservations
- Display staff currently on shift
- Display popular menu items
- Include useful business charts
- Include quick action shortcuts

Table Management:
- View restaurant floor layout
- Create new tables
- Edit table information
- Merge tables
- Split tables
- Mark tables as available, occupied, reserved, or cleaning
- Move customers between tables

Menu Management:
- Create menu categories
- Create menu items
- Edit menu items
- Delete menu items
- Upload food images
- Add descriptions
- Configure prices
- Configure availability
- Mark featured dishes
- Support seasonal menus

Order Management:
- Create new customer orders
- Add menu items
- Remove menu items
- Edit quantities
- Add kitchen notes
- Apply discounts
- Split bills
- Transfer orders between tables
- Save draft orders
- Complete orders
- Cancel orders when necessary

Kitchen Display:
- Show incoming orders
- Show orders currently being prepared
- Show orders ready for collection
- Show completed orders
- Allow kitchen staff to update order status

Reservation Management:
- Create reservations
- Edit reservations
- Cancel reservations
- Select reservation date and time
- Assign tables
- Specify party size
- Prevent conflicting bookings

Customer Management:
- Store customer profiles
- Store contact information
- Track visit history
- Track favourite menu items
- Manage loyalty points
- Add customer notes

Inventory Management:
- Track ingredients
- Track stock quantities
- Track suppliers
- Record inventory adjustments
- Record purchase history
- Display low-stock warnings

Staff Management:
- Manage employees
- Store staff details
- Assign roles
- Configure permissions
- Manage work shifts
- View staff schedules

Billing:
- Generate bills
- Support multiple payment methods
- Support split payments
- Support partial payments
- Calculate taxes
- Generate printable receipts

Reports:
Generate reports for:
- Revenue
- Daily sales
- Monthly sales
- Best-selling menu items
- Inventory usage
- Staff performance
- Reservation trends

Allow reports to be filtered by date range.

Global Search:
Provide fast search across:
- Customers
- Orders
- Reservations
- Staff
- Menu items
- Inventory

Notifications:
Display notifications for:
- New reservations
- Kitchen updates
- Low inventory
- Staff reminders
- Completed orders

Settings:
Allow configuration of:
- Restaurant information
- Business hours
- Taxes
- Currency
- Notification preferences

User Interface Requirements:
- Modern professional design
- Clean layout
- Consistent navigation
- Responsive interface
- Loading states
- Empty states
- Success notifications
- Error handling
- Confirmation dialogs
- Reusable UI components
- Consistent spacing, typography, and styling

Architecture Requirements:
- Organize the application into well-structured feature modules
- Build reusable components where appropriate
- Maintain a consistent architecture throughout the application
- Ensure navigation accurately reflects the product structure
- Ensure all modules integrate correctly with one another
- Generate a complete working application rather than isolated pages
- Do not introduce unrelated features or concepts that are not supported by the requested product
- Preserve the requested product identity from planning through implementation
- Produce an application that accurately represents a Restaurant Management Platform suitable for real-world restaurant operations.

## Artifacts

- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/modern-unit-converter-web-application-th-1/.generated-app-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/modern-unit-converter-web-application-th-1/build-manifest.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/modern-unit-converter-web-application-th-1/universal-feature-contract.json
- C:/Users/Richa/Desktop/DevPulse-V4/.generated-builder-workspaces/modern-unit-converter-web-application-th-1/blueprint-manifest.json
- .generated-build-history/one-prompt-build-1-dup-1783464655626

## Failure Reasons

- prompt alignment failed without blueprint leakage: Only 1/3 required UI terms detected in generated source.
- Missing feature module: payments

## Audit Timeline

| Stage | Status | Evidence |
| --- | --- | --- |
| Build requested | INFO | prompt length=4113 |
| Profile selected | INFO | GENERIC_CUSTOM_APP_V1 |
| Workspace generated | PASS | 123 files, 27 directories |
| Manifest written | PASS | manifestHash=ecfff390150a… |
| Feature modules generated | FAIL | 13 modules |
| Build executed | PASS | npmBuildDurationMs=4137 |
| Preview verified | FAIL | http://127.0.0.1:5173/ |
| Production validation completed | PENDING | PENDING |
| Blueprint purity checked | FAIL | FAIL — 0 violations |
| Build history record persisted | PASS | Immutable build history artifacts written |
| Build finalized | PASS | status=PASS validation=PARTIAL |
