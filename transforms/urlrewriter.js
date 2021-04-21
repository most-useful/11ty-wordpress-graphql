const config = require('../src/_data/config.json');
const {JSDOM} = require("jsdom");

function rewriteUrl(content, outputPath) {
    if ( !outputPath.endsWith(".html") ) {
        return content;
    }

    const dom = new JSDOM(content);
    const document = dom.window.document;

    const [...anchors] = document.querySelectorAll('a');
    
    anchors.forEach(anchor => {
        config.urlRewriterUrls.forEach(url => {
            if ( anchor.href.startsWith(url) ) {
                var reff = anchor.href.replace(url, "/");
                anchor.href = reff;
            } 
        });
    });

    return `<!doctype html>${document.documentElement.outerHTML}`;
}

module.exports = rewriteUrl;