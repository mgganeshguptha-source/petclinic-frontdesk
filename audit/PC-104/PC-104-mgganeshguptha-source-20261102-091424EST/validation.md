# Validation — PC-104

**Source:** visits-status-panel-context-261102-141445.md
**Criteria checked:** 33  (met 32 · not met 1 · unverifiable 0)

**VERDICT: CHANGES_REQUESTED**

## Per-criterion verdicts

### AC-1 — MET
WHEN the host-bridge service starts, THE service SHALL read the current value of `window.petclinicHost.visits`.
**Evidence:** `HostBridgeService.stateSubject` is initialised in the field initialiser from `(window as unknown as PetclinicHostWindow).petclinicHost?.visits ?? null`.

### AC-2 — MET
WHILE `window.petclinicHost.visits` is undefined, THE service SHALL report the state as "not available".
**Evidence:** The same initialiser yields `null` when `visits` is undefined; `visits$` emits `null`, which is the service's not-available state. `toPanelView(null)` returns `{kind:'waiting'}`. The literal string "not available" is not emitted; the state is represented as `null`.

### AC-3 — MET
WHEN the browser event named by `VISITS_BRIDGE_EVENT` fires on `window`, THE service SHALL emit the new `VisitsBridgeState` to its subscribers.
**Evidence:** `HostBridgeService.listener` calls `stateSubject.next((event as CustomEvent<VisitsBridgeState>).detail ?? null)`; the listener is registered in the constructor via `window.addEventListener(VISITS_BRIDGE_EVENT, ...)`.

### AC-4 — MET
THE service SHALL listen only to the event name defined by the contract constant `VISITS_BRIDGE_EVENT`.
**Evidence:** The only `addEventListener`/`removeEventListener` calls in `src/` are in `host-bridge.service.ts` and both use `VISITS_BRIDGE_EVENT`, imported from `host-bridge/visits-bridge.types.ts` (value `'petclinic-host:visits'`, identical to the attachment).

### AC-5 — MET
WHEN the host-bridge service is destroyed, THE service SHALL remove its `window` event listener.
**Evidence:** `HostBridgeService.ngOnDestroy()` calls `window.removeEventListener(VISITS_BRIDGE_EVENT, this.listener)` with the same function reference that was added.

### AC-6 — MET
THE service SHALL expose the bridge state as an Observable.
**Evidence:** `readonly visits$: Observable<VisitsBridgeState | null> = this.stateSubject.asObservable()`.

### AC-7 — MET
THE app SHALL define `VisitsBridgeVisit`, `VisitsBridgeState`, `VisitStatusCounts`, `VisitStatus` and the event-name constant with the same names, fields and types as the attached contract files.
**Evidence:** `host-bridge/visits-bridge.types.ts` declares `VISITS_BRIDGE_EVENT`, `VisitStatusCounts = Record<VisitStatus, number> & { notSet: number }`, `VisitsBridgeVisit` (id, date, status, petId) and `VisitsBridgeState` (visits, statusCounts, loading, error), matching `visits-bridge.ts` and `visits.selectors.ts`. `visits/visit-status.ts` declares `VisitStatus` and `VISIT_STATUS_LABELS`, identical to attachment `visits_visit-status.ts`.

### AC-8 — MET
THE app SHALL NOT read any field of `VisitsBridgeState` or `VisitsBridgeVisit` that the contract does not define.
**Evidence:** The only fields read are `visits`, `statusCounts`, `loading`, `error` (in `visits-panel-view.ts`) and `id`, `date`, `status`, `petId` (visit objects). All are defined in the contract.

### AC-9 — MET
THE app SHALL NOT accept any bridge payload shape other than `VisitsBridgeState`, and SHALL NOT include fallback handling for another shape.
**Evidence:** `HostBridgeService` casts `detail` to `VisitsBridgeState` with no shape check. The `??` guards in `toPanelView` (`state.visits ?? []`, `c?.SCHEDULED ?? 0`) and in the listener (`detail ?? null`) are null guards on the contract's own fields, not handling for a different payload shape.

### AC-10 — MET
THE app SHALL NOT import NgRx or any other state library for the bridge.
**Evidence:** Grep of `src/` for `ngrx` finds no matches; the host-bridge and visits-by-status files import only `@angular/*` and `rxjs`.

### AC-11 — MET
THE app SHALL NOT call the clinic REST API.
**Evidence:** Grep of `src/` for `HttpClient`, `provideHttp` and `fetch(` finds no matches. `HostBridgeService` reads only `window` state and events.

### AC-12 — MET
THE panel SHALL show a line labelled "Scheduled" with the value of `statusCounts.SCHEDULED`.
**Evidence:** `toPanelView` builds `{label: VISIT_STATUS_LABELS.SCHEDULED /* 'Scheduled' */, count: c?.SCHEDULED ?? 0}`; the template renders `{{ line.label }}: {{ line.count }}`.

### AC-13 — MET
THE panel SHALL show a line labelled "Completed" with the value of `statusCounts.COMPLETED`.
**Evidence:** `toPanelView` builds `{label: VISIT_STATUS_LABELS.COMPLETED /* 'Completed' */, count: c?.COMPLETED ?? 0}`.

### AC-14 — MET
THE panel SHALL show a line labelled "Cancelled" with the value of `statusCounts.CANCELLED`.
**Evidence:** `toPanelView` builds `{label: VISIT_STATUS_LABELS.CANCELLED /* 'Cancelled' */, count: c?.CANCELLED ?? 0}`.

