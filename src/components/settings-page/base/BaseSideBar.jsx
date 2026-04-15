import React from "react";

import "styles/settings-page/base/BaseSideBar.css";
import closeIcon from "assets/close-icon-dark.png";

export const BaseSideBar = ({
    label,
    isOpen,
    onClose,
    children,
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="base-sidebar">
            <div className="base-sidebar__header">
                <div className="base-sidebar__label">{label}</div>
                <img 
                    className="base-sidebar__close-button"
                    src={closeIcon}
                    alt="CLOSE"
                    onClick={onClose}
                />
            </div>
            {children}
        </div>
    );
};

export const BaseSideBarItem = ({
    label,
    isSelected,
    onClick,
}) => {
    return (
        <div 
            className={isSelected ? (
                "base-sidebar-item__selected"
            ) : (
                "base-sidebar-item"
            )}
            onClick={onClick}
            >
            <div className="base-sidebar-item__label">{label}</div>
        </div>
    );
};

