import React, { useState, useEffect, useRef } from "react";

import "styles/settings-page/base/BaseDropDown.css";
import chevronIcon from "assets/chevron-icon.png";

export const BaseDropDown = ({
    selection, setSelection,
    label,
    isEditable=true,
    isProfile=false,
    children,
}) => {
    const [isOpen, setOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef(null);
    const listRef = useRef(null);

    const chooseClassName = (baseName) => {
        return isProfile ? `profile-${baseName}` : baseName;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleKeyDown = (event) => {
        if (!isOpen) {
            if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                setOpen(true);
                setFocusedIndex(0);
                event.preventDefault();
            }
            return;
        }

        const itemCount = React.Children.count(children);

        switch (event.key) {
            case "ArrowDown":
                setFocusedIndex((prev) => (prev + 1) % itemCount);
                event.preventDefault();
                break;
            case "ArrowUp":
                setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
                event.preventDefault();
                break;
            case "Enter":
            case " ":
                if (focusedIndex >= 0) {
                    const child = React.Children.toArray(children)[focusedIndex];
                    if (child) {
                        child.props.setSelection(child.props.item);
                    }
                    setOpen(false);
                }
                event.preventDefault();
                break;
            case "Escape":
            case "Tab":
                setOpen(false);
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        if (isOpen && listRef.current) {
            const items = listRef.current.querySelectorAll('[role="option"]');
            if (items[focusedIndex]) {
                items[focusedIndex].focus();
            }
        }
    }, [isOpen, focusedIndex]);

    return (
        <div className={chooseClassName("base-dropdown")} onKeyDown={handleKeyDown}>
            <div className={chooseClassName("base-dropdown__label")}>{`${label}:`}</div>
            <div
                className={chooseClassName("base-dropdown__container")}
                ref={containerRef}
            >
                <button
                    className={chooseClassName("base-dropdown__button")}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    onClick={() => {
                        if (isEditable) {
                            setOpen(!isOpen);
                            if (!isOpen) setFocusedIndex(0);
                        }
                    }}
                >
                    {isEditable ? (
                        <img
                            className={chooseClassName(isOpen ? (
                                `base-dropdown__collapse-icon__open`
                            ) : (
                                `base-dropdown__collapse-icon__closed`
                            ))}
                            src={chevronIcon}
                            alt="DROPDOWN"
                        />
                    ) : (
                        <></>
                    )}
                    <BaseDropDownSelection
                        selection={selection}
                        isProfile={isProfile}
                    />
                </button>
                {isOpen ? (
                    <div
                        className={chooseClassName("base-dropdown__list")}
                        role="listbox"
                        ref={listRef}
                        onClick={() => setOpen(false)}
                    >
                        {React.Children.map(children, (child, index) =>
                            React.cloneElement(child, { isFocused: index === focusedIndex })
                        )}
                    </div>
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
};

export const BaseDropDownItem = ({
                                     item,
                                     setSelection,
                                     isProfile=false,
                                     isFocused=false,
                                 }) => {
    const itemRef = useRef(null);
    const chooseClassName = (baseName) => {
        return isProfile ? `profile-${baseName}` : baseName;
    };

    return (
        <div
            className={chooseClassName("base-dropdown-item")}
            role="option"
            aria-selected={isFocused}
            tabIndex={isFocused ? 0 : -1}
            ref={itemRef}
            onClick={(event) => setSelection(item)}
            style={isFocused ? { outline: '2px solid #1D3557', transform: 'translateY(-2px)' } : {}}
        >
            <div className={chooseClassName("base-dropdown-item__label")}>{item.label ?? "Unknown"}</div>
            {item.image ? (
                <img 
                    className={chooseClassName("base-dropdown-item__image")}
                    src={item.image}
                    alt="DROPDOWN-ITEM"
                />
            ) : (
                <></>
            )}
        </div>
    );
};

const BaseDropDownSelection = ({
    selection,
    isProfile=false,
}) => {
    const chooseClassName = (baseName) => {
        return isProfile ? `profile-${baseName}` : baseName;
    };

    return (
        <div className={chooseClassName("base-dropdown-selection")}>
            {selection.label ? (
                <div className={chooseClassName("base-dropdown-selection__label")}>{selection.label}</div>
            ) : (
                <></>
            )}
            {selection.image ? (
                <img 
                    className={chooseClassName("base-dropdown-selection__image")}
                    src={selection.image}
                    alt="SELECTION-ITEM"
                />
            ) : (
                <></>
            )}
        </div>
    );
}

