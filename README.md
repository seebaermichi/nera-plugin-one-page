# 📄 @nera-static/plugin-one-page

A plugin for the static site generator [Nera](https://github.com/seebaermichi/nera) to merge content from multiple markdown pages into a single output page. Ideal for landing pages and long-form content.

## ✨ Features

-   Merge content from multiple `.md` files into one HTML page
-   Define content order and anchor IDs
-   Auto-generate anchors from headings if none provided
-   Optional tag and attribute wrappers per section
-   Fully configurable via frontmatter and plugin defaults

## 🚀 Installation

Install the plugin in your Nera project:

```bash
npm install @nera-static/plugin-one-page
```

No further setup required — the plugin uses sensible defaults.

## ⚙️ Configuration

You define behavior directly in the meta section (frontmatter) of your markdown files. By default, the plugin uses the following meta keys:

```yaml
add_to_page: <path to main page>
add_to_page_order: <sorting order>
anchor_id: <custom anchor ID>
content_wrapper_tag: <e.g., section, div>
content_wrapper_attributes:
    - attribute: ...
      value: ...
```

If you'd like to override the default property names, you can create a file `config/one-page.yaml` in your project with custom keys:

```yaml
property_name: add_to_page
order_property: add_to_page_order
anchor_id_property: anchor_id
content_wrapper_tag_property: content_wrapper_tag
content_wrapper_attributes_property: content_wrapper_attributes
```

## 🧩 Usage

Suppose you want to merge `service.md`, `prices.md`, and `about-us.md` into `index.html`.

### Directory structure

```
pages/
├── index.md
├── service.md
├── prices.md
└── about-us.md
```

### Meta frontmatter of sub-pages

#### `pages/service.md`

```markdown
---
title: Service
add_to_page: /index.html
add_to_page_order: 1
anchor_id: service-section
---

Content for service
```

#### `pages/prices.md`

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

#### `pages/about-us.md`

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

### What it generates

The content of `service.md`, `prices.md`, and `about-us.md` will be appended to the output of `index.html`, wrapped in tags and anchor elements like:

```html
<section class="...">
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

## 🧪 Development

```bash
npm install
npm test
```

## 📦 License

MIT

## 🧑‍💻 Author

Michael Becker  
[GitHub](https://github.com/seebaermichi)
