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

    const handleAction = () => {
        const requestId = ++requestIdRef.current;
        setToggling(true);

        // determines if a process is stale
        const isActive = () => {
            return requestId === requestIdRef.current;
        };

        setTimeout(async () => {
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

    const onClick = (event) => {
        event.preventDefault();
        handleAction();
    };

    const onKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleAction();
        }
    };

    return (
        <div className="base-switch">
            <button
                type="button"
                role="switch"
                aria-checked={value}
                aria-label={label}
                onClick={onClick}
                onKeyDown={onKeyDown}
                className="base-switch__clickable-area"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
                <img
                    className={`base-switch__button ${isPulsing ? "base-switch__button--pulse" : ""} ${isToggling ? "base-switch__button--toggling" : ""}`}
                    src={value ? switchOnIcon : switchOffIcon}
                    alt=""
                    aria-hidden="true"
                />
            </button>
            <div className="base-switch__label" aria-hidden="true">{label}</div>
        </div>
    );
};