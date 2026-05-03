const updateSession = () => {
    // move user data from local to session storage
    sessionStorage.setItem("user", localStorage.getItem("user"));
    sessionStorage.setItem("user-token", localStorage.getItem("user-token"));
}; 

export default updateSession;

