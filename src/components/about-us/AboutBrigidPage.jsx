import React from 'react'
import brigidPhoto from 'assets/about/AboutMe-Pic.JPG'

const AboutBrigidPage = () => {
    return (
        <div>
            <h1>Brigid</h1>
            <img
                src={brigidPhoto}
                alt="Brigid"
                style={{ width: "200px"}}
                />

            <p>Hello!! My name is Brigid in currently a Computer Science student at UB!!</p>
            <br/>
            <ul>
                <li>My favorite muppet is Gonzo!!!</li>
                <li>I'm always listening to music, my favorite artist is Hozier</li>
                <li>Recently, I love watching hockey (Go Bruins!) </li>
            </ul>

        </div>
    )
}; export default AboutBrigidPage;

