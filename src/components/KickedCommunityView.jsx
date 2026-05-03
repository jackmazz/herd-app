import React from "react";
import madGoat from "../assets/MadBabyGoat.png";
import cancelIcon from "../assets/red-cancel.svg";
import "../styles/CommunityPage.css";

export default function KickedCommunityView() {
    return (
        <div className="kicked-view-container">
            <div className="kicked-view-content">
                <div className="kicked-image-wrapper">
                    <img src={madGoat} alt="Mad Baby Goat" className="kicked-goat-img" />
                    <img src={cancelIcon} alt="Kicked" className="kicked-cancel-overlay" />
                </div>
                <p className="kicked-message">
                    You've been kicked from this community.
                </p>
                <p className="kicked-message">
                    Be sure to always care for the Herd and follow community guidelines.
                </p>
            </div>
        </div>
    );
}