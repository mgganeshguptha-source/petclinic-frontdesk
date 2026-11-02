# Plan for: Front-desk panel showing visits by status, read from the host app's shared store (PC-104)

**Source:** visits-status-panel-context-261102-141445.md (newest context file, CI mode) + .github/copilot-instructions.md
**Stack:** Angular frontend only (Angular 19 standalone, TypeScript strict, RxJS). No backend, no REST calls.
**Total steps:** 9
**Unresolved clarifications:** None

---

## Acceptance criteria coverage

Coverage uses the context file's ids (AC-1 … AC-33). The story's AC1–AC7 are groupings of these and are not renumbered here.

| AC | Criterion (abbreviated) | Covered by |
|---|---|---|
| AC-1 | Service reads `window.petclinicHost.visits` on start | Step 3 |
| AC-2 | Undefined visits → "not available" | Step 3 |
| AC-3 | Bridge event emits new `VisitsBridgeState` | Step 3 |
| AC-4 | Listens only to `VISITS_BRIDGE_EVENT` | Step 2, Step 3 |
| AC-5 | Service removes window listener on destroy | Step 3 |
| AC-6 | Bridge state exposed as Observable | Step 3 |
| AC-7 | Contract types/constant identical to attachments | Step 2 |
| AC-8 | No field read outside the contract | Step 5 (panel reads only contract fields); Step 9 |
| AC-9 | Only `VisitsBridgeState` shape, no fallback | Step 2, Step 3 |
| AC-10 | No NgRx or state library | Step 2 (no imports from `@ngrx`; no package added in Step 7) |
| AC-11 | No REST API calls | No step required — no HTTP code is written. Verified in Step 9. |
| AC-12 | "Scheduled" line from `statusCounts.SCHEDULED` | Step 5 |
| AC-13 | "Completed" line from `statusCounts.COMPLETED` | Step 5 |
| AC-14 | "Cancelled" line from `statusCounts.CANCELLED` | Step 5 |
| AC-15 | "Not set" line from `statusCounts.notSet` | Step 5 |
| AC-16 | Counts not recomputed from `visits` | Step 5 |
| AC-17 | List only `SCHEDULED` visits | Step 4 |
| AC-18 | Show `date` string unchanged | Step 4 (selection), Step 5 (render) |
| AC-19 | Pet text "Pet <petId>" | Step 5 |
| AC-20 | Missing `petId` → "Pet: not set" | Step 5 |
| AC-21 | No scheduled → "No scheduled visits." | Step 5 |
| AC-22 | Sort by `date` ascending, plain string compare | Step 4 |
| AC-23 | Missing/empty `date` sorted last | Step 4 |
| AC-24 | Ties ordered by `id` ascending | Step 4 |
| AC-25 | `loading` → only "Loading visits…" | Step 4 (view model), Step 5 (render) |
| AC-26 | `error` set (loading false) → only error text | Step 4, Step 5 |
| AC-27 | Counts and list shown only when no loading/error | Step 4, Step 5 |
| AC-28 | Not published → "Waiting for the clinic app…" | Step 3, Step 4, Step 5 |
| AC-29 | No throw when `window.petclinicHost` / `visits` undefined | Step 3, Step 5 |
| AC-30 | Shell renders "Visits by status" panel | Step 6 |
| AC-31 | `npm install` + `npx ng build --configuration development` passes | Step 7 |
| AC-32 | Never list COMPLETED, CANCELLED or missing status | Step 4 |
| AC-33 | Plain HTML only, no styling | Step 5 (template and CSS kept plain); verified in Step 9 |

---

## Before you execute any step

1. Keep the context file in the session context throughout execution.
2. `.github/copilot-instructions.md` applies to all generated code.
3. Execute steps in order. Do not add NgRx, NgModules, HttpClient or any dependency.
4. Record the confirmed file set in the Impacted Files block after Step 1.

---

## Pre-flight

