## What Are We Trying to Achieve
A receptionist needs to plan the day without opening the clinic app's pages. This app adds a front-desk panel that shows how many visits are scheduled, completed, cancelled or not set, and lists the scheduled visits by date and pet ID.

This app runs on the same page as the host app (petclinic-angular-demo), which owns the visits data. It does not call the REST API. It reads the host's published visits state through the host bridge contract and updates when the host announces a change.

**New terms introduced by this story**
- **Host bridge** — the visits state the host publishes on the page's shared host object, plus the browser event it dispatches on every change.
- **Not set** — a visit whose status is absent or is not one of SCHEDULED, COMPLETED, CANCELLED. Counted under the Not set line from the bridge's status counts.

## Expected Behaviour
On start, the panel reads the host's current published visits state. Each time the host dispatches the bridge event, the panel shows the new state.

The panel shows four status-count lines in this order — Scheduled, Completed, Cancelled, Not set — each with its count from the bridge's status counts. Below them it lists the visits whose status is SCHEDULED, each with its date and pet ID.

While the bridge reports loading, the panel shows "Loading visits…". When the bridge reports an error, the panel shows the error text exactly as published. When the host has published nothing, the panel shows "Waiting for the clinic app…". In no case does the page throw because the published value is missing.

The contract types, status values and labels, and the event name are taken exactly from the attached store files and the attached visit-status file. No field outside the contract is read.

## Acceptance Criteria
- AC-1: WHEN the front-desk app starts, THE host bridge service SHALL read the visits state currently published by the host.
- AC-2: WHEN the host dispatches the bridge event, THE host bridge service SHALL emit the newly published visits state.
- AC-3: WHEN the host bridge service is destroyed, THE host bridge service SHALL remove its listener for the bridge event.
- AC-4: IF the host has not published any visits state, THEN THE visits panel SHALL display "Waiting for the clinic app…".
- AC-5: IF the host has not published any visits state, THEN THE front-desk app SHALL NOT raise an uncaught error.
- AC-6: THE front-desk app SHALL define the bridge state, bridge visit, status-count type, status values, status labels and bridge event name exactly as they appear in the attached contract files.
- AC-7: THE front-desk app SHALL NOT read any field of a bridge visit other than id, date, status and petId.
- AC-8: THE host bridge service SHALL NOT apply a fallback for any payload shape other than the bridge state defined by the contract.
- AC-9: WHILE the bridge state reports loading as true, THE visits panel SHALL display "Loading visits…".
- AC-10: IF the bridge state reports an error, THEN THE visits panel SHALL display the error text exactly as the host published it.
- AC-11: WHEN the bridge state reports neither loading nor error, THE visits panel SHALL display four status-count lines labelled Scheduled, Completed, Cancelled and Not set, in that order.
- AC-12: WHEN the visits panel displays status-count lines, THE visits panel SHALL show each count from the bridge's status counts and SHALL NOT recompute any count from the bridge's visits list.
- AC-13: WHEN the bridge state reports neither loading nor error, THE visits panel SHALL list only the bridge visits whose status is SCHEDULED, and SHALL NOT list any visit whose status is absent or any other value.
- AC-14: WHEN the visits panel lists a visit, THE visits panel SHALL show that visit's date and pet ID.
- AC-15: THE front-desk app SHALL build with `npm install` followed by `npx ng build --configuration development`, with no errors.

## Edge Cases
- Host has not published (window host object or its visits value missing): panel shows the waiting message; no exception.
- Bridge reports loading true: loading message shown; panel body behaviour per CL-5.
- Bridge reports an error string: that exact string shown, not a generic message.
- Visit with status absent (null or undefined): counted under Not set, never listed.
- Visit with status CANCELLED or COMPLETED: never listed in the scheduled list, counted in its own line.
- Scheduled visit with pet ID absent (undefined): display per CL-4.
- No visits with status SCHEDULED: list area shown per CL-3.
- Host dispatches the bridge event several times in a row: each event replaces the displayed state with the latest one.
- Service destroyed, then the host dispatches the event: no further update is emitted.

