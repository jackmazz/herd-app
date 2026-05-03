import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDropDown } from "components/settings-page/base/BaseDropDown.jsx";
import { BaseDropDownItem } from "components/settings-page/base/BaseDropDown.jsx";
import applyColorMode from "utilities/applyColorMode.js";
import * as Config from "config.js";

import "styles/settings-page/dropdowns/ColorModeDropDown.css";

export const ColorModeDropDown = ({
    currentUser, setCurrentUser,
    showAlert,
}) => {
    const { t } = useTranslation();

    const makeItem = (colorMode) => {
        switch (colorMode) {
            case Config.COLOR_MODE_NONE:
                return {
                    value: colorMode,
                    label: t("settings.colorModeOptions.none"),
                };

            case Config.COLOR_MODE_PROTANOPIA:
                return {
                    value: colorMode,
                    label: t("settings.colorModeOptions.protanopia"),
                };

            case Config.COLOR_MODE_DEUTERANOPIA:
                return {
                    value: colorMode,
                    label: t("settings.colorModeOptions.deuteranopia"),
                };

            case Config.COLOR_MODE_TRITANOPIA:
                return {
                    value: colorMode,
                    label: t("settings.colorModeOptions.tritanopia"),
                };

            case Config.COLOR_MODE_ACHROMATOPSIA:
                return {
                    value: colorMode,
                    label: t("settings.colorModeOptions.achromatopsia"),
                };

            default:
                return {
                    value: Config.COLOR_MODE_NONE,
                    label: t("settings.colorModeOptions.none"),
                };
        }
    };

    const initialSelection = makeItem(currentUser.attributes.colorMode);
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
                        colorMode: item.value,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("request failed");
            }

            const data = await response.json();
            const attributesData = data.attributes ?? {};
            const colorModeData =
                attributesData.colorMode ?? Config.COLOR_MODE_NONE;

            setCurrentUser({
                ...currentUser,
                attributes: attributesData,
            });

            setSelection(makeItem(colorModeData));
            applyColorMode(colorModeData);
        }

        catch (error) {
            setSelection(savedSelection);
            showAlert(t("settings.errors.updateColorMode"));
        }
    };

    return (
        <div className="status-dropdown">
            <BaseDropDown
                selection={selection}
                setSelection={setSelection}
                label={t("settings.colorMode")}
            >
                <BaseDropDownItem
                    item={{
                        value: Config.COLOR_MODE_NONE,
                        label: t("settings.colorModeOptions.none"),
                    }}
                    selection={selection}
                    setSelection={submit}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.COLOR_MODE_PROTANOPIA,
                        label: t("settings.colorModeOptions.protanopia"),
                    }}
                    selection={selection}
                    setSelection={submit}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.COLOR_MODE_DEUTERANOPIA,
                        label: t("settings.colorModeOptions.deuteranopia"),
                    }}
                    selection={selection}
                    setSelection={submit}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.COLOR_MODE_TRITANOPIA,
                        label: t("settings.colorModeOptions.tritanopia"),
                    }}
                    selection={selection}
                    setSelection={submit}
                />

                <BaseDropDownItem
                    item={{
                        value: Config.COLOR_MODE_ACHROMATOPSIA,
                        label: t("settings.colorModeOptions.achromatopsia"),
                    }}
                    selection={selection}
                    setSelection={submit}
                />
            </BaseDropDown>
        </div>
    );
};