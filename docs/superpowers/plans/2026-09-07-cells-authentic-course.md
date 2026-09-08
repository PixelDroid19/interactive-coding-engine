# Authentic Cells course implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline. The repository prohibits unsolicited subagents. Do not create a worktree, deploy, or modify external references. The user's subsequent active goal authorizes progressive verified commits and pushes on the existing branch.

**Goal:** Make the educational workspaces use executable Cells-shaped contracts and compose original components into useful features.

**Architecture:** Keep Lit 3 and the existing public learning runtime. Implement class-based scoped registration and shared styles in that runtime, reuse complete curriculum dependencies, and add a feature whose pages communicate through public properties and events. Do not claim proprietary-runtime equivalence.

**Tech Stack:** TypeScript generators, Lit 3, ScopedElementsMixin, Vite, Vitest, browser contract runner.

**Spec:** User-approved design: original neutral variants, `WidgetMixin(ScopedElementsMixin(LitElement))`, property getters, class-based scoped configuration, shared styles, translations and business events. A data manager is optional and owns external integration, not presentation.

## Global constraints

- External reference repositories are read-only and must never be copied into this repository.
- Keep existing lesson IDs, progress, recorded audio and subtitles stable.
- Spanish learning copy; original neutral names, styles and demo data.
- Verify public behavior, not a single mandatory source spelling.
- The platform itself uses the commands declared in its AGENTS.md. Exported component projects use the educational Cells CLI.

## Task 1: Executable composition contracts

Files: `src/engine/cells/cellsRecipes.ts`, a focused runtime-contract test, `cellsProjectAudit.ts`, curriculum recipe tests.

- [x] Add failing tests that execute generated runtime modules: class mapping by `is`, inherited registrations, invalid classes, configurable dependencies and isolated shared styles.
- [x] Run targeted Vitest tests and confirm the missing behavior fails.
- [x] Implement original helpers; generate `is`, class arrays and shared-style getters in curriculum hosts.
- [x] Accept class-based registration and getter styles in preliminary audits without replacing browser evidence.
- [x] Re-run runtime, recipe, practice and editor suites.

## Task 2: Reuse complete components

Files: `cellsCurriculumRecipes.ts`, `lessonProjects.ts`, recipe integration tests.

- [x] Add regression evidence for missing transitive dependencies and missing child locale resources.
- [x] Replace simplified dependency copies with full generated components, preserving module paths, style pairs and locale catalogs.
- [x] Wire child business events instead of broad click handlers; ensure presentational components contain no data-manager requirement.
- [x] Verify nested render, language changes and public event details in a real browser.

## Task 3: First feature and instructional alignment

Files: original feature generator and tests, Cells course registration and reading/practice content.

- [x] Build an original account-detail feature with summary and movements views, translated labels and scoped variants.
- [x] Drive navigation and filtering through properties/events; make data an input, without mandatory networking.
- [x] Add a course entry explaining the files, contracts and an observable modification task.
- [x] Validate loading, empty, error, success, return navigation and filter behavior.

## Completion gate

- [x] Personally review all diffs and unexpected changes.
- [x] Run strongest relevant automated suites, typecheck and production build.
- [x] Exercise the local course and generated feature in a browser, including a narrow viewport.
- [x] Report exact changes, evidence and remaining curriculum migration; do not claim all 84 lessons rebuilt from a first vertical slice.

## Evidence and remaining work

- `npm test -- --maxWorkers=2 --reporter=dot`: 1316 passed, 2 skipped. An unconstrained run concurrent with the production build hit the existing 5-second audit timeout; the bounded rerun passed without changing timeouts.
- `npm run lint` and `npm run build`: passed. Existing bundle-size and Pyodide externalization warnings remain.
- `npm run cells:verify:browser`: eight component families, actual player challenge bridge, instrumented coverage, 16 feature checks, failing starter, disconnected-filter mutation and 390px viewport passed.
- Real local UI: opened the supplemental reading, edited the root through CodeMirror, ran 32/32 lab contracts, opened the preview and navigated to movements. Lesson 06: start gate, play, pause, edit/fork, reload preview and return to tape/roadmap exercised.
- No external components copied; no audio/subtitle edits, commit, push or deploy. No proprietary-runtime equivalence claimed.
- Remaining: migrate the rest of the course's application examples and evaluate each recorded lesson against the expanded features. Optional data-manager integration is not implemented. External CLI parity tests remain skipped; ZIP export has not been independently exercised this turn.

