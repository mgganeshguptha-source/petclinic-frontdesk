# Design — PC-104: Visits by status panel (host bridge)

**Source:** visits-status-panel-context-261102-141445.md
**Design required because:** introduces a cross-application read channel (a `window` global and a browser event published by petclinic-angular-demo), a pattern this repo does not yet use, and a typed `window` extension. The contract mapping point must be decided once.

## 1. Existing system

- `src/app/app.component.ts` — standalone `AppComponent` (`app-root`), `imports: []`, no router.
- `src/app/app.component.html` — `<main class="frontdesk">` with `<h1>Petclinic front desk</h1>` and a comment reserving the place for panels.
- `src/app/app.config.ts` — `provideZoneChangeDetection({ eventCoalescing: true })` only. No `provideHttpClient`, no router, no NgRx.
- No `window` declarations, no host bridge, no `src/app/host-bridge/` folder exists yet.
- Upstream (read-only, not copied as a folder): `store/visits/visits-bridge.ts` defines `VISITS_BRIDGE_EVENT`, `VisitsBridgeVisit`, `VisitsBridgeState`, and publishes `window.petclinicHost.visits` plus a `CustomEvent` with `detail` = state. `store/visits/visits.selectors.ts` defines `VisitStatusCounts = Record<VisitStatus, number> & { notSet: number }`. `visits/visit-status.ts` defines `VisitStatus` and `VISIT_STATUS_LABELS`.
- Closest precedent: none. This is the first consumer of the bridge and the first `window` extension.

Must not break: the existing page heading and the app bootstrap (`main.ts`, `app.config.ts`) must stay as they are.

## 2. Approach

Three new pieces under `src/app/`, plus a shell change:

1. A **contract file** that holds exactly the copied types, the status labels, and the event-name constant, with the NgRx-dependent code (`startVisitsBridge`, selectors, `Store` import) left behind. It also declares the typed `window.petclinicHost` shape.
2. A **`HostBridgeService`** (root-provided) that owns one `BehaviorSubject` holding the latest bridge value. It seeds from `window.petclinicHost.visits` and keeps one `window` listener for the bridge event, which it removes on destroy. It exposes the subject as a read-only Observable.
3. A **`VisitsStatusPanelComponent`** (OnPush, standalone) that maps the bridge value to a single view model discriminated union (waiting / loading / error / ready). Sorting and filtering of scheduled visits is a pure function in a sibling file, so the component template only renders.
4. **`AppComponent`** imports the panel and renders `<app-visits-status-panel />` under the heading.

Data flow: host store → `window.petclinicHost.visits` + `petclinic-host:visits` → `HostBridgeService` → panel view model (async pipe) → template.

## 3. Decisions

### D1 — Representation of "host has not published"
**Serves:** AC-2, AC-28, AC-29
**Chosen:** the service's observable emits `null` when there is no published value; the panel renders this as "Waiting for the clinic app…".
**Why:** "not available" is a normal state at startup, not a failure. Modelling it as a value keeps the stream alive and lets the panel decide the text in one place.
**Alternatives considered:**
- Emit an error notification on the observable — rejected: an error terminates an RxJS stream, and AC-29 forbids throwing; the next publish would be lost.
- A separate `available: boolean` flag alongside the state — rejected: two sources of truth that can disagree; `null` already encodes it.
**Trade-off:** every consumer must handle `null`. Accepted: there is one consumer and the panel is the only place that renders it.

### D2 — Typing the `window` global without `any`
**Serves:** AC-7, AC-8, AC-9, AC-29
**Chosen:** a TypeScript global augmentation in the contract file: `declare global { interface Window { petclinicHost?: { visits?: VisitsBridgeState } } }`. Reads use optional chaining.
**Why:** the constraint forbids casting to `any`. Declaration merging gives typed access everywhere, and the optional members encode the "host may not have published" case in the type system (AC-29).
**Alternatives considered:**
- Local cast `(window as Window & { petclinicHost?: ... })` at each read — rejected: repeated casts in two places (service and tests) and the type is not visible to other files that might later read the global.
- Copy the host's `(window as any).petclinicHost` pattern — rejected: explicitly forbidden by the story's constraints and removes compile-time checking of AC-8.
**Trade-off:** the augmentation is global for the whole compilation unit. Accepted: the app has no other `petclinicHost` declaration, and the host repo is not compiled here.

