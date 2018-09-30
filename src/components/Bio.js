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

class Bio extends React.Component {
  render() {
    return (
      <div
        style={{
          display: 'flex',
          marginBottom: rhythm(2.5),
        }}
      >
        <Avatar src={profilePic} alt="Jan Akerman"/>
        <p>
          Senior Full Stack Developer @ <a href="https://www.scottlogic.com/">Scott Logic</a>. London, UK.{' '}
        </p>
      </div>
    )
  }
}

export default Bio
