import React, { useState } from 'react';
import { useTranslation } from "react-i18next";

const EditBioPopup = ({ onClose, onSave, currentBio }) => {
    const { t } = useTranslation();
    const [newBio, setNewBio] = useState(currentBio);
    const charLimit = 150;

    const handleSaveClick = () => {
        onSave(newBio);
    };

    const handlePopupContentClick = (e) => {
        e.stopPropagation();
    };

    return(
        <div className="postModalOverlay" onClick={onClose}>
            <div className="postModal" onClick={handlePopupContentClick}>
                <div className="postTitleOverflow">
                    <h2>{t("profilePage.editBioModal.title")}</h2>
                </div>
                <textarea
                    className="postModalTextarea"
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    placeholder={t("profilePage.editBioModal.placeholder")}
                    maxLength={charLimit}/>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {newBio.length}/{charLimit}
                </div>

                <div className="postModalActions">
                    <button className="feedGhostBtn" onClick={onClose}>
                        {t("profilePage.editBioModal.cancel")}
                    </button>
                    
                    <button className="feedPrimaryBtn" onClick={handleSaveClick}>
                        {t("profilePage.editBioModal.save")}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditBioPopup;