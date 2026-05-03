import React from 'react';
import helenphoto from '../assets/about-me-pic-helen.png';
export const AboutMeHelen = () => {
    return (
        <div>
            <h1>Helen</h1>
            <img
                src={helenphoto}
                alt="Helen"
                style={{ width: "200px"}}
                />
            <br/>
            {/* <p style={{paddingLeft: "300px", paddingRight: "300px"}}> 
            text here
            </p>*/}

            <p>
                Hi! My name is Helen!
                <br/>
                I am one of the developers of RateRoom and currently studying Computer Science at UB.
                <br/>
                My favorite game is Hollow Knight. I like collecting cans and drawing.
                <br/>
                Lately, I've been binge-watching The Apothecary Diaries.
                <br/>
                ദ്ദി(｡•̀ ,&lt;)~✩‧₊
            </p>
        </div>
    )
}; export default AboutMeHelen;

