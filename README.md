# 11ty-wordpress-graphql
My messing around with Eleventy using WordPress GraphQL to generate a site...

# Please Note...
I am absolutely not a developer. Or at least I haven't been for at least 12 years. And even then I was more of a bug fixer.
So this might well be a horrible way to do things. Feel free to let me know of a better way, but be kind :)

This is my first node.js foray, my first 11ty foray, and first public github project too...

Anyway, that said, if you find the information useful then that's cool :)

Much of this is heavily inspired by https://www.webstoemp.com/blog/headless-cms-graphql-api-eleventy/

# Customize the Main Layout
In _includes/layouts/layout.njk you'll find an image tag which loads default-logo-changeme.png from the assets/images subdirectory. This is the Most Useful logo and you'll likely want to change that to your own site logo. Please do :)

Also, slightly further down that file, change your site title and site description

Change the copyright details in the footer section.

I've included some Matomo website tracking script in the footer area because I use Matomo and I highly recommend it. If you don't use Matomo delete this, or set config.useMatomo to false. If you do wish to use it, set config.matomoURL to your Matomo installation.

See the demo-config.json and the corresponding section in this document for more explanation.

# Note: setup a config.json in your _data directory

In order to make this a little bit more generic I have included the ability / necessity to specify the GraphQL endpoint and a few others.

I previously specified this in the environment but it's cumbersome. Now you need to create a config.json file which
contains the configurable options. This is not included in the git repo because it's personal to you.

It will need to look something like this;
{
    "imgSource": [
        "http://your-development-machine.lan",
        "https://www.your-live-site.com"
    ],
    "graphqlUrl": "http://your-development-machine.lan/?graphql",
    "urlRewriterUrls": [
        "https://www.your-live-environment.com/",
        "http://your-development-machine.lan"
    ],
    "useCache": true,
    "useMatomo": true,
    "matomoUrl": "https://analytics.most-useful.com/",
    "useGoogleAnalytics": true,
    "googleAnalyticsCode": "Your Google Analytics V3 Code",
    "ignoreEmbeddedImages": false
}

I've done this so you can install it and don't have to worry about me updating anything that points to your GraphQL

# Setup your autoinject.json
I've included a sample autoinject.json which gives you an idea of what the adCodes plugin for injecting adCodes will do. Basically, you can inject any code at certain points in the generated pages using this file. You can have as many adcodes as you desire. The format is below;

[
    {
        "tag": "h2",
        "tagCounter": 1,
        "repeatEvery": 0,
        "position": "beforebegin",
        "adCode": "<!-- Ezoic - Above P1 - under_page_title -->\n<div id=\"ezoic-pub-ad-placeholder-178\"> </div>\n<!-- End Ezoic - Above P1 - under_page_title -->"
    },
    {
        "tag": "h2",
        "tagCounter": 2,
        "repeatEvery": 2,
        "adCode": "<!-- Ezoic - Above P2 - under_second_paragraph --><div id=\"ezoic-pub-ad-placeholder-179\"> <div><!-- End Ezoic - Above P2 - under_second_paragraph -->",
        "position": "beforebegin"
    },
]

The tag is any HTMLElement you can search for in Javascript. So it can be of the format h2 or h2#some-id or h2.some-class for example. Or div#some-id, or span.some-class for example. Anything.

tagCounter is how many of that tag to count before inserting the adCode.

repeatEvery allows you to specify a number of tags to count and then insert the same adCode again. Useful with something like Google Ads in between comments for example. With the repeat every, the code will be inserted at the first position specified in tagCounter and then every 'repeatEvery' occurences of that tag within the document.

position allows you to specify any position that insertAdjacentHTML accepts, such as beforebegin, beforeend, afterbegin and afterend.

adCode is the code you want injected. *Note* that due to JSON limitations the adCode MUST be all on one line though. You can specify \n in the code to add a newline into the inserted adcode.

Further details can be found at https://www.most-useful.com/eleventy-static-site-generator-from-wordpress.html