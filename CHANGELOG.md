# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