### D3 — Copying the contract without NgRx
**Serves:** AC-7, AC-8, AC-10
**Chosen:** a single file `src/app/host-bridge/visits-bridge.contract.ts` containing `VisitStatus`, `VISIT_STATUS_LABELS`, `VisitStatusCounts`, `VisitsBridgeVisit`, `VisitsBridgeState`, `VISITS_BRIDGE_EVENT` and the `Window` augmentation. Field names and types are identical to the attachments. A header comment names the source (PC-103 host, PC-104 attachments) and says it must be re-synced when the host changes.
**Why:** the attachments import NgRx and the reducer. Copying them verbatim would pull `@ngrx/store` into this app, which AC-10 forbids. Two files (`visit-status.ts` and `visits-bridge.contract.ts`) would mirror the upstream layout more closely, but a single file keeps the contract in one place for review.
**Alternatives considered:**
- Copy the store folder as-is and remove unused code — rejected: leaves dead imports and an NgRx dependency the build would need.
- Add `@ngrx/store` and use the real selectors — rejected: out of scope and forbidden (AC-10).
- Import the contract from the host repo via a path or package — rejected: module federation is out of scope and no package exists.
**Trade-off:** the copy can drift silently from the host. Accepted for this story; the header comment and the re-sync note are the mitigation.

### D4 — Subscribing to the bridge: one listener in the service, removed on destroy
**Serves:** AC-1, AC-3, AC-4, AC-5, AC-6
**Chosen:** the service constructor adds one `window` listener for `VISITS_BRIDGE_EVENT` and reads the current value; `ngOnDestroy` removes the listener and completes the subject. The listener reads `(event as CustomEvent<VisitsBridgeState>).detail` and pushes it into the subject.
**Why:** one listener shared by all subscribers is simpler to reason about than one per subscription, and it matches AC-5 literally: the service removes its own listener when the service is destroyed.
**Alternatives considered:**
- Per-subscription listener inside `new Observable(...)` teardown — rejected: AC-5 is about the service being destroyed, and the teardown would depend on every subscriber unsubscribing.
- Reading `window.petclinicHost.visits` inside the listener instead of `detail` — rejected: `detail` is the state the bridge publishes with the event (AC-3 says "emit the new state"); both are the same value, and `detail` avoids a second global read.
- Lazy listener attached on first subscribe — rejected: adds state to the service for no visible gain; the listener is cheap.
**Trade-off:** the listener is attached as soon as the service is constructed, even if no subscriber exists yet. Accepted: the service is constructed by the panel that immediately subscribes.

Ordering detail: the listener is registered before the initial read. Both are synchronous on the same task, so no publish can fall between them.

### D5 — Where the display rules live
**Serves:** AC-16, AC-17, AC-22, AC-23, AC-24, AC-25, AC-26, AC-27, AC-28
**Chosen:** the panel component maps the bridge value into a view model union `{ kind: 'waiting' } | { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; counts; scheduled }` with precedence: null → waiting; `loading` → loading; `error` set → error; otherwise → ready. The scheduled list is built by a pure function `sortScheduledVisits(visits)` in `src/app/host-bridge/scheduled-visits.ts`.
**Why:** the precedence rules are the most defect-prone part of the story and are easiest to read as one `switch`-like mapping, not spread across `*ngIf` chains in the template. The template then only renders the discriminated union.
**Alternatives considered:**
- Template `@if` chains on `bridge.loading`, `bridge.error`, etc. — rejected: precedence is implicit and the conventions forbid logic in templates beyond simple expressions.
- Sorting and filtering inside `HostBridgeService` — rejected: the service should expose the bridge state unchanged (AC-6, AC-8); presentation rules belong to the panel.
**Trade-off:** the view-model mapping sits in the component file rather than a service. Accepted: it is presentation logic with no I/O, and the pure sorting function is separately testable later.

### D6 — Sorting without mutating the bridge value
**Serves:** AC-22, AC-23, AC-24, AC-32
**Chosen:** `sortScheduledVisits` first filters to `status === 'SCHEDULED'` into a new array, then sorts that copy with this comparator:
1. A visit with a non-empty `date` comes before one without.
2. Two dated visits: `a.date < b.date` (plain string comparison), then `a.id - b.id` on equal dates.
3. Two undated visits: `a.id - b.id`.
**Why:** the bridge value is shared with the host and the panel's change detection depends on references. `Array.prototype.sort` mutates in place, so sorting the bridge's `visits` array would alter the host's published state.
**Alternatives considered:**
- Sort `state.visits` in place — rejected: mutates shared data and breaks AC-16's "counts come from the bridge" assumption if the order changed under the host.
- Parse dates into `Date` objects — rejected: the story says plain string comparison (AC-22) and the format is fixed `yyyy-mm-dd`, so parsing adds failure modes without changing the order.
**Trade-off:** a malformed date such as `2026-1-5` sorts incorrectly as a string. Accepted: the upstream format is `format: date`, and the story does not ask for validation.

### D7 — Pet and date text
**Serves:** AC-18, AC-19, AC-20
**Chosen:** the template renders `{{ visit.date }}` unchanged and `Pet {{ visit.petId }}` when `petId` is present, else `Pet: not set`. "Present" is tested as `petId !== undefined && petId !== null`.
**Why:** a null check is required because the type says `undefined` but the value comes from another app at runtime; a `!== undefined` test alone would render "Pet null".
**Alternatives considered:**
- Precompute the display string in the view model — rejected: trivial expression, and keeping it in the template makes AC-18's "unchanged" visible at the point of rendering.
- `[innerHTML]` — rejected: forbidden, and not needed; interpolation escapes.
**Trade-off:** the null check is slightly redundant against the declared type. Accepted, because the bridge is an untrusted boundary at runtime.

