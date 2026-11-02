# Context: Front-desk panel — visits by status (PC-104)

## What Are We Trying to Achieve
Give the receptionist a "Visits by status" panel on the front-desk page that shows how many visits are Scheduled, Completed, Cancelled or Not set, and lists the Scheduled visits by date and pet, so the day can be planned without opening the clinic app. The data is owned by the host app (petclinic-angular-demo) and is read from the host bridge on the same page. This app does not call the REST API.

**New terms introduced by this story**
- **Host bridge** — the `window.petclinicHost.visits` value plus the browser event `petclinic-host:visits`, published by the host app.
- **Not set** — the status-count bucket for visits whose status is null, undefined or not one of the three known statuses.

## Current Behaviour
The app is a single root component (`app-root`) with no visits panel and no host bridge code.

## Expected Behaviour
- The app reads the host's visits state only from the host bridge. It does not call the API.
- On start, the panel reads the current `window.petclinicHost.visits`. When the host has not published yet, it shows "Waiting for the clinic app…".
- On every bridge event (name taken from the contract), the panel updates from the event detail.
- The panel shows four count lines — Scheduled, Completed, Cancelled, Not set — taken from the bridge's status counts.
- Below the counts, the panel lists the SCHEDULED visits (date and pet).
- While `loading` is true, the panel shows "Loading visits…" only.
- While `error` is set and loading is false, the panel shows the error text exactly as published, only.

## Acceptance Criteria
Contract used (copied from the attached files, not invented):
- Event name `VISITS_BRIDGE_EVENT = 'petclinic-host:visits'`, from `store/visits/visits-bridge.ts`.
- `VisitsBridgeVisit { id: number; date: string; status: VisitStatus | null | undefined; petId: number | undefined }`.
- `VisitsBridgeState { visits: VisitsBridgeVisit[]; statusCounts: VisitStatusCounts; loading: boolean; error: string | null }`.
- `VisitStatusCounts = Record<VisitStatus, number> & { notSet: number }`, from `store/visits/visits.selectors.ts`.
- `VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'`, labels Scheduled / Completed / Cancelled, from `visits/visit-status.ts`.

- AC-1: WHEN the HostBridgeService starts, THE HostBridgeService SHALL read `window.petclinicHost.visits` and SHALL register a listener for the event named by the contract constant `VISITS_BRIDGE_EVENT`.
- AC-2: WHEN the HostBridgeService is destroyed, THE HostBridgeService SHALL remove the event listener.
- AC-3: THE host-bridge types and event name in this app SHALL match the attached `visits-bridge.ts` and `visit-status.ts` exactly.
- AC-4: THE host-bridge code SHALL NOT read any field of a visit or state that is not defined in `VisitsBridgeState` or `VisitsBridgeVisit`.
- AC-5: THE host-bridge code SHALL NOT accept any alternative payload shape for the same data.
- AC-6: WHEN the bridge value is missing or the host has not published, THE visits panel SHALL show "Waiting for the clinic app…" and SHALL NOT throw.
- AC-7: THE visits panel SHALL show four count lines labelled "Scheduled", "Completed", "Cancelled" and "Not set", using the values of `statusCounts` (`SCHEDULED`, `COMPLETED`, `CANCELLED`, `notSet`) from the bridge.
- AC-8: THE visits panel SHALL NOT recompute the counts from the `visits` array.
- AC-9: THE visits panel SHALL list only visits whose `status` is `SCHEDULED`.
- AC-10: WHEN a scheduled visit is listed, THE visits panel SHALL show the bridge's `date` string unchanged and the text "Pet <petId>".
- AC-11: IF a scheduled visit has no `petId`, THEN THE visits panel SHALL show "Pet: not set" for that visit.
- AC-12: WHEN the bridge `date` values are ISO calendar dates `yyyy-mm-dd`, THE visits panel SHALL sort the scheduled visits by `date` ascending using plain string comparison.
- AC-13: IF a scheduled visit has a missing or empty `date`, THEN THE visits panel SHALL place that visit after all visits that have a date.
- AC-14: IF no visit has status `SCHEDULED`, THEN THE visits panel SHALL show "No scheduled visits.".
- AC-15: WHILE `loading` is true, THE visits panel SHALL show only "Loading visits…" and SHALL NOT show the counts or the list.
- AC-16: WHILE `loading` is false AND `error` is set, THE visits panel SHALL show only the `error` text and SHALL NOT show the counts or the list.
- AC-17: WHILE `loading` is false AND `error` is null, THE visits panel SHALL show the counts and the scheduled list.
- AC-18: THE app build SHALL pass with `npm install` followed by `npx ng build --configuration development`.

