import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
// import uploadIcon from 'assets/upload-icon.svg';
import uploadIcon from "assets/upload-icon-alt-light.png";
import discardIcon from "assets/close-icon-dark.png";
import {
    PROFILE_PICTURE_ACCEPT,
    validateProfilePictureFile,
} from 'utilities/validateProfilePictureFile';

const ChangeProfilePhotoPopup = ({ onClose, onSave}) => {
    const { t } = useTranslation();

    const [upload, setUpload] = useState(null);
    const [uploadURL, setUploadURL] = useState("");
    const [uploadMessage, setUploadMessage] = useState("");
    const [isUploadValid, setUploadValid] = useState(false);

    const handleSaveClick = () => {
        if (isUploadValid) {
            onSave(upload);
        }
    };

    const handlePopupContentClick = (e) => {
        e.stopPropagation();
    };

    const openFileExplorer = () => {
        // create file input modal
        const input = document.createElement("input");
        input.type = "file";
        input.accept = PROFILE_PICTURE_ACCEPT;
        input.style.display = "none";

        // on file selected
        input.onchange = (event) => {
            const file = event.target.files[0] ?? null;

            const { valid, errorMessage } = validateProfilePictureFile(file);

            if (valid) {
                // update the state
                setUpload(file);
                setUploadURL(URL.createObjectURL(file));
                setUploadValid(true);
            }

            // if the upload is not valid, reset the state and show an alert message
            else {
                // reset the state
                if (uploadURL) {
                    URL.revokeObjectURL(uploadURL);
                }
                setUpload(null);
                setUploadURL("");
                setUploadMessage("");
                setUploadValid(false);

                // print an error message and close the modal
                setUploadMessage(errorMessage);
                // setIsPosting(false);
            }

            // close the input modal
            document.body.removeChild(input);
        };

        // open the file input modal
        document.body.appendChild(input);
        input.click();
    }

    const discardFile = () => {
        if (uploadURL) {
            URL.revokeObjectURL(uploadURL);
        }
        setUpload(null);
        setUploadURL("");
        setUploadMessage("");
        setUploadValid(false);
    }

    return(
        <div className="postModalOverlay" onClick={onClose}>
            <div className="postModal" onClick={handlePopupContentClick}>
                <div className="postTitleOverflow">
                    <h2>{t("profilePage.profilePhotoModal.title")}</h2>
                </div>

                {uploadURL ? (
                    <div className="align-profile-photo-preview">
                        <img
                            className="upload-profile-photo-preview"
                            src={uploadURL}
                            alt=""
                        />
                    </div>
                ) : (
                    <div className="postModalAttachment">
                        <div className="postModalAttachment__message">
                            {t("profilePage.profilePhotoModal.previewPlaceholder")}
                        </div>
                    </div>
                )}

                <div className="postModalUpload">
                    <button className="postModalUpload__uploadButton" onClick={openFileExplorer}>
                        <img className="postModalUpload__uploadIcon" src={uploadIcon} alt="UPLOAD" />
                        {t("profilePage.profilePhotoModal.upload")}
                    </button>
                    {upload ? (
                        <div className="postModalAttachment">
                        <img
                            className="postModalAttachment__discardButton"
                            src={discardIcon}
                            alt="DISCARD"
                            onClick={() => discardFile()}
                        />
                        <div className="postModalAttachment__fileName">
                            {upload.name}
                        </div>
                        </div>
                    ) : (
                        <div className="postModalAttachment">
                        <div
                            className={
                            uploadMessage
                                ? "postModalAttachment__message postModalAttachment__message--error"
                                : "postModalAttachment__message"
                            }
                        >
                            {uploadMessage || t("communityPage.postModal.noFileSelected")}
                        </div>
                        </div>
                    )}
                </div>

            <div className="postModalActions">
                <button className="feedGhostBtn" onClick={onClose}>
                    {t("profilePage.profilePhotoModal.cancel")}
                </button>
                
                <button className="feedPrimaryBtn" onClick={handleSaveClick}>
                    {t("profilePage.profilePhotoModal.save")}
                </button>
            </div>
        </div>
    </div>
    )
}

export default ChangeProfilePhotoPopup;