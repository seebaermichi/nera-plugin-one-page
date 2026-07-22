import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
    vi,
} from 'vitest'
import { getMetaData } from '../index.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

// The suite runs in a temp cwd and restores the original in afterAll. The
// previous version chdir'd and never came back, which can pollute sibling test
// files sharing a worker — and its config file was inert anyway, because
// index.js read config at module scope, before beforeAll ever ran.
let tmpDir
let originalCwd

const DEFAULT_CONFIG_YAML = `
property_name: add_to_page
order_property: add_to_page_order
anchor_id_property: anchor_id
content_wrapper_tag_property: content_wrapper_tag
content_wrapper_attributes_property: content_wrapper_attributes
`

const configPath = () => path.join(tmpDir, 'config/one-page.yaml')

function writeConfig(yaml) {
    fs.writeFileSync(configPath(), yaml)
}

function removeConfig() {
    fs.rmSync(configPath(), { force: true })
}

beforeAll(() => {
    originalCwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nera-plugin-one-page-'))
    fs.mkdirSync(path.join(tmpDir, 'config'), { recursive: true })
    process.chdir(tmpDir)
})

afterAll(() => {
    process.chdir(originalCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
})

beforeEach(() => {
    writeConfig(DEFAULT_CONFIG_YAML)
})

const SAMPLE_PAGES = [
    {
        meta: { href: '/index.html' },
        content: '<h1>Welcome</h1>\nIndex content',
    },
    {
        meta: {
            href: '/service.html',
            add_to_page: '/index.html',
            add_to_page_order: 2,
            anchor_id: 'service',
            content_wrapper_tag: 'section',
            content_wrapper_attributes: [
                { attribute: 'class', value: 'section-service' },
            ],
        },
        content: '<h1>Service</h1>\nService content',
    },
    {
        meta: {
            href: '/about.html',
            add_to_page: '/index.html',
            add_to_page_order: 1,
            content_wrapper_tag: 'div',
        },
        content: '<h1>About Us</h1>\nAbout content',
    },
]

const indexOf = (result) => result.find((p) => p.meta.href === '/index.html')

describe('OnePagePlugin', () => {
    it('merges content into the correct page with proper anchor and wrappers', () => {
        const indexPage = indexOf(getMetaData({ pagesData: SAMPLE_PAGES }))

        expect(indexPage.content).toContain('<a id="about-us"></a>')
        expect(indexPage.content).toContain('<a id="service"></a>')
        expect(indexPage.content).toContain('<div>')
        expect(indexPage.content).toContain('<section class="section-service">')
        expect(indexPage.content).toMatch(/About content[\s\S]*Service content/)
    })

    it('uses <section> as default wrapper if none is specified', () => {
        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/foo.html',
                            add_to_page: '/index.html',
                            add_to_page_order: 1,
                        },
                        content: '<h1>Foo</h1>\nFoo content',
                    },
                ],
            })
        )

        expect(indexPage.content).toContain('<section>')
        expect(indexPage.content).toContain('<a id="foo"></a>')
    })

    it('skips anchor generation if no h1 is found and no anchor_id provided', () => {
        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/bar.html',
                            add_to_page: '/index.html',
                            add_to_page_order: 1,
                        },
                        content: 'This has no h1 at all.',
                    },
                ],
            })
        )

        expect(indexPage.content).not.toContain('<a id=')
    })

    it('appends merged sections after the target page\'s own content', () => {
        // Documented in the README's Generated Output section; locked here so
        // the two cannot drift apart again.
        const indexPage = indexOf(getMetaData({ pagesData: SAMPLE_PAGES }))

        expect(indexPage.content.indexOf('Index content')).toBeLessThan(
            indexPage.content.indexOf('About content')
        )
        expect(indexPage.content.startsWith('<h1>Welcome</h1>')).toBe(true)
    })

    it('leaves pages that are not merge targets untouched', () => {
        const result = getMetaData({ pagesData: SAMPLE_PAGES })
        const about = result.find((p) => p.meta.href === '/about.html')

        expect(about.content).toBe('<h1>About Us</h1>\nAbout content')
    })
})

