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
          <Blurb>Engineer @ <a href="https://form3.tech/">Form3</a>. UK.</Blurb>
          <Blurb>Github: [@janakerman](https://github.com/janakerman)</Blurb>
        </div>
      </Wrapper>
    )
  }
}

export default Bio
