import React from 'react';

const NoResultsBubble = ({children}) => {
    return (
        <div style={{width: "100%", height: "30vh", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <div className="bubble-container">
                <div className="main-bubble">
                    {children}
                </div>
                <div className="bubble-dot medium-dot"></div>
                <div className="bubble-dot small-dot"></div>
            </div>
        </div>
    );
};

export default NoResultsBubble;