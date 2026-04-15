import React from 'react';

const AboutUsPage = () => {
    const baseUrl = process.env.PUBLIC_URL || '';

    return (
        <div>
            <h1>Meet the Developers</h1>
            <a href={`${baseUrl}/about-brigid`}>
                Brigid
            </a>
            <br/>
            <a href={`${baseUrl}/about-jill`}>
                Jill
            </a>
            <br/>
            <a href={`${baseUrl}/about-helen`}>
                Helen
            </a>
            <br/>
            <a href={`${baseUrl}/about-jack`}>
                Jack
            </a>
            <br/>
            <a href={`${baseUrl}/about-cam`}>
                Cam
            </a>
            <br/>
        </div>
    );
};

export default AboutUsPage;

