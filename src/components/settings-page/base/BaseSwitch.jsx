import React, { useState, useRef } from "react";

import * as Config from "config.js"

import "styles/settings-page/base/BaseSwitch.css";
import switchOnIcon from "assets/switch-on-icon.png";
import switchOffIcon from "assets/switch-off-icon.png";

export const BaseSwitch = ({
                               label,
                               value,
                               onToggle,
                           }) => {
    const [isToggling, setToggling] = useState(false);
    const [isPulsing, setPulsing] = useState(false);
    const requestIdRef = useRef(0);

    const onClick = (event) => {
        event.preventDefault();
        
        const requestId = ++requestIdRef.current;
            
        // determines if a process is stale
        const isActive = () => {
            return requestId === requestIdRef.current;
        };

        const timeout = setTimeout(async () => {
            await onToggle(isActive);

            if (isActive()) {
                setToggling(false);
                // Trigger pulse effect
                setPulsing(true);
                setTimeout(() => {
                    if (isActive()) setPulsing(false);
                }, 400); // Match CSS animation duration
            }
        }, Config.TOGGLE_DELAY);
    };

    return (
        <div className="base-switch">
            <img
                className={`base-switch__button ${isPulsing ? "base-switch__button--pulse" : ""} ${isToggling ? "base-switch__button--toggling" : ""}`}
                src={value ? switchOnIcon : switchOffIcon}
                alt="SWITCH"
                onClick={onClick}
            />
            <div className="base-switch__label">{label}</div>
        </div>
    );
};