## Task 4: Application composition migration

- [x] Keep all six page routes and public product-object selection payloads stable.
- [x] Use scoped class helpers and SCSS/css.js shared-style composition in all generated pages and the application card variant.
- [x] Reuse the complete educational action component with its typography and locale files.
- [x] Wire Favorites and Search selections to the named detail route.
- [x] Verify all five application projects in a sandboxed browser, including plain preview outside test mode.
- [x] Add a regression for rebuilding identical app code: a fresh iframe must restart the application.
- [x] Exercise the real application lab: repaired lifecycle/navigation, 30/30 contracts.

Remaining acceptance work: review lesson-specific component behaviors and advanced application examples against the actual learning objectives; validate exported projects independently. The broad course migration is still open.

## Task 5a: Observable disabled action contract

- [x] Match lesson 11: Boolean property, reflected attribute and native disabled state remain synchronized.
- [x] Suppress public actions while disabled, including synthetic clicks; restore interaction on attribute removal.
- [x] Verify Enter and Space each emit one action when enabled and none while disabled in Chromium.
- [x] Include the regression test, public API documentation and default-slot metadata in generated component packages.
- [x] Preserve complete shared dependency reuse across all five application projects.

Evidence: browser regression first failed with `disabled must reflect and disable the native control`, then passed after implementation. The complete suite exposed the preliminary audit's explicit-attribute requirement; the component now declares it without weakening the audit. Final `npm test -- --maxWorkers=2 --reporter=dot`: 1318 passed, 2 skipped; lint and production build passed. Browser verification passed five applications, eight component families, the player challenge, feature states, mutation detection and mobile checks. Existing build warnings remain. Exported test execution in an external CLI and ZIP handoff are not proven by these checks.

Next: mutually exclusive state-panel behavior, actual search/list/catalog interaction, advanced examples and independent exported-project validation. Audio and subtitles remain unchanged.

## Task 5b: Exclusive request-state presentation

- [x] Render one translated state at a time with loading semantics and error announcements.
- [x] Show consumer content only in success and expose retry only in error; emit the existing public intention without owning networking.
- [x] Document the finite state domain and fallback, success slot and demo variants.
- [x] Verify transitions, removal of stale content/actions, invalid input and live ES/EN changes in Chromium; include an exported regression test.
- [x] Let the generic browser contract runner choose a documented string literal for finite-domain properties instead of supplying an invalid arbitrary string.

Browser red evidence: `Missing exclusive state: loading`; after the state guard, the generic runner also correctly exposed its invalid fixture via `browser-event`. The final browser flow passes all state assertions. The editor integration identified a DOM typing issue in the exported test; using the standard attribute accessor fixed it without suppressing diagnostics. No audio or subtitle changes.

Final verification: full suite 1318 passed / 2 skipped, lint passed, production build passed with existing warnings, browser checks passed. Remaining: search/list/catalog, advanced examples and exported-project execution.

## Task 5c: Search, configurable collection and catalog composition

- [x] Reuse the complete scoped action in search; send one current query for click or Enter, without submitting during text composition.
- [x] Accept consumer-owned `items` and `query` in the list, render actual scoped cards, show no-results feedback and preserve the input array.
- [x] Bridge search and clear intents in the catalog through public properties/events only.
- [x] Reemit selections with a stable ID and product name, including duplicate-name fixtures.
- [x] Ship metadata, README contracts and regression tests with all three generated packages.

Red evidence: missing scoped search action, missing keyboard query, and disconnected catalog data each failed in Chromium before the corresponding correction. Final browser flow verifies Enter, composition, filtering, exact duplicate-name selection, empty results and clearing; all five applications and previous component/feature checks still pass. Full suite: 1318 passed / 2 skipped; targeted editor and curriculum checks: 24 passed; lint and production build passed with existing warnings. Exported test source is validated by editor diagnostics, but execution outside the platform remains a separate pending gate.

## Task 5d: Reusable status sizing and accurate editor diagnostics

- [x] Render the status indicator as a compact control with scoped typography instead of nesting an entire content card.
- [x] Keep its existing inspect event and keyboard-accessible native button.
- [x] Use the language service's syntactic and semantic diagnostics for JS/TS; retain the highlighting parser as fallback when the service is unavailable and for other languages.
- [x] Reproduce valid JSON import-attribute false positives with the real TypeScript library set, and preserve genuine syntax errors plus unavailable-service fallback in integration tests.

