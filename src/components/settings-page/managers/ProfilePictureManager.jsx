import React, { useState } from "react";

import {
  PROFILE_PICTURE_ACCEPT,
  validateProfilePictureFile,
} from "utilities/validateProfilePictureFile";
import { useTranslation } from "react-i18next";
import "styles/settings-page/managers/ProfilePictureManager.css";
import defaultProfilePicture from "assets/profile-picture.png";
import uploadIcon from "assets/upload-icon-alt.png";
import closeIcon from "assets/close-icon-dark.png";

export const ProfilePictureManager = ({
    currentUser, setCurrentUser,
    currentModal, setCurrentModal,
    showAlert,
}) => {
    const [upload, setUpload] = useState(null);
    const [uploadURL, setUploadURL] = useState("");
    const [isUploadValid, setUploadValid] = useState(false);
    const { t } = useTranslation();
    const uploadProfilePicture = async () => {
        // don't upload if the upload was flagged as invalid
        if (!isUploadValid) {
            return;
        }
    
        try {
            // fetch the current user's files
            let query = `uploaderID=${currentUser.id}`;
            let url = `${process.env.REACT_APP_API_PATH}/file-uploads?${query}`;
            let response = await fetch(url, {method: "GET"});
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // extract the response data
            const data = await response.json();            
            const filesData = data[0] ?? [];
            
            // find the profile picture
            const profilePictureData = filesData.find(file => 
                file.attributes && 
                file.attributes.type === "profile-pic"
            );
            
            // delete the profile picture if found
            if (profilePictureData) {
                url = `${process.env.REACT_APP_API_PATH}/file-uploads/${profilePictureData.id}`;
                response = await fetch(url, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${currentUser.token}`
                    },
                });
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
            }
            
            // make multipart form data for upload
            const formData = new FormData();
            formData.append("uploaderID", currentUser.id);
            formData.append("attributes", JSON.stringify({type: "profile-pic"}));
            formData.append("file", upload);
            
            // upload the profile picture
            url = `${process.env.REACT_APP_API_PATH}/file-uploads`;
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${currentUser.token}`
                },
                body: formData,
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // update the current user
            setCurrentUser({
                ...currentUser,
                attributes: {
                    ...currentUser.attributes,
                    upload,
                },
            });

            // reset state
            if (uploadURL) {
                URL.revokeObjectURL(uploadURL);
            }
            setUpload(null);
            setUploadURL("");
            setUploadValid(false);
            
            // close any modals
            setCurrentModal(null);
            
            // reload the page
            window.location.reload();
        }
        
        catch (error) {
            // reset state
            if (uploadURL) {
                URL.revokeObjectURL(uploadURL);
            }
            setUpload(null);
            setUploadURL("");
            setUploadValid(false);
            
            // show an alert
            showAlert(t("settings.errors.updateProfilePicture"));
        }
    };
    
    const chooseFile = () => {
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
                
                // open the profile picture confirmation modal
                setCurrentModal("confirm-profile-picture");
            }
            
            // if the upload is not valid, reset the state and show an alert message
            else {
                // reset the state
                setUpload(null);
                setUploadURL("");
                setUploadValid(false);
                
                // show an alert
                showAlert(errorMessage, false, true);
            }
            
            // close the input modal
            document.body.removeChild(input);
        };
        
        // open the file input modal
        document.body.appendChild(input);
        input.click();
    };

    return (
      <>
        <div className="profile-picture-manager">
          <div className="profile-picture-manager__label">
            {t("settings.fields.profilePicture")}
          </div>

          <img 
            className="profile-picture-manager__picture" 
            src={currentUser.attributes.profilePicture || defaultProfilePicture}
            alt="PROFILE"
          />

          <button 
            className="profile-picture-manager__upload-button"
            onClick={chooseFile}
          >
            <img 
              className="profile-picture-manager__upload-icon" 
              src={uploadIcon} 
              alt="UPLOAD"
            />

            {t("settings.fields.uploadPhoto")}
          </button>
        </div>

        <ProfilePictureModal
          uploadURL={uploadURL}
          isOpen={currentModal === "confirm-profile-picture"}
          onClose={() => setCurrentModal(null)}
          onUpload={uploadProfilePicture}
        />
      </>
    );
};

const ProfilePictureModal = ({
    uploadURL,
    isOpen,
    onClose,
    onUpload,
}) => {
    // don't display if not open
    const { t } = useTranslation();
    if (!isOpen) {
        return null;
    }

    return (
  <div className="profile-picture-modal">
    <div className="profile-picture-modal__menu">
      <img 
        className="profile-picture-modal__close-button"
        src={closeIcon}
        alt="CLOSE"
        onClick={onClose}
      />
      
      <div className="profile-picture-modal__message">
        {t("settings.profilePictureModal.message")}
      </div>

      <img
        className="profile-picture-modal__upload"
        src={uploadURL}
        alt="UPLOAD"
      />
      
      <div className="profile-picture-modal__footer">
        <button 
          className="profile-picture-modal__cancel-button"
          onClick={onClose}
        >
          {t("settings.cancel")}
        </button>

        <button 
          className="profile-picture-modal__confirm-button"
          onClick={(event) => {
            onUpload(event);
            onClose(event);
          }}
        >
          {t("settings.profilePictureModal.confirm")}
        </button>
      </div>
    </div>
  </div>
);
}