describe('anchor id generation', () => {
    // v3.0.0. The old rule was `[^\w]+` -> `-`, which is ASCII-only, so every
    // umlaut produced a leading hyphen — an id that is legal HTML but an
    // invalid CSS identifier, breaking `#id` selectors and querySelector.
    const anchorFor = (content) => {
        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: { href: '/x.html', add_to_page: '/index.html' },
                        content,
                    },
                ],
            })
        )
        const match = indexPage.content.match(/<a id="([^"]*)"><\/a>/)
        return match ? match[1] : null
    }

    it.each([
        ['<h1>About Our Company</h1>', 'about-our-company'],
        ['<h1>Über uns</h1>', 'uber-uns'],
        ['<h1>Qué hacemos</h1>', 'que-hacemos'],
        ['<h1>Straße</h1>', 'strasse'],
        ['<h1>About Us!</h1>', 'about-us'],
        ['<h1>  Spaced  Out  </h1>', 'spaced-out'],
    ])('slugifies %s to %s', (content, expected) => {
        expect(anchorFor(content)).toBe(expected)
    })

    it('never emits an id starting or ending with a hyphen', () => {
        for (const heading of ['Über uns', '!!!Hallo!!!', '— Dash —']) {
            const id = anchorFor(`<h1>${heading}</h1>`)
            if (id !== null) expect(id).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/)
        }
    })

    it('emits no anchor when the heading slugifies to nothing', () => {
        // Previously produced `<a id="-"></a>`, a duplicate on every such page.
        expect(anchorFor('<h1>!!!</h1>')).toBeNull()
        expect(anchorFor('<h1>日本語</h1>')).toBeNull()
    })

    it('still prefers an explicit anchor_id verbatim', () => {
        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/x.html',
                            add_to_page: '/index.html',
                            anchor_id: 'Über_uns',
                        },
                        content: '<h1>Ignored</h1>',
                    },
                ],
            })
        )

        expect(indexPage.content).toContain('<a id="Über_uns"></a>')
    })

    it('ignores headings below h1', () => {
        expect(anchorFor('<h2>Just an H2</h2>')).toBeNull()
        expect(anchorFor('<h2>Sub</h2><h1>Real Title</h1>')).toBe('real-title')
    })
})

describe('unmatched merge targets', () => {
    it('warns when no page has the targeted href', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        getMetaData({
            pagesData: [
                { meta: { href: '/index.html' }, content: 'Main' },
                {
                    // No leading slash — the most likely authoring mistake.
                    meta: { href: '/x.html', add_to_page: 'index.html' },
                    content: '<h1>X</h1>',
                },
            ],
        })

        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn.mock.calls[0][0]).toContain('index.html')
        expect(warn.mock.calls[0][0]).toContain('add_to_page')
        warn.mockRestore()
    })

    it('does not warn when every target resolves', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        getMetaData({ pagesData: SAMPLE_PAGES })

        expect(warn).not.toHaveBeenCalled()
        warn.mockRestore()
    })

    it('names the configured property in the warning', () => {
        writeConfig('property_name: merge_into\n')
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        getMetaData({
            pagesData: [
                { meta: { href: '/index.html' }, content: 'Main' },
                {
                    meta: { href: '/x.html', merge_into: '/nope.html' },
                    content: '<h1>X</h1>',
                },
            ],
        })

        expect(warn.mock.calls[0][0]).toContain('merge_into')
        warn.mockRestore()
    })
})