1. **Stack assumption.** Angular 19 standalone components only (no NgModules), `app.config.ts` unchanged (zone change detection, no HttpClient, no router). Feature panels are standalone components under `src/app/`. This app only reads the host's bridge and never calls the REST API.
2. **Behaviour preservation.** The existing shell heading "Petclinic front desk" in `app.component.html` is kept. The `app-root` selector and `AppComponent.title` are unchanged. No existing behaviour is removed.
3. **Non-functional handling.** None stated in the story. No latency, bundle or accessibility target is set. Nothing to verify beyond the build.
4. **Assumed criteria.** No assumed criteria. No criterion is marked `[ASSUMED]`.
5. **Design decisions taken in this plan** (developer may override before Step 3):
   - **D1 — Not-available representation.** `HostBridgeService` emits a discriminated union `HostBridgeReading`: `{available: false}` when `window.petclinicHost?.visits` is undefined, otherwise `{available: true, state: VisitsBridgeState}`. The panel maps `{available: false}` to "Waiting for the clinic app…" (AC-2, AC-28).
   - **D2 — Listener lifecycle.** The service adds the `window` listener in its constructor, then emits the current value. It removes the listener and completes its subject in `ngOnDestroy` (AC-5). The listener is added before the current value is read, so an event fired in between is not missed.
   - **D3 — Where logic lives.** The filter, sort and loading/error precedence are pure functions in `src/app/visits-by-status/visits-panel-view.ts`. The component only maps the service stream with `map` and renders with `async`. This keeps the component thin and the logic reviewable.
   - **D4 — Event detail.** The event `detail` is passed through as `VisitsBridgeState`. There is no alternative-shape handling (AC-9). A missing `detail` is treated as "not available", not as another shape.
   - **D5 — Shape copy.** Only the interfaces, the `VISITS_BRIDGE_EVENT` constant and the `VisitStatusCounts` type are copied. `startVisitsBridge`, the selectors, the reducer, actions and effects are NOT copied. They import `@ngrx/store` and the reducer, which this app does not have (AC-10). The attachments `02-…actions.ts`, `03-…effects.ts` and `04-…reducer.ts` are not used.
   - **D6 — Window typing.** `window.petclinicHost` is typed via `declare global { interface Window { … } }` in the types file. No `any` cast (context constraint).

---

## Impacted Files

| ID | Path | Role |
|----|------|------|
| F1 | `src/app/visits/visit-status.ts` | NEW. Verbatim copy of attachment `06-visits_visit-status.ts`. Keeps the same relative path the bridge types import (`../visits/visit-status`). |
| F2 | `src/app/host-bridge/visits-bridge.types.ts` | NEW. Contract copy: `VISITS_BRIDGE_EVENT`, `VisitsBridgeVisit`, `VisitsBridgeState`, `VisitStatusCounts`, and the `Window.petclinicHost` declaration. No NgRx or rxjs imports. |
| F3 | `src/app/host-bridge/host-bridge.service.ts` | NEW. `HostBridgeService` and `HostBridgeReading` (D1, D2). |
| F4 | `src/app/visits-by-status/visits-panel-view.ts` | NEW. Pure functions: `toPanelView`, `scheduledVisitsSorted`, `VisitsPanelView` type. |
| F5 | `src/app/visits-by-status/visits-by-status-panel.component.ts` | NEW. Standalone `app-visits-by-status-panel`, `OnPush`, injects `HostBridgeService`. |
| F6 | `src/app/visits-by-status/visits-by-status-panel.component.html` | NEW. Plain-HTML template for states, counts and list. |
| F7 | `src/app/visits-by-status/visits-by-status-panel.component.css` | NEW. Empty stylesheet (plain HTML only, AC-33). |
| F8 | `src/app/app.component.ts` | CHANGED. Add the panel to `imports`. |
| F9 | `src/app/app.component.html` | CHANGED. Replace the placeholder comment with `<app-visits-by-status-panel />`. |

> Not touched: `src/app/app.config.ts`, `package.json`, `angular.json`, `src/main.ts`.
> Not copied: the NgRx store files (`store/visits/*.ts` other than the bridge types, selectors and reducer).

## Signature changes

None — no existing public or interface method changes signature. `AppComponent` only gains an `imports` entry.

## Contract usage

