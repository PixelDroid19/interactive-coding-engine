# Open Cells Curriculum V2 Design

## Goal

Convert the existing Open Cells course into a complete, neutral learning path that teaches production-grade component and application work without exposing private reference material, organizations, products, infrastructure, URLs, or datasets.

## Boundaries

- Reference documentation is read-only research input and is never copied into the repository.
- Product content uses only neutral `academy-*` packages, fictional data, and generalized contracts.
- The platform, lessons, scripts, comments, tests, exports, and commits must not reveal research provenance.
- Lit remains a prerequisite; the Cells course explains the integration contract instead of repeating the Lit course.
- Existing progress IDs `open-cells-01` through `open-cells-68` remain stable.

## Learning architecture

Every lesson follows: concept → minimal example → multi-file journey → guided change → individual practice → behavioral verification → common failure → transfer. Existing lessons are enriched in place. New advanced units extend the path with lifecycle, context, assets, theming, routing guards, delegated routes, templates, offline behavior, feature flags, observability, analytics, performance, CI/CD, and migration strategy.

## Project architecture

Component lessons rotate through distinct neutral artifacts and reuse earlier packages through local imports. Application lessons assemble those packages into a fictional learning workspace. Component practices use the component demo workbench; application practices render the complete app. Exports remain standard ZIP projects that can continue outside the platform.

## Privacy and neutrality

The Cells course exposes no source cards. A repository test scans curriculum, scripts, engine recipes, and learning assets for forbidden provenance markers. Examples use generated fixtures and never copy real endpoints, identifiers, metrics, customer data, or branded component names.

## Acceptance

- No visible or source-level provenance markers in the Cells deliverable.
- Existing 68 IDs remain usable and new units are registered in the roadmap.
- Each new concept has explanation, example, practice, diagnostic, and script.
- Component and app playgrounds load the correct workspace kind.
- All exercises validate behavior with variable inputs.
- Normal and cyber themes remain usable.
- Full tests, TypeScript, build, and browser flows pass.
