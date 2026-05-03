import React from 'react'
import camPhoto from '../assets/CamBassLive.JPG'

const AboutMeCam = () => {
    return (
        <div>
            <h1>Cam</h1>
            <img
                src={camPhoto}
                alt="Cam"
                style={{ width: "200px"}}
            />

            <p>Hi! My name is Cam and I'm a 1st semester senior in Computer Science at UB!</p>
            <br/>
            <ul>
                <li>I produce music</li>
                <li>My personal artist name is C A M </li>
                <li>I'm also the vocalist and bassist in a hardcore/metalcore band named Deogen</li>
                <li>Every developer should use GitKraken for a visual git flow (*Not a sponsor*)</li>
            </ul>

        </div>
    )
}

export default AboutMeCam;