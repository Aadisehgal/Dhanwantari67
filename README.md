# 🏥 Dhanwantari Healthcare — Enterprise HMS

**Status: All 10 phases complete.** Foundation through PWA/Testing/CI-CD are
all built with real, working code — not placeholders. See the honesty note
in Phase 9 below for the small subset of "Extra 53 Features" left as
documented future work.

## What's in Phase 10 (new, final phase)

- **PWA offline sync**: refined `next-pwa` runtime caching (pages
  network-first with 5s timeout fallback to cache, images/static
  stale-while-revalidate), an `/offline` fallback page, and a real
  IndexedDB-backed offline action queue (`lib/offline/queue.ts`, using the
  tiny free `idb-keyval` library) — writes made while offline (vitals,
  nursing notes) are queued and automatically replayed when the connection
  returns, with a status banner (`components/pwa/OfflineIndicator.tsx`)
  showing pending-sync count
- **Playwright E2E suite** (`tests/e2e/`): auth flow, patient registration +
  duplicate detection, appointment booking (including recurring series),
  billing/invoice creation + PDF content-type verification, and RBAC
  enforcement (confirms a pharmacist can't see admin-only Reports/Audit Log)
- **Unit tests** (`tests/unit/`, Vitest): payroll calculation and lab
  abnormal-value detection — the two richest pure-logic functions in the
  codebase
- **CI/CD** (`.github/workflows/`): `ci.yml` runs lint → typecheck → Prisma
  migrate/seed against a real Postgres service container → Vitest → build →
  Playwright E2E on every push/PR; `deploy.yml` auto-deploys to Vercel
  production after CI passes on `main`, running `prisma migrate deploy`
  against the production database first
- `vercel.json`, `postinstall`/`build` script fixes so Prisma client
  generation is never missed in a fresh deploy

## Project-wide summary

| Area | Status |
|---|---|
| Auth, RBAC, multi-branch schema | ✅ Full |
| Patients, UHID, duplicate detection, family linking | ✅ Full |
| Calendar/Appointments (incl. recurring) + Queue/Token board | ✅ Full |
| OPD, EMR timeline, ICD-10, digital prescriptions + drug/allergy checks | ✅ Full |
| Pharmacy/Inventory (FEFO, barcode) + GST Billing | ✅ Full |
| IPD (wards/beds/admission/discharge) + OT booking + e-signature consent | ✅ Full |
| Laboratory (order → sample → result → report) | ✅ Full |
| HR/Payroll/Attendance/Shift roster | ✅ Full |
| Reports/Analytics + role-specific dashboards | ✅ Full |
| Notifications, Audit Log, Global Search | ✅ Full |
| Extra Features (Section 5, 53 listed) | ⚠️ 10 of 53 built with real logic; 43 documented, not built (see Phase 9 note) |
| Settings panel UI, Backup/Restore, i18n | ❌ Not built |
| PWA offline queue, E2E tests, CI/CD | ✅ Full |

**6 PDF printouts, all self-hosted via `@react-pdf/renderer`**: Prescription,
Bill/Invoice, Discharge Summary, Consent Form, Lab Report, and Payslip.

## Branding

The hospital logo (`public/logo.png`) is wired in as:
- Browser favicon (`favicon.ico`, 16x16, 32x32)
- PWA home-screen icon (`icon-192.png`, `icon-512.png`, plus a padded
  `icon-512-maskable.png` for Android adaptive icons) via `manifest.json`
- iOS home-screen icon (`apple-touch-icon.png`)
- Shown on the login page and in the persistent dashboard header

## Deploying via CI/CD

`.github/workflows/deploy.yml` needs these repository secrets set (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel dashboard → Settings → Tokens |
| `PRODUCTION_DATABASE_URL` | Your production Postgres connection string (Neon/Supabase) |

Also link the repo to a Vercel project once (`vercel link`) so `.vercel/project.json`
exists, or set `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` as additional secrets.

## Running this for real

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL
npx prisma migrate dev --name init
npx prisma db seed
npm run dev                 # http://localhost:3000/login
```

To run the test suites locally:
```bash
npm run test                # Vitest unit tests
npx playwright install --with-deps
npx playwright test         # E2E (needs `npm run dev` running, or set CI=true to auto-start)
```

## What's in Phase 9 (new)

### Core modules (Section 4.16, 4.17, 4.20)
- **Notification Center**: in-app bell with unread badge (`components/notifications/NotificationBell.tsx`),
  polls every 30s, mark-read/mark-all-read. Wired into 3 real events so it's
  not just plumbing: appointment booking notifies the doctor, leave
  approval/rejection notifies the staff member, lab report release notifies
  the ordering doctor. Email delivery reuses the Phase-1 adapter
  (`lib/adapters/notification.ts`) — still zero paid dependency.
- **Audit Log Viewer** (`/dashboard/settings/audit-logs`): every module has
  been writing to `AuditLog` since Phase 2 — this phase adds the searchable,
  filterable (module/date-range) viewer, admin-only.
- **Global Search** (Ctrl/Cmd+K, `components/search/GlobalSearch.tsx`):
  unified search across patients, invoices, medicines.
- A shared `app/dashboard/layout.tsx` now puts search + notifications in a
  persistent header across every dashboard page.

### Extra Features batch (of the 53 listed in Section 5)
Built with real schema + Server Actions + UI, not stubs:
1. **Hospital Announcement Board** (#11) — `/dashboard/announcements`
2. **Patient Feedback & NPS System** (#7) — `/dashboard/feedback`, with
   doctor-wise average rating and an NPS (promoter − detractor) score
3. **Complaint/Grievance Management** (#8) — `/dashboard/complaints`, with
   SLA deadline and a visible breach indicator
4. **Vaccination Tracker & Reminder Board** (#4) — `/dashboard/vaccinations`,
   due-date dashboard with overdue highlighting
5. **Chronic Disease Registry** (#30) — `/dashboard/chronic-registry`
6. **Recall Campaign Manager** (#31) — bulk reminder (email + in-app) to
   every patient tagged with a chosen chronic condition
7. **Doctor Digital Signature** (#32) — already existed as `Doctor.signatureUrl`
   since Phase 3 and is used on every prescription PDF
8. **Family Health Card** (#1) — already existed since Phase 2
   (`PatientFamily`, shown on the patient profile page)
9. **Digital Consent Forms** (#6) — already built in Phase 5
10. **Auto Follow-Up Scheduler** (#46) — already built in Phase 2
    (`scheduleFollowUp` in `actions/appointments.ts`)

### Two more issues caught and fixed during this phase
- `getDashboardSummary` and the Reports page already had their gaps closed
  in Phase 8; this phase's new `getAuditLogs` action follows the same
  pattern (session + explicit admin-role check, not just the module guard)
  so it can't be bypassed via a crafted client call.

### Honesty about scope: what's NOT built yet
The master prompt lists 53 extra features; building all of them with real
logic (not placeholders) is multiple weeks of work. **Explicitly not built**,
listed here so nothing is silently dropped — each follows the same
schema → Server Action → UI pattern used throughout this project and can be
added incrementally:

Membership/Loyalty Packages (#2), Referral Doctor Commission Tracker (#3),
Health Camp Management (#5), Doctor Performance Analytics as a dedicated
report beyond what Reports already shows (#9), Custom Form Builder (#10),
Diet Plan Module (#12), Physiotherapy Session Tracker (#13), Ambulance
Dispatch & Tracking (#14), Asset & Equipment Maintenance Log (#15),
Laundry/Housekeeping Task Board (#16), Birthday/Anniversary Auto-Greeting
(#17), Doctor Leave & Locum auto-reassignment (#18), Waitlist Auto-Fill
(#19), Insurance Pre-Authorization Tracker (#20), Multi-Language UI (#21),
QR Self Check-In Kiosk (#23), Voice Search (#24), Local OCR for ID scan
(#25), Smart Slot Suggestion (#26), Inventory Reorder Point Auto-Calc (#27),
Revenue Forecasting via regression (#28), Patient No-Show Risk Flag (#29),
Multi-Branch Consolidated Owner Dashboard (#36), Staff Shift Swap Requests
(#37), Expense Approval Workflow (#38), Cash Drawer Reconciliation (#39),
Patient Document Vault (#40), Print Templates Designer (#41),
Keyboard-First Data Entry Mode (#42), Duplicate Record Merge Tool (#43),
SOP/Protocol Library (#44), Bed Turnaround Analytics (#45), Patient
Self-Service Portal (#47), Dark/High-Contrast Theme toggle UI (#48; dark
mode CSS classes exist but no user-facing toggle), Data Export/Portability
(#49), System Health Monitor (#50), Role-Based Custom Dashboard Widgets
(#51), Internal Staff Chat on Patient Case (#52), Printable Daily OT/Ward
Round Sheet (#53). Also not built: Insurance/TPA claim tracking (Section
4.13), full Purchase Order approval workflow UI (schema exists from Phase 4,
no UI yet), Settings panel UI beyond audit logs (Section 4.18), Backup &
Restore (Section 4.19), i18n.

## What's in Phase 8 (new)

- **Analytics engine** (`lib/analytics.ts`): revenue trend, patient
  registration trend, payment-mode breakdown, bed occupancy per ward, top
  diagnoses by frequency, doctor consultation workload, pending dues, and a
  today-at-a-glance summary — all plain Prisma aggregation, no external BI tool
- **Reports & Analytics page** (`/dashboard/reports`): revenue/registration
  dual-line trend, payment-mode pie chart, bed-occupancy stacked bar,
  top-diagnoses and doctor-workload bar charts (all Recharts)
- **Role-specific home dashboard** (`components/dashboard/RoleStatWidgets.tsx`):
  the dashboard landing page now shows different stat cards depending on who's
  logged in — admins see revenue/registrations/low-stock/pending-leaves/lab
  queue all at once, while a pharmacist sees only low-stock, an accountant
  sees today's revenue, a lab tech sees pending orders, and so on
- **Two more permission/security fixes caught in review**:
  - `getDashboardSummary` had no auth check at all and would happily return
    any branch's stats to any caller who guessed a branch ID — now requires
    a session and restricts non-admin roles to their own branch
  - The Reports page previously would crash with an unhandled error for
    roles without `REPORTS` access (e.g. a doctor or nurse clicking the nav
    card) — now shows a friendly "you don't have access" message instead

## What's in Phase 7 (new)

- **Attendance** (`actions/hr.ts`): self-service check-in/check-out (creates
  today's record), admin manual override for corrections
- **Shift roster** (`components/hr/ShiftRosterGrid.tsx`): weekly staff ×
  weekday grid, Morning/Evening/Night/Off assignment
- **Leave workflow**: staff apply for Casual/Sick/Earned/Unpaid leave;
  HR/admin approve or reject
- **Payroll** (`lib/payroll-utils.ts`): standard basic + 40% HRA − 12% PF
  formula, pro-rata deduction for unpaid-leave/absent days that month, and
  the **5th printout** — a payslip PDF (`lib/pdf/payslip-pdf.tsx`,
  `/api/payslips/[id]/pdf`) with earnings/deductions breakdown and net pay
- Extended schema: `Staff` now carries `employeeId`/`basicSalary`/bank
  details; new `Attendance`, `ShiftRoster`, `LeaveRequest`, `Payslip` models
  and their enums
- **Permission-scoping fix**: rather than gate the whole HR module behind
  HR_MANAGER only (which would have blocked every other role from
  self-service attendance/leave), every staff role now gets HR module
  access, but `actions/hr.ts` enforces at the action level that
  check-in/check-out/leave-application can only touch the caller's *own*
  staff record, and that manual attendance edits, shift assignment, leave
  approval, and payslip generation are restricted to HR/admin roles —
  closing a privilege-escalation gap before it shipped
- Seed data: Staff records + demo HR Manager login for all demo users

## What's in Phase 6 (new)

- **Lab order-to-report workflow** (`actions/lab.ts`): order one or more
  tests as a panel, **sample collection with auto-generated tracking
  barcode** (`lib/lab-utils.ts`), result entry, **rule-based abnormal-value
  flagging** (parses the test's reference range and flags out-of-range
  results — no ML involved), report release, and a lab-technician worklist
  showing every pending/collected/in-progress order for the branch
- **Lab report PDF** (new — the **4th printout**): `lib/pdf/lab-report-pdf.tsx`,
  `/api/lab-orders/[id]/pdf` — shows result, reference range, and highlights
  abnormal values in red
- Extended schema: `LabOrderStatus` enum, `LabOrder` now branch-scoped with
  an ordering doctor and sample barcode, `LabResult` captures unit/reference-range
  snapshot/remarks/release metadata
- Seed data: 8 common lab tests (CBC, Fasting Blood Sugar, Lipid Profile,
  LFT, KFT, Thyroid/TSH, Urine R/M, HbA1c) with reference ranges
- Patient profile now links directly to "Order Lab Test" alongside the
  existing OPD/EMR quick links

## What's in Phase 5 (new)

- **IPD ward/bed management** (`actions/ipd.ts`): admission into a specific
  vacant bed, live ward/bed occupancy board (`components/ipd/WardBoard.tsx`),
  bed transfer, bedside nursing notes with vitals
- **Discharge workflow**: discharge summary capture, **auto-generated
  room-charge invoice** (days stayed × bed daily rate) wired straight into
  the billing module, plus a printable discharge summary PDF
  (`lib/pdf/discharge-summary-pdf.tsx`, `/api/admissions/[id]/discharge-summary/pdf`)
- **OT (Operation Theatre) booking** (`actions/ot.ts`): surgeon/room conflict
  detection (no double-booking a theatre or a surgeon), weekly schedule view,
  status transitions (scheduled → in-progress → completed/cancelled)
- **E-signature consent forms** (`components/ipd/SignaturePad.tsx`, free
  canvas-based capture, no paid e-sign service): admission/surgical/anesthesia/
  procedure/general consent templates, editable text, witness field, and a
  printable signed-consent PDF (`lib/pdf/consent-pdf.tsx`,
  `/api/consent-forms/[id]/pdf`)
- Schema additions: `NursingNote`, `DischargeSummary`, `OTBooking`,
  `ConsentForm`, `AdmissionStatus`/`OTStatus`/`ConsentFormType` enums, and a
  `dailyRate` on `Bed` for automatic room-charge calculation
- Demo seed data: 3 wards (General/ICU/Private) with 14 beds total

## What's in Phase 4 (new)

- **Pharmacy/Inventory** (`actions/pharmacy.ts`, `lib/pharmacy-utils.ts`):
  stock-in batches with **auto-generated barcode**, **FEFO** (First-Expiry-First-Out)
  dispensing logic with a full stock-movement ledger, internal (ward/OT)
  consumption tracking, low-stock and expiry alerts, camera-based **barcode
  scanning** (`components/pharmacy/BarcodeScanner.tsx`, html5-qrcode — free,
  browser-based)
- **Billing/GST Invoicing** (`actions/billing.ts`): itemized invoices mixing
  consultation + pharmacy + lab + procedure + room-charge lines in a single
  bill, per-line GST calculation, payments (cash/card/UPI/insurance/bank/wallet),
  credit notes, and refunds
- **Prescription PDF printout** (Phase 3, `/api/prescriptions/[id]/pdf`) and
  **Bill/Invoice PDF printout** (new, `/api/invoices/[id]/pdf`,
  `lib/pdf/invoice-pdf.tsx`) — both self-hosted via `@react-pdf/renderer`,
  GST-compliant, with hospital letterhead and QR code
- Extended schema: `Supplier`, `PurchaseOrder`/`PurchaseOrderItem`, `GRN`,
  `StockMovement`, `InternalConsumption`, `Dispense`/`DispenseItem`,
  `CreditNote`, `Refund` — the full pharmacy/billing data model, not just a
  skeleton
- **Bug fix**: removed an incorrect role-prefixed-route redirect in
  `middleware.ts` left over from Phase 1 that would have blocked normal
  navigation to module-named routes (`/dashboard/patients`, `/dashboard/pharmacy`,
  etc.) for non-admin roles — authorization is correctly enforced by
  `requirePermission()` in every Server Action instead

## What's in Phase 3 (new)

- **Vitals capture** (`actions/opd.ts`): BP/pulse/temp/SpO2/weight/height with
  auto BMI calculation; historical trend chart (`components/opd/VitalsTrendChart.tsx`,
  Recharts)
- **ICD-10 diagnosis search** (`lib/medical-data/icd10.ts`): local searchable
  dataset, no external API call needed
- **Digital prescription builder** (`components/opd/OPDConsultation.tsx`):
  medicine search/autocomplete, dosage/frequency/duration/instructions per item,
  **rule-based allergy check** (patient allergy list vs. drug/category) and
  **pairwise drug-interaction check** (`DrugInteraction` table) — warnings shown
  to the doctor without blocking clinical judgement
- **Voice-to-prescription** (`lib/hooks/useVoiceDictation.ts`): free, browser-native
  Web Speech API dictation for clinical notes, with manual correction
- **PDF prescription generation** (`lib/pdf/prescription-pdf.tsx`,
  `/api/prescriptions/[id]/pdf`): self-hosted `@react-pdf/renderer`, hospital
  letterhead, doctor signature image, QR code linking to the digital copy
- **EMR timeline** (`/dashboard/patients/[id]/emr`): full longitudinal history
  of visits, diagnoses, and prescriptions per patient

## What's in Phase 2 (new)

- **Patient Registration & UHID** (`actions/patients.ts`, `lib/patient-utils.ts`):
  branch-prefixed sequential UHID generator, rule-based fuzzy duplicate-patient
  detection (Levenshtein name similarity + phone/DOB match — no paid AI), family
  linking, patient search/profile pages
- **Smart Calendar/Appointments** (`actions/appointments.ts`): booking with
  recurrence expansion (physio/dialysis/chemo style repeat series), reschedule,
  cancel, mark-arrived, auto follow-up scheduler, unified weekly calendar feed
  combining appointments + doctor leaves
- **Queue & Token Management** (`actions/queue.ts`): per-doctor daily token
  sequence, call-next/complete/no-show flow, simple-moving-average wait-time
  estimation per doctor (rule-based, no paid AI/ML)
- Pages: `/dashboard/patients`, `/dashboard/patients/new`, `/dashboard/patients/[id]`,
  `/dashboard/appointments`, `/dashboard/queue/[doctorId]`

## What's in Phase 1

- Next.js 15 (App Router) + TypeScript strict + Tailwind, PWA-ready config
- Full Prisma schema: Hospital/Branch, data-driven RBAC (Role/Permission/RolePermission),
  Patient, Doctor, Appointment/Token, EMR/Prescription, Lab, IPD/Ward/Bed, Pharmacy,
  Billing, Staff, AuditLog, SystemSetting (skeletons for modules built in later phases)
- Auth.js v5 (Credentials provider) with JWT sessions, argon2 password hashing
- `requirePermission(module, action)` guard — data-driven, not hardcoded, used by every
  Server Action / API route
- `middleware.ts` — route-level auth + role-based redirect (defense in depth)
- Seed script: demo hospital, 1 branch, all 12 roles with a starter permission matrix,
  5 demo user accounts
- Pluggable notification adapter (console/SMTP today, Twilio/WhatsApp interface-compatible
  later — no paid keys anywhere)

## Setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL (free Neon/Supabase Postgres works)
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Visit `http://localhost:3000/login`.

### Demo accounts (password: `Demo@1234`)

| Role | Email |
|---|---|
| Hospital Admin | admin@dhanwantari.demo |
| Receptionist | reception@dhanwantari.demo |
| Doctor | doctor@dhanwantari.demo |
| Pharmacist | pharmacist@dhanwantari.demo |
| Accountant | accountant@dhanwantari.demo |
| HR Manager | hr@dhanwantari.demo |

## Roadmap (remaining phases, per Section 12 build order)

1. ✅ Auth + RBAC + schema foundation
2. ✅ Patient Registration & UHID + Smart Calendar/Appointments + Queue/Token board
3. ✅ OPD workflow, EMR timeline, digital prescriptions (+ drug-interaction check)
4. ✅ Pharmacy/Inventory (batches, FEFO, barcode) + Billing/GST invoicing (+ bill PDF)
5. ✅ IPD (wards/beds/admission/discharge) + OT booking & consent (+ discharge PDF)
6. ✅ Laboratory module (order → result → report PDF)
7. ✅ HR/Payroll/Attendance/Shift roster (+ payslip PDF)
8. ✅ Reports/Analytics dashboards (Recharts) + role-specific home dashboards
9. ✅ Notifications/Audit log viewer + curated batch of Extra Features (10 of 53 — see honesty note above)
10. ✅ PWA offline sync, Playwright E2E suite, CI/CD (GitHub Actions → Vercel)

## Notes

- No paid AI/SMS/WhatsApp APIs anywhere — see `lib/adapters/notification.ts` for the
  swap-in-later pattern.
- Deploy target: Vercel + Neon/Supabase free Postgres.
