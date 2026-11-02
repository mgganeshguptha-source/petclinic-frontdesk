# PC-104: Front-desk panel showing visits by status, read from the host app's shared store

## Summary

Adds a "Visits by status" panel to the front-desk app. The panel shows how many visits are Scheduled, Completed, Cancelled and Not set, and lists the scheduled visits by date and pet ID. The front desk does not call the REST API. It reads the visits state that the host app (`petclinic-angular-demo`) publishes on the page.

**Requires a new or changed contract from:** petclinic-angular-demo (store bridge from PC-103).

## Changes

- `src/app/host-bridge/visits-bridge.types.ts`: copy of the contract from `store/visits/visits-bridge.ts` and `visits.selectors.ts`. Defines `VISITS_BRIDGE_EVENT` (`petclinic-host:visits`), `VisitStatusCounts`, `VisitsBridgeVisit` and `VisitsBridgeState`. No fields were added.
- `src/app/host-bridge/host-bridge.service.ts`: `HostBridgeService` exposes `visits$`. It starts with `window.petclinicHost.visits` (or `null` if the host has not published), emits on each bridge event, and removes the listener and completes the subject in `ngOnDestroy`.
- `src/app/visits-by-status/`:
  - `visits-panel-view.ts`: pure mapping from bridge state to the view model. It handles display rules and sorting.
  - `visits-by-status-panel.component.{ts,html,css}`: standalone, `OnPush` component that renders the view model with the `async` pipe.
- `src/app/visits/visit-status.ts`: copied from petclinic-angular-demo, at the same relative path so the contract imports resolve.
- `src/app/app.component.html`: shows `<app-visits-by-status-panel />`.

## Display rules

- **Null state:** "Waiting for the clinic app…".
- **`loading: true`:** only "Loading visits…".
- **`error` set:** only the error text, shown exactly as published.
- **Ready:** the four counts come from `statusCounts`, not from the list. Scheduled visits are listed by `date` ascending, using plain string comparison of `yyyy-mm-dd`. A missing or empty date sorts last. Ties are ordered by `id` ascending. Each line shows the date string unchanged and "Pet <petId>", or "Pet: not set" when `petId` is missing. If no visit is scheduled, the list shows "No scheduled visits.".

## Acceptance criteria

- **AC1:** The service reads `window.petclinicHost.visits` on start and listens on the contract event name. It removes the listener on destroy.
- **AC2:** Types and event name match the attached `visits-bridge.ts`. No fields beyond `VisitsBridgeState` are read, and there is no fallback for other payload shapes.
- **AC3:** Counts are labelled Scheduled, Completed, Cancelled and Not set, and come from `statusCounts`.
- **AC4:** Only `SCHEDULED` visits are listed, with date and pet ID.
- **AC5:** Loading, error and waiting states behave as specified. A missing bridge value does not throw.
- **AC6:** `npm install … && npx ng build --configuration development` passes (exit 0 in `.harness/validation-report.txt`).
- **AC7:** Display and sort rules are implemented as described above.

## Out of scope

- REST API calls.
- NgRx. This app only reads the host's bridge.
- Module federation between the two apps.
- Styling beyond plain HTML.
- Unit tests. This repo runs build-only.

## Testing

- Development build: `npm install --legacy-peer-deps … && npx ng build --configuration development` passes.
- Not covered: unit tests (out of scope for this repo), and a manual run alongside a live petclinic-angular-demo host.

## Risks / notes

- The bridge contract is copied, not shared. Any change in petclinic-angular-demo's `visits-bridge.ts`, `visits.selectors.ts` or `visit-status.ts` must be mirrored here.
- `VisitsBridgeVisit.status` is typed `VisitStatus | null | undefined`. Only the exact `'SCHEDULED'` string matches the list filter.
