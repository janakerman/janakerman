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
    const posts = get(this, 'props.data.allMarkdownRemark.edges')
    const externalPosts = get(this, 'props.data.site.siteMetadata.externalPosts')
    const allPosts = posts.concat(externalPosts)
      .sort((p1, p2) => Date.parse(p1.Date) < Date.parse(p2.Date))
  

    return (
      <Layout location={this.props.location}>
        <Helmet
          htmlAttributes={{ lang: 'en' }}
          meta={[{ name: 'description', content: siteDescription }]}
          title={siteTitle}
        />
        <Bio />
        {allPosts.map(post => posts.includes(post) ? this.renderInternalPost(post) : this.renderExternalPost(post))}
      </Layout>
    )
  }

  renderInternalPost({ node }) {
    return this.renderPost({
      title: get(node, 'frontmatter.title') || node.fields.slug,
      slug: node.fields.slug,
      date: node.frontmatter.date,
      excerpt: node.excerpt,
      readingTime: node.fields.readingTime.text
    })
  }

  renderExternalPost({ Title, Url, Date, Excerpt, ReadingTime }) {
    return this.renderPost({
      title: `${Title} [External]`,
      slug: Url,
      date: Date,
      excerpt: Excerpt,
      readingTime: ReadingTime,
      LinkComponent: ({children, to, style}) => <a style={style} href={to}>{children}</a>
    })
  }

  renderPost({ excerpt, title, date, readingTime, slug, LinkComponent = Link }) {
    return (
      <div key={slug}>
        <h3
          style={{
            marginBottom: rhythm(1 / 4),
          }}
        >
          <LinkComponent style={{ boxShadow: 'none', }} to={slug}>
            {title}
          </LinkComponent>
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
        title
        description
        externalPosts {
          Date
          Url
          Excerpt
          Title
          ReadingTime
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
