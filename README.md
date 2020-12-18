# One page - Nera plugin
This is a plugin for the static side generator [Nera](https://github.com/seebaermichi/nera) to show content from 
different page markdown files on one page.

## Installation
At first, you need to place this plugin in the `src/plugins` folder of your Nera project.  

## Configuration
This is the default configuration. It defines the properties which should be used in the meta section of the pages 
which should be merged. All values in this file are the default ones, so if you use these, you can leave your config 
file empty.
```yaml
property_name: add_to_page
order_property: add_to_page_order
anchor_id_property: anchor
content_wrapper_tag_property: content_wrapper_tag
content_wrapper_attributes_property: content_wrapper_attributes

```

## Usage
Let's assume you have four pages:
* `/pages/index.md`
* `/pages/service.md`
* `/pages/prices.md`
* `/pages/about-us.md`  

and you want to show the content of service, prices and about-us page on the index page, to get only one `index.html` 
  page compiled.

To achieve this the meta section of service, prices and about-us page should look like follows:  
_/pages/service.md_
```markdown
---
title: Service
add_to_page: /index.html
add_to_page_order: 1
anchor_id: service-section
---
service content goes here

```
_/pages/prices.md_
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
prices content goes here

```
_/pages/about-us.md_
```markdown
---
title: About us
add_to_page: /index.html
add_to_page_order: 3
content_wrapper_attributes:
    - attribute: style
      value: background-color: red;
---
# About our company
about us content goes here

```
The properties for the anchor, wrapper tag and wrapper attributes are optional.  

__anchor__  
If no anchor id property is given, the plugin will create an anchor with `id` out of the `h1` of your content in kebab 
case. So for the content of the about us section the `id` of the anchor will be `about-our-company`.  
If there is an anchor id property, like for the service section, it will use this one.

__wrapper tag__  
The plugin will wrap the content of your section with a `section` tag by default. If your provide another tag, like 
`div` it will use this instead.  

__wrapper attributes__  
You can also define attributes, which will be added to the wrapper tag. This is an array of objects with two 
properties: `attribute` and `value` (see prices and about us as an example).  
