# NMMC Queueing System URL Reference

This file lists known frontend pages and backend API endpoints in this workspace, including monitor URLs per clinic or department.

## Base URLs

- Frontend base: http://localhost:3000
- Backend base: http://localhost:3005

## Frontend URLs

### Public and Auth

- /
- /login
- /kiosk
- /kiosk/form
- /kiosk/survey

### Staff Pages

- /triage
- /releasing
- /caller

### Admin Pages

- /admin-dashboard
- /admin-caller
- /admin-releasing
- /admin-triage
- /admin-departments
- /admin-monitor
- /admin-reports
- /admin-workstations
- /admin-monisetting
- /manage-releasing

### Monitor Pages

- /monitor-windows
- /monitor/{department-slug}

## Monitor URLs Per Clinic or Department

Use this pattern:

- /monitor/{department-slug}

Seed-based examples:

- /monitor/administration
- /monitor/animal-bite-department
- /monitor/family-medicine
- /monitor/internal-medicine
- /monitor/pediatrics
- /monitor/obstetrics-gynecology
- /monitor/x-ray-department
- /monitor/dental-clinic
- /monitor/laboratory
- /monitor/pharmacy
- /monitor/surgery
- /monitor/cardiology
- /monitor/nephrology
- /monitor/ent
- /monitor/ophthalmology

Notes:

- Department slug format follows lowercase words joined by hyphens.
- Special characters are removed during slug generation.
- If your database has additional departments, their monitor URL is still /monitor/{that-department-slug}.

## Backend Health URL

- GET /health

## Backend API URLs

All API routes are under /api.

### Monitor API

- GET /api/monitor/departments-videos
- GET /api/monitor/windows
- GET /api/monitor/department/:slug
- GET /api/monitor/stream
- POST /api/monitor/upload-video

### Shared API

- GET /api/shared/departments
- GET /api/shared/queue-options
- POST /api/shared/queue-options/batch
- GET /api/shared/analytics

### Triage API

- POST /api/triage/kiosk/register
- GET /api/triage/kiosk/patient/:id
- GET /api/triage/patients/search
- POST /api/triage/:visitId/merge-patient
- GET /api/triage/pending
- POST /api/triage/call-next
- POST /api/triage/:id/call-specific
- GET /api/triage/my-current
- POST /api/triage/submit
- POST /api/triage/:id/no-show
- POST /api/triage/:id/restore
- DELETE /api/triage/:id

### Releasing API

- GET /api/releasing/pending
- POST /api/releasing/call-next
- GET /api/releasing/my-current
- POST /api/releasing/:id/call
- POST /api/releasing/:id/noshow
- POST /api/releasing/:id/assign

### Caller API

- GET /api/caller/pending
- GET /api/caller/departments
- POST /api/caller/departments
- DELETE /api/caller/departments/:id
- POST /api/caller/queue-options
- DELETE /api/caller/queue-options/:id
- POST /api/caller/visit/:visitId/call
- POST /api/caller/visit/:visitId/serve
- POST /api/caller/visit/:visitId/no-show
- POST /api/caller/visit/:visitId/transfer
- POST /api/caller/visit/:visitId/restore
- POST /api/caller/visit/:visitId/notify
- DELETE /api/caller/visit/:visitId/force-remove

### Tickets API

- POST /api/tickets/reset

### Workstations API

- GET /api/workstations
- POST /api/workstations
- PUT /api/workstations/:id
- DELETE /api/workstations/:id

### Auth and User API

- /api/auth/* (better-auth routes)
- GET /api/users
- POST /api/users/create
- PUT /api/users/:id/role
- PUT /api/users/:id/status
- PUT /api/users/:id/department
- PUT /api/users/:id/workstation
