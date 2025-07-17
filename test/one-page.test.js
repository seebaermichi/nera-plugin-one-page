import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getMetaData } from '../index.js'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const TEST_DIR = path.resolve(os.tmpdir(), 'nera-plugin-one-page-test')

const CONFIG_YAML = `
property_name: add_to_page
order_property: add_to_page_order
anchor_id_property: anchor_id
content_wrapper_tag_property: content_wrapper_tag
content_wrapper_attributes_property: content_wrapper_attributes
`

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

beforeAll(async () => {
    await fs.mkdir(path.join(TEST_DIR, 'config'), { recursive: true })
    await fs.writeFile(path.join(TEST_DIR, 'config/one-page.yaml'), CONFIG_YAML)
    process.chdir(TEST_DIR) // Make sure config gets picked up
})

afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true })
})

describe('OnePagePlugin', () => {
    it('merges content into the correct page with proper anchor and wrappers', () => {
        const result = getMetaData({ pagesData: SAMPLE_PAGES })

        const indexPage = result.find((p) => p.meta.href === '/index.html')
        expect(indexPage.content).toContain('<a id="about-us"></a>')
        expect(indexPage.content).toContain('<a id="service"></a>')
        expect(indexPage.content).toContain('<div>')
        expect(indexPage.content).toContain('<section class="section-service">')
        expect(indexPage.content).toMatch(/About content[\s\S]*Service content/)
    })

    it('uses <section> as default wrapper if none is specified', () => {
        const pagesData = [
            {
                meta: { href: '/index.html' },
                content: 'Main',
            },
            {
                meta: {
                    href: '/foo.html',
                    add_to_page: '/index.html',
                    add_to_page_order: 1,
                },
                content: '<h1>Foo</h1>\nFoo content',
            },
        ]

        const result = getMetaData({ pagesData })
        const indexPage = result.find((p) => p.meta.href === '/index.html')

        expect(indexPage.content).toContain('<section>')
        expect(indexPage.content).toContain('<a id="foo"></a>')
    })

    it('skips anchor generation if no h1 is found and no anchor_id provided', () => {
        const pagesData = [
            {
                meta: { href: '/index.html' },
                content: 'Main',
            },
            {
                meta: {
                    href: '/bar.html',
                    add_to_page: '/index.html',
                    add_to_page_order: 1,
                },
                content: 'This has no h1 at all.',
            },
        ]

        const result = getMetaData({ pagesData })
        const indexPage = result.find((p) => p.meta.href === '/index.html')

        expect(indexPage.content).not.toContain('<a id=')
    })

    it('falls back to default config if config file is missing', async () => {
        // Remove config file temporarily
        await fs.rm(path.join(TEST_DIR, 'config/one-page.yaml'))

        const pagesData = [
            {
                meta: { href: '/index.html' },
                content: 'Main',
            },
            {
                meta: {
                    href: '/baz.html',
                    add_to_page: '/index.html',
                    add_to_page_order: 1,
                },
                content: '<h1>Baz</h1>\nBaz content',
            },
        ]

        const result = getMetaData({ pagesData })
        const indexPage = result.find((p) => p.meta.href === '/index.html')

        expect(indexPage.content).toContain('<section>')
        expect(indexPage.content).toContain('<a id="baz"></a>')
    })
})
