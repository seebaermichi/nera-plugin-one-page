import path from 'path'
import { load } from 'cheerio'
import { getConfig } from '@nera-static/plugin-utils'

const CONFIG_PATH = path.resolve(process.cwd(), 'config/one-page.yaml')
const config = getConfig(CONFIG_PATH) || {}

const nameProp = config.property_name || 'add_to_page'
const orderProp = config.order_property || 'add_to_page_order'
const anchorProp = config.anchor_id_property || 'anchor_id'
const tagProp = config.content_wrapper_tag_property || 'content_wrapper_tag'
const attrProp =
    config.content_wrapper_attributes_property || 'content_wrapper_attributes'

function extractSections(pages) {
    return pages
        .filter(({ meta }) => meta?.[nameProp])
        .map(({ meta, content }) => ({
            target: meta[nameProp],
            order: meta[orderProp] ?? 1,
            anchorId: meta[anchorProp] ?? null,
            wrapperTag: meta[tagProp] ?? 'section',
            wrapperAttrs: meta[attrProp] ?? [],
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
        .map(({ attribute, value }) => `${attribute}="${value}"`)
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
    const sections = extractSections(data.pagesData)
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
        const mergedSections = grouped[meta.href]
        if (!mergedSections) return { meta, content }

        return {
            meta,
            content: buildMergedContent(content, mergedSections),
        }
    })
}
