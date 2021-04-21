const {JSDOM} = require("jsdom");
const adCodes = require("../_data/autoinject.json");

function injectAdCode(htmlstring = '', outputPath ) {
    if ( !outputPath.endsWith('.html') ) {
        return htmlstring;
    }
    const content = new JSDOM(htmlstring).window.document;
    let selectors = new Object;     // It's sort of a hashmap really
    let selectorsCount = [];
    adCodes.forEach ( adCode => {
        if ( typeof selectors[adCode.tag] == 'undefined' || selectors[adCode.tag].length == 0 ) {
            selectors[adCode.tag] = [];
        }
        selectors[adCode.tag] = selectors[adCode.tag].concat(adCode);
        selectorsCount[adCode.tag] = 0; // This is used for picking which adCode to add.
    });

    // Iterate through our list of adCodes and try to find relevant elements to inject around
    let selKeys = Object.keys(selectors);
    for ( var x = 0 ; x < selKeys.length ; x++ ) {
        let elementKey = selKeys[x];
        let elements = content.querySelectorAll(elementKey);
        elements.forEach( element => {
            if ( element.classList.contains("no-inject")) {
                return;
            }
            let headerNum = selectorsCount[elementKey];
            selectorsCount[elementKey] = headerNum + 1;
        
            // So now we know which HTML tag it is, and which number of the tag has been seen previously
            // Now we get to fetch the adCode for this specific tag.
            selectors[elementKey].forEach( tagNameConfig => {
                if ( tagNameConfig.repeatEvery != 0 ) {
                    // This if statement is to find adCodes that repeat every so often.
                    if ( headerNum +1 > tagNameConfig.tagCounter ) {
                        // Don't display unless it's beyond the start
                        if ( (headerNum + 1 - tagNameConfig.tagCounter) % tagNameConfig.repeatEvery == 0 ) {
                            // If the first time to show this code is the third occurence of an h2 for example,
                            // Then we don't show unless this h2 is the third or greater that we've seen.
                            // Then if we want to show every third one after that, we take away 3 from this counter and see if there's a remainder
                            // ie, if this is the the 5th h2 in the document
                            // 5 - 3 = 2. 2 % 3 == 2 so we won't show.
                            // 6 - 3 = 3. 3 % 3 == 0, so we do show.
                            element.insertAdjacentHTML(tagNameConfig.position, tagNameConfig.adCode);
                        }
                    }
                }
                // This if statement is to find adCodes that are inserted once
                if ( tagNameConfig.tagCounter == headerNum + 1 ) { // headerNum is zero based, tagCounter is 1 based (since its based more on language)
                    element.insertAdjacentHTML(tagNameConfig.position, tagNameConfig.adCode);
                }
            });
        });
    }
    return content.documentElement.outerHTML;
}

function initialise( eleventyConfig, options = {} ) {
    eleventyConfig.addTransform('injectAdCode', (content, outputPath) => {
        return injectAdCode(content, outputPath );
    });
}

module.exports = {
    initArguments: {},
    configFunction: initialise
};