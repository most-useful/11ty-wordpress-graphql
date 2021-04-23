const imageShortcode = require("./src/plugins/imageShortcode.js");   
const readerBar = require('eleventy-plugin-reader-bar')
const readingTime = require('eleventy-plugin-reading-time');
const urlrewriter = require('./transforms/urlrewriter');
const wpTables = require('./transforms/styledTables');
const pluginTOC = require('eleventy-plugin-nesting-toc');
const addIds = require('./src/plugins/addIds');
const injectAds = require('./src/plugins/injectAds');

module.exports = (eleventyConfig, options = {}) => {

    eleventyConfig.addPlugin(readingTime);
    eleventyConfig.addPlugin(readerBar);
    eleventyConfig.addPlugin(pluginTOC);
    eleventyConfig.addPlugin(addIds);
    eleventyConfig.addPlugin(injectAds);

    eleventyConfig.addTransform('urlrewrite', urlrewriter);
    eleventyConfig.addTransform('styledTables', wpTables);

    eleventyConfig.addFilter('date', require('./filters/nunjucks-date-filter.js'));
    
    eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
    eleventyConfig.addLiquidShortcode("image", imageShortcode);
    eleventyConfig.addJavaScriptFunction("image", imageShortcode);

    eleventyConfig.addPassthroughCopy("img");
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy({ "assets/favicon": "/" });

    eleventyConfig.setTemplateFormats([
        "njk"
      ]);

    return {
        dir: {
            input: "src",
            output: "public_html"
        },
        passthroughFileCopy: true
    }
}