Final evidence: 1321 tests passed / 2 skipped; lint and build passed with existing warnings. Chromium catches a restored oversized indicator and passes the compact version alongside all component/application flows. In the actual lesson 12 player: start/pause/seek/reload, visible `Sin errores`, compact status, `error` retry with `{ state: "error" }` in the event inspector, transition to `empty` removing retry, and English translation were checked. No audio changes or deployment. Remaining: advanced component/application examples and independent ZIP/CLI execution.

## Task 5e: Lifecycle and subtree context (69–70)

- [x] Observe online/offline only while connected; preserve callback identity and count actual signals without duplicate subscriptions after reconnection.
- [x] Use the public `@lit/context` controllers with a shared module identity, a demo provider and two real consumers, without global application state.
- [x] Verify independent providers, reparenting, disconnect cleanup and renewed subscriptions on reconnect in Chromium.
- [x] Include controller dependency, context source files, editor declarations, generated regression tests and explanatory README in the context package.

Red evidence: missing lifecycle observation count and missing two-consumer provider failed before implementation. Final validation: `npm test -- --maxWorkers=4` passed 1321 tests / 2 skipped; lint, build and complete browser verification passed. The unconstrained full suite hit the existing 5-second exhaustive-catalog timeout twice; limiting worker concurrency passed without changing assertions or timeouts. A demo-practice string-mutation regression was corrected in generated whitespace, preserving its expected failing contract. Browser behavior was executed; exported test source was checked by the editor, but independent ZIP/CLI execution is still pending. No audio, subtitle or deployment changes. Remaining: examples 71–84 and independent export validation. Recursive packaging of a future component that embeds the context panel will need to retain its auxiliary context modules and dependency; no current component does so.

## Task 5f: Configurable and accessible media (71)

- [x] Bind public `src`, `alt`, `width` and `height`, preserving `imageLabel` and its `open` event.
- [x] Reserve responsive space during loading, success, error and empty source; retain a usable ratio for invalid dimensions.
- [x] Hide the decorative icon from assistive technology, allow decorative `alt=""`, and recover when the consumer replaces a broken URL.
- [x] Export source-aligned styles, metadata, demo controls, ES/EN messages, README and a regression test.

Red evidence: Chromium failed because the original recipe had no real image or reserved frame. The completed browser scenario verifies decoded images, a genuinely invalid source, stable dimensions, translated error, recovery and empty source. The actual lesson 71 player was started, paused, sought to the final tape and reloaded; the mobile Workbench showed the image and error, and clearing `src` with keyboard showed the English empty message. An automated empty-fill discrepancy did not reproduce with keyboard and required no Workbench change. Screenshots inspected locally. Final validation: 1321 tests passed / 2 skipped with four workers, 13 targeted editor/curriculum tests passed, lint and build passed with existing warnings. No audio or deployment changes. Remaining: 72–84 and independent ZIP/CLI execution; generated exported tests have not yet been run by that external toolchain.

## Task 5g: Theme tokens across real scoped components (72)

- [x] Render the complete shared state panel and action in one theme host; select light/dark palettes through tokens without replacing component instances.
- [x] Make shared component styles consume environmental tokens with their existing appearance as fallback, including a visible focus ring.
- [x] Keep state and disabled inputs independent from theme selection; preserve the existing event and label its action as inspection of the current theme.
- [x] Document inherited and consumer-specific CSS tokens without duplicate metadata; include generated demo, README and regression test.

Red evidence: the previous theme recipe did not render its declared shared state component. Chromium now checks both palettes, text contrast at least 4.5:1, focus contrast at least 3:1, visible focus width, error-to-empty cleanup, consumer token overrides across shadow boundaries, disabled actions and reenable events. Actual lesson 72 player: start/pause/final seek/reload, mobile Workbench dark/error and light/loading/disabled in English visually inspected. The final copy clarifies that the action inspects the current theme rather than changing a global preference. Full suite: 1321 passed / 2 skipped; final focused editor/curriculum checks: 13 passed, including lesson 73's generated sources; lint, build and browser verification passed with existing build warnings. Lesson 73's workflow behavior and independent ZIP/CLI execution remain unproven, alongside application examples 74–84. No audio or deployment changes.
