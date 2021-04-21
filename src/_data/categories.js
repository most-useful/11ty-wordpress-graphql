/** This data collector fetches the WordPress categories */

const fetch = require("node-fetch");
const path = require("path");
const flatCache = require('flat-cache');
const config = require("./config.json");

const CACHE_KEY = 'categories';
const CACHE_FOLDER = path.resolve("./.cache");
const CACHE_FILE = "categories.json";


async function requestCategories() {

    if (typeof config === 'undefined' || typeof config.graphqlUrl === 'undefined') {
        throw new Error("You must define graphqlUrl in config.json in your _data directory");
    }
    // Check the cache first
    const cache = flatCache.load(CACHE_FILE, CACHE_FOLDER);
    const cachedItems = cache.getKey(CACHE_KEY);

    if ( config.useCache && cachedItems ) {
        console.log("Category cache found, using that instead of the GraphQL API. Remove " + CACHE_FOLDER + "/" + CACHE_KEY + " to force a reload");
        return cachedItems;
    }

    let afterCursor = ""; 
    let itemsPerRequest = 100;
    let makeNewQuery = true;   // Thsi will be true when we fetch the whole lot but we're just playing now
    let categories = [];

    while ( makeNewQuery ) {
        console.log(`CATEGORIES Trying to fetch ${itemsPerRequest} items`);
        try {
            const data = await fetch(config.graphqlUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    query: `{
                                categories(first: ${itemsPerRequest}, after: "${afterCursor}") {
                                    nodes {
                                        categoryId
                                        description
                                        name
                                        slug
                                        count
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
                throw new Error("Aborting category fetch due to error from GraphQL query");
            }

            categoryInfo = response.data.categories.pageInfo;
            if ( categoryInfo.hasNextPage ) {
                makeNewQuery = true;
                afterCursor = categoryInfo.endCursor;
            } else {
                makeNewQuery = false;
            }

            categories = categories.concat(response.data.categories.nodes);
            
        } catch ( error ) {
            throw new Error(error);
        }
    }

    // Format posts for returning
    const categoriesFormatted = categories.map((item) => {
        return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description,
            count: item.count
        };
    });

    if ( categoriesFormatted.length ) {
        cache.setKey(CACHE_KEY, categoriesFormatted);
        cache.save();
    }
    return categoriesFormatted;
}

module.exports = requestCategories;
