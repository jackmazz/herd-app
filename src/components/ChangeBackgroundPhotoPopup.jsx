import React, { useState } from 'react';
import uploadIcon from 'assets/upload-icon.svg';
import {
    PROFILE_PICTURE_ACCEPT,
    validateProfilePictureFile,
} from 'utilities/validateProfilePictureFile';

const ChangeBackgroundPhotoPopup = ({ onClose, onSave}) => {
    const [newPhoto, setNewPhoto] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadError, setUploadError] = useState("");

    const handleSaveClick = () => {
        if (selectedFile) {
            onSave(selectedFile);
        }
    };

    const handlePopupContentClick = (e) => {
        e.stopPropagation();
    };

    const openFileExplorer = () => {
        setUploadError("");
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = PROFILE_PICTURE_ACCEPT;
        input.style.display = 'none';

        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const { valid, errorMessage } = validateProfilePictureFile(file);

                if (!valid) {
                    setUploadError(errorMessage);
                    setSelectedFile(null);
                    setNewPhoto("");
                } else {
                    setUploadError("");
                    let fileToSave = file;
                    const fileName = file.name;
                    const lastDot = fileName.lastIndexOf('.');
                    const extension = fileName.substring(lastDot);

                    if (lastDot > 0 && extension !== extension.toLowerCase()) {
                        const nameWithoutExt = fileName.substring(0, lastDot);
                        const newFileName = nameWithoutExt + extension.toLowerCase();

                        fileToSave = new File([file], newFileName, {
                            type: file.type,
                            lastModified: file.lastModified,
                        });
                    }

                    setSelectedFile(fileToSave);
                    setNewPhoto(URL.createObjectURL(fileToSave));
                }
            }
            document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.click();
    }

    return(
        <div className="popup-overlay" onClick={onClose}>
            <div className="upload-photo-popup" onClick={handlePopupContentClick}>
                <button className="popup-close-btn" onClick={onClose}>&times;</button>
                <h1 className="upload-photo-heading">Change Banner Photo</h1>
                {uploadError ? (
                    <p className="profile-photo-popup__upload-error" role="alert">
                        {uploadError}
                    </p>
                ) : null}
                { newPhoto ? <img className="upload-background-photo-preview" src={newPhoto} alt="" />
                    : <div>Upload a photo to see a preview here...</div>
                }
                <button style={{position: "absolute", bottom: "20px", left: "20px"}} className="upload-photo-button" onClick={openFileExplorer}>
                    Upload
                    <img style={{width: "40px", height:"40px"}} src={uploadIcon} alt="" />
                </button>
                <button style={{position: "absolute", bottom: "20px", right: "20px"}} className="edit-save-btn" onClick={handleSaveClick}>Save</button>
            </div>
        </div>
    )
}

export default ChangeBackgroundPhotoPopup;
