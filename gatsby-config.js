module.exports = {
  siteMetadata: {
    title: 'Jan Akerman',
    author: 'Jan Akerman',
    description: 'Jack of all, master of some.',
    siteUrl: 'https://janakerman.co.uk/',
    externalPosts: [
      { 
        url: 'https://blog.scottlogic.com/2017/09/01/thoughts-on-jest-snapshots.html',  
        excerpt: 'Jest provides fast parallelised test running, with a familiar assertion syntax, built in code coverage, Snapshots and more. In this post, I’ll be investigating Snapshots and laying out some thoughts...',
        domain: 'scottlogic.com',
        frontmatter: {
          title: 'Thoughts on Jest Snapshots',
          date: '2017-09-01',
          tags: ['Jest', 'Javascript']
        },
        fields: {
          readingTime: { text: '4 min read' },
        }
      },
      { 
        url: 'https://blog.scottlogic.com/2018/03/13/leadership-election-with-apache-curator.html',
        excerpt: 'This post is going to look at how we can easily implement distributed leadership election using Apache Curator...',
        domain: 'scottlogic.com',
        frontmatter: {
          title: 'Leadership Election with Apache Curator',
          date: '2018-03-13',
          tags: ['Apache Curator','Zookeeper', 'Java']
        },
        fields: {
          readingTime: { text: '7 min read' },        }
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
