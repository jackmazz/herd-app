import React, { useEffect, useState } from "react";
import {BrowserRouter as Router, Routes, Route, Outlet, Navigate} from "react-router-dom";
import { io } from "socket.io-client";

import AboutUsPage from "components/about-us/AboutUsPage.jsx";
import AboutBrigidPage from "components/about-us/AboutBrigidPage.jsx";
import AboutCamPage from "components/about-us/AboutCamPage.jsx";
import AboutHelenPage from "components/about-us/AboutHelenPage.jsx";
import AboutJackPage from "components/about-us/AboutJackPage.jsx";
import AboutJillPage from "components/about-us/AboutJillPage.jsx";

import HomePage from "components/HomePage.jsx";
import LoginPage from "components/LoginPage.jsx";
import RegisterPage from "components/RegisterPage.jsx";
import ForgotPassword from "components/ForgotPassword.jsx";
import ResetPassword from "components/ResetPassword.jsx";
import { SettingsPage } from "components/settings-page/SettingsPage.jsx";
import { SearchPage } from "components/SearchPage.jsx";

import "styles/App.css";
import Profile from "./components/Profile";
import AppLayout from "components/AppLayout";
import CreateCommunity from "components/CreateCommunity";
import CommunityPage from "components/CommunityPage";
import EditCommunityPage from "components/EditCommunityPage.jsx";
import StyleGuide from "components/StyleGuide";
import Notifications from "components/Notifications";
import verifyUser from "./utilities/verifyUser";
import CommunityRules from "components/CommunityRules";
// Initalize the socket with the respective path and tenantID
// NEED this in App.jsx to use the socket throughout the application for real-time connections
const socket = io(process.env.REACT_APP_API_PATH_SOCKET, {
    path: "/hci/api/realtime-socket/socket.io",
    query: {
        tenantID: "example"
    }
}); export { socket };

function App() {
    // tracks the state if the user is currently logged in or not
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    // execute on component load
    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to HCI socket server")
        })

        const checkSession = async () => {
            try {
                const isVerified = await verifyUser();
                setLoggedIn(isVerified);
            } catch (error) {
                setLoggedIn(false);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    });

    const ProtectedRoute = ({ loggedIn, loading }) => {
        if (loading) {
            return null; // Or a loading spinner
        }
        if (!loggedIn) {
            return <Navigate to="/" replace />;
        }
        return <Outlet />;
    };

    return (
        // the app is wrapped in a router component, that will render the
        // appropriate content based on the URL path.  Since this is a
        // single page app, it allows some degree of direct linking via the URL
        // rather than by parameters.  Note that the "empty" route "/", uses the HomePage
        // component, if you look in the HomePage component you will see a ternary operation:
        // if the user is logged in, show the "home page", otherwise show the login form.
        <Router basename={process.env.PUBLIC_URL}>
            <div id="app">
                <header>
                    <Routes>
                        <Route path="/" element={
                            <LoginPage setLoggedIn={setLoggedIn}/>
                        }/>

                        <Route path="/register" element={
                            <RegisterPage
                            />
                        }/>
                    
                        <Route path="/forgot-password" element = {<ForgotPassword/>}/>
                        <Route path="/reset-password" element = {<ResetPassword/>}/>

                        {/* Protected Routes Wrapper */}
                        <Route element={<ProtectedRoute loggedIn={loggedIn} loading={loading} />}>
                            {/* Pages WITH navbar */}
                            <Route element={<AppLayout loggedIn={loggedIn} />}>
                                <Route path="/home" element={
                                    <HomePage loggedIn={loggedIn}/>
                                }/>

                                <Route path="/profile/:userId" element={<Profile loggedIn={loggedIn}/>}/>

                                <Route path="/settings" element={<SettingsPage/>}/>

                                <Route path="/search/" element={<SearchPage/>}/>
                                <Route path="/search/:query" element={<SearchPage/>}/>

                                <Route path="/profile" element={<Profile loggedIn={loggedIn}/>}/>
                                <Route path="/create-community" element={<CreateCommunity />} />
                                <Route path="/community/:groupID" element={<CommunityPage />} />
                                <Route path="/community/:groupID/edit" element={<EditCommunityPage />} />
                                {/* <Route path="/community/:groupID/rules" element={<CommunityRules />} /> */}
                                <Route path="/about-us" element={<AboutUsPage/>}/>
                                <Route path="/about-brigid" element={<AboutBrigidPage/>}/>
                                <Route path="/about-jack" element={<AboutJackPage/>}/>
                                <Route path="/about-cam" element={<AboutCamPage/>}/>
                                <Route path="/about-helen" element={<AboutHelenPage/>}/>
                                <Route path="/about-jill" element={<AboutJillPage/>}/>
                                <Route path="/style-guide" element={<StyleGuide />} />
                                <Route path="/notifications" element={<Notifications />} />
                            </Route>
                        </Route>
                    </Routes>
                </header>
            </div>
        </Router>
    );
}; export default App;
