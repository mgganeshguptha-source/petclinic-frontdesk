# Context: Front-desk panel showing visits by status (PC-104)

## 1. What Are We Trying to Achieve
A receptionist needs to plan the day without opening the clinic app's pages. This app runs on the same page as the petclinic host app (`petclinic-angular-demo`), which owns the visits data. The front-desk app adds a "Visits by status" panel that shows how many visits are Scheduled, Completed, Cancelled or Not set, and lists the Scheduled visits by date and pet. It reads the host's published visits state and does not call the REST API.

**New terms introduced by this story:**
- **Host bridge** — the host app's published visits state, read from `window.petclinicHost.visits` and updated by the browser event `VISITS_BRIDGE_EVENT`.
- **Visits by status panel** — the front-desk panel that renders the four counts and the Scheduled list.
- **Not set** — the count of visits whose status is missing or not one of the known status values (`statusCounts.notSet`).

## 2. Current Behaviour
N/A — no visits panel or host bridge consumer exists in this app. The app shell is a single root component.

## 3. Expected Behaviour
- The app reads the host bridge state (`VisitsBridgeState`) through a `HostBridgeService` exposed as an Observable. It starts with the current `window.petclinicHost.visits`, or a "not published" state when the host has not published yet, and emits on every bridge event.
- The panel shows four count lines (Scheduled, Completed, Cancelled, Not set) from the bridge's `statusCounts`, and below them the Scheduled visits as date and pet.
- Loading, error and "not published" states replace the content as described in the acceptance criteria.

## 4. Acceptance Criteria
Contract source: `store/visits/visits-bridge.ts`, `store/visits/visits.selectors.ts`, `visits/visit-status.ts` (attached, PC-103 of `petclinic-angular-demo`). Story-stated values are used verbatim. The story's AC7 answers the round-1 clarifications CL-1 to CL-5 (ascending date order, date string unchanged, "No scheduled visits.", "Pet: not set" placeholder, loading wins over error and counts/list are hidden while either is set). Those answers are encoded below as traced criteria.

- AC-1: WHEN the host bridge service starts, THE host bridge service SHALL emit the current value of `window.petclinicHost.visits`, or a "not published" state WHEN that property is absent.
- AC-2: WHEN a browser event named `VISITS_BRIDGE_EVENT` is dispatched, THE host bridge service SHALL emit the event's `detail` as the new state. Source: story Expected Behaviour; attached bridge dispatches `detail: state`.
- AC-3: THE host bridge service SHALL listen only to the event named by the exported constant `VISITS_BRIDGE_EVENT` (value `petclinic-host:visits`) and SHALL NOT listen to any other event name.
- AC-4: WHEN the host bridge service is destroyed, THE host bridge service SHALL remove its event listener.
- AC-5: THE app SHALL define `VisitsBridgeState`, `VisitsBridgeVisit`, `VisitStatus`, `VisitStatusCounts`, `VISIT_STATUS_LABELS` and `VISITS_BRIDGE_EVENT` with the field names, types and values exactly as in the attached files. Source: story AC2.
- AC-6: THE app SHALL NOT read any field of the bridge state other than those declared in `VisitsBridgeState` and `VisitsBridgeVisit`. Source: story AC2.
- AC-7: THE app SHALL NOT accept any alternative payload shape of the bridge state. Source: story AC2.
- AC-8: THE visits-by-status panel SHALL show four count lines labelled "Scheduled", "Completed", "Cancelled" and "Not set", with values taken from `statusCounts.SCHEDULED`, `statusCounts.COMPLETED`, `statusCounts.CANCELLED` and `statusCounts.notSet`. Source: story AC3.
- AC-9: THE visits-by-status panel SHALL NOT recompute any count from the `visits` array. Source: story AC3.
- AC-10: THE visits-by-status panel SHALL list only visits whose `status` equals `SCHEDULED`. Source: story AC4.
- AC-11: THE visits-by-status panel SHALL order the listed Scheduled visits by `date` ascending. Source: story AC7; answers CL-1. Date sort key format is open, see CL-6.
- AC-12: THE visits-by-status panel SHALL show each listed visit's `date` exactly as the bridge provides it, unchanged. Source: story AC7; answers CL-2.
- AC-13: THE visits-by-status panel SHALL show each listed visit's pet as "Pet <petId>". Source: story AC7.
- AC-14: IF a listed visit has no `petId`, THEN THE visits-by-status panel SHALL show "Pet: not set" for that visit. Source: story AC7; answers CL-4.
- AC-15: IF no visit has status `SCHEDULED`, THEN THE visits-by-status panel SHALL show "No scheduled visits." in place of the list. Source: story AC7; answers CL-3.
- AC-16: WHILE the bridge state has `loading` true, THE visits-by-status panel SHALL show "Loading visits…" and nothing else. Source: story Expected Behaviour and AC7; answers CL-5 (loading wins).
- AC-17: IF the bridge state has `loading` false and `error` set, THEN THE visits-by-status panel SHALL show only the `error` text exactly as published. Source: story Expected Behaviour and AC7; answers CL-5.
- AC-18: WHILE `loading` is false and `error` is null, THE visits-by-status panel SHALL show the four counts and the Scheduled list. Source: story AC7 (the sentence "counts and the list show only when neither is set" is truncated in the story; this criterion takes its stated meaning).
- AC-19: IF the host has not published visits (`window.petclinicHost` or `visits` is missing), THEN THE visits-by-status panel SHALL show "Waiting for the clinic app…". Source: story Expected Behaviour and AC5.
- AC-20: IF `window.petclinicHost` or `window.petclinicHost.visits` is missing, THEN THE app SHALL NOT throw an error. Source: story AC5.
- AC-21: THE app shell SHALL show the visits-by-status panel. Source: story In scope.
- AC-22: THE app SHALL NOT call the REST API or dispatch NgRx actions to obtain visits data. Source: story Out of scope and Expected Behaviour.
- AC-23: WHEN `npm install` is followed by `npx ng build --configuration development`, THE build SHALL succeed. Source: story AC6.

