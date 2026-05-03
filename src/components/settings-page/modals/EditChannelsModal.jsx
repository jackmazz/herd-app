import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import * as Config from "config.js"

import "styles/settings-page/modals/EditChannelsModal.css";
import closeIcon from "assets/close-icon-dark.png";

export const EditChannelsModal = ({
    token,
    groupId,
    channels, setChannels,
    currentChannel, setCurrentChannel,
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();
    const modalRef = useRef(null);

    // Accessibility: Focus management and trap
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();

            const handleKeyDown = (e) => {
                if (e.key === "Escape") {
                    onClose();
                }
                if (e.key === "Tab") {
                    const focusableElements = modalRef.current.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    const first = focusableElements[0];
                    const last = focusableElements[focusableElements.length - 1];

                    if (e.shiftKey && document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            };
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen]); // Removed onClose to prevent focus reset on parent re-renders

    const updateChannels = async (newChannels) => {
        try {
            let url = `${process.env.REACT_APP_API_PATH}/groups/${groupId}`;
            let response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`, 
                    "Content-Type": "application/json",
                },
            });
            
            if (!response.ok) {
                throw new Error("Request Failed");
            }
            
            let data = await response.json();
            let attributesData = data.attributes ?? {};
            let nameData = attributesData.name ?? "Unknown";

            const newAttributes = {
                ...attributesData,
                channels: newChannels,
            };
            
            url = `${process.env.REACT_APP_API_PATH}/groups/${groupId}`;
            response = await fetch(url, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`, 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: nameData,
                    attributes: newAttributes,
                }),
            });
            
            if (!response.ok) {
                throw new Error("Request Failed");
            }
            
            setChannels(newChannels);

        } catch (error) {
            // nimp
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="edit-channels-modal" onClick={onClose}>
            <div
                className="edit-channels-modal__menu"
                ref={modalRef}
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-channels-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="edit-channels-modal__close-button"
                    style={{ border: 'none', background: 'transparent' }}
                    onClick={(event) => onClose(event)}
                    aria-label={t("communityPage.editChannelsModal.close")}
                >
                    <img src={closeIcon} alt="" style={{ width: '100%', height: '100%' }} />
                </button>
                <div id="edit-channels-title" className="edit-channels-modal__title">
                    {t("communityPage.editChannelsModal.title")}
                </div>
                <div className="edit-channels-modal__channel-list">
                    <ChannelListItem
                        channelName={t("communityPage.editChannelsModal.all")}
                        onDelete={null}
                    />
                    {channels.map((channelName, index) => (
                        <ChannelListItem
                            key={index}
                            index={index}
                            channels={channels}
                            channelName={channelName}
                            currentChannel={currentChannel}
                            setCurrentChannel={setCurrentChannel}
                            onUpdate={updateChannels}
                        />
                    ))}
                </div>
                <ChannelField
                    channels={channels}
                    onUpdate={updateChannels}
                />
            </div>
        </div>
    );
};

export const ChannelListItem = ({
                                    index,
                                    channels,
                                    channelName,
                                    currentChannel, setCurrentChannel,
                                    onUpdate,

                                }) => {
    const [isSelected, setSelected] = useState(false);

    return (
        <div className="channel-list-item">
            <div
                className={isSelected ? (
                    "channel-list-item__name__selected"
                ) : (
                    "channel-list-item__name"
                )}
            >{`# ${channelName}`}
            </div>
            {onUpdate ? (
                <button
                    className="channel-list-item__delete-button"
                    style={{ border: 'none', background: 'transparent' }}
                    onClick={() => {
                        if (currentChannel === channelName) {
                            setCurrentChannel(null);

                        }
                        onUpdate(channels.filter((_, i) => i !== index));
                    }}
                    onMouseEnter={() => setSelected(true)}
                    onMouseLeave={() => setSelected(false)}
                    onFocus={() => setSelected(true)}
                    onBlur={() => setSelected(false)}
                    aria-label={`Delete channel ${channelName}`}
                >
                    <img src={closeIcon} alt="" style={{ width: '100%', height: '100%' }} />
                </button>
            ) : (
                <></>
            )}
        </div>
    );
};

export const ChannelField = ({
    channels,
    onUpdate,
}) => {
    const { t } = useTranslation();
    const valueMinLength = Config.MIN_CHANNEL_NAME_LENGTH;
    const valueMaxLength = Config.MAX_CHANNEL_NAME_LENGTH;
    const [value, setValue] = useState("");
    const [isValid, setValid] = useState(false);
    const [message, setMessage] = useState("");
    
    useEffect(() => {
        const trimmedValue = value.trim();
        const lowerCaseValue = trimmedValue.toLowerCase();
    
        if (channels.length === Config.MAX_CHANNEL_COUNT) {
            setValid(false);
            setMessage(t("communityPage.editChannelsModal.errors.maxChannels"));
            return;
        }
        
        if (trimmedValue.length === 0) {
            setValid(false);
            setMessage("");
            return;
        }
        
        if (trimmedValue.length < valueMinLength) {
            setValid(false);
            setMessage(
  t("communityPage.editChannelsModal.errors.minLength", {
    count: valueMinLength,
  })
);
            return;
        }
        
        if (trimmedValue.length > valueMaxLength) {
            setValid(false);
            setMessage(
  t("communityPage.editChannelsModal.errors.maxLength", {
    count: valueMaxLength,
  })
);
            return;
        }
        
        if (lowerCaseValue === "all") {
            setValid(false);
            setMessage(t("communityPage.editChannelsModal.errors.taken"));
            return;
        }
        
        for (const channelName of channels) {
            if (lowerCaseValue === channelName.toLowerCase()) {
                setValid(false);
                setMessage(t("communityPage.editChannelsModal.errors.taken"));
                return;
            }
        }
        
        if (value.length === valueMaxLength) {
            setValid(true);
            setMessage(t("communityPage.editChannelsModal.errors.maxReached"));
            return;
        }
        
        setValid(true);
        setMessage("");
    }, [
        channels, 
        value,
        valueMinLength,
        valueMaxLength,
        t,
    ])

    const onKeyDown = (event) => {
        // unfocus on enter or escape key
        if (event.key === "Enter") {
            if (isValid) {
                onUpdate([
                    ...channels,
                    value.trim(),
                ]);
                setValue("");
            }
        }
        
        if (event.key === "Escape") {
            event.preventDefault();
            event.target.blur();
        }
    };

    return (
        <div className="channel-field">
            <div className="channel-field__label">
                {t("communityPage.editChannelsModal.addChannel")}
            </div>
            <div className="channel-field__input-container">
                <input
                    className="channel-field__input"
                    name="channel-name"
                    type="text"
                    placeholder={t("communityPage.editChannelsModal.newChannelPlaceholder")}
                    maxLength={valueMaxLength}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={onKeyDown}
                />
                {isValid ? (
                    <button
                        className="channel-field__save-button"
                        style={{ border: 'none', background: 'transparent' }}
                        onClick={() => {
                            onUpdate([
                                ...channels,
                                value.trim(),
                            ]);
                            setValue("");
                        }}
                    >
                        {t("communityPage.editChannelsModal.save")}
                    </button>
                ) : (
                    <></>
                )}
            </div>
            <div className="channel-field__message">
                {message}
            </div>
        </div>
    );
};

