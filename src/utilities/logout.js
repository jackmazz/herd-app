import applyColorMode from "utilities/applyColorMode.js";
import * as Config from "config.js";

const logout = async () => {
    // retrieve user token from local storage
    const userToken = localStorage.getItem("user-token");
    
    // return failure if user token don't exist
    if (!userToken) {
        return false;
    }
    
    try {
        // send verify request
        const response = await fetch(process.env.REACT_APP_API_PATH + "/auth/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`,
            },
        });
        
        // if the user couldn't be logged out, return failure
        if (!response.ok) {
            return false;
        }
        
        else {
            // remove user info from local storage
            localStorage.removeItem("user");
            localStorage.removeItem("user-token");
            
            // remove user info from session storage
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("user-token");
            
            // remove the color mode
            applyColorMode(Config.COLOR_MODE_NONE);
            
            // return success
            return true;
        }
    }
    
    // return failure on error
    catch (error) {
        return false;
    }
}; export default logout;