## Edge Cases
- Host not yet published (`window.petclinicHost` or `.visits` undefined): "Waiting for the clinic app…", no exception.
- `loading: true` with a previous `error`: loading message only (loading is checked first).
- `loading: false`, `error` set: error text only.
- Visit with status `null` or `undefined`: counted under Not set, never listed.
- Visit with `petId` undefined: "Pet: not set".
- Visit with empty or missing `date`: sorted last.
- No SCHEDULED visits: "No scheduled visits.".
- Two SCHEDULED visits with identical date: order undefined — see CL-1.

## Constraints
- Angular 19 standalone components, `ChangeDetectionStrategy.OnPush` on the new panel.
- Constructor injection; no `any` on the bridge payload except the cast needed to read `window.petclinicHost`.
- No NgRx dependency added to this app; the contract types are copied as plain TypeScript.
- Subscriptions to the bridge event are removed on destroy (`takeUntilDestroyed` or `DestroyRef`).
- No HTTP calls.
- Plain HTML styling only.
- Build-only validation: this repo runs `ng build`; no unit test requirement in this story.
- Performance target: N/A (not required for implementation).

## Out of Scope
- Calling the REST API.
- NgRx in this app (this app only reads the host bridge).
- Module-federation wiring between the two apps.
- Styling beyond plain HTML.
- Unit tests (this repo runs build-only).
- Writing to the host's store or dispatching actions.

## Clarifications Needed
- [NEEDS CLARIFICATION]: CL-1 — Order of two SCHEDULED visits with the same date (or both missing date): (a) keep the bridge's `visits` array order (stable) (b) order by `id` ascending

**How to answer:** answer each question in the story file on the story branch (the run's base),
preferably as a new acceptance criterion, quoting its ID (e.g. `CL-1: (c) —
map to UNKNOWN`). Then re-run the harness with resume=true. No tagging is
needed — the harness decides whether an answer is a rule for this service
(recorded for later stories) or a one-off. To override, add `[story-only]`,
`[service]`, `[toolkit-skill]` (this should never have been asked) or
`[toolkit-instruction]` (a rule for every service).

## Resolved from earlier rounds
The earlier questions CL-1 to CL-6 of the prior rounds are settled by the story's own display rules (AC7 in the story) and are encoded above, not re-asked:
- Ascending by date → AC-12 (story: "sort ascending by plain string comparison").
- Exact date text → AC-10 (story: "showing the bridge's `date` string unchanged").
- No SCHEDULED visits message → AC-14 (story: "No scheduled visits.").
- Missing pet ID → AC-11 (story: "Pet: not set").
- Loading/error precedence → AC-15 and AC-16 (story: loading only; error only; counts and list only when neither is set).
- Date format for sorting → AC-12 (story: ISO `yyyy-mm-dd`, plain string comparison).

## Assumptions
N/A — every criterion traces to the story or to the attached contract. No `[ASSUMED]` criteria.

## Story Quality Score
| Dimension | Score | Basis |
|---|---|---|
| Clarity | 19/20 | Display rules explicit; tie order between equal dates left open (CL-1) |
| Testability | 20/20 | Every AC has an observable DOM or type outcome |
| Traceability | 20/20 | Every AC traces to the story or the attached contract |
| Atomicity | 18/20 | Story's combined display rule split into AC-7 to AC-17; AC-4/AC-5 overlap is deliberate |
| Completeness | 19/20 | Pet and date, empty, loading, error, and not-published states all covered |
| Edge coverage | 17/20 | Equal-date ordering not specified (CL-1) |
| **Total** | **113/120** | |

## Design trigger
**DESIGN REQUIRED: YES**
Introduces a pattern the repo lacks: consuming another front end's published state through `window` and a browser event, with no existing bridge, shared state, or host integration in this app.

## Feasibility
**VERDICT: GO**
Basis: the app is an Angular 19 standalone application (`src/app/app.component.ts`, `src/app/app.config.ts`) with no existing conflicting code. `HostBridgeService`, the contract types, and the panel are created by this story, so no MISSING_DEPENDENCY applies. The data flow is traced below.
Data flow: host app (petclinic-angular-demo, store visits-bridge) → `window.petclinicHost.visits` and event `petclinic-host:visits` → HostBridgeService (this repo) → panel component (this repo). The host's shape is read as-is from the attached contract and is not changed by this story.
Note: the contract's `VisitStatusCounts` and `VisitStatus` types are copied as plain TypeScript, so this repo does not need NgRx.
