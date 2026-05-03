const isPrivate = async (fromUserId, toUserId) => {
    if (!fromUserId || !toUserId) {
        return true;
    }
    
    // return not hidden for this user
    if (fromUserId.toString() === toUserId.toString()) {
        return false;
    }

    try {
        // fetch the user from the server
        const getUserURL = `${process.env.REACT_APP_API_PATH}/users/${toUserId}`;
        const getUserResponse = await fetch(getUserURL, {method: "GET"});
        
        // if the request failed, throw error
        if (!getUserResponse.ok) {
            throw new Error("request failed");
        }
        
        // extract data
        const getUserData = await getUserResponse.json();
        const privateAccountData = getUserData.attributes?.privateAccount || false;
        
        // fetch whether the fromUser follows toUser
        const connectionsQuery = encodeURIComponent(JSON.stringify({
            path: "type",
            equals: "follow",
        }));
        const connectionsURL = (
            `${process.env.REACT_APP_API_PATH}/connections?`
            + `fromUserID=${fromUserId}&`
            + `toUserID=${toUserId}&`
            + `attributes=${connectionsQuery}`
        );
        const connectionsResponse = await fetch(connectionsURL, {method: "GET"});
        
        // if the request failed, throw error
        if (!connectionsResponse.ok) {
            throw new Error("request failed");
        }
        
        // extract data
        const connectionsData = (await connectionsResponse.json());
        const connectionsLength = connectionsData[1] || 0;
        
        // return hidden if the author is private and there is no follow connection
        return privateAccountData && connectionsLength === 0;
    }
    
    // return hidden if request fails
    catch (error) {
        return true;
    }
};

export default isPrivate;

