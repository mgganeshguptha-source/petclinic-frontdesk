# PC-104 — Visits by status panel (host bridge)

## Summary

The front-desk app runs on the same page as `petclinic-angular-demo`. It does not call the REST API. It reads the host's visits state from the host bridge and shows:

- Counts per status: Scheduled, Completed, Cancelled, Not set (taken from the bridge's `statusCounts`).
- A list of SCHEDULED visits, sorted by date ascending, showing the bridge `date` string and `Pet <petId>` (or `Pet: not set`).

## Files

| File | Purpose |
|---|---|
| `src/app/host-bridge/visits-bridge.types.ts` | Contract copied from `stories/PC-104/store/visits/visits-bridge.ts` and `visits.selectors.ts`: `VISITS_BRIDGE_EVENT`, `VisitsBridgeVisit`, `VisitsBridgeState`, `VisitStatusCounts`. |
| `src/app/host-bridge/host-bridge.service.ts` | `HostBridgeService`. Exposes `visits$: Observable<VisitsBridgeState \| null>`. Starts from `window.petclinicHost.visits` (`null` if not published), emits on every `VISITS_BRIDGE_EVENT`, and removes the listener on destroy. |
| `src/app/visits/visit-status.ts` | Status type and labels (copied from `stories/PC-104/visits/visit-status.ts`). |
| `src/app/visits-by-status/visits-panel-view.ts` | Pure mapping from bridge state to the view model (states, counts, sorted scheduled lines). |
| `src/app/visits-by-status/visits-by-status-panel.component.*` | "Visits by status" panel (OnPush, standalone). |
| `src/app/app.component.*` | Shows the panel under the page title. |

## Display states

| Bridge state | Panel shows |
|---|---|
| Not published (`null`) | `Waiting for the clinic app…` |
| `loading: true` | `Loading visits…` only |
| `error` set (and not loading) | the error text exactly as published, only |
| Otherwise | four count lines, then the scheduled list or `No scheduled visits.` |

## Ordering rules

- Only visits with `status === 'SCHEDULED'` are listed.
- Sort by `date` ascending using plain string comparison (`yyyy-mm-dd`).
- A missing or empty `date` sorts last.
- Visits with the same date (or both without a date) are ordered by `id` ascending.

## Example (mocked values)

Bridge state:

```json
{
  "visits": [
    { "id": 2, "date": "2026-01-02", "status": "SCHEDULED", "petId": 11 },
    { "id": 1, "date": "2026-01-01", "status": "SCHEDULED", "petId": null },
    { "id": 3, "date": "2026-01-01", "status": "COMPLETED", "petId": 12 }
  ],
  "statusCounts": { "SCHEDULED": 2, "COMPLETED": 1, "CANCELLED": 0, "notSet": 0 },
  "loading": false,
  "error": null
}
```

Panel output:

```
Scheduled: 2
Completed: 1
Cancelled: 0
Not set: 0
2026-01-01 — Pet: not set
2026-01-02 — Pet 11
```

## Out of scope

- REST API calls, NgRx in this app, module-federation wiring, styling beyond plain HTML, unit tests (this repo runs build-only).

## Validation

- Build: `npm install … && npx ng build --configuration development` (AC6). It passed in the previous harness run recorded in `.harness/validation-report.txt`. It was not re-run for this documentation change.