| Contract (attached file) | Element | Shape used | Read or written by |
|----------|---------|------------|------------------------------|
| visits-bridge.ts | `window.petclinicHost.visits` | `VisitsBridgeState \| undefined` | F3 (read on start) |
| visits-bridge.ts | event `VISITS_BRIDGE_EVENT` (`petclinic-host:visits`) | `CustomEvent<VisitsBridgeState>`, `detail` | F3 (listen) |
| visits-bridge.ts | `VisitsBridgeState.visits` | `VisitsBridgeVisit[]` | F4 (scheduled list) |
| visits-bridge.ts | `VisitsBridgeState.statusCounts` | `VisitStatusCounts` | F6 (counts) |
| visits-bridge.ts | `VisitsBridgeState.loading`, `.error` | `boolean`, `string \| null` | F4 (precedence), F6 |
| visits-bridge.ts | `VisitsBridgeVisit.id`, `.date`, `.status`, `.petId` | `number`, `string`, `VisitStatus \| null \| undefined`, `number \| undefined` | F4 (filter, sort), F6 (render) |
| visit-status.ts | `VisitStatus`, `VISIT_STATUS_LABELS` | `'SCHEDULED' \| 'COMPLETED' \| 'CANCELLED'` | F2 (type), F4 (filter) |

Only one shape per element. The bridge is mapped to view types in one place (F4 via F3). Components never read the raw window value.

---

## Step 1 — Confirm the file set

**Goal:** Check the project layout (`package.json`, `angular.json`, existing `src/app/` files, no existing `host-bridge` or `visits-by-status` folders) and confirm or amend the Impacted Files table. Do not write code.
**Implements:** — (enabling step, no AC)
**Depends on:** —

**Suggested prompt:**

> Using visits-status-panel-context-261102-141445.md and .github/copilot-instructions.md, confirm the file set for this story. Start from the Impacted Files list F1–F9 in .harness/prompt-steps.md. Check that package.json and angular.json exist and that `ng build --configuration development` is defined. Check that no NgRx packages are declared as dependencies and that `src/app/host-bridge/` and `src/app/visits-by-status/` do not exist yet. Also check for non-code files this change needs (none expected). Add any file that is genuinely required with a new ID (F10 onward). Do not renumber. Do not propose edits.

**Review checkpoint:** Confirm the list F1–F9 is complete and each path is under `src/app/`. Confirm no NgRx dependency is needed. If the build command is missing from `angular.json`, stop and report it (AC-31 would be unverifiable).

---

## Step 2 — Copy the contract types

**Goal:** Create F1 and F2 as contract copies with no behaviour.
**Implements:** AC-4 (event constant), AC-7 (types match attachments), AC-9 (only `VisitsBridgeState` shape), AC-10 (no state library import)
**Depends on:** Step 1

**Suggested prompt:**

> Create F1 `src/app/visits/visit-status.ts` as an exact copy of attachment `06-visits_visit-status.ts` (`VisitStatus` type and `VISIT_STATUS_LABELS`). Create F2 `src/app/host-bridge/visits-bridge.types.ts` containing only:
> - `export const VISITS_BRIDGE_EVENT = 'petclinic-host:visits';`
> - `export interface VisitsBridgeVisit { id: number; date: string; status: VisitStatus | null | undefined; petId: number | undefined; }`
> - `export interface VisitsBridgeState { visits: VisitsBridgeVisit[]; statusCounts: VisitStatusCounts; loading: boolean; error: string | null; }`
> - `export type VisitStatusCounts = Record<VisitStatus, number> & { notSet: number };` (copied from `05-store_visits_visits.selectors.ts`)
> - `import {VisitStatus} from '../visits/visit-status';`
> - `declare global { interface Window { petclinicHost?: { visits?: VisitsBridgeState }; } }` with `export {};` only if needed.
>
> Do NOT copy `startVisitsBridge`, the selectors, the reducer, actions or effects. Do NOT import `@ngrx/store`, `rxjs` or any state library. Do NOT add fields that are not in the attachment. Do not use `any`.

