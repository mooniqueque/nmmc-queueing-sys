# ADR 0008: Dual-Ticket Queue Contract

## Status
Accepted

## Date
2026-04-07

## Context
The queue system originally used a single generic ticket field (`ticketNumber`) and a transitional secondary field (`windowTicketNumber`).
The workflow now has two explicit queue stages that each need their own ticket semantics:

1. Window queue progression after triage
2. Clinic/department queue progression after releasing

Keeping legacy ticket columns caused migration drift and reporting ambiguity.

## Decision
Adopt a canonical dual-ticket model across backend, database, and reporting:

- `triageTicket` = window queue ticket generated when triage submits to `WAITING_WINDOW`
- `serviceTicket` = department/clinic ticket generated when window assigns to `WAITING_CLINIC`
- `queueBusinessDay` = business-day partition key used for unique sequencing
- `ticketNumber` alias = transitional API convenience field only

Legacy fields are deprecated and must be removed from schema/tooling:

- `visit.ticketNumber`
- `visit.windowTicketNumber`
- `visit_queueDate_sequenceKey_ticketNumber_key`

## Consequences
Positive:

- Clear semantics for each workflow stage
- Stable uniqueness guarantees per business day
- Easier operational analytics and troubleshooting

Trade-offs:

- Temporary API compatibility alias (`ticketNumber`) can still cause confusion if not documented
- Migration chain must reconcile old environments idempotently

## API Contract Notes
Transitional response payload behavior:

- Include `triageTicket` and/or `serviceTicket` explicitly where relevant
- `ticketNumber` may mirror stage-specific value during transition
- New consumers must read explicit fields first

## Deprecation Timeline
- Phase 0 (now): dual-ticket fields required; `ticketNumber` alias kept for backward compatibility
- Phase 1 (within 2 sprints): update all frontend/report consumers to stop depending on `ticketNumber`
- Phase 2 (next release after validation): remove `ticketNumber` alias from API payloads
- Exit criteria: no dashboard, report, or client consumer reads `ticketNumber` as primary

## Validation Gates
Before app start or deployment:

1. `prisma migrate deploy` succeeds
2. `prisma migrate status` is clean
3. schema verifier passes canonical checks and rejects legacy columns/indexes
