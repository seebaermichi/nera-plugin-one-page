# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2026-07-20

### Fixed

-   **`cheerio` is now declared as a runtime dependency.** It was in
    `devDependencies` while `index.js` imports it, so the plugin loaded only
    when the host project happened to hoist cheerio into a shared
    `node_modules`. Installing the package into a project without it threw
    `ERR_MODULE_NOT_FOUND: cheerio` on import — verified from a clean-room
    tarball install
-   a missing or non-array `pagesData` returns an empty array instead of
    throwing `Cannot read properties of undefined (reading 'filter')`
-   `content_wrapper_attributes` authored as a YAML mapping
    (`class: hero`) no longer throws `attrs.map is not a function`. Both the
    mapping and the documented list form are accepted; anything else is ignored
    with a warning instead of failing the build
-   attribute values are HTML-escaped, so a value containing `"` can no longer
    break out of the attribute it is written into
-   config is read per invocation instead of at import time, so edits to
    `config/one-page.yaml` take effect during `npm run dev` without a restart

### Changed

-   **`engines.node` raised to `>=20.18.1`.** Every current `cheerio` 1.x fails
    on Node 18 with `ReferenceError: File is not defined`, so the previous
    `>=18` was never true once cheerio became a runtime dependency. This
    corrects a false claim rather than dropping working support
-   CI runs Node 20 and 22 with `fail-fast: false`, matching the above
-   `@nera-static/plugin-utils` raised to `^1.2.0`

### Removed

-   `views` from the `files` list. There is no `views/` directory and never has
    been — this plugin transforms page content and ships no templates. Nothing a
    consumer receives changes

### Migration Guide

Backward-compatible with v2.0.1 in behaviour. The one thing to check is
**Node 18**: if you are still on it, this plugin never actually worked, and the
release now says so in `engines` rather than failing at runtime. Upgrade to
Node 20.18.1 or later.

## [2.0.1] - 2024-12-27

### Added

-   Professional CHANGELOG.md for release tracking
-   Enhanced documentation and package metadata

### Changed

-   Updated @nera-static/plugin-utils to v1.1.0 for improved compatibility
-   Improved package.json metadata and repository references
-   Enhanced README.md with better examples and documentation

### Technical Details

-   Maintains stable API with `getMetaData()` function
-   Full compatibility with Nera v4.1.0 static site generator
-   Zero breaking changes from previous version
-   All tests passing (4/4)
-   Optimized for content merging and one-page layouts

## [2.0.0] - 2024-07-19

### Added

-   Initial stable release for Nera static site generator
-   Content merging from multiple markdown pages into single output
-   Configurable anchor ID generation from headings
-   Custom wrapper tags and attributes per section
-   Flexible ordering system for merged content
-   Comprehensive test coverage

### Features

-   Merge content via `add_to_page` frontmatter property
-   Auto-generate anchors from H1 headings or custom IDs
-   Section wrapper customization with tags and attributes
-   Order control with `add_to_page_order` property
-   Full YAML configuration support
-   Integration with @nera-static/plugin-utils

### Dependencies

-   Node.js >=18 support
-   ES modules architecture
-   Modern development tooling (Vitest, ESLint, Husky)