### D8 — Shell integration
**Serves:** AC-30, AC-33
**Chosen:** `AppComponent` adds `VisitsStatusPanelComponent` to its `imports` array and `<app-visits-status-panel />` under the existing `<h1>`. The reserved comment in the template is replaced by the element. No CSS file is added for the panel; styling is plain HTML.
**Why:** the story requires the panel in the shell and forbids styling beyond plain HTML.
**Alternatives considered:**
- A router route with `loadComponent` — rejected: no router is configured and the story asks for the shell to show the panel directly.
- Rendering the panel from `main.ts` via `createComponent` — rejected: bypasses the component model used by `AppComponent`.
**Trade-off:** the shell now depends on the panel's selector. Accepted; the shell is the only place panels are placed.

### D9 — Change detection and subscriptions
**Serves:** AC-5, AC-33
**Chosen:** `VisitsStatusPanelComponent` uses `ChangeDetectionStrategy.OnPush` and reads the view model through `async` pipe; it has no manual `subscribe()`. Teardown of the window listener is owned by the service's `ngOnDestroy`.
**Why:** matches the repo's conventions (OnPush for new components, async pipe over manual subscribe).
**Alternatives considered:**
- Manual `subscribe` with `takeUntilDestroyed()` in the component — rejected: adds a teardown path the async pipe already provides.
**Trade-off:** the view model must be a stable observable (created once in the component field) to avoid re-subscribing on each change detection. Accepted: it is built in the constructor.

## 4. Contract changes

No HTTP contract changes. No REST calls (AC-11). No change in the host repository.

New TypeScript contract (copied from the attachments, same names and fields, in `src/app/host-bridge/visits-bridge.contract.ts`):

    type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    const VISIT_STATUS_LABELS: Readonly<Record<VisitStatus, string>>;
    type VisitStatusCounts = Record<VisitStatus, number> & { notSet: number };
    interface VisitsBridgeVisit { id: number; date: string; status: VisitStatus | null | undefined; petId: number | undefined; }
    interface VisitsBridgeState { visits: VisitsBridgeVisit[]; statusCounts: VisitStatusCounts; loading: boolean; error: string | null; }
    const VISITS_BRIDGE_EVENT = 'petclinic-host:visits';
    declare global { interface Window { petclinicHost?: { visits?: VisitsBridgeState }; } }

New service surface (signatures only):

    class HostBridgeService implements OnDestroy {
      readonly state$: Observable<VisitsBridgeState | null>;
      ngOnDestroy(): void;
    }

New pure function (signature only):

    function sortScheduledVisits(visits: readonly VisitsBridgeVisit[]): VisitsBridgeVisit[];

Backward compatibility: none required; no existing consumers of this app's code.

## 5. Data & state

Not applicable — this app persists nothing and owns no entities. The only state is the service's in-memory `BehaviorSubject` holding the latest bridge value, which is replaced on each event. The host owns the visits data.

## 6. Impact

**Expected to change:**
- `src/app/host-bridge/visits-bridge.contract.ts` (new) — copied contract and `Window` augmentation
- `src/app/host-bridge/host-bridge.service.ts` (new) — `HostBridgeService`
- `src/app/host-bridge/scheduled-visits.ts` (new) — `sortScheduledVisits`
- `src/app/visits-status/visits-status-panel.component.ts` and `.html` (new) — the panel
- `src/app/app.component.ts` — add the panel to `imports`
- `src/app/app.component.html` — render `<app-visits-status-panel />`, replace the placeholder comment

**Explicitly unchanged:**
- `src/app/app.config.ts` — no `provideHttpClient`, no router, no NgRx
- `src/main.ts`, `package.json`, `angular.json` — no new dependencies
- The `store/` and `visits/` attachments are not copied as folders into the repo
- The host application and its `startVisitsBridge` code
- The existing page heading in `app.component.html`

## 7. Risks

- **Contract drift.** The copied types can diverge from the host without a compile error here. Mitigation: header comment in the contract file naming the source and the re-sync rule.
- **Spoofed events.** Any script on the page can dispatch `petclinic-host:visits` with an arbitrary `detail`. The panel renders only text via interpolation (no `innerHTML`), so the impact is limited to misleading counts. No validation is added, per AC-9.
- **Global type augmentation** affects the whole compilation unit. Low risk while no other code declares `petclinicHost`.
- **Malformed dates** sort as strings and may appear out of order (see D6).
- **Verification gap.** The repo runs build-only (AC-31). Behaviour criteria (AC-17 to AC-27) are verified by code review against the design, not by automated tests. Unit tests are out of scope.
- **Listener attached before any subscriber** (D4). Negligible cost; noted for completeness.

## 8. Open questions

None.
