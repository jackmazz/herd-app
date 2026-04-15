const verifyUser = async () => {
    // retrieve user info from local storage
    const userID = localStorage.getItem("user");
    const userToken = localStorage.getItem("user-token");
    
    // return failure if the user ID or user token don't exist
    if (!userID || !userToken) {
        return false;
    }
    
    try {   
        // send verify request
        const response = await fetch(process.env.REACT_APP_API_PATH + "/auth/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`,
            },
        });
        
        // if the user couldn't be verified, return failure
        if (!response.ok) {
            return false;
        }
        
        // make sure session variables are set
        sessionStorage.setItem("user", userID);
        sessionStorage.setItem("user-token", userToken);
        
        // return success - the user token was verified
        return true;  
    
    // throw all errors
    } catch(error) {
        throw error;
    }
};

export default verifyUser;

