import React, { Children } from 'react'
import { Link, graphql } from 'gatsby'
import get from 'lodash/get'
import Helmet from 'react-helmet'

import Bio from '../components/Bio'
import Layout from '../components/layout'
import { rhythm } from '../utils/typography'

class BlogIndex extends React.Component {
  render() {
    const siteTitle = get(this, 'props.data.site.siteMetadata.title')
    const siteDescription = get(
      this,
      'props.data.site.siteMetadata.description'
    )
    const posts = get(this, 'props.data.allMarkdownRemark.edges').map(n => n.node)
    const externalPosts = get(this, 'props.data.site.siteMetadata.externalPosts')
    const allPosts = posts.concat(externalPosts)
      .sort((p1, p2) => Date.parse(p2.frontmatter.date) - Date.parse(p1.frontmatter.date))
  

    return (
      <Layout location={this.props.location}>
        <Helmet
          htmlAttributes={{ lang: 'en' }}
          meta={[{ name: 'description', content: siteDescription }]}
          title={siteTitle}
        />
        <Bio />
        {allPosts.map(post => this.renderInternalPost(post))}
      </Layout>
    )
  }

  renderInternalPost(post) {
    return this.renderPost({
      title: get(post, 'frontmatter.title') || post.fields.slug,
      slug: post.fields.slug,
      url: post.url,
      domain: post.domain,
      date: post.frontmatter.date,
      excerpt: post.excerpt,
      readingTime: post.fields.readingTime.text,
    })
  }

  renderPost({ excerpt, title, date, readingTime, slug, url, domain}) {
    title = slug ? title : `${title} [${domain}]` // Use slug to check if internal post.

    const LinkComponent = slug ? <Link style={{ boxShadow: 'none', }} to={slug}>{title}</Link> :
       <a style={{ boxShadow: 'none', }} href={url}>{title}</a>
    return (
      <div key={slug || url}>
        <h3
          style={{
            marginBottom: rhythm(1 / 4),
          }}
        >
        { LinkComponent }
        </h3>
        <small>{date}</small> - <small>{readingTime}</small>
        <p dangerouslySetInnerHTML={{ __html: excerpt }} />
      </div>
    )
  }
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        externalPosts {
          url
          domain
          excerpt
          frontmatter {
            date(formatString: "DD MMMM, YYYY")
            title
          }
          fields {
            readingTime {
              text
            }
          }
        }
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "DD MMMM, YYYY")
            title
          }
          fields {
            readingTime {
              text
            }
          }
        }
      }
    }
  }
`
