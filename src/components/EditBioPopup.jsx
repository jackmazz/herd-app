import React, { useState } from 'react';

const EditBioPopup = ({ onClose, onSave, currentBio }) => {
    const [newBio, setNewBio] = useState(currentBio);
    const charLimit = 150;

    const handleSaveClick = () => {
        onSave(newBio);
    };

    const handlePopupContentClick = (e) => {
        e.stopPropagation();
    };

    return(
        <div className="popup-overlay" onClick={onClose}>
            <div className="edit-bio-popup" onClick={handlePopupContentClick}>
                <button className="popup-close-btn" onClick={onClose}>&times;</button>
                <h1 className="popup-title">Edit Bio</h1>
                <textarea
                    className="edit-bio-textbox"
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    placeholder="Something cool about me..."
                    maxLength={charLimit}/>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {newBio.length}/{charLimit}
                </div>
                <button className="edit-save-btn" onClick={handleSaveClick}>Save</button>
            </div>
        </div>
    )
}

export default EditBioPopup;