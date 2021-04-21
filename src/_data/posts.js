const fetch = require("node-fetch");
const path = require("path");
const flatCache = require('flat-cache');
const config = require('./config.json');

const CACHE_KEY = 'blogposts';
const CACHE_FOLDER = path.resolve("./.cache");
const CACHE_FILE = "blogposts.json";
const remapImages = require('../plugins/remapImages');

function sortComments( a, b ) {
    let aDate = new Date(a.date);
    let bDate = new Date(b.date);
    let aDateMillis = aDate.getMilliseconds();
    let bDateMillis = bDate.getMilliseconds();

    return aDateMillis - bDateMillis;
}

function unflatten(arr) {
    var tree = [],
        mappedArr = {},
        arrElem,
        mappedElem;

    // First map the nodes of the array to an object -> create a hash table.
    for(var i = 0, len = arr.length; i < len; i++) {
      arrElem = arr[i];
      mappedArr[arrElem.id] = arrElem;
      mappedArr[arrElem.id]['children'] = [];
    }


    for (var id in mappedArr) {
      if (mappedArr.hasOwnProperty(id)) {
        mappedElem = mappedArr[id];
        // If the element is not at the root level, add it to its parent array of children.
        if (mappedElem.parentId) {
          mappedArr[mappedElem['parentId']]['children'].push(mappedElem);
        }
        // If the element is at the root level, add it to first level elements array.
        else {
          tree.push(mappedElem);
        }
      }
    }
    return tree;
  }

  function createSortedComments( commentTree, output = [], depth = 1) {

    commentTree.forEach( comment => {
        let newComment = JSON.parse(JSON.stringify(comment));   // Copy the comment to a new comment because we don't want the children
        newComment.depth = depth;
        newComment.children = [];
        output.push(newComment);
        if ( comment.children.length > 0 ) {
            createSortedComments(comment.children, output, depth + 1);
        }
    });

    return output;

  }

async function requestPosts() {

    // Check the cache first
    const cache = flatCache.load(CACHE_FILE, CACHE_FOLDER);
    const cachedItems = cache.getKey(CACHE_KEY);

    if ( config.useCache ) {
        if ( cachedItems ) {
            console.log("POSTS Cache file found, using that instead of the GraphQL API. Remove " + CACHE_FOLDER + "/" + CACHE_KEY + " to force a reload");
            return cachedItems;
        }
    }
    let afterCursor = ""; 
    let itemsPerRequest = 100;
    let makeNewQuery = true;   // Thsi will be true when we fetch the whole lot but we're just playing now
    let posts = [];

    while ( makeNewQuery ) {
        console.log(`POSTS Trying to fetch ${itemsPerRequest} items`);
        
            const data = await fetch(config.graphqlUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    query: `{
                                posts(first: ${itemsPerRequest}, after: "${afterCursor}") {
                                    nodes {
                                        title
                                        featuredImage {
                                            node {
                                                sourceUrl
                                                altText
                                            }
                                        }
                                        slug
                                        modified
                                        excerpt
                                        id
                                        content(format: RENDERED)
                                        categories {
                                            nodes {
                                              slug
                                              name
                                            }
                                        }
                                        commentCount
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

            postInfo = response.data.posts.pageInfo;
            if ( postInfo.hasNextPage ) {
                makeNewQuery = true;
                afterCursor = postInfo.endCursor;
            } else {
                makeNewQuery = false;
            }
            posts = posts.concat(response.data.posts.nodes);
    }

    // Go through the content looking for WordPress media library images to download and remap into locally stored images
    for ( x = 0 ; x < posts.length ; x++ ) {
        thePost = posts[x];
        thePost.content = await remapImages(thePost.content);
    }

    // Go through the posts and get comments for those posts that have them. I tried doing this using one GraphQL
    // call above because it looks like it should work, but it was wildly unreliable...
    for ( x = 0 ; x < posts.length ; x++ ) {
        thePost = posts[x];
        if ( thePost.commentCount > 0 ) {
            let postID = thePost.id;
            const commentData = await fetch(config.graphqlUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    query: `{
                            post(id: "${postID}", idType: ID) {
                                comments(where: {orderby: COMMENT_DATE_GMT, order: ASC}, first: ${thePost.commentCount} ) {
                                  nodes {
                                    authorGravatarUrl
                                    author {
                                      node {
                                        url
                                        name
                                      }
                                    }
                                    id
                                    date
                                    content
                                    parentId
                                  }
                                }
                            }
                          }`
                })
            });

            const commentResponse = await commentData.json();

            if ( commentResponse.errors ) {
                let errors = commentResponse.errors;
                errors.map((error) => {
                    console.log(error.message);
                });
                throw new Error("Aborting comment fetching due to error from GraphQL query");
            }
            let comments = commentResponse.data.post.comments.nodes;
            const commentsFormatted = comments.map( comment => {
                return {
                    id: comment.id,
                    parentId: comment.parentId,
                    authorGravatarUrl: comment.authorGravatarUrl,
                    authorName: comment.author.node != null ? comment.author.node.name : "Unknown",
                    authorUrl: comment.author.node != null ? comment.author.node.url : "",
                    date: comment.date,
                    content: comment.content
                }
            });

            // This will sort into date order, but does not link replies to comments, or replies to replies
            //commentsFormatted.sort(sortComments);

            // This will thread the comments, but then creates a tree. Which is OK in here, but doesn't lend itself
            // to being displayed by Nunjucks or non-recursive templates.
            var commentTree = unflatten(commentsFormatted);

            sortedCommentsFinal = createSortedComments(commentTree);

            thePost.comments = sortedCommentsFinal;
        }
    }

    // Format posts for returning
    const postsFormatted = posts.map(item => {
        item.excerpt = item.excerpt.replace('<p>', '');
        item.excerpt = item.excerpt.replace('</p>', ''); // Would prefer excerpt as RAW format but need login for that
        return {
            id: item.id,
            date: item.modified,
            title: item.title,
            slug: item.slug,
            image: item.featuredImage.node.sourceUrl,
            imageAlt: item.featuredImage.node.altText,
            summary: item.excerpt,
            body: item.content,
            categories: item.categories.nodes,
            commentCount: item.commentCount,
            comments: item.comments
        };
    });

    if ( config.useCache && postsFormatted.length  ) {
        cache.setKey(CACHE_KEY, postsFormatted);
        cache.save();
    }

    return postsFormatted;
}

module.exports = requestPosts;