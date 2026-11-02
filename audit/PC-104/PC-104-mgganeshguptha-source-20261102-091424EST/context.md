# Context: Front-desk panel showing visits by status (PC-104)

**Story type:** New development (full stack not applicable; frontend only)
**Layer:** Angular frontend
**Upstream contract:** petclinic-angular-demo (store folder and visit-status file attached)
**Mode:** CI (no questions asked; prior clarification rounds resolved from story text)

---

## What Are We Trying to Achieve

Give receptionists a front-desk panel that shows how many visits are scheduled, completed or cancelled, and lists the scheduled visits by date and pet, so the day can be planned without opening the clinic app's pages.

New terms introduced by this story:
- **Host bridge:** the read-only channel the clinic host app publishes its visits state on. It is the `window.petclinicHost.visits` value plus a browser event named `petclinic-host:visits`. This app reads it and never writes to it.
- **Not set:** the count of visits whose status is missing or not one of the three known statuses.

## Current Behaviour

No visits panel and no host bridge exist in this app. The app shell renders no feature panels.

## Expected Behaviour

This app runs on the same page as the clinic host app (petclinic-angular-demo), which owns the visits data. It does not call the REST API. It reads the host's published visits state:
- the current value on `window.petclinicHost.visits` when the service starts, or "not available" when the host has not published yet;
- an update every time the browser event `petclinic-host:visits` fires.

The contract types (`VisitsBridgeState`, `VisitsBridgeVisit`, `VisitStatusCounts`, `VisitStatus`, and the status labels) and the event name are copied exactly from the attached store files and the visit-status file.

The panel "Visits by status" shows:
- one line per status: Scheduled, Completed, Cancelled, Not set, each with its count from the bridge's status counts;
- below the counts, the list of SCHEDULED visits, each showing the bridge `date` string and the pet ID;
- state messages as defined in the acceptance criteria (loading, error, waiting, no scheduled visits).

## Acceptance Criteria

Traceability: the story's AC1 to AC7 are split into atomic criteria below. Each criterion traces to the story text in its basis. None is marked [ASSUMED].

**Host bridge service**
- AC-1: WHEN the host-bridge service starts, THE service SHALL read the current value of `window.petclinicHost.visits`.
- AC-2: WHILE `window.petclinicHost.visits` is undefined, THE service SHALL report the state as "not available".
- AC-3: WHEN the browser event named by the contract constant `VISITS_BRIDGE_EVENT` (value `petclinic-host:visits`) fires on `window`, THE service SHALL emit the new `VisitsBridgeState` to its subscribers.
- AC-4: THE service SHALL listen only to the event name defined by the contract constant `VISITS_BRIDGE_EVENT`.
- AC-5: WHEN the host-bridge service is destroyed, THE service SHALL remove its `window` event listener.
- AC-6: THE service SHALL expose the bridge state as an Observable.

**Contract fidelity**
- AC-7: THE app SHALL define `VisitsBridgeVisit`, `VisitsBridgeState`, `VisitStatusCounts`, `VisitStatus` and the event-name constant with the same names, fields and types as the attached contract files.
- AC-8: THE app SHALL NOT read any field of `VisitsBridgeState` or `VisitsBridgeVisit` that the contract does not define.
- AC-9: THE app SHALL NOT accept any bridge payload shape other than `VisitsBridgeState`, and SHALL NOT include fallback handling for another shape.
- AC-10: THE app SHALL NOT import NgRx or any other state library for the bridge.
- AC-11: THE app SHALL NOT call the clinic REST API.

**Counts**
- AC-12: THE panel SHALL show a line labelled "Scheduled" with the value of `statusCounts.SCHEDULED`.
- AC-13: THE panel SHALL show a line labelled "Completed" with the value of `statusCounts.COMPLETED`.
- AC-14: THE panel SHALL show a line labelled "Cancelled" with the value of `statusCounts.CANCELLED`.
- AC-15: THE panel SHALL show a line labelled "Not set" with the value of `statusCounts.notSet`.
- AC-16: THE panel SHALL NOT recompute any count from the `visits` list.

**Scheduled list content**
- AC-17: THE panel SHALL list only visits whose `status` is `SCHEDULED`.
- AC-18: THE panel SHALL show each listed visit's `date` string exactly as received, with no reformatting.
- AC-19: THE panel SHALL show each listed visit's pet as "Pet <petId>", using the numeric `petId` value.
- AC-20: IF a listed visit has no `petId`, THEN THE panel SHALL show "Pet: not set" in place of the pet text for that visit.
- AC-21: IF no visit has status `SCHEDULED`, THEN THE panel SHALL show "No scheduled visits." in place of the list.

**Scheduled list order**
- AC-22: THE panel SHALL order listed visits by `date` ascending, comparing the date strings as plain strings.
- AC-23: IF a visit has a missing or empty `date`, THEN THE panel SHALL place that visit after every visit with a non-empty date.
- AC-24: WHEN two listed visits have the same `date`, or both have no `date`, THE panel SHALL order them by `id` ascending.

