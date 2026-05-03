import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDropDown } from "components/settings-page/base/BaseDropDown.jsx";
import { BaseDropDownItem } from "components/settings-page/base/BaseDropDown.jsx";
import * as Config from "config.js";

import "styles/settings-page/dropdowns/StatusDropDown.css";
import neutralEmoji from "assets/emojis/neutral-emoji.png";
import happyEmoji from "assets/emojis/happy-emoji.png";
import roflEmoji from "assets/emojis/rofl-emoji.png";
import coolEmoji from "assets/emojis/cool-emoji.png";
import depressedEmoji from "assets/emojis/depressed-emoji.png";
import sleepingEmoji from "assets/emojis/sleeping-emoji.png";
import scaredEmoji from "assets/emojis/scared-emoji.png";
import madEmoji from "assets/emojis/mad-emoji.png";
import deviousEmoji from "assets/emojis/devious-emoji.png";

export const StatusDropDown = ({
    currentUser, setCurrentUser,
    isEditable=true,
    isProfile=false,
    showAlert,
}) => {
    const { t } = useTranslation();

    const chooseClassName = (baseName) => {
        return isProfile ? `profile-${baseName}` : baseName;
    };

    const makeItem = (status) => {
        switch (status) {
            case Config.STATUS_NEUTRAL:
                return {
                    value: status,
                    label: t("profilePage.status.neutral"),
                    image: neutralEmoji,
                };

            case Config.STATUS_HAPPY:
                return {
                    value: status,
                    label: t("profilePage.status.happy"),
                    image: happyEmoji,
                };

            case Config.STATUS_ROFL:
                return {
                    value: status,
                    label: t("profilePage.status.rofl"),
                    image: roflEmoji,
                };

            case Config.STATUS_COOL:
                return {
                    value: status,
                    label: t("profilePage.status.cool"),
                    image: coolEmoji,
                };

            case Config.STATUS_DEPRESSED:
                return {
                    value: status,
                    label: t("profilePage.status.depressed"),
                    image: depressedEmoji,
                };

            case Config.STATUS_SLEEPING:
                return {
                    value: status,
                    label: t("profilePage.status.sleeping"),
                    image: sleepingEmoji,
                };

            case Config.STATUS_SCARED:
                return {
                    value: status,
                    label: t("profilePage.status.scared"),
                    image: scaredEmoji,
                };

            case Config.STATUS_MAD:
                return {
                    value: status,
                    label: t("profilePage.status.mad"),
                    image: madEmoji,
                };

            case Config.STATUS_DEVIOUS:
                return {
                    value: status,
                    label: t("profilePage.status.devious"),
                    image: deviousEmoji,
                };

            default:
                return {
                    value: Config.STATUS_NEUTRAL,
                    label: t("profilePage.status.neutral"),
                    image: neutralEmoji,
                };
        }
    };

    const initialSelection = makeItem(
        currentUser?.attributes?.status ?? Config.STATUS_NEUTRAL
    );

    const [selection, setSelection] = useState(initialSelection);

    const submit = async (item) => {
        const savedSelection = selection;
        setSelection(item);

        try {
            const url = `${process.env.REACT_APP_API_PATH}/users/${currentUser.id}`;

            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({
                    attributes: {
                        ...currentUser.attributes,
                        status: item.value,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("request failed");
            }

            const data = await response.json();
            const attributesData = data.attributes ?? {};
            const statusData =
                attributesData.status ?? Config.STATUS_NEUTRAL;

            setCurrentUser({
                ...currentUser,
                attributes: attributesData,
            });

            setSelection(makeItem(statusData));
        }

        catch (error) {
            setSelection(savedSelection);

            showAlert(
                t("profilePage.status.failedUpdate")
            );
        }
    };

    return (
        <div className={chooseClassName("status-dropdown")}>
            <BaseDropDown
                selection={selection}
                setSelection={setSelection}
                label={t("profilePage.status.title")}
                isEditable={isEditable}
                isProfile={isProfile}
            >
                <BaseDropDownItem
                    item={{
                        value: Config.STATUS_NEUTRAL,
                        label: t("profilePage.status.neutral"),
                        image: neutralEmoji,
                    }}
                    selection={selection}
                    setSelection={submit}
                    isProfile={isProfile}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.STATUS_HAPPY,
                        label: t("profilePage.status.happy"),
                        image: happyEmoji,
                    }}
                    selection={selection}
                    setSelection={submit}
                    isProfile={isProfile}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.STATUS_ROFL,
                        label: t("profilePage.status.rofl"),
                        image: roflEmoji,
                    }}
                    selection={selection}
                    setSelection={submit}
                    isProfile={isProfile}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.STATUS_COOL,
                        label: t("profilePage.status.cool"),
                        image: coolEmoji,
                    }}
                    selection={selection}
                    setSelection={submit}
                    isProfile={isProfile}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.STATUS_DEPRESSED,
                        label: t("profilePage.status.depressed"),
                        image: depressedEmoji,
                    }}
                    selection={selection}
                    setSelection={submit}
                    isProfile={isProfile}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.STATUS_SLEEPING,
                        label: t("profilePage.status.sleeping"),
                        image: sleepingEmoji,
                    }}
                    selection={selection}
                    setSelection={submit}
                    isProfile={isProfile}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.STATUS_SCARED,
                        label: t("profilePage.status.scared"),
                        image: scaredEmoji,
                    }}
                    selection={selection}
                    setSelection={submit}
                    isProfile={isProfile}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.STATUS_MAD,
                        label: t("profilePage.status.mad"),
                        image: madEmoji,
                    }}
                    selection={selection}
                    setSelection={submit}
                    isProfile={isProfile}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.STATUS_DEVIOUS,
                        label: t("profilePage.status.devious"),
                        image: deviousEmoji,
                    }}
                    selection={selection}
                    setSelection={submit}
                    isProfile={isProfile}
                />
            </BaseDropDown>
        </div>
    );
};
