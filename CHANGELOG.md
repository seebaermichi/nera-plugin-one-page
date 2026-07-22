# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2026-07-22

### Changed

-   anchor slugification now calls `slugify` from
    `@nera-static/plugin-utils` instead of the copy 3.0.0 introduced inline.
    **Output is unchanged** — it is the same algorithm, moved to where
    `plugin-tags` shares it, so a future correction to the rule reaches both
    plugins rather than only the one that noticed. Verified by the unmodified
    3.0.0 anchor test table, which still passes, and by re-generating the
    README's Generated Output block and diffing it byte-for-byte
-   minimum `@nera-static/plugin-utils` raised to `^1.4.0`, which is where
    `slugify` was added

### Notes

No action needed on upgrade from 3.0.0. If you are coming from 2.x, the
migration note under 3.0.0 below still applies unchanged.

## [3.0.0] - 2026-07-22

Outcome of the README audit recorded in `audit/readme/README-one-page.md`.
Sixteen findings; the two behavioural ones are below, the rest were
documentation.

### Changed

-   **BREAKING**: **auto-generated anchor IDs are now non-ASCII safe.** The slug
    rule was `[^\w]+` → `-`, which is ASCII-only, so every accented heading was
    mangled and could produce an ID starting with a hyphen. Such an ID is legal
    HTML but is **not a valid CSS identifier**: `#-ber-uns` matches nothing in a
    stylesheet and `document.querySelector('#-ber-uns')` throws, which broke
    scroll-spy and smooth-scroll scripts on any German or Spanish one-pager. The
    rule now matches `slugifyTag` in `@nera-static/plugin-tags`

    | Heading | v2.x | v3.0.0 |
    | --- | --- | --- |
    | `Über uns` | `-ber-uns` | `uber-uns` |
    | `Qué hacemos` | `qu-hacemos` | `que-hacemos` |
    | `Straße` | `stra-e` | `strasse` |
    | `About Us!` | `about-us-` | `about-us` |
    | `日本語` | `-` | *(no anchor)* |

    Purely alphanumeric headings are unaffected: `About Our Company` remains
    `about-our-company`. An explicit `anchor_id` is still used verbatim and is
    never slugified

### Added

-   an unresolved `add_to_page` now logs a warning naming the target and the
    number of sections that were not merged. The value must equal a page's
    `meta.href` exactly, so `index.html` without the leading slash merged
    nothing at all — silently, in a build that exited 0
-   README documents what was previously undocumented: the defaults for every
    frontmatter key, the exact-`href` matching rule, that merged source pages
    still render on their own when they define `layout`, that
    `content_wrapper_tag: ''` emits no wrapper, and that malformed
    `content_wrapper_attributes` are dropped rather than fatal

### Fixed

-   **the README's `about-us.md` example was invalid YAML.** It wrote
    `value: background-color: red;` — a plain scalar containing `": "` — so a
    reader who copied it lost that page from the build with a single console
    line. Values containing a colon are now quoted, and the trap is called out
-   the README's generated-output example showed an `<a id="prices"></a>` the
    plugin never emitted (anchors are derived from the first `<h1>`, never from
    the filename), and omitted the target page's own content, the `<p>` wrapping
    and the retained `<h1>`. The block is now the verbatim output of the
    example above it
-   "Auto-generate anchors from headings" corrected to name the first `<h1>`
    specifically; `<h2>` and below never produced an anchor
-   removed the "zero-runtime overhead" claim, which contradicted the `cheerio`
    runtime dependency documented twelve lines below it
-   Compatibility now states the `@nera-static/plugin-utils` range and explains
    that the Nera `v4.1.0+` line is a baseline rather than a requirement
-   added the `## 🤝 Contributing` section, the Author hard break, and the
    `npx vitest run` guidance (`npm test` is watch mode)

### Migration from v2.x

**If every `<h1>` you rely on for an anchor is plain ASCII letters, digits and
spaces, nothing changes** — those slugs are byte-identical.

Check your site if either applies:

1.  **A heading contains an accent, an umlaut, `ß`, or non-Latin script.** Its
    anchor ID changes per the table above. Any in-page link (`href="#-ber-uns"`),
    CSS rule or script selector using the old value must be updated — or pin the
    old value by setting `anchor_id` explicitly on that page's frontmatter, which
    is used verbatim
2.  **A heading ends in punctuation** (`About Us!`). The trailing hyphen is now
    trimmed: `about-us-` becomes `about-us`

To find affected pages, grep your `pages/` for headings outside `[A-Za-z0-9 ]`
and check the anchors in the rendered output before and after upgrading.

The new warning for an unresolved `add_to_page` may surface merges that were
never working. It is a warning only — nothing that built before fails now.

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