describe('configuration', () => {
    // These assertions were impossible before: config was read once at import
    // time, so the fixture and the chdir were both inert and the suite passed
    // only because its values matched the hardcoded defaults.

    it('honours custom property names from the config file', () => {
        writeConfig(
            [
                'property_name: merge_into',
                'order_property: merge_order',
                'anchor_id_property: slug',
                'content_wrapper_tag_property: wrapper',
                'content_wrapper_attributes_property: wrapper_attrs',
            ].join('\n')
        )

        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/custom.html',
                            merge_into: '/index.html',
                            merge_order: 1,
                            slug: 'custom-anchor',
                            wrapper: 'article',
                            wrapper_attrs: [
                                { attribute: 'class', value: 'custom' },
                            ],
                        },
                        content: '<h1>Custom</h1>',
                    },
                ],
            })
        )

        expect(indexPage.content).toContain('<article class="custom">')
        expect(indexPage.content).toContain('<a id="custom-anchor"></a>')
    })

    it('ignores default property names once they are overridden', () => {
        writeConfig('property_name: merge_into\n')

        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/ignored.html',
                            add_to_page: '/index.html',
                        },
                        content: '<h1>Ignored</h1>',
                    },
                ],
            })
        )

        expect(indexPage.content).toBe('Main')
    })

    it('falls back to default config if config file is missing', () => {
        removeConfig()

        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/baz.html',
                            add_to_page: '/index.html',
                            add_to_page_order: 1,
                        },
                        content: '<h1>Baz</h1>\nBaz content',
                    },
                ],
            })
        )

        expect(indexPage.content).toContain('<section>')
        expect(indexPage.content).toContain('<a id="baz"></a>')
    })

    it('picks up a config change without a restart', () => {
        const pagesData = [
            { meta: { href: '/index.html' }, content: 'Main' },
            {
                meta: { href: '/x.html', add_to_page: '/index.html' },
                content: '<h1>X</h1>',
            },
        ]

        expect(indexOf(getMetaData({ pagesData })).content).toContain('<h1>X</h1>')

        writeConfig('property_name: something_else\n')

        expect(indexOf(getMetaData({ pagesData })).content).toBe('Main')
    })
})

describe('malformed input', () => {
    it('returns an empty array when pagesData is missing', () => {
        expect(getMetaData({ app: {} })).toEqual([])
    })

    it('returns an empty array when pagesData is not an array', () => {
        expect(getMetaData({ pagesData: 'nope' })).toEqual([])
    })

    it('returns an empty array when data itself is missing', () => {
        expect(getMetaData()).toEqual([])
    })

    it('accepts wrapper attributes authored as a YAML mapping', () => {
        // The natural way to write it, and it used to throw
        // `attrs.map is not a function`.
        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/m.html',
                            add_to_page: '/index.html',
                            content_wrapper_attributes: {
                                class: 'hero',
                                'data-role': 'banner',
                            },
                        },
                        content: '<h1>M</h1>',
                    },
                ],
            })
        )

        expect(indexPage.content).toContain(
            '<section class="hero" data-role="banner">'
        )
    })

    it('ignores wrapper attributes of an unusable type', () => {
        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/s.html',
                            add_to_page: '/index.html',
                            content_wrapper_attributes: 'class=hero',
                        },
                        content: '<h1>S</h1>',
                    },
                ],
            })
        )

        expect(indexPage.content).toContain('<section>')
    })

    it('skips list entries that have no attribute name', () => {
        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/p.html',
                            add_to_page: '/index.html',
                            content_wrapper_attributes: [
                                { value: 'orphan' },
                                { attribute: 'id', value: 'kept' },
                            ],
                        },
                        content: '<h1>P</h1>',
                    },
                ],
            })
        )

        expect(indexPage.content).toContain('<section id="kept">')
    })

    it('escapes quotes in attribute values', () => {
        const indexPage = indexOf(
            getMetaData({
                pagesData: [
                    { meta: { href: '/index.html' }, content: 'Main' },
                    {
                        meta: {
                            href: '/q.html',
                            add_to_page: '/index.html',
                            content_wrapper_attributes: {
                                title: 'a "quoted" value',
                            },
                        },
                        content: '<h1>Q</h1>',
                    },
                ],
            })
        )

        expect(indexPage.content).toContain(
            '<section title="a &quot;quoted&quot; value">'
        )
    })
})
