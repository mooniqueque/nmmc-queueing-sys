# NMMC Queueing System — Patient Flow Guide (Current Setup)

Plain-language walkthrough of the current implementation, based on the existing frontend and backend code.

---

## Quick Overview

```
Primary path:
[Patient] -> /kiosk -> /triage -> /releasing -> /caller -> done

Alternate path:
[Walk-in patient] -> /triage (manual entry) -> /releasing -> /caller -> done
```

---

## Step-by-Step Patient Journey

| Step | Page / URL | Who Acts | What They Do | What Happens Behind the Scenes | Where the Patient Goes Next |
|------|-----------|----------|--------------|-------------------------------|----------------------------|
| 1 | `/kiosk` -> `/kiosk/form?type=registered|unregistered` | Patient (self-service) | Chooses patient type, fills demographics, appointment flag, and optional priority categories. Registered patients may search by Hospital ID first. | Backend creates/updates the patient, then creates a Visit with status `KIOSK_SUBMITTED`. **No ticket number is assigned yet at kiosk stage**. | Patient appears in triage queue. |
| 2 | `/triage` | Triage Nurse | Selects kiosk patient (or uses Manual Entry for walk-ins), records vitals and assessment, sets department and categories, submits. | Visit is saved with triage fields and status `WAITING_WINDOW`. System generates a **window ticket number** (`sequenceKey = WINDOW`). For walk-ins, patient + visit can be created directly here. | Patient moves to releasing/window queue. |
| 3 | `/releasing` | Window Clerk | Reviews waiting patients, can call patient to window, mark no-show, then print and assign to clinic queue. | `Call` sets status `IN_PROGRESS` with calling station details. `Print & Assign` sets status `WAITING_CLINIC`, preserves prior window ticket in `windowTicketNumber`, generates a **department ticket number** (`sequenceKey = DEPT_<departmentId>`), and links selected queue category. | Patient appears in the target clinic caller queue. |
| 4 | `/caller` | Clinic Caller (per department) | Calls next patient, serves patient, marks no-show, restores no-show, or transfers to another department when needed. | `Call` -> `IN_PROGRESS`; `Serve` -> `COMPLETED`; `No Show` -> `NO_SHOW`; `Restore` -> `WAITING_CLINIC`; `Transfer` -> `WAITING_CLINIC` in new dept with referral flags. | Patient is completed, or routed to another clinic. |

---

## Status Definitions (Plain English)

| Status | Plain English |
|--------|--------------|
| `PENDING_TRIAGE` | Model default state. Usually transient and not the normal kiosk entry state in current flow. |
| `KIOSK_SUBMITTED` | Patient completed kiosk intake and is waiting for triage assessment. |
| `WAITING_WINDOW` | Triage is done; patient is waiting at releasing/window queue. |
| `WAITING_CLINIC` | Patient is assigned to a clinic/department queue and waiting to be called there. |
| `IN_PROGRESS` | Patient has been called and is currently being served. |
| `COMPLETED` | Service finished; visit is closed. |
| `NO_SHOW` | Patient did not present when called/expected. Can be restored depending on station workflow. |

---

## Ticket Numbering Behavior

- Kiosk registration creates the visit but does not assign ticket number yet.
- Triage submission assigns the first queue number for window processing (`WINDOW` sequence).
- Releasing assignment generates a new department queue number (`DEPT_<departmentId>` sequence).
- Previous window ticket is retained in `windowTicketNumber` for traceability.

---

## Special Cases

### No-Show Handling
- Triage no-show: status becomes `NO_SHOW`; restore sends it back to `KIOSK_SUBMITTED`.
- Caller no-show: status becomes `NO_SHOW`; restore sends it back to `WAITING_CLINIC`.

### Referral / Transfer to Another Department
- Caller can transfer a patient to another department.
- Status returns to `WAITING_CLINIC` in the target department.
- Visit is flagged as referred (`isReferred = true`) and records source department (`referredFromId`).

### Walk-In Without Kiosk
- Triage nurse can enable Manual Entry and create the visit directly from triage.
- That visit proceeds to `WAITING_WINDOW` with a generated window ticket.

---

## Access and Routing

| Role / User Type | Main Pages |
|------------------|------------|
| Patient / Public | `/kiosk`, `/kiosk/form`, `/kiosk/survey`, `/monitor/[slug]`, `/monitor-windows` |
| Triage Nurse | `/triage` |
| Window Clerk | `/releasing` |
| Clinic Caller | `/caller` |
| Admin | `/admin-dashboard`, `/admin-triage`, `/admin-releasing`, `/admin-caller`, `/admin-departments`, `/admin-workstations`, `/admin-monitor`, `/admin-monisetting`, `/admin-reports` |

Notes:
- `/` redirects to `/login`.
- After login, middleware redirects staff users to role home pages.
- Unapproved staff accounts are blocked until admin approval.

---

## Real-Time Updates

- Real-time queue updates use SSE (Server-Sent Events).
- Stream endpoint: `/api/monitor/stream` (optional `?topic=<departmentOrChannel>`).
- Frontend listens via `EventSource` and refreshes queues with a short debounce (about 1 second), so screens update without manual reload.

---

## Seeded Test Accounts

Default password for seeded users: **password123**

| Email | Role | Approval State |
|-------|------|----------------|
| `admin@nmmc.gov.ph` | ADMIN | Approved |
| `andreanna@nmmc.gov.ph` | CLINIC_CALLER | Approved |
| `aljo@nmmc.gov.ph` | WINDOW_CLERK | Approved |
| `karl@nmmc.gov.ph` | TRIAGE_NURSE | Pending |

See `nmmcqueue-backend/prisma/seed.ts` for the full seeded list.

---

## System URLs at a Glance

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/kiosk` | Kiosk welcome page |
| `http://localhost:3000/kiosk/form?type=registered` | Registered patient kiosk form |
| `http://localhost:3000/kiosk/form?type=unregistered` | New patient kiosk form |
| `http://localhost:3000/kiosk/survey` | Kiosk survey page |
| `http://localhost:3000/login` | Staff login |
| `http://localhost:3000/signup` | Staff sign-up |
| `http://localhost:3000/triage` | Triage nurse dashboard |
| `http://localhost:3000/releasing` | Window clerk dashboard |
| `http://localhost:3000/caller` | Clinic caller dashboard |
| `http://localhost:3000/admin-dashboard` | Admin dashboard |
| `http://localhost:3000/admin-workstations` | Workstation management |
| `http://localhost:3000/admin-monisetting` | Monitor video upload/settings |
| `http://localhost:3000/monitor-windows` | Public window monitor view |
| `http://localhost:3000/monitor/<department-slug>` | Public department monitor view |
| `http://localhost:3005/health` | Backend health check |
| `http://localhost:3005/api/shared/departments` | Public departments reference API |
| `http://localhost:3005/api/monitor/stream?topic=WINDOW` | SSE stream example |
