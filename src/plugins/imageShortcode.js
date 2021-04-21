const path = require("path");
const Image = require("@11ty/eleventy-img");

async function imageShortcode(src, alt, sizes, attributes = {}) {

    let imgOpts = {
        widths: [300, 600, 1000],
        formats: ["avif", "jpeg", "webp"],
        filenameFormat: function(id, src, width, format, options) {
            src = src.split("?")[0];    // Get rid of any additional querystrings
            const extension = path.extname(src);
            const name = path.basename(src, extension);
            return `${name}-${width}w.${format}`;
        },
        cacheOptions: {
            // if a remote image URL, this is the amount of time before it fetches a fresh copy
            duration: "7d",
        
            // project-relative path to the cache directory
            directory: ".remote-image-cache",
        
            removeUrlQueryParams: true,
          }
    };

    let metadata = await Image(src, imgOpts);
    
    let imageAttributesOrig = {
        alt,
        sizes,
        loading: "lazy",
        decoding: "async",
    };

    let imageAttributes = {
        ...imageAttributesOrig,
        ...attributes
    }

    // You bet we throw an error on missing alt in `imageAttributes` (alt="" works okay)
    return Image.generateHTML(metadata, imageAttributes);
}

module.exports = imageShortcode;