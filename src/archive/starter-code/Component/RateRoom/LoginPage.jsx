import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

const LoginPage = ({setLoggedIn}) => {
    // get userToken state variable
    const [userToken, setUserToken] = useState("");
    useEffect(() => {
        setUserToken(sessionStorage.getItem("token"));
    }, []);
    
    // redirect to the home page if already logged in
    const navigate = useNavigate();
    const handleRedirect = () => {
        if (userToken != null) {
            navigate("/");
        }
    };  
    handleRedirect();
    
    return (
        <div>
            Login Page!
        </div>
    );
};

export default LoginPage;

