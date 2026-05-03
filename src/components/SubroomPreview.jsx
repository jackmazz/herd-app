import React from 'react'
import sampleProfilePic from 'assets/tests/CamProfilePhotoExample.svg'

const SubroomPreview = ({subroom}) => {
    return(
        <div className="subroom-card">
            {/*Two flex columns
                LEFT column has 3 rows
                    1. user info and room tags
                    2. body text
                    3. likes/comments
                RIGHT column has 3 highest rated
            */}
            <div className="subroom-main-body">
                <img src={sampleProfilePic}/>
                <p className="subroom-body-text">
                    {subroom.bodyText}
                </p>
            </div>
            <div className="highest-rated-section">
                text
            </div>
        </div>
    )
}

export default SubroomPreview;