## 5. Edge Cases
- Host not published: `window.petclinicHost` undefined → "Waiting for the clinic app…", no throw.
- `window.petclinicHost` defined but `visits` undefined → same as above.
- Bridge state with `visits: []` → counts shown (all zero except as given by `statusCounts`), list shows "No scheduled visits.".
- Visit with `status` null or undefined → contributes only to `statusCounts.notSet`, never listed.
- Visit with `status` SCHEDULED and `petId` undefined → "Pet: not set".
- `loading: true` and `error` set at the same time → only "Loading visits…" shown (AC-16).
- `error` set with `loading: false` → only the error text (AC-17); the message is shown exactly as published (no rewording).
- Multiple bridge events in quick succession → each emits the latest state; the panel reflects the last one.
- Component destroyed → listener removed; no further updates processed (AC-4).

## 6. Constraints
- Standalone components only; no NgModules.
- `ChangeDetectionStrategy.OnPush` for the new panel component.
- Use the async pipe or explicit subscription with teardown (`takeUntilDestroyed()` or equivalent) for the bridge Observable.
- No `any` in the copied contract types beyond what the attached file already declares; the `(window as any)` access pattern is limited to reading `window.petclinicHost` in `HostBridgeService`.
- Contract files are copied into `src/app/host-bridge/`. Import paths inside the copies must resolve locally; the copied content must otherwise be unchanged.
- No new third-party libraries; no NgRx.
- Public `HostBridgeService` gets JSDoc describing purpose, emitted states and error behaviour.
- Plain HTML only; no styling beyond what is necessary.
- Performance target: N/A — no latency, bundle or memory targets were given in the story.
- Build verification: `npm install` then `npx ng build --configuration development` must pass. Repo runs build-only (no unit tests in this story).

## 7. Out of Scope
- Calling the REST API for visits.
- NgRx of any kind in this app (this app only reads the host's bridge).
- Module-federation wiring between the two apps.
- Writing to the host's state or dispatching events back to the host.
- Styling beyond plain HTML.
- Unit tests (this repo runs build-only for this story).
- Filtering or grouping by date other than the ascending order in AC-11.
- Editing any file under `store/` or `visits/` other than copying them as contract.

## 8. Clarifications Needed
- [NEEDS CLARIFICATION]: CL-6 — Date sort key for the Scheduled list: the bridge defines `date` as a plain `string` with no format. "Ascending by date" needs a comparable form. (a) ISO calendar dates `yyyy-mm-dd`, ordered by string comparison (b) another format, name it (its pattern) so ascending order can be defined.

**How to answer:** answer each question in the story file on the story branch (the run's base), preferably as a new acceptance criterion, quoting its ID (e.g. `CL-6: (a)`). Then re-run the harness with resume=true. No tagging is needed — the harness decides whether an answer is a rule for this service (recorded for later stories) or a one-off. To override, add `[story-only]`, `[service]`, `[toolkit-skill]` (this should never have been asked) or `[toolkit-instruction]` (a rule for every service).

## 9. Assumptions
N/A — every criterion traces to the story, its attached contract, or its answers to CL-1 to CL-5. No `[ASSUMED]` criteria.

## 10. Story Quality Score
| Dimension | Score | Basis |
|---|---|---|
| Clarity | 18/20 | Story AC7 sentence on hidden counts/list is truncated; read as "neither set" (AC-18). Date sort format open (CL-6). |
| Testability | 20/20 | Every AC has an observable outcome (text, count, event listener, build result). |
| Traceability | 20/20 | All ACs trace to story text, attached contract, or answers CL-1 to CL-5. No `[ASSUMED]`. |
| Atomicity | 20/20 | Each AC is one behaviour and one response; story AC7 split into AC-11 to AC-18. |
| Completeness | 16/20 | Date format undefined in contract (CL-6). |
| Edge coverage | 17/20 | Null status, missing petId, missing host, simultaneous loading/error covered; date format edge unresolved. |
| **Total** | **111/120** | |

## 11. Design trigger
**DESIGN REQUIRED: YES**
Triggers fired: "Crosses a service boundary" (new dependency on the host app's `window.petclinicHost` bridge and its browser event, which this repo does not have today) and "Introduces a pattern the repo lacks" (browser-global/event-based state consumption; no such pattern exists here).

## 12. Feasibility
**VERDICT: GO**
Basis: the contract files (`visits-bridge.ts`, `visits.selectors.ts`, `visit-status.ts`) are attached and self-contained once copied; the panel and `HostBridgeService` are new code in this repo; the app is standalone Angular 19 with a single root component.
Data flow: host store (petclinic-angular-demo, `visits` feature) → `startVisitsBridge` publishes on `window.petclinicHost.visits` and dispatches `petclinic-host:visits` (host repo, read as-is, unchanged) → `HostBridgeService` (this repo) → visits-by-status panel (this repo).
Note: the copied bridge file imports `Store` and `VisitStatus`; the copy keeps the type and constant definitions and drops the `startVisitsBridge` runtime publisher, which belongs to the host.
