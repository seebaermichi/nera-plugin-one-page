import path from 'path'
import { load } from 'cheerio'
import { getConfig } from '@nera-static/plugin-utils'

/**
 * Resolved per call rather than at module scope, so edits to
 * config/one-page.yaml are picked up without restarting `npm run dev`.
 */
function getSettings() {
    const config =
        getConfig(path.resolve(process.cwd(), 'config/one-page.yaml')) || {}

    return {
        nameProp: config.property_name || 'add_to_page',
        orderProp: config.order_property || 'add_to_page_order',
        anchorProp: config.anchor_id_property || 'anchor_id',
        tagProp: config.content_wrapper_tag_property || 'content_wrapper_tag',
        attrProp:
            config.content_wrapper_attributes_property ||
            'content_wrapper_attributes',
    }
}

/**
 * Accepts either shape the wrapper attributes can plausibly be authored in:
 *
 *     content_wrapper_attributes:        content_wrapper_attributes:
 *         - attribute: class                 class: hero
 *           value: hero
 *
 * The mapping form is the natural thing to write and used to throw
 * `attrs.map is not a function`. Anything else is ignored with a warning
 * rather than taking the build down.
 */
function normalizeWrapperAttrs(attrs) {
    if (attrs == null) return []

    if (Array.isArray(attrs)) {
        return attrs
            .filter((entry) => entry && entry.attribute != null)
            .map((entry) => ({
                attribute: String(entry.attribute),
                value: entry.value ?? '',
            }))
    }

    if (typeof attrs === 'object') {
        return Object.entries(attrs).map(([attribute, value]) => ({
            attribute,
            value: value ?? '',
        }))
    }

    console.warn(
        `⚠️ one-page: ignoring content_wrapper_attributes of type ${typeof attrs} — expected a list or a mapping`
    )

    return []
}

function escapeAttributeValue(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function extractSections(pages, settings) {
    const { nameProp, orderProp, anchorProp, tagProp, attrProp } = settings

    return pages
        .filter(({ meta }) => meta?.[nameProp])
        .map(({ meta, content }) => ({
            target: meta[nameProp],
            order: meta[orderProp] ?? 1,
            anchorId: meta[anchorProp] ?? null,
            wrapperTag: meta[tagProp] ?? 'section',
            wrapperAttrs: normalizeWrapperAttrs(meta[attrProp]),
            content,
        }))
}

function buildAnchorId(content, fallbackId) {
    if (fallbackId) return fallbackId

    const $ = load(content)
    const h1 = $('h1').first().text().trim()

    if (!h1) return null
    return h1.toLowerCase().replace(/[^\w]+/g, '-')
}

function buildWrapper(tag, attrs = []) {
    if (!tag) return { open: '', close: '' }

    const attrString = attrs
        .map(
            ({ attribute, value }) =>
                `${attribute}="${escapeAttributeValue(value)}"`
        )
        .join(' ')
    const open = attrString ? `<${tag} ${attrString}>` : `<${tag}>`
    return { open, close: `</${tag}>` }
}

function buildMergedContent(content, sections = []) {
    const merged = sections
        .map((section) => {
            const anchorId = buildAnchorId(section.content, section.anchorId)
            const anchorTag = anchorId ? `<a id="${anchorId}"></a>\n` : ''
            const { open, close } = buildWrapper(
                section.wrapperTag,
                section.wrapperAttrs
            )

            return `${open}\n${anchorTag}${section.content}\n${close}`
        })
        .join('\n\n')

    return `${content}\n\n${merged}`
}

export function getMetaData(data) {
    // Same guard as page-pagination:54 and page-navigation:41. Without it a
    // missing pagesData surfaced as `Cannot read properties of undefined`.
    if (!data || !Array.isArray(data.pagesData)) {
        return []
    }

    const settings = getSettings()
    const sections = extractSections(data.pagesData, settings)
    const grouped = {}

    for (const section of sections) {
        if (!grouped[section.target]) grouped[section.target] = []
        grouped[section.target].push(section)
    }

    // Sort each group by order
    Object.values(grouped).forEach((sections) => {
        sections.sort((a, b) => a.order - b.order)
    })

    return data.pagesData.map(({ meta, content }) => {
        const mergedSections = grouped[meta?.href]
        if (!mergedSections) return { meta, content }

        return {
            meta,
            content: buildMergedContent(content, mergedSections),
        }
    })
}