**State messages**
- AC-25: WHILE the bridge state has `loading` set to true, THE panel SHALL show only the text "Loading visits…".
- AC-26: WHILE the bridge state has `loading` set to false and `error` is non-null, THE panel SHALL show only the `error` text exactly as published.
- AC-27: WHILE the bridge state has `loading` set to false and `error` set to null, THE panel SHALL show the counts and the scheduled list.
- AC-28: WHILE the host has not published a visits value, THE panel SHALL show only the text "Waiting for the clinic app…".
- AC-29: THE app SHALL NOT throw an error when `window.petclinicHost` or `window.petclinicHost.visits` is undefined.

**Shell and build**
- AC-30: THE app shell SHALL render the "Visits by status" panel.
- AC-31: THE app SHALL pass `npm install` followed by `npx ng build --configuration development`.

**Negative criteria**
- AC-32: THE panel SHALL NOT show visits with status `COMPLETED`, `CANCELLED`, or a missing status in the scheduled list.
- AC-33: THE app SHALL NOT add styling beyond plain HTML for this panel.

## Edge Cases

- Host not yet published: panel shows "Waiting for the clinic app…" and does not throw (AC-28, AC-29).
- Host publishes after this app starts: the next bridge event replaces the state (AC-3).
- `loading` true and `error` set together: only "Loading visits…" is shown (AC-25).
- `error` set and `loading` false: only the error text is shown; counts and list hidden (AC-26).
- No SCHEDULED visits, with or without other statuses: "No scheduled visits." (AC-21).
- Scheduled visit with no `petId`: "Pet: not set" (AC-20).
- Scheduled visits with equal dates: ordered by `id` ascending (AC-24).
- Scheduled visit with missing or empty `date`: placed last (AC-23).
- Visit with missing `status`: counted under "Not set" and not listed (AC-15, AC-32).
- Service destroyed while subscribed: listener removed; no further emissions (AC-5).

## Constraints

- Angular 19 standalone components only; no NgModules.
- `ChangeDetectionStrategy.OnPush` for the new panel component.
- No `any` types for the bridge; the `window` global is typed through a declaration, not by casting to `any`.
- Subscriptions in components use the async pipe or explicit teardown; the service removes its listener on destroy.
- Public service gets JSDoc: purpose, emitted value, error behaviour.
- Plain HTML only; no new dependencies.
- Build-only verification in this repo: `npm install` then `npx ng build --configuration development` (AC-31). No unit tests in scope.
- Performance target: N/A — no latency or bundle target stated in the story.

## Out of Scope

- Calling the clinic REST API.
- NgRx or any state library in this app.
- Module-federation wiring between the two apps.
- Styling beyond plain HTML.
- Unit tests (this repo runs build-only).
- Writing to the host's visits state or dispatching host events.
- Reformatting dates to a locale or calendar display.
- Filtering, search, or editing of visits.

## Clarifications Needed

None outstanding. Each question raised in earlier rounds is answered by the story text and is encoded as an AC:
- Round 1, CL-1 (list order): ascending by date → AC-22.
- Round 1, CL-2 (date text): bridge string unchanged → AC-18.
- Round 1, CL-3 (no scheduled visits): "No scheduled visits." → AC-21.
- Round 1, CL-4 (missing pet): "Pet: not set" → AC-20.
- Round 1, CL-5 (loading and error precedence): loading only while loading; error only otherwise → AC-25, AC-26, AC-27.
- Round 2, CL-6 (date sort key): ISO `yyyy-mm-dd`, plain string comparison → AC-22, AC-23.
- Round 3, CL-1 (tie order): ordered by `id` ascending → AC-24.

## Assumptions

None. No criterion is marked [ASSUMED].

## Story Quality Score

| Dimension | Score | Basis |
|---|---|---|
| Clarity | 19/20 | Terms and state messages are literal; window typing left to the design |
| Testability | 15/20 | Build-only verification (AC-31); behaviour checks have no automated test in scope |
| Traceability | 20/20 | Every AC traces to the story or the attached contract; no [ASSUMED] |
| Atomicity | 18/20 | Story criteria split to one response each; AC-25 to AC-27 still carry two conditions |
| Completeness | 18/20 | All states, labels and sort rules given; no accessibility or live-region requirement |
| Edge coverage | 18/20 | Missing host, late publish, missing date, pet, status covered; no malformed-date case |
| **Total** | **108/120** | |

## Design trigger

**DESIGN REQUIRED: YES**
Introduces a pattern the repo lacks: a cross-application host bridge that reads a `window` global and a browser event published by another app. Also consumes a changed upstream contract into shared observable state, so the mapping point must be decided once.

## Feasibility

**VERDICT: GO**
Basis: the contract types, event constant and status labels are all attached, so the shape is fixed. The host already publishes the bridge (PC-103), so no change in the host repo is needed. The app has no existing dependency this story would miss; the only new code is local to this app.

Data flow: host store (petclinic-angular-demo, owned by the host, unchanged) → `window.petclinicHost.visits` and `petclinic-host:visits` event → host-bridge service in this app (new) → Visits by status panel in this app (new) → app shell (changed).
