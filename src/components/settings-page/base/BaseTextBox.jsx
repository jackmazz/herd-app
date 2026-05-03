import React, { useState, useEffect, useRef } from "react";

import * as Config from "config.js"

import "styles/settings-page/base/BaseTextBox.css";
import undoIcon from "assets/undo-icon.png";

export const BaseTextBox = ({
    label,
    name,
    message,
    placeholder,
    maxLength,
    value,
    isValid,
    isChanged,
    onChange,
    onSubmit,
    onReset,
    onValidate,
}) => {
    const [isValidating, setValidating] = useState(false);
    const requestIdRef = useRef(0);
        
    useEffect(() => {
        const controller = new AbortController(); // cancels stale requests
        const requestId = ++requestIdRef.current; // tracks the current process
        let active = true;
        
        // validating, block submissions
        setValidating(true);
        
        // determines if a process is stale
        const isActive = () => {
            return (
                active &&
                !controller.signal.aborted &&
                requestId === requestIdRef.current
            );
        };
        
        // validate after INPUT_DELAY to prevent spam
        const timeout = setTimeout(async () => {
            await onValidate(controller, isActive);
            
            // finished validating, unblock submissions
            if (isActive()) {
                setValidating(false);
            } else {
                return;
            }
        }, Config.INPUT_DELAY);
        
        return () => {
            // clean up the current process
            active = false;
            controller.abort();
            clearTimeout(timeout);
            
            // finished validating, unblock submissions
            setValidating(false);
        };
    }, [value, onValidate]);
    
    const canSubmit = () => {
        return !isValidating && isValid && isChanged;
    };
    
    const canReset = () => {
        return !isValidating && isChanged;
    };

    const onKeyDown = (event) => {  
        // submit on enter key
        if (event.key === "Enter") {
            if (canSubmit()) {
                event.preventDefault();
                event.target.blur();
                onSubmit(event);
            }
        }
        
        // reset on escape key
        else if (event.key === "Escape") {
            if (canReset()) {
                event.preventDefault();
                event.target.blur();
                onReset(event);
            }
        }
    };

    return (
        <div className="base-textbox">
            <div className="base-textbox__label">{label}</div>
            <div 
                className="base-textbox__controls"
                >
                <div className="base-textbox__input-container">
                    <input 
                        className="base-textbox__input"
                        name={name}
                        value={value}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                    />
                    <img 
                        className="base-textbox__undo-button"
                        style={isChanged ? ({
                            opacity: "100%",
                            pointerEvents: "auto",
                        }) : ({
                            opacity: "0%",
                            pointerEvents: "none",
                        })}
                        disabled={!canReset()}
                        src={undoIcon}
                        alt="RESET"
                        onClick={(event) => {
                            if (canReset()) {
                                onReset(event);
                            }
                        }}
                    />
                </div>
                <button 
                    className="base-textbox__save-button"
                    style={isValid && isChanged ? ({
                        opacity: "100%",
                        pointerEvents: "auto",
                    }) : ({
                        opacity: "0%",
                        pointerEvents: "none",
                    })}
                    disabled={!canSubmit()}
                    onClick={(event) => {
                        if (canSubmit()) {
                            onSubmit(event);
                        }
                    }}
                    >Save
                </button>
            </div>
            <div className="base-textbox__message"
                >{message}
            </div>
        </div>
    );
};

