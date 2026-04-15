import React, { useState } from 'react';
import uploadIcon from 'assets/upload-icon.svg';
import {
    PROFILE_PICTURE_ACCEPT,
    validateProfilePictureFile,
} from 'utilities/validateProfilePictureFile';

const ChangeProfilePhotoPopup = ({ onClose, onSave}) => {
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
        // Create a hidden file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = PROFILE_PICTURE_ACCEPT;
        input.style.display = 'none';

        // Set up the event listener for when a file is selected
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
                    // If the file is valid, store it. As a workaround for case-sensitive servers,
                    // we'll ensure the file extension is lowercase.
                    let fileToSave = file;
                    const fileName = file.name;
                    const lastDot = fileName.lastIndexOf('.');
                    const extension = fileName.substring(lastDot);

                    // Check if there is an extension that needs to be converted to lowercase
                    if (lastDot > 0 && extension !== extension.toLowerCase()) {
                        const nameWithoutExt = fileName.substring(0, lastDot);
                        const newFileName = nameWithoutExt + extension.toLowerCase();

                        // Create a new File object with the modified name
                        fileToSave = new File([file], newFileName, {
                            type: file.type,
                            lastModified: file.lastModified,
                        });
                    }

                    setSelectedFile(fileToSave);
                    setNewPhoto(URL.createObjectURL(fileToSave));
                }
            }
            // Clean up by removing the input from the DOM
            document.body.removeChild(input);
        };

        // Append the input to the DOM and trigger the click
        document.body.appendChild(input);
        input.click();
    }


    return(
        <div className="popup-overlay" onClick={onClose}>
            <div className="upload-photo-popup" onClick={handlePopupContentClick}>
                <button className="popup-close-btn" onClick={onClose}>&times;</button>
                <h1 className="upload-photo-heading">Change Profile Photo</h1>
                {uploadError ? (
                    <p className="profile-photo-popup__upload-error" role="alert">
                        {uploadError}
                    </p>
                ) : null}
                { newPhoto ? <img className="upload-profile-photo-preview" src={newPhoto}/>
                    : <div>Upload a photo to see a preview here...</div>
                }
                <button style={{position: "absolute", bottom: "20px", left: "20px"}} className="upload-photo-button" onClick={openFileExplorer}>
                    Upload
                    <img style={{width: "40px", height:"40px"}} src={uploadIcon}/>
                </button>
                <button style={{position: "absolute", bottom: "20px", right: "20px"}} className="edit-save-btn" onClick={handleSaveClick}>Save</button>
            </div>
        </div>
    )
}

export default ChangeProfilePhotoPopup;