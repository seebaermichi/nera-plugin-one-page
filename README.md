# @nera-static/plugin-one-page

A plugin for the [Nera](https://github.com/seebaermichi/nera) static site generator to merge content from multiple markdown pages into a single output page. Ideal for landing pages and long-form content.

## ✨ Features

- Merge content from multiple `.md` files into one HTML page
- Define content order and anchor IDs per section
- Auto-generate anchors from headings if not provided
- Optional tag and attribute wrappers for each section
- Configurable via frontmatter and optional `config/one-page.yaml`
- Lightweight and zero-runtime overhead
- Full compatibility with Nera v4.1.0+

## 🚀 Installation

Install the plugin in your Nera project:

```bash
npm install @nera-static/plugin-one-page
```

No additional setup required – the plugin works out of the box using default frontmatter keys.

## ⚙️ Configuration

Define plugin behavior in your markdown files' frontmatter:

```yaml
add_to_page: /index.html
add_to_page_order: 1
anchor_id: custom-anchor
content_wrapper_tag: section
content_wrapper_attributes:
  - attribute: class
    value: section-class
```

### Optional global configuration

Create `config/one-page.yaml` to override default keys:

```yaml
property_name: add_to_page
order_property: add_to_page_order
anchor_id_property: anchor_id
content_wrapper_tag_property: content_wrapper_tag
content_wrapper_attributes_property: content_wrapper_attributes
```

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
content_wrapper_tag: div
content_wrapper_attributes:
  - attribute: class
    value: price-wrapper
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
  - attribute: style
    value: background-color: red;
---

# About Our Company

About content goes here.
```

### Generated output

```html
<section>
  <a id="service-section"></a>
  Content for service
</section>

<div class="price-wrapper">
  <a id="prices"></a>
  Prices content
</div>

<section style="background-color: red;">
  <a id="about-our-company"></a>
  About content goes here.
</section>
```

## 📊 Generated Output

The plugin appends content from other pages to the target output page (`add_to_page`) in defined order. It wraps each section and anchors as configured and generates clean, static HTML.

## 🧪 Development

```bash
npm install
npm test
npm run lint
```

Tests use [Vitest](https://vitest.dev) and validate:

- Merging behavior and section order
- Anchor ID generation and defaults
- Wrapper tag rendering and attributes
- Output HTML structure

## 🧑‍💻 Author

Michael Becker
[https://github.com/seebaermichi](https://github.com/seebaermichi)

## 🔗 Links

- [Plugin Repository](https://github.com/seebaermichi/nera-plugin-one-page)
- [NPM Package](https://www.npmjs.com/package/@nera-static/plugin-one-page)
- [Nera Static Site Generator](https://github.com/seebaermichi/nera)

## 🧩 Compatibility

- **Nera**: v4.1.0+
- **Node.js**: >= 18
- **Plugin API**: Uses `getMetaData()` for section merging

## 📦 License

MIT