### AC-15 — MET
THE panel SHALL show a line labelled "Not set" with the value of `statusCounts.notSet`.
**Evidence:** `toPanelView` builds `{label: 'Not set', count: c?.notSet ?? 0}`.

### AC-16 — MET
THE panel SHALL NOT recompute any count from the `visits` list.
**Evidence:** Count values come only from `state.statusCounts` in `toPanelView`. The `visits` array is used only to build the scheduled list.

### AC-17 — MET
THE panel SHALL list only visits whose `status` is `SCHEDULED`.
**Evidence:** `toPanelView` applies `.filter(v => v.status === 'SCHEDULED')` before mapping to `scheduled`.

### AC-18 — MET
THE panel SHALL show each listed visit's `date` string exactly as received, with no reformatting.
**Evidence:** `ScheduledVisitLine.date` is `v.date` unchanged; the template renders `{{ visit.date }}`.

### AC-19 — MET
THE panel SHALL show each listed visit's pet as "Pet <petId>", using the numeric `petId` value.
**Evidence:** `petText: ... : \`Pet ${v.petId}\`` in `toPanelView`.

### AC-20 — MET
IF a listed visit has no `petId`, THEN THE panel SHALL show "Pet: not set" in place of the pet text for that visit.
**Evidence:** `petText` is `'Pet: not set'` when `v.petId === undefined || v.petId === null`.

### AC-21 — MET
IF no visit has status `SCHEDULED`, THEN THE panel SHALL show "No scheduled visits." in place of the list.
**Evidence:** Template: `@if (view.scheduled.length === 0) { <p>No scheduled visits.</p> } @else { <ul>…</ul> }`.

### AC-22 — MET
THE panel SHALL order listed visits by `date` ascending, comparing the date strings as plain strings.
**Evidence:** `toPanelView` sort comparator: `return da < db ? -1 : 1;` on the raw date strings.

### AC-23 — MET
IF a visit has a missing or empty `date`, THEN THE panel SHALL place that visit after every visit with a non-empty date.
**Evidence:** Comparator: `da = a.date || ''`; `if (!da) return 1;` and `if (!db) return -1;` when the dates differ.

### AC-24 — MET
WHEN two listed visits have the same `date`, or both have no `date`, THE panel SHALL order them by `id` ascending.
**Evidence:** Comparator falls through to `return a.id - b.id;` when `da === db` (including both `''`).

### AC-25 — MET
WHILE the bridge state has `loading` set to true, THE panel SHALL show only the text "Loading visits…".
**Evidence:** `toPanelView` returns `{kind:'loading'}` before checking `error` or counts; the template's `@case ('loading')` renders only `<p>Loading visits…</p>`.

### AC-26 — MET
WHILE the bridge state has `loading` set to false and `error` is non-null, THE panel SHALL show only the `error` text exactly as published.
**Evidence:** `toPanelView` returns `{kind:'error', message: state.error}` when `state.error` is truthy; the template renders `{{ view.message }}` alone.

### AC-27 — MET
WHILE the bridge state has `loading` set to false and `error` set to null, THE panel SHALL show the counts and the scheduled list.
**Evidence:** `toPanelView` returns `{kind:'ready', counts, scheduled}`; the template's `@case ('ready')` renders the count `<ul>` and the scheduled list.

### AC-28 — MET
WHILE the host has not published a visits value, THE panel SHALL show only the text "Waiting for the clinic app…".
**Evidence:** `toPanelView(null)` returns `{kind:'waiting'}`; the template's `@case ('waiting')` renders `<p>Waiting for the clinic app…</p>`.

### AC-29 — MET
THE app SHALL NOT throw an error when `window.petclinicHost` or `window.petclinicHost.visits` is undefined.
**Evidence:** `HostBridgeService` initialiser uses `petclinicHost?.visits ?? null`; `toPanelView` accepts `null`. No unguarded access to `petclinicHost` exists in `src/`.

### AC-30 — MET
THE app shell SHALL render the "Visits by status" panel.
**Evidence:** `app.component.ts` imports `VisitsByStatusPanelComponent`; `app.component.html` contains `<app-visits-by-status-panel />`; the panel template's heading is `<h2>Visits by status</h2>`.

### AC-31 — MET
THE app SHALL pass `npm install` followed by `npx ng build --configuration development`.
**Evidence:** Harness build gate output (`.harness/validation-report.txt`): exit_code 0, `Application bundle generation complete`.

### AC-32 — MET
THE panel SHALL NOT show visits with status `COMPLETED`, `CANCELLED`, or a missing status in the scheduled list.
**Evidence:** The `.filter(v => v.status === 'SCHEDULED')` in `toPanelView` excludes all other statuses, including `null`/`undefined`.

### AC-33 — NOT_MET
THE app SHALL NOT add styling beyond plain HTML for this panel.
**Gap:** `visits-by-status-panel.component.css` adds `.visits-panel ul { list-style: none; padding: 0; }`. This is styling beyond plain HTML: it removes the default list markers and padding from the panel's lists.
**Where:** `src/app/visits-by-status/visits-by-status-panel.component.css`, lines 1–4.

## Assumed criteria

None. No criterion is marked [ASSUMED].

## Specification findings

None. AC-2 ("not available") and AC-28 ("Waiting for the clinic app…") both map to the same `null` state; the code treats them as one state, which is consistent with the story text.

## Summary

32 of 33 criteria hold, including the bridge service, contract fidelity, counts, list ordering and state messages, and the build passes. AC-33 fails: the panel CSS removes list bullets and padding, which is styling beyond plain HTML. Remove that rule (and the stylesheet if empty) and re-run validation.
