import React from 'react'
import styled from 'styled-components'

// Import typefaces
import 'typeface-montserrat'
import 'typeface-merriweather'

import profilePic from '../assets/jan.jpg'
import { rhythm } from '../utils/typography'

const Avatar = styled.img`
  margin-right: ${rhythm(1 / 2)};
  margin-bottom: 0;
  width: ${rhythm(2)};
  height: ${rhythm(2)};
  border-radius: 100%;
`
const Wrapper = styled.div`
  display: flex;
  margin-bottom: ${rhythm(2.5)};
`
const Blurb = styled.p`
  text-align: left;
  margin-bottom: 0;
`

class Bio extends React.Component {
  render() {
    return (
      <Wrapper>
        <Avatar src={profilePic} alt="Jan Akerman"/>
        <div>
          <Blurb>Senior Full Stack Developer @ <a href="https://www.scottlogic.com/">Scott Logic</a>. London, UK.</Blurb>
          <Blurb>Dev - DevOps - Java - Javascript - Kubernetes</Blurb>
        </div>
      </Wrapper>
    )
  }
}

export default Bio
