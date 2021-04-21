const shortHash = require('shorthash2');
const {JSDOM} = require("jsdom");

function addIdsToHeaders(htmlstring = '', options = {} ) {
    const content = new JSDOM(htmlstring).window.document;
    let headers = content.querySelectorAll('h2, h3, h4, h5, h6');
    headers.forEach( header => {
        if ( header.getAttribute('id') == null || header.getAttribute('id') == "" ) {
            let newId = shortHash(header.innerHTML);
            header.setAttribute('id', newId);
        }
    });
    return content.documentElement.outerHTML;
}

function initialise( eleventyConfig, options = {} ) {
    eleventyConfig.addFilter('addHeaderIds', (content, opts) => {
        return addIdsToHeaders(content, {...options, ...opts} );
    });
}

module.exports = {
    initArguments: {},
    configFunction: initialise
};