**Review checkpoint:** Diff F2 against `01-store_visits_visits-bridge.ts` and `05-store_visits_visits.selectors.ts`. Names, field names, types, optionality and the event string must be identical. The file has no `@ngrx` or `rxjs` import. No `any` appears. If anything differs, fix F2, do not adapt the shape.

---

## Step 3 — Implement HostBridgeService

**Goal:** Create F3 with the bridge reading, listener lifecycle and Observable (decisions D1, D2, D4).
**Implements:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-9, AC-28 (service half), AC-29 (service half)
**Depends on:** Step 2

**Suggested prompt:**

> Create F3 `src/app/host-bridge/host-bridge.service.ts`. Implement:
>
> ```ts
> export type HostBridgeReading =
>   | { available: false }
>   | { available: true; state: VisitsBridgeState };
>
> @Injectable({providedIn: 'root'})
> export class HostBridgeService implements OnDestroy {
>   private readonly subject = new BehaviorSubject<HostBridgeReading>({available: false});
>   readonly state$: Observable<HostBridgeReading> = this.subject.asObservable();
>   private readonly onBridgeEvent = (event: Event): void => {
>     const detail = (event as CustomEvent<VisitsBridgeState>).detail;
>     this.subject.next(detail ? {available: true, state: detail} : {available: false});
>   };
>   constructor() {
>     window.addEventListener(VISITS_BRIDGE_EVENT, this.onBridgeEvent);
>     const current = window.petclinicHost?.visits;
>     this.subject.next(current ? {available: true, state: current} : {available: false});
>   }
>   ngOnDestroy(): void {
>     window.removeEventListener(VISITS_BRIDGE_EVENT, this.onBridgeEvent);
>     this.subject.complete();
>   }
> }
> ```
>
> Add JSDoc for the class: purpose, emitted value, error behaviour (never throws on a missing host value). Import `VISITS_BRIDGE_EVENT` and `VisitsBridgeState` from `./visits-bridge.types`. Do not read any other field. Do not add a fallback for another payload shape. Do not modify F2 or any other file.

**Review checkpoint:** Confirm the listener is added in the constructor and removed in `ngOnDestroy` with the same function reference. Confirm the event name is only `VISITS_BRIDGE_EVENT`. Confirm there is no `any` and no branch for a different payload shape. If the `Window` declaration is missing from F2, return to Step 2.

---

## Step 4 — Derive the view model (pure functions)

**Goal:** Create F4 with the scheduled filter, the date/id sort and the state precedence (decision D3).
**Implements:** AC-17, AC-18 (selection keeps the string unchanged), AC-22, AC-23, AC-24, AC-25, AC-26, AC-27, AC-28 (view half), AC-32
**Depends on:** Step 2, Step 3

**Suggested prompt:**

> Create F4 `src/app/visits-by-status/visits-panel-view.ts` with pure, exported functions and types (no Angular imports):
>
> ```ts
> export type VisitsPanelView =
>   | {kind: 'waiting'}
>   | {kind: 'loading'}
>   | {kind: 'error'; message: string}
>   | {kind: 'ready'; counts: VisitStatusCounts; scheduled: VisitsBridgeVisit[]};
>
> export function toPanelView(reading: HostBridgeReading): VisitsPanelView;
> export function scheduledVisitsSorted(visits: VisitsBridgeVisit[]): VisitsBridgeVisit[];
> ```
>
> Rules:
> - `toPanelView`: if `!reading.available` → `waiting`. Else if `state.loading` → `loading`. Else if `state.error !== null` → `error` with `message: state.error`. Else → `ready` with `counts: state.statusCounts` (not recomputed) and `scheduled: scheduledVisitsSorted(state.visits)`.
> - `scheduledVisitsSorted`: keep only `status === 'SCHEDULED'`. Sort with: visits with a non-empty `date` before those without (`!!date`); then `date` by plain `<` / `>` string comparison; then `id` ascending. Use `(a.date ?? '')` for the comparison so a missing date does not throw. Return a new array; do not mutate the input.
> - Import `HostBridgeReading` from `../host-bridge/host-bridge.service`, types from `../host-bridge/visits-bridge.types`.
>
> Only comment non-obvious sort precedence. Do not modify other files.

