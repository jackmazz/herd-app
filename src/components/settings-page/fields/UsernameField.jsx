import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { ConfirmationModal } from "components/settings-page/modals/ConfirmationModal.jsx";
import { BaseTextBox } from "components/settings-page/base/BaseTextBox.jsx";
import * as Config from "config.js";

import "styles/settings-page/fields/UsernameField.css";

export const UsernameField = ({
    currentUser, setCurrentUser,
    currentModal, setCurrentModal,
    showAlert,
}) => {
    const { t } = useTranslation();

    const initialValue = currentUser.attributes.username ?? "";
    const valueMinLength = Config.MIN_USERNAME_LENGTH;
    const valueMaxLength = Config.MAX_USERNAME_LENGTH;
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
                body: JSON.stringify({
                    attributes: {
                        ...currentUser.attributes,
                        username: trimmedValue,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("request failed");
            }

            const data = await response.json();
            const attributesData = data.attributes || {};
            const usernameData = attributesData.username ?? "";

            setCurrentUser({
                ...currentUser,
                attributes: attributesData,
            });

            setValue(usernameData);
            setActualValue(usernameData);
        }

        catch (error) {
            setActualValue(savedActualValue);
            showAlert(t("settings.errors.updateUsername"));
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
                setErrorMessage(t("settings.errors.usernameRequired"));
            }
            return;
        }

        if (trimmedValue.length < valueMinLength) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(
                    t("settings.errors.usernameMin", { count: valueMinLength })
                );
            }
            return;
        }

        if (trimmedValue.length > valueMaxLength) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(
                    t("settings.errors.usernameMax", { count: valueMaxLength })
                );
            }
            return;
        }

        try {
            const attributes = {
                path: "username",
                equals: trimmedValue,
            };
            const query = `attributes=${encodeURIComponent(JSON.stringify(attributes))}`;
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
            const usersDataLength = data[1] ?? -1;

            if (usersDataLength < 0 || usersDataLength > 1) {
                if (isActive()) {
                    setValid(false);
                    setErrorMessage(t("settings.errors.usernameTaken"));
                }
                return;
            }

            if (usersDataLength === 1) {
                const userIdData = usersData[0].id?.toString() ?? "INVALID-ID";

                if (userIdData === "INVALID-ID") {
                    if (isActive()) {
                        setValid(false);
                        setErrorMessage(t("settings.errors.usernameTaken"));
                    }
                    return;
                }

                if (userIdData !== currentUser.id) {
                    if (isActive()) {
                        setValid(false);
                        setErrorMessage(t("settings.errors.usernameTaken"));
                    }
                    return;
                }
            }

            if (value.length === Config.MAX_USERNAME_LENGTH) {
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
                setErrorMessage(t("settings.errors.validateUsername"));
                showAlert(t("settings.errors.validateUsernameAlert"));
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
        <div className="username-field">
            <BaseTextBox
                label={t("settings.fields.username")}
                name="username"
                message={errorMessage}
                placeholder={t("settings.placeholders.username")}
                maxLength={valueMaxLength}
                value={value}
                isValid={isValid}
                isChanged={isChanged}
                onChange={(event) => setValue(event.target.value)}
                onSubmit={() => setCurrentModal("confirm-username")}
                onReset={() => reset()}
                onValidate={onValidate}
            />

            <ConfirmationModal
                message={t("settings.usernameModal.message")}
                description={t("settings.usernameModal.description")}
                isOpen={currentModal === "confirm-username"}
                onClose={() => setCurrentModal("")}
                onConfirm={() => submit()}
            />
        </div>
    );
};