module.exports = {
  siteMetadata: {
    title: 'Jan Akerman',
    author: 'Jan Akerman',
    description: 'Jack of all, master of some.',
    siteUrl: 'https://janakerman.co.uk/',
    externalPosts: [
      { 
        Title: 'Thoughts on Jest Snapshots',
        Url: 'https://blog.scottlogic.com/2017/09/01/thoughts-on-jest-snapshots.html',
        Date: '2017-09-01',
        Excerpt: 'Jest is a testing framework that provides the testing tools we now expect to see in a modern software project. It provides fast parallelised test running, with a familiar assertion syntax, built in code coverage, Snapshots and more. In this post, I’ll be investigating Snapshots and laying out some thoughts!',
        ReadingTime: '4 min read'
      },
      { 
        Title: 'Leadership Election with Apache Curator',
        Url: 'https://blog.scottlogic.com/2018/03/13/leadership-election-with-apache-curator.html',
        Date: '2018-03-13',
        Excerpt: 'Distributed computing is difficult, but fortunately it’s never been easier. Companies like Netflix, Facebook, LinkedIn, etc, have been solving difficult problems and open sourcing the solutions. This post is going to look at how we can easily implement distributed leadership election using Apache Curator.',
        ReadingTime: '7 min read'
      }
    ]
  },
  pathPrefix: '/janakerman',
  plugins: [
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-offline`,
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-feed`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/pages`,
        name: 'pages',
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          'gatsby-remark-prismjs',
          'gatsby-remark-copy-linked-files',
          'gatsby-remark-smartypants',
          'gatsby-remark-reading-time'
        ],
      },
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: "UA-136299323-1",
        head: false,
        anonymize: true,
        respectDNT: true,
        sampleRate: 5,
        siteSpeedSampleRate: 10,
        cookieDomain: "janakerman.co.uk",
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Gatsby Starter Blog`,
        short_name: `GatsbyJS`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/assets/gatsby-icon.png`,
      },
    },
    `gatsby-plugin-react-helmet`,
    {
      resolve: 'gatsby-plugin-typography',
      options: {
        pathToConfigModule: 'src/utils/typography',
      },
    },
  ],
}
