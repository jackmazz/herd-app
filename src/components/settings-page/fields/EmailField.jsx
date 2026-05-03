import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { ConfirmationModal } from "components/settings-page/modals/ConfirmationModal.jsx";
import { BaseTextBox } from "components/settings-page/base/BaseTextBox.jsx";
import * as Config from "config.js";

import "styles/settings-page/fields/EmailField.css";

export const EmailField = ({
    currentUser, setCurrentUser,
    currentModal, setCurrentModal,
    showAlert,
}) => {
    const { t } = useTranslation();

    const initialValue = currentUser.email ?? "";
    const valueMinLength = Config.MIN_EMAIL_LENGTH;
    const valueMaxLength = Config.MAX_EMAIL_LENGTH;
    const [value, setValue] = useState(initialValue);
    const [actualValue, setActualValue] = useState(initialValue);
    const [isValid, setValid] = useState(false);
    const [isChanged, setChanged] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const submit = async () => {
        if (!isValid || !isChanged) {
            return;
        }

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
                body: JSON.stringify({ email: trimmedValue }),
            });

            if (!response.ok) {
                throw new Error("request failed");
            }

            const data = await response.json();
            const attributesData = data.attributes || {};
            const emailData = data.email || "";

            setCurrentUser({
                ...currentUser,
                email: emailData,
                attributes: attributesData,
            });

            setValue(emailData);
            setActualValue(emailData);
        }

        catch (error) {
            setActualValue(savedActualValue);
            showAlert(t("settings.errors.updateEmail"));
        }
    };

    const reset = () => {
        setValue(actualValue);
    };

    const onValidate = useCallback(async (controller, isActive) => {
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
                setErrorMessage(t("settings.errors.emailRequired"));
            }
            return;
        }

        if (trimmedValue.length < valueMinLength) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(
                    t("settings.errors.emailMin", { count: valueMinLength })
                );
            }
            return;
        }

        if (trimmedValue.length > valueMaxLength) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(
                    t("settings.errors.emailMax", { count: valueMaxLength })
                );
            }
            return;
        }

        if (!trimmedValue.includes("@")) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(t("settings.errors.invalidEmail"));
            }
            return;
        }

        if (!trimmedValue.substring(trimmedValue.lastIndexOf("@") + 1).includes(".")) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(t("settings.errors.invalidEmail"));
            }
            return;
        }

        try {
            const query = `email=${encodeURIComponent(trimmedValue)}`;
            const url = `${process.env.REACT_APP_API_PATH}/users?${query}`;
            const response = await fetch(url, {
                method: "GET",
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error("request failed");
            }

            const data = await response.json();
            const usersData = data[0] ?? [];

            if (usersData.length > 1) {
                if (isActive()) {
                    setValid(false);
                    setErrorMessage(t("settings.errors.emailTaken"));
                }
                return;
            }

            if (usersData.length === 1) {
                const userIdData = usersData[0].id?.toString() ?? "INVALID-ID";

                if (userIdData === "INVALID-ID") {
                    if (isActive()) {
                        setValid(false);
                        setErrorMessage(t("settings.errors.emailTaken"));
                    }
                    return;
                }

                if (userIdData !== currentUser.id) {
                    if (isActive()) {
                        setValid(false);
                        setErrorMessage(t("settings.errors.emailTaken"));
                    }
                    return;
                }
            }

            if (value.length === Config.MAX_EMAIL_LENGTH) {
                if (isActive()) {
                    setValid(true);
                    setErrorMessage(t("settings.errors.maxReached"));
                }
                return;
            }

            if (isActive()) {
                setValid(true);
                setErrorMessage("");
            } else {
                return;
            }
        }

        catch (error) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(t("settings.errors.validateEmail"));
                showAlert(t("settings.errors.validateEmailAlert"));
            } else {
                return;
            }
        }
    }, [
        value,
        actualValue,
        valueMinLength,
        valueMaxLength,
        currentUser.id,
        showAlert,
        t,
    ]);

    return (
        <div className="email-field">
            <BaseTextBox
                label={t("settings.fields.email")}
                name="email"
                message={errorMessage}
                placeholder={t("settings.placeholders.email")}
                maxLength={valueMaxLength}
                value={value}
                isValid={isValid}
                isChanged={isChanged}
                onChange={(event) => setValue(event.target.value)}
                onSubmit={() => setCurrentModal("confirm-email")}
                onReset={() => reset()}
                onValidate={onValidate}
            />

            <ConfirmationModal
                message={t("settings.emailModal.message")}
                description={t("settings.emailModal.description")}
                isOpen={currentModal === "confirm-email"}
                onClose={() => setCurrentModal("")}
                onConfirm={() => submit()}
            />
        </div>
    );
};