/** This function will download images from your wordpress site and make them served locally */
/* Note you must set the img src prefix to your wordpress site otherwise they will be treated as external
   and won't be remapped appropriately, similarly if you don't want them served from your static site, just
   don't set any imgSource elements in the config file */

const {JSDOM} = require("jsdom");
const config = require('../_data/config.json');
const imageShortcode = require("./imageShortcode");

function htmlToElement(html, document) {
    let temp = document.createElement('template');
    html = html.trim(); // Never return a space text node as a result
    temp.innerHTML = html;
    return temp.content.firstChild;
}

async function analyseImages(content) {
    if ( typeof config.ignoreEmbeddedImages != 'undefined' && config.ignoreEmbeddedImages ) {
        console.log("Ignoring embedded images as per config.ignoreEmbeddedImages");
        return content;
    }
    const dom = new JSDOM(content);
    const document = dom.window.document;

    const [...images] = document.querySelectorAll('img');

    for (imgCount = 0 ; imgCount < images.length ; imgCount++ ) {
        let image = images[imgCount];
        // Go through this and use the 11ty image generator
        // This is needed unless you plan to use the original WordPress library structure
        // Which you could. And it might be wiser to stick with that, this is a bit kludgy at the moment.

        // TODO: This needs a lot of work. It is necessary to run this through 11ty image though because otherwise
        // the image won't be downloaded and available statically. However, this will rewrite the tag into <picture>
        // format and that may not be desirable if for example the image already specifies responsive selectors.
        // I may need to look for that and adjust the logic accordingly
        //console.log("Image SRC: " + image.src);
        for( y = 0 ; y < config.imgSource.length ; y++ ) {
            imgSourceToReplace = config.imgSource[y];
            if ( image.getAttribute('src').startsWith(imgSourceToReplace) ) {
                if ( image.getAttribute('alt') == null || image.getAttribute('alt') == "" ) {
                    if ( image.getAttribute('title') != null && image.getAttribute('title') != "" ) {
                        image.setAttribute('alt', image.getAttribute('title'));    // Not sure why some of these are not giving alts even though they're set in the source
                    }
                }
                //console.log("Replacing image with src " + image.getAttribute('src') + ", alt='" + image.getAttribute('alt') + "'") ;
                // TODO: This needs to be better, images won't necessarily be this size and this could break layout
                // TODO: Do we need to capture the style of the original image? Probably.
                let imgId = image.getAttribute('id');
                let imgClass = image.getAttribute('class');
                let imgStyle = image.getAttribute('style');
                let imgWidth = image.getAttribute('width');
                let imgHeight = image.getAttribute('height');
                let imgAttributes = new Object();
                if ( imgId != null && imgId != "" ) {
                    imgAttributes.id = imgId;
                }
                if ( imgClass != null && imgClass != "" ) {
                    imgAttributes.class = imgClass;
                }
                if ( imgStyle != null && imgStyle != "" ) {
                    imgAttributes.style = imgStyle;
                }
                if ( imgWidth != null && imgWidth != "" ) {
                    imgAttributes.width = imgWidth;
                }
                if ( imgHeight != null && imgHeight != "" ) {
                    imgAttributes.height = imgHeight;
                }
                let newImg = await imageShortcode(image.getAttribute('src'), image.getAttribute('alt'), "100vw", imgAttributes);
                image.parentNode.replaceChild(htmlToElement(newImg, document), image);
            }            
        }
    }
    return document.documentElement.outerHTML;
}

module.exports = analyseImages;