## Constraints
- Standalone components only; no NgModules.
- OnPush change detection for the new panel component.
- No `any` types, including for the typed access to the host's global object; the global read and write must use a declared, typed shape.
- Contract types, labels and the event name are copied from the attachments; the NgRx imports in the attached store files are not copied, since this app has no NgRx dependency.
- Use the attached visit-status definitions as the source for the status type and labels.
- Reactive subscription to the bridge must be torn down on destroy.
- JSDoc on the public host bridge service: purpose, emitted value, and what it emits when the host has published nothing.
- No HTTP calls, no HttpClient, no REST API calls from this app.
- Validation is by build only (`npx ng build --configuration development`); this repo has no unit-test step for this story.

## Out of Scope
- Calling the REST API for visits.
- NgRx or any state library in this app; this app only reads the host's bridge.
- Module-federation or build wiring between the two apps.
- Styling beyond plain HTML.
- Unit tests for the service or panel (this repo runs build-only for this story).
- Any write or action on visits from this panel.
- Changes to the host app's store, actions, effects or reducer.

## Clarifications Needed
[NEEDS CLARIFICATION]: CL-1 — Order of the scheduled-visit list: (a) ascending by date (b) in the order the bridge's visits array holds them

[NEEDS CLARIFICATION]: CL-2 — Date text shown for each scheduled visit: (a) exactly the bridge's date string, unchanged (b) reformatted to a calendar date in a pattern stated in the story

[NEEDS CLARIFICATION]: CL-3 — Scheduled list when no visit is SCHEDULED: (a) a fixed message, with its exact text stated (b) no text; the list area is empty

[NEEDS CLARIFICATION]: CL-4 — Pet shown for a scheduled visit with no pet ID: (a) a fixed placeholder, with its exact text stated (b) the pet line is omitted for that visit

[NEEDS CLARIFICATION]: CL-5 — Panel body while loading or error is set: (a) only the loading or error message is shown, and loading wins when both are set (b) the last published counts and scheduled list stay visible beneath the message, and error wins when both are set

**How to answer:** answer each question in the story file on the story branch (the run's base),
preferably as a new acceptance criterion, quoting its ID (e.g. `CL-1: (c) —
map to UNKNOWN`). Then re-run the harness with resume=true. No tagging is
needed — the harness decides whether an answer is a rule for this service
(recorded for later stories) or a one-off. To override, add `[story-only]`,
`[service]`, `[toolkit-skill]` (this should never have been asked) or
`[toolkit-instruction]` (a rule for every service).

## Story Quality Score
| Dimension | Score | Basis |
|---|---|---|
| Clarity | 16/20 | Date text format, empty-list text, and pet-ID absence are unstated (CL-2 to CL-4) |
| Testability | 18/20 | AC-6 and AC-7 verifiable by inspection only; AC-15 is build-only, as the story requires |
| Traceability | 20/20 | No ASSUMED criteria; every AC traces to the story or the attached contract |
| Atomicity | 20/20 | Each AC one behaviour, one response, at most two preconditions |
| Completeness | 16/20 | Loading/error body and list ordering not specified (CL-1, CL-5) |
| Edge coverage | 16/20 | Edge cases named, but three depend on open clarifications |
| **Total** | **106/120** | |

## Design trigger
**DESIGN REQUIRED: YES**
Crosses a service boundary: the story introduces a new dependency on the host app's shared global object and browser event, which this repo has never read. Also introduces a pattern the repo lacks (consuming a host-published browser event), and consumes a changed upstream contract into a shared service, so the single place where the host shape is mapped must be decided once.

## Feasibility
**VERDICT: GO**
Basis: the repo is an Angular 19 standalone application with a bootstrapped root component and a `development` build configuration, so the build acceptance criterion is achievable. The contract is attached, so no shape is guessed.
Data flow: host store (petclinic-angular-demo, unchanged, read as-is from the attachment) → browser event and host global object → host bridge service (this repo) → visits panel (this repo) → app shell (this repo).
Note (not a blocker): the attached store files import NgRx and two host files that are not attached (a visit model and a visit service). Only the bridge types, the event constant, the status-count type and the visit-status definitions are needed here, so those imports are not copied.
