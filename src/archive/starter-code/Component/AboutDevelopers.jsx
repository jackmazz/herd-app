import React from 'react';

const AboutDevelopers = () => {
    const baseUrl = process.env.PUBLIC_URL || '';

    return (
        <div>
            <h1>Meet the Developers</h1>
            <a href={`${baseUrl}/about-me-brigid`}>
                Brigid
            </a>
            <br/>
            <a href={`${baseUrl}/about-me-jill`}>
                Jill
            </a>
            <br/>
            <a href={`${baseUrl}/about-me-helen`}>
                Helen
            </a>
            <br/>
            <a href={`${baseUrl}/about-me-jack`}>
                Jack
            </a>
            <br/>
            <a href={`${baseUrl}/about-me-cam`}>
                Cam
            </a>
            <br/>
        </div>
    );
}

export default AboutDevelopers;