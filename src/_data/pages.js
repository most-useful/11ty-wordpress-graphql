const fetch = require("node-fetch");
const path = require("path");
const flatCache = require('flat-cache');
const config = require("./config.json");
const remapImages = require('../plugins/remapImages');

const CACHE_KEY = 'blogpages';
const CACHE_FOLDER = path.resolve("./.cache");
const CACHE_FILE = "blogpages.json";

async function requestPages() {

    // Check the cache first
    const cache = flatCache.load(CACHE_FILE, CACHE_FOLDER);
    const cachedItems = cache.getKey(CACHE_KEY);

    if ( config.useCache && cachedItems ) {
        console.log("PAGE Cache file found, using that instead of the GraphQL API. Remove " + CACHE_FOLDER + "/" + CACHE_KEY + " to force a reload");
        return cachedItems;
    }

    let afterCursor = ""; 
    let itemsPerRequest = 100;
    let makeNewQuery = true;   // Thsi will be true when we fetch the whole lot but we're just playing now
    let pages = [];

    while ( makeNewQuery ) {
        console.log(`PAGES Trying to fetch ${itemsPerRequest} items`);
        try {
            const data = await fetch(config.graphqlUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    query: `{
                                pages(first: ${itemsPerRequest}, after: "${afterCursor}") {
                                    nodes {
                                        title
                                        slug
                                        id
                                        content(format: RENDERED)
                                    }
                                    pageInfo {
                                        hasNextPage
                                        hasPreviousPage
                                        endCursor
                                        startCursor
                                    }
                                }
                            }`
                })
            });

            const response = await data.json();

            if ( response.errors ) {
                let errors = response.errors;
                errors.map((error) => {
                    console.log(error.message);
                });
                throw new Error("Aborting due to error from GraphQL query");
            }

            pageInfo = response.data.pages.pageInfo;
            if ( pageInfo.hasNextPage ) {
                makeNewQuery = true;
                afterCursor = pageInfo.endCursor;
            } else {
                makeNewQuery = false;
            }

            pages = pages.concat(response.data.pages.nodes);
            
        } catch ( error ) {
            throw new Error(error);
        }
    }

    // Go through the content looking for WordPress media library images to download and remap into locally stored images
    for ( x = 0 ; x < pages.length ; x++ ) {
        thePage = pages[x];
        thePage.content = await remapImages(thePage.content);
    }
    // Format pages for returning
    const pagesFormatted = pages.map((item) => {
        return {
            id: item.id,
            title: item.title,
            slug: item.slug,
            body: item.content
        };
    });

    if ( pagesFormatted.length ) {
        cache.setKey(CACHE_KEY, pagesFormatted);
        cache.save();
    }
    return pagesFormatted;
}

module.exports = requestPages;