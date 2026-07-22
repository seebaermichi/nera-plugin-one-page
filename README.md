# @nera-static/plugin-one-page

[![Test](https://github.com/seebaermichi/nera-plugin-one-page/actions/workflows/test.yml/badge.svg)](https://github.com/seebaermichi/nera-plugin-one-page/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@nera-static/plugin-one-page)](https://www.npmjs.com/package/@nera-static/plugin-one-page)

A plugin for the [Nera](https://github.com/seebaermichi/nera) static site generator to merge content from multiple markdown pages into a single output page. Ideal for landing pages and long-form content.

## ✨ Features

- Merge content from multiple `.md` files into one HTML page
- Define content order and anchor IDs per section
- Auto-generate an anchor from a section's first `<h1>` when none is given
- Optional tag and attribute wrappers for each section
- Configurable via frontmatter and optional `config/one-page.yaml`
- No templates to publish and no configuration file required

## 🚀 Installation

Install the plugin in the root of your Nera project:

```bash
npm install @nera-static/plugin-one-page
```

Nera detects the plugin automatically and applies it during the build. There is nothing to publish and no configuration file to create — the defaults below are used when `config/one-page.yaml` is absent.

## ⚙️ Configuration

### Frontmatter keys

Set these in the frontmatter of the pages you want to **merge into** another page:

| Key | Required | Default | Purpose |
|---|---|---|---|
| `add_to_page` | **yes** | — | `href` of the page to merge this content into |
| `add_to_page_order` | no | `1` | Sort position within the target page |
| `anchor_id` | no | slug of the first `<h1>` | `id` of the anchor placed before the section |
| `content_wrapper_tag` | no | `section` | Element wrapping the section; `''` emits no wrapper |
| `content_wrapper_attributes` | no | none | Attributes set on the wrapper element |

```yaml
add_to_page: /index.html
add_to_page_order: 1
anchor_id: custom-anchor
content_wrapper_tag: section
content_wrapper_attributes:
  - attribute: class
    value: section-class
```

`content_wrapper_attributes` may also be written as a plain mapping, which is
often shorter:

```yaml
content_wrapper_attributes:
  class: section-class
  data-role: banner
```

Attribute values are HTML-escaped, so a value containing quotes cannot break out
of the attribute. A value that is neither a list nor a mapping is ignored with a
console warning rather than failing the build, and list entries without an
`attribute` key are skipped.

> **Quote any value containing a colon.** `value: background-color: red;` is
> invalid YAML — the build logs `❌ Failed to process page` and **drops that page
> entirely**, exiting 0. Write `value: 'background-color: red;'`.

### `add_to_page` must match the target's `href` exactly

The value is compared literally against the target page's `meta.href`, which
Nera builds as a root-relative path with a leading `/` and an `.html`
extension:

| Source file | `href` to target |
|---|---|
| `pages/index.md` | `/index.html` |
| `pages/de/index.md` | `/de/index.html` |

`index.html` without the leading slash, or a typo, merges nothing. Since v3.0.0
this logs a warning naming the unresolved target; before that it failed
silently.

### Anchor IDs

When `anchor_id` is not set, the anchor is derived from the section's **first
`<h1>`**. Headings below `<h1>` are ignored, and a section with no `<h1>` gets
no anchor at all.

The slug rule is `slugify()` from
[`@nera-static/plugin-utils`](https://www.npmjs.com/package/@nera-static/plugin-utils),
shared with `@nera-static/plugin-tags` so tag slugs and anchors agree. It
lowercases, expands `ß` to `ss`, strips diacritics, replaces every remaining run
of non-alphanumerics with a single `-`, and trims leading and trailing hyphens:

| Heading | Anchor |
|---|---|
| `About Our Company` | `about-our-company` |
| `Über uns` | `uber-uns` |
| `Qué hacemos` | `que-hacemos` |
| `Straße` | `strasse` |

A heading that contains no Latin letters or digits (`日本語`, `!!!`) slugifies to
nothing, so no anchor is emitted — set `anchor_id` explicitly for those.

**Anchor IDs are a public contract.** Visitors bookmark them and your own CSS
and scripts select them, so this rule only changes in a major version.

### Optional global configuration

Create `config/one-page.yaml` to rename the frontmatter keys the plugin looks
for. The values below are the defaults, so this file is only needed if you want
different key names:

```yaml
property_name: add_to_page
order_property: add_to_page_order
anchor_id_property: anchor_id
content_wrapper_tag_property: content_wrapper_tag
content_wrapper_attributes_property: content_wrapper_attributes
```

The file is re-read on every build, so changes take effect during `npm run dev`
without restarting.

## 🧩 Usage

### Example directory structure

```
pages/
├── index.md
├── service.md
├── prices.md
└── about-us.md
```

### Sample frontmatter

#### `index.md` — the target page

```markdown
---
title: Home
layout: layouts/default.pug
---

Welcome to our company.
```

#### `service.md`

```markdown
---
title: Service
add_to_page: /index.html
add_to_page_order: 1
anchor_id: service-section
---

Content for service
```

#### `prices.md`

```markdown
---
title: Prices
add_to_page: /index.html
add_to_page_order: 2
anchor_id: prices
content_wrapper_tag: div
content_wrapper_attributes:
  class: price-wrapper
---

Prices content
```

#### `about-us.md`

```markdown
---
title: About Us
add_to_page: /index.html
add_to_page_order: 3
content_wrapper_attributes:
  style: 'background-color: red;'
---

# About Our Company

About content goes here.
```

### Merged pages still render on their own

This plugin adds content to the target page; it does not remove the source
pages. A merged page keeps rendering as its own page **if it defines `layout`**
in its frontmatter — Nera skips any page without one. The examples above omit
`layout` from `service.md`, `prices.md` and `about-us.md`, which is what makes
them merge-only. Add `layout` if you also want them reachable at their own URL.

## 📊 Generated Output

Merged sections are **appended after the target page's own content**, in
`add_to_page_order` order. Markdown is already rendered to HTML before this
plugin runs, so section bodies arrive wrapped in `<p>`, and any heading in the
source — including the `<h1>` an anchor was derived from — is part of the merged
content.

Output of `/index.html` for the example above, verbatim:

```html
<p>Welcome to our company.</p>


<section>
<a id="service-section"></a>
<p>Content for service</p>

</section>

<div class="price-wrapper">
<a id="prices"></a>
<p>Prices content</p>

</div>

<section style="background-color: red;">
<a id="about-our-company"></a>
<h1>About Our Company</h1>
<p>About content goes here.</p>

</section>
```

## 🧪 Development

```bash
npm install
npx vitest run
npm run lint
```

`npm test` starts Vitest in **watch** mode; use `npx vitest run` for a single
pass. Tests use [Vitest](https://vitest.dev) and validate:

- Merging behavior, section order, and placement relative to the target content
- Anchor ID generation, slugification, and defaults
- Wrapper tag rendering, attributes, and escaping
- Config overrides, the missing-config fallback, and malformed input

## 🤝 Contributing

Issues and pull requests are welcome. See the
[Nera contributing guide](https://github.com/seebaermichi/nera/blob/main/CONTRIBUTING.md)
for plugin development, the hook contract, and local setup.

For this repo specifically:

- `npx vitest run` and `npm run lint` must pass (`npm test` is watch mode).
- Bump the version and update `CHANGELOG.md` **in the same commit** as the change.
- The anchor IDs and wrapper markup this plugin emits are a **public contract** —
  visitors link to the anchors and users style the wrappers from their own CSS,
  so changing what either produces is a **major** bump.
- Releases publish from CI on a pushed `v*` tag. Never run `npm publish`.

## 🧑‍💻 Author

Michael Becker  
[https://github.com/seebaermichi](https://github.com/seebaermichi)

## 🔗 Links

- [Plugin Repository](https://github.com/seebaermichi/nera-plugin-one-page)
- [NPM Package](https://www.npmjs.com/package/@nera-static/plugin-one-page)
- [Nera Static Site Generator](https://github.com/seebaermichi/nera)

## 🧩 Compatibility

- **Nera**: v4.1.0+ — a baseline, not a requirement. This plugin uses no
  generator feature above the 4.x line and ships no templates, so there is no
  Pug `basedir` dependency and nothing that needs v4.2.0 or v4.3.0.
- **Node.js**: >= 20.18.1 — required by `cheerio`, this plugin's runtime dependency
- **Plugin Utils**: `^1.4.0` — `getConfig()` and `slugify()`, which is the shared implementation of the anchor slug rule below
- **Plugin API**: exports `getMetaData()`, which rewrites page content

## 📦 License

MIT