**Review checkpoint:** Confirm: only `'SCHEDULED'` passes the filter (AC-17, AC-32); missing or empty date sorts last (AC-23); equal dates and two undated visits fall back to `id` ascending (AC-24); loading is checked before error (AC-25, AC-26); counts come straight from `statusCounts` (AC-16). `scheduledVisitsSorted` does not mutate its input.

---

## Step 5 — Build the panel component

**Goal:** Create F5, F6 and F7 for the "Visits by status" panel with plain HTML (AC-33).
**Implements:** AC-8, AC-12, AC-13, AC-14, AC-15, AC-16, AC-18, AC-19, AC-20, AC-21, AC-25, AC-26, AC-27, AC-28, AC-29, AC-33
**Depends on:** Step 3, Step 4

**Suggested prompt:**

> Create F5 `src/app/visits-by-status/visits-by-status-panel.component.ts`: standalone component, selector `app-visits-by-status-panel`, `changeDetection: ChangeDetectionStrategy.OnPush`, `templateUrl` F6, `styleUrl` F7. Inject `HostBridgeService` with `private readonly`. Expose `readonly view$ = inject(HostBridgeService).state$.pipe(map(toPanelView));` (import `map` from `rxjs`). No subscriptions in the component. No other logic.
>
> Create F6 `visits-by-status-panel.component.html` (plain HTML, no styling classes beyond none) with `@if` / `@for` on `view$ | async`:
> - `waiting` → `<p>Waiting for the clinic app…</p>` only
> - `loading` → `<p>Loading visits…</p>` only
> - `error` → `<p>{{ view.message }}</p>` only
> - `ready` → heading "Visits by status"; a list with exactly four lines in this order: `Scheduled: {{ counts.SCHEDULED }}`, `Completed: {{ counts.COMPLETED }}`, `Cancelled: {{ counts.CANCELLED }}`, `Not set: {{ counts.notSet }}`; then the scheduled list: if `scheduled` is empty → `<p>No scheduled visits.</p>`; else an `<ul>` with `@for (visit of scheduled; track visit.id)` rendering `{{ visit.date }}` and pet text `@if (visit.petId !== undefined) { Pet {{ visit.petId }} } @else { Pet: not set }`.
>
> The heading "Visits by status" appears in the `ready` state only, so the loading, error and waiting states show only their text. Do not add `[innerHTML]`. Do not add computed counts in the template.
>
> Create F7 as an empty stylesheet (no rules).
>
> Only comment non-obvious template logic. Do not modify other files.

**Review checkpoint:** Confirm each of the four states renders only its own text (AC-25 to AC-28). Confirm labels read exactly "Scheduled", "Completed", "Cancelled", "Not set" (AC-12 to AC-15). Confirm the date renders unchanged (AC-18) and the pet text is "Pet <id>" or "Pet: not set" (AC-19, AC-20). Confirm the template reads only `id`, `date`, `petId`, `status` through the view model (AC-8). The component has `OnPush` and no `subscribe`. The CSS file has no rules (AC-33).

---

## Step 6 — Wire the panel into the app shell

**Goal:** Show the panel from the root component (F8, F9).
**Implements:** AC-30
**Depends on:** Step 5

**Suggested prompt:**

> Edit F8 `src/app/app.component.ts`: import `VisitsByStatusPanelComponent` from `./visits-by-status/visits-by-status-panel.component` and add it to the `imports` array. Keep `title` and the selector unchanged.
>
> Edit F9 `src/app/app.component.html`: keep the `<main class="frontdesk">` and `<h1>Petclinic front desk</h1>`, and replace the placeholder comment with `<app-visits-by-status-panel />`. Do not change `app.component.css`. Do not modify `app.config.ts`.

**Review checkpoint:** Confirm the h1 is kept (Pre-flight behaviour preservation), the panel is rendered inside `<main>`, and `AppComponent` only gained an import.

---

## Step 7 — Build verification

**Goal:** Prove the app compiles with the strict TypeScript and Angular template checks (AC-31).
**Implements:** AC-31
**Depends on:** Step 6

**Suggested prompt:**

