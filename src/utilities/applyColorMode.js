import * as Config from "config.js";

const chooseClassName = (baseName, colorMode) => {
    switch (colorMode) {
        case Config.COLOR_MODE_NONE:
        return `${baseName}-filter-none`;
        
        case Config.COLOR_MODE_PROTANOPIA:
        return `${baseName}-filter-protanopia`;
        
        case Config.COLOR_MODE_DEUTERANOPIA:
        return `${baseName}-filter-deuteranopia`;
        
        case Config.COLOR_MODE_TRITANOPIA:
        return `${baseName}-filter-tritanopia`;
        
        case Config.COLOR_MODE_ACHROMATOPSIA:
        return `${baseName}-filter-achromatopsia`;
        
        default:
        return `${baseName}-filter-none`;
    }
};

const fetchColorMode = async () => {
    const userID = localStorage.getItem("user");
    const userToken = localStorage.getItem("user-token");
    
    if (!userID || !userToken) {
        return Config.COLOR_MODE_NONE;
    }
    
    try {   
        const url = `${process.env.REACT_APP_API_PATH}/users/${userID}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`,
            },
        });
        
        if (!response.ok) {
            return Config.COLOR_MODE_NONE;
        }
        
        const data = await response.json();
        const attributesData = data.attributes ?? {};
        const colorModeData = attributesData.colorMode ?? Config.COLOR_MODE_NONE;
        
        return colorModeData;  
    
    } catch(error) {
        return Config.COLOR_MODE_NONE;
    }
};

const applyColorMode = async (colorMode=null) => {
    if (!colorMode) {
        colorMode = await fetchColorMode();
    }
    document.getElementById("overlay").className = chooseClassName("overlay", colorMode);
};

export default applyColorMode;

