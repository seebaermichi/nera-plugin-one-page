const { getConfig } = require('../plugin-helper')

module.exports = (() => {
    const H1_REGEX = '^<(h1[^>]*)>(.[^<]*)'

    const config = getConfig(`${__dirname}/config/one-page.yaml`)
    const nameProperty = config.property_name || 'add_to_page'
    const orderProperty = config.order_property || 'add_to_page_order'
    const anchorIdProperty = config.anchor_id_property || 'anchor_id'
    const tagProperty = config.content_wrapper_tag_property || 'content_wrapper_tag'
    const attributesProperty = config.content_wrapper_attributes_property || 'content_wrapper_attributes'

    const getOnePages = pagesToAdd => {
        const onePages = {}
        pagesToAdd.forEach(({ meta }) => {
            const key = meta[nameProperty]

            if (!onePages[key]) onePages[key] = []
        })

        return onePages
    }

    const getContentToAdd = pagesToAdd => {
        return pagesToAdd.map(({ meta, content }) => ({
            page: meta[nameProperty],
            order: meta[orderProperty] || 1,
            anchorId: meta[anchorIdProperty] || false,
            tag: meta[tagProperty] || 'section',
            attributes: meta[attributesProperty] || [],
            content
        }))
    }

    const setAnchor = (anchorId, content) => {
        let id = ''

        if (anchorId) {
            id = anchorId
        } else {
            const regex = new RegExp(H1_REGEX, 'gm')
            const matches = regex.exec(content)

            id = matches[2].toLowerCase().replace(/ /g, '-')
        }

        return `<a id="${id}"></a>\n${content}`
    }

    const openingTag = (tag, attributes) => {
        if (tag === '') return ''

        const attributesString = attributes.map(({ attribute, value }) => `${attribute}="${value}"`).join(' ')

        return `<${[tag, attributesString].join(' ')}>`
    }

    const closingTag = tag => tag !== '' ? `</${tag}>\n` : ''

    const mergeContent = (pagesData, onePages) => {
        return pagesData.map(({ meta, content }) => {
            if (onePages[meta.href]) {
                content += onePages[meta.href].map(({ content, anchorId, tag, attributes }) => {
                    return `${openingTag(tag, attributes)}
                            ${setAnchor(anchorId, content)}
                            ${closingTag(tag)}`
                })
                    .join('')
            }

            return { meta, content }
        })
    }

    const getMetaData = data => {
        const pagesToAdd = data.pagesData.filter(({ meta }) => meta[config.property_name])
        const onePages = getOnePages(pagesToAdd)
        const contentToAdd = getContentToAdd(pagesToAdd)

        Object.keys(onePages).forEach(key => {
            onePages[key] = contentToAdd.filter(({ page }) => page === key)
                .sort((a, b) => a.order - b.order)
        })

        return mergeContent(data.pagesData, onePages)
    }

    return {
        getMetaData
    }
})()
