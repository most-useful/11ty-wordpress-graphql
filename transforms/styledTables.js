/** This function will add WordPress styled tables to the header IF the content contains a table */
const {JSDOM} = require("jsdom");

function addTableStyle(content, outputPath) {
    if ( !outputPath.endsWith(".html") ) {
        return content;
    }

    const dom = new JSDOM(content);
    const document = dom.window.document;

    const [...embeddedTables] = document.querySelectorAll('figure.wp-block-table');
    let foundTable = embeddedTables.length > 0 ? true : false;

    if ( foundTable ) {
        let htmlHead = document.querySelector('head');
        let newStyle = document.createElement('link');
        newStyle.setAttribute('rel', 'preload');
        newStyle.setAttribute('as', 'style')
        newStyle.setAttribute('type', 'text/css');
        newStyle.setAttribute('href', '/assets/css/tables.css');
        newStyle.setAttribute('onload', "this.onload=null;this.rel='stylesheet'");
        htmlHead.appendChild(newStyle);
        
        let noScript = document.createElement('noscript');
        let linkRel = document.createElement('link');
        linkRel.setAttribute('rel', 'stylesheet');
        linkRel.setAttribute('href', '/assets/css/tables.css');
        noScript.appendChild(linkRel);
        htmlHead.appendChild(noScript);

        return `<!doctype html>${document.documentElement.outerHTML}`;
    } else {
        return content;
    }
}

module.exports = addTableStyle;