> From the repository root, run `npm install` and then `npx ng build --configuration development`. Report the result. If the build fails, report the first errors with file and line, and do not change the contract types (F1, F2) to silence them. Do not disable strict TypeScript or template type checking. Do not add dependencies.

**Review checkpoint:** `npm install` and `npx ng build --configuration development` both exit 0. A failure is a blocker: fix the cause in the affected step's file, not in the contract files, and re-run.

---

## Step 8 — Convention drift review

**Goal:** Check the changed files against `.github/copilot-instructions.md` and the Angular instruction files, and list drift without fixing it automatically.
**Implements:** — (enabling step, no AC)
**Depends on:** Step 7

**Suggested prompt:**

> Review F1–F9 against .github/copilot-instructions.md and the Angular conventions (standalone only, OnPush for new components, no `any`, no manual `subscribe` without teardown, services hold logic, no NgRx). Check comments: only non-obvious code is commented. List drift as file, line and rule. Do not auto-fix.

**Review checkpoint:** Decide per item whether to fix. Expected result: no drift. Each listed item must be resolved or explicitly accepted.

---

## Step 9 — Validation against acceptance criteria

**Goal:** Check each AC id against the running app and the built output. This is manual and involves no Copilot changes.
**Implements:** — (verification step, no AC)
**Depends on:** Step 8

**Suggested prompt:**

> Produce a verification checklist keyed by AC id (AC-1 to AC-33) from visits-status-panel-context-261102-141445.md. For each id, give the concrete check: the file or line to inspect, or the runtime action (e.g. set `window.petclinicHost.visits` in the console, then dispatch `petclinic-host:visits`, and observe the panel). Include AC-11 and AC-33 (no step required) and AC-10 (no NgRx import). Do not run anything; give me the checklist.

**Review checkpoint:** Record pass / fail / unclear per AC id. An unverifiable criterion is `unclear`, not `pass`. If an AC fails, loop back to the step that owns it (see the coverage matrix).

---

## Done criteria

Before opening a PR, confirm:
- `npm install` and `npx ng build --configuration development` pass (AC-31).
- F2 matches attachments `01-…visits-bridge.ts` and `05-…selectors.ts` for the copied names, fields and types, with no NgRx or rxjs imports (AC-7, AC-10).
- No field outside `VisitsBridgeState` / `VisitsBridgeVisit` is read (AC-8, AC-9).
- The service listens only to `VISITS_BRIDGE_EVENT` and removes the listener on destroy (AC-4, AC-5).
- The panel shows counts from `statusCounts`, the scheduled-only sorted list, and the four state messages as specified (AC-12 to AC-29).
- The shell renders the panel and keeps the existing heading (AC-30).
- No REST calls, no NgRx, no new dependencies, no styling beyond plain HTML (AC-11, AC-10, AC-33).
- Commit message includes story ID PC-104 and the Co-authored-by trailer.

---

## --- EXECUTION RECORD (appended by harness) ---
- timestamp: 2026-11-02T14:18:22
- phase: coding
- approved impacted files: ['src/app/app.component.html', 'src/app/app.component.ts', 'src/app/host-bridge/host-bridge.service.ts', 'src/app/host-bridge/visits-bridge.types.ts', 'src/app/visits-by-status/visits-by-status-panel.component.css', 'src/app/visits-by-status/visits-by-status-panel.component.html', 'src/app/visits-by-status/visits-by-status-panel.component.ts', 'src/app/visits-by-status/visits-panel-view.ts', 'src/app/visits/visit-status.ts']
- actually touched: ['src/app/app.component.html', 'src/app/app.component.ts', 'src/app/host-bridge/host-bridge.service.ts', 'src/app/host-bridge/visits-bridge.types.ts', 'src/app/visits-by-status/visits-by-status-panel.component.css', 'src/app/visits-by-status/visits-by-status-panel.component.html', 'src/app/visits-by-status/visits-by-status-panel.component.ts', 'src/app/visits-by-status/visits-panel-view.ts', 'src/app/visits/visit-status.ts']
- scope: matches approved plan (no additions)
- review status: APPROVED by human at 2026-11-02T14:18:22
