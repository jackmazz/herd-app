import React, { useEffect, useRef } from "react";

import "styles/settings-page/base/BaseSideBar.css";
import closeIcon from "assets/close-icon-dark.png";

export const BaseSideBar = ({
                                label,
                                isOpen,
                                onClose,
                                children,
                                ...props
                            }) => {
    const sidebarRef = useRef(null);

    useEffect(() => {
        if (isOpen && sidebarRef.current) {
            sidebarRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="base-sidebar"
            ref={sidebarRef}
            tabIndex="-1"
            style={{ outline: 'none' }}
            {...props}
        >
            <div className="base-sidebar__header">
                <div className="base-sidebar__label">{label}</div>
                <button
                    className="base-sidebar__close-button"
                    onClick={onClose}
                    aria-label="Close Channels"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                    <img
                        src={closeIcon}
                        alt=""
                        style={{ width: '100%', height: '100%' }}
                    />
                </button>
            </div>
            {children}
        </div>
    );
};

export const BaseSideBarItem = ({
    label,
    isSelected,
    onClick,
    ...props
}) => {
    return (
        <button
            className={isSelected ? (
                "base-sidebar-item__selected"
            ) : (
                "base-sidebar-item"
            )}
            onClick={onClick}
            role="link"
            {...props}
            >
            <div className="base-sidebar-item__label">{label}</div>
        </button>
    );
};

