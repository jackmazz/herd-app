import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseTextBox } from "components/settings-page/base/BaseTextBox.jsx";
import * as Config from "config.js";

import "styles/settings-page/fields/ScreennameField.css";

export const ScreennameField = ({
    currentUser, setCurrentUser,
    showAlert,
}) => {
    const { t } = useTranslation();

    const initialValue = currentUser.attributes.screenname ?? "";
    const valueMinLength = Config.MIN_SCREENNAME_LENGTH;
    const valueMaxLength = Config.MAX_SCREENNAME_LENGTH;

    const [value, setValue] = useState(initialValue);
    const [actualValue, setActualValue] = useState(initialValue);
    const [isValid, setValid] = useState(false);
    const [isChanged, setChanged] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const submit = async () => {      
        if (!isValid || !isChanged) return;

        const trimmedValue = value.trim();
        setValue(trimmedValue);

        const savedActualValue = actualValue;
        setActualValue(trimmedValue);

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
                        screenname: trimmedValue,
                    },
                }),
            });

            if (!response.ok) throw new Error("request failed");

            const data = await response.json();
            const attributesData = data.attributes ?? {};
            const screennameData = attributesData.screenname ?? "";

            setCurrentUser({
                ...currentUser,
                attributes: attributesData,
            });

            setValue(screennameData);
            setActualValue(screennameData);
        } catch (error) {
            setActualValue(savedActualValue);

            showAlert(
    t("settings.errors.updateScreenname"),
    true
);
        }
    };

    const reset = () => {
        setValue(actualValue);
    };

    const onValidate = useCallback((controller, isActive) => {
        const trimmedValue = value.trim();
        const trimmedActualValue = actualValue.trim();

        const changed = trimmedValue !== trimmedActualValue;

        if (isActive()) {
            setChanged(changed);
        } else {
            return;
        }

        if (!changed) {
            if (isActive()) {
                setValid(true);
                setErrorMessage("");
            }
            return;
        }

        if (trimmedValue.length === 0) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(t("settings.errors.screennameRequired"));
            }
            return;
        }

        if (trimmedValue.length < valueMinLength) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(
                    t("settings.errors.screennameMin", { count: valueMinLength })
                );
            }
            return;
        }

        if (trimmedValue.length == 10) {
            if (isActive()) {
                // setValid(false);
                setErrorMessage(
                    t("settings.errors.screennameMax", { count: 10 })
                );
            }
            return;
        }
        if (trimmedValue.length > 10) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(
                    t("settings.errors.screennameMax", { count: 10 })
                );
            }
            return;
        }

        if (value.length === valueMaxLength) {
            if (isActive()) {
                setValid(true);
                setErrorMessage(t("settings.errors.maxReached"));
            }
            return;
        }

        if (isActive()) {
            setValid(true);
            setErrorMessage("");
        }
    }, [value, actualValue, valueMinLength, valueMaxLength, t]);

    return (
        <div className="screenname-field">
            <BaseTextBox
                label={t("settings.fields.screenname")}
                name="screenname"
                message={errorMessage}
                placeholder={t("settings.placeholders.screenname")}
                maxLength={10}
                value={value}
                isValid={isValid}
                isChanged={isChanged}
                onChange={(event) => setValue(event.target.value)}
                onSubmit={() => submit()}
                onReset={() => reset()}
                onValidate={onValidate}
            />
        </div>
    );
};