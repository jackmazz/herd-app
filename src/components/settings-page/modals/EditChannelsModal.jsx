import React, { useEffect, useState } from "react";

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
        <div className="edit-channels-modal">
            <div className="edit-channels-modal__menu">
                <img 
                    className="edit-channels-modal__close-button"
                    src={closeIcon}
                    alt="CLOSE"
                    onClick={(event) => onClose(event)}
                />
                <div className="edit-channels-modal__title">Edit Channels</div>
                <div className="edit-channels-modal__channel-list">
                    <ChannelListItem 
                        channelName="All"
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
                <img 
                    className="channel-list-item__delete-button"
                    src={closeIcon}
                    alt="DELETE"
                    onClick={() => {
                        if (currentChannel === channelName) {
                            setCurrentChannel(null);
                            
                        }
                        onUpdate(channels.filter((_, i) => i !== index));
                    }}
                    onMouseEnter={() => setSelected(true)}
                    onMouseLeave={() => setSelected(false)}
                />
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
            setMessage("Maximum number of channels reached");
            return;
        }
        
        if (trimmedValue.length === 0) {
            setValid(false);
            setMessage("");
            return;
        }
        
        if (trimmedValue.length < valueMinLength) {
            setValid(false);
            setMessage(`Channel name must be at least ${valueMinLength} characters`);
            return;
        }
        
        if (trimmedValue.length > valueMaxLength) {
            setValid(false);
            setMessage(`Channel name must be under ${valueMaxLength} characters`);
            return;
        }
        
        if (lowerCaseValue === "all") {
            setValid(false);
            setMessage(`Channel name already taken`);
            return;
        }
        
        for (const channelName of channels) {
            if (lowerCaseValue === channelName.toLowerCase()) {
                setValid(false);
                setMessage(`Channel name already taken`);
                return;
            }
        }
        
        if (value.length === valueMaxLength) {
            setValid(true);
            setMessage(`Reached maximum character limit`);
            return;
        }
        
        setValid(true);
        setMessage("");
    }, [
        channels, 
        value,
        valueMinLength,
        valueMaxLength,
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
            <div className="channel-field__label">Add Channel</div>
            <div className="channel-field__input-container">
                <input 
                    className="channel-field__input"
                    name="channel-name"
                    type="text"
                    placeholder="New Channel Name..."
                    maxLength={valueMaxLength}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={onKeyDown}
                />
                {isValid ? (
                    <div 
                        className="channel-field__save-button"
                        onClick={() => {
                            onUpdate([
                                ...channels,
                                value.trim(),
                            ]);
                            setValue("");
                        }}
                        >Save
                    </div>
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

