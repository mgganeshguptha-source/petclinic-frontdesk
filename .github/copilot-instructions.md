# Copilot Instructions — petclinic-frontdesk (Angular Web)

## Repository Overview

- Purpose: Front desk web application for the Petclinic system. The home page is titled "Petclinic front desk"; feature panels are added story by story (example noted in source: PC-104, visits by status).
  [TODO — MUST COMPLETE]: One-paragraph description of what this app does for clinic staff and who its primary users are. Needed so Copilot understands domain context. Not discoverable from code.
- Tech Stack (from package.json): Angular 19 (`@angular/*` ^19.2.0), TypeScript ~5.7, RxJS ~7.8, zone.js ~0.15, Karma + Jasmine for tests (`@types/jasmine`, `jasmine-core`, `karma-jasmine`), Angular CLI / `@angular-devkit/build-angular` for build and serve.
- Architecture: Standalone bootstrap (`bootstrapApplication(AppComponent, appConfig)` in `src/main.ts`). Providers are configured in `src/app/app.config.ts` with zone change detection and event coalescing. No NgModules and no routes file exist yet.
- Source root: `src/`. App code lives under `src/app/`. Build output: `dist/petclinic-frontdesk`. Static assets: `public/`.

## Application Structure

- Currently a single root component (`src/app/app.component.*`, selector `app-root`) with no router outlet, feature folders, or shared/core split yet.
- Feature panels are expected to be added as standalone components under `src/app/` as stories land. Keep feature code grouped per feature rather than in one growing root component.
- Routing: [TODO — MUST COMPLETE]: Confirm whether the app will use lazy-loaded feature routes (`provideRouter` with `loadComponent`) or a single page with panels. No router is configured today.
- State management: [TODO — MUST COMPLETE]: Confirm the approach (services with RxJS `BehaviorSubject`, Angular signals, or NgRx). No state library is currently a dependency. Do not introduce one without agreement.

## API Integration Conventions

- No HTTP layer is configured yet: `app.config.ts` does not call `provideHttpClient`. When adding it, register it in `app.config.ts` and use `HttpClient` from `@angular/common/http`, not raw `fetch`, so XSRF handling and interceptors apply.
- Put one injectable service per backend resource under `src/app/` and return typed responses (no `any`).
- Environment configuration: [TODO — MUST COMPLETE]: Name of the backend base URL source (no `environments/` folder exists in the repo today) and how it differs between dev and production builds.
- Auth token attachment and error-handling interceptors: [TODO — MUST COMPLETE]: Auth provider and how tokens are attached to requests. Not visible in code yet.

## Security Guidelines

- Never call `bypassSecurityTrustHtml`, `bypassSecurityTrustUrl`, or similar APIs without a documented justification in code.
- Never interpolate untrusted HTML via `[innerHTML]` without Angular sanitization. Prefer text interpolation.
- Use `HttpClient` for all state-changing calls so Angular's built-in XSRF support applies.
- Do not store auth tokens in `localStorage` or `sessionStorage` without a documented decision.
- [TODO — MUST COMPLETE]: Project-specific security items: authentication and authorization model, token storage decision, Content Security Policy, and whether this app handles protected health or personal data (if so, apply the HIPAA guardrails in `.github/instructions/hipaa-guardrails.instructions.md`).

## Design Patterns

- Standalone components only. Do not add NgModules for new code.
- Use the `async` pipe or explicit subscription management. Every manual `subscribe()` needs a teardown (`takeUntilDestroyed()` or an equivalent).
- Use `ChangeDetectionStrategy.OnPush` for new components.
- Reactive forms are the preferred form approach for multi-field input. [TODO — MUST COMPLETE]: Confirm this, since no forms are implemented yet.
- Smart/presentational split: [TODO — MUST COMPLETE]: Confirm whether feature containers should delegate data loading to services and keep presentational components input/output only.

## Unique Patterns For This Project

- [TODO — MUST COMPLETE]: Project-specific rules an AI would not infer from code: i18n strategy (Angular i18n or ngx-translate), feature flag mechanism, accessibility baseline (WCAG level targeted, ARIA expectations), date/time and locale handling for clinic schedules, and theming. These are the most common source of defects when missed.
- Story references: commit and code comments reference story IDs (for example PC-104). Keep story IDs in commit messages and PR descriptions.

## What To Avoid

- Business logic or HTTP calls inside components. Put them in services.
- Manual `subscribe()` without teardown, and nested subscriptions. Use operators such as `switchMap` or `combineLatest`.
- `any` types, including for API responses. Define interfaces for every payload.
- Default change detection for new components (use OnPush).
- Logic in templates beyond simple expressions.
- Disabling the TypeScript strict checks or Angular template type checking to silence errors.
- Adding third-party UI or state libraries without agreement. The current dependency set is intentionally minimal.

## Documentation Requirements

- Public services and shared components get JSDoc describing purpose, inputs/outputs, and error behavior. No Compodoc setup exists in the repo today.
- Update the README (or a feature doc) when adding a run, build, or environment step.
- Build and test commands are defined in `package.json`: `npm start` (serve), `npm run build`, `npm run watch`, `npm test` (Karma). Keep these working when changing configuration.
- [TODO — MUST COMPLETE]: Team expectations for documentation, such as required README sections, ADR practice, or story-to-doc linkage. Not visible in code.
