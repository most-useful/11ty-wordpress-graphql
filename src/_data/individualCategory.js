/** This data collector fetches all posts from each WordPress category */

const fetch = require("node-fetch");
const path = require("path");
const flatCache = require('flat-cache');
const config = require("./config.json");

const CACHE_KEY = 'individualCategories';
const CACHE_FOLDER = path.resolve("./.cache");
const CACHE_FILE = "individualCategories.json";

async function getIndividualCategoryListings() {
    // Check the cache first
        const cache = flatCache.load(CACHE_FILE, CACHE_FOLDER);
        const cachedItems = cache.getKey(CACHE_KEY);

        let afterCursor = "";
        let itemsPerRequest = 1;
        let makeNewQuery = true;   // Thsi will be true when we fetch the whole lot but we're just playing now
        let categoryPosts = [];
    
        if ( config.useCache && cachedItems ) {
            console.log("Individual category cache found, using that instead of the GraphQL API. Remove " + CACHE_FOLDER + "/" + CACHE_KEY + " to force a reload");
            return cachedItems;
        }
    
        try {
            while ( makeNewQuery ) {
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
                                    name
                                    slug
                                    description
                                    posts(first: 200) {
                                        nodes {
                                            date
                                            excerpt
                                            postId
                                            slug
                                            title
                                            featuredImage {
                                                node {
                                                altText
                                                sourceUrl
                                                }
                                            }
                                        }
                                    }
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
                categoryPosts = categoryPosts.concat(response.data.categories.nodes);
            }
        } catch ( error ) {
            throw new Error(error);
        }
    
        // Format posts for returning
        const categoryPostsFormatted = categoryPosts.map((item) => {
            return {
                id: item.categoryId,
                categoryName: item.name,
                categorySlug: item.slug,
                posts: item.posts.nodes
            };
        });
    
        if ( categoryPostsFormatted.length ) {
            cache.setKey(CACHE_KEY, categoryPostsFormatted);
            cache.save();
        }
        return categoryPostsFormatted;
    }
    
module.exports = getIndividualCategoryListings;