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

import Profile from "./components/Profile";
import AppLayout from "components/AppLayout";
// import CreateCommunity from "components/CreateCommunity";
import CommunityPage from "components/CommunityPage";
import EditCommunityPage from "components/EditCommunityPage.jsx";
import StyleGuide from "components/StyleGuide";
import verifyUser from "./utilities/verifyUser";
import ReadingMode from "components/ReadingMode";
import CommunityRules from "components/CommunityRules";
import applyColorMode from "utilities/applyColorMode.js";
import TutorialModal from "components/tutorial/TutorialModal";
import NotFoundPage from "components/NotFoundPage.jsx";

// Initalize the socket with the respective path and tenantID
// NEED this in App.jsx to use the socket throughout the application for real-time connections

import './styles/App.css';
import './styles/Comments.css';
import './styles/CommunityPage.css';
import './styles/CommunityRules.css';
import './styles/CreateCommunity.css';
/* from ForgotPassword.css */
/* from FormField.css */
import './styles/HomePage.css';
/* from LoginPage.css */
import './styles/Navbar.css';
import './styles/Notifications.css';
import './styles/Postcard.css';
import './styles/Profile.css';
/* from Register.css */
/* from ResetPassword.css */
import './styles/SearchPage.css';
import './styles/UserSearchModal.css';
import './styles/settings-page/SettingsPage.css';
import './styles/settings-page/base/BaseSideBar.css';
import './styles/settings-page/base/BaseSwitch.css';
import './styles/settings-page/base/BaseTextArea.css';
import './styles/settings-page/base/BaseTextBox.css';
import './styles/settings-page/fields/PasswordField.css';
import './styles/settings-page/fields/TokenField.css';
import './styles/settings-page/managers/BlockedUserManager.css';
import './styles/settings-page/managers/ProfilePictureManager.css';
import './styles/settings-page/modals/AlertModal.css';
import './styles/settings-page/modals/ConfirmationModal.css';
import './styles/settings-page/modals/DeleteAccountModal.css';
import './styles/settings-page/modals/EditChannelsModal.css';
import './styles/settings-page/modals/ResetPasswordModal.css';
import './styles/ReadingMode.css';

const socket = io(process.env.REACT_APP_API_PATH_SOCKET, {
    path: "/hci/api/realtime-socket/socket.io",
    query: {
        tenantID: "example"
    }
}); export { socket };

const tutorialSteps = [
    { target: '.community-section-my', content: 'This is the My Communities section. Any communities you join will be shown here.' },
    { target: '.community-section-discover', content: 'This is the Discover section. Here you can discover new communities to join based on your selected interests.', noScroll: true },
    { target: '.community-section-recommended', content: 'This is the Recommended section. This section will show communities you might like based on joined communities.' },
    { target: '.feedTabBtn:nth-child(1)', content: 'This tab shows your communities and communities you can discover', clickTarget: '.feedTabBtn:nth-child(1)' },
    { target: '.feedTabBtn:nth-child(2)', content: 'This tab shows posts from the communities you\'ve joined', clickTarget: '.feedTabBtn:nth-child(2)' },
    { target: '.feedTabBtn:nth-child(3)', content: 'This page shows posts from the accounts that you follow', clickTarget: '.feedTabBtn:nth-child(3)' },
    { target: '.tutorial-community-283',
        content: 'This is a community card. This displays the title, tags, as well as public or private status of the community.',
        clickTarget: ".feedTabBtn:nth-child(1)",
        position: 'right'},
    { target: '.postBtn button', content: 'Inside a community, you can share your thoughts using the Post button.', clickTarget: '.tutorial-community-283' },
    { target: '.postOptionsPopup', content: 'You can create standard posts, interactive polls, rankings, or even rate things!', clickTarget: '.postBtn button' , position: 'left' },
    { target: '.nav-home', content: 'Let\'s head back home to see the rest of the site.', clickTarget: '.nav-home-btn' },
    { target: '.nav-searchbar', content: 'This is a search bar for communities. Type in the names of communities to search for them.' },
    { target: '.nav-home', content: 'This is the home icon. You can click it to go back to the home page.'},
    { target: '.notif-bell-wrapper', content: 'This is your notifications. Join some communities and make your first posts to start getting notifications. You can change what notifications you will receive on the settings page.' },
    { target: '.hamburger-menu', content: 'The hamburger menu shows more options like settings and finding users.', clickTarget: '.hamburger-btn' },
    { target: '.nav-settings', content: 'This is the settings icon. You can click it to go to your settings page.' },
    { target: '.nav-find-users', content: 'This is the find users icon. You can click it to bring up a pop-up that will let you search for users by their usernames.' },
    { target: '.nav-about-us', content: 'This is the about us icon. You can click it to go to this website\'s about us page. This page will have the information on the developers of this website.' },
    { target: '.nav-style-guide', content: 'This is the style guide icon. You can click it to go to a page that describes this website\'s style guide in detail.' },
    { target: '.nav-logout', content: 'This is the logout icon. You can click it to log out of your account.' },
    { target: '.nav-profile-icon', content: 'This is your profile icon. You can click it to go to your profile page.', clickTarget: '.hamburger-btn' },
];

function App() {
    // tracks the state if the user is currently logged in or not
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const [user, setUser] = useState(null);

    const prepareTutorialCommunity = async () => {
        const userId = sessionStorage.getItem("user");
        const token = sessionStorage.getItem("user-token");
        const tutorialGroupId = 283;

        if (!userId || !token) return;

        try {
            // 1. Join the community if not already joined
            const memberRes = await fetch(`${process.env.REACT_APP_API_PATH}/group-members?userID=${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const membershipsData = await memberRes.json();
            const memberships = membershipsData[0] || [];
            const isJoined = memberships.some(m => Number(m.groupID) === tutorialGroupId && m.attributes?.role !== "kicked");

            if (!isJoined) {
                await fetch(`${process.env.REACT_APP_API_PATH}/group-members`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ userID: Number(userId), groupID: tutorialGroupId, attributes: {} }),
                });
            }

            // 2. Fetch fresh user to update pinned list
            const userRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const freshUser = await userRes.json();
            const currentAttributes = freshUser.attributes || {};
            let pinned = currentAttributes.pinnedCommunities || [];

            // Remove if exists and place at the front
            pinned = [tutorialGroupId, ...pinned.filter(id => Number(id) !== tutorialGroupId)];

            // 3. Patch user attributes
            await fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    attributes: {
                        ...currentAttributes,
                        pinnedCommunities: pinned,
                    },
                }),
            });

            // Update local user state
            setUser({
                ...freshUser,
                attributes: { ...currentAttributes, pinnedCommunities: pinned }
            });

            // Dispatch event so HomePage knows to refresh its pinned list
            window.dispatchEvent(new CustomEvent('tutorial-community-prepared'));
        } catch (error) {
            console.error("Error preparing tutorial community:", error);
        }
    };

    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to HCI socket server")
        })

        const checkSession = async () => {
            try {
                const isVerified = await verifyUser();
                setLoggedIn(isVerified);

                if (isVerified) {
                    const userId = sessionStorage.getItem("user");
                    const token = sessionStorage.getItem("user-token");

                    const res = await fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const userData = await res.json();
                    setUser(userData);

                    // If attributes or showTutorial is missing, default to false
                    const tutorialFlag = userData.attributes?.showTutorial === true;
                    if (tutorialFlag) {
                        prepareTutorialCommunity();
                    }
                    setShowTutorial(tutorialFlag);
                }
            } catch (error) {
                setLoggedIn(false);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
        applyColorMode();

        const handleTriggerTutorial = () => {
            prepareTutorialCommunity();
            setShowTutorial(true);
        };
        window.addEventListener('trigger-tutorial', handleTriggerTutorial);

        return () => {
            window.removeEventListener('trigger-tutorial', handleTriggerTutorial);
        };
    }, []);

    const finishTutorial = async () => {
        const userId = sessionStorage.getItem("user");
        const token = sessionStorage.getItem("user-token");

        if (!userId || !token) return;

        try {
            // Fetch the absolute latest data to avoid overwriting pins/settings
            const res = await fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const freshUser = await res.json();
            const currentAttributes = freshUser.attributes || {};

            const patchRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    attributes: {
                        ...currentAttributes,
                        showTutorial: false,
                    },
                }),
            });

            if (patchRes.ok) {
                setShowTutorial(false);
                setUser({
                    ...freshUser,
                    attributes: { ...currentAttributes, showTutorial: false }
                });
            }
        } catch (error) {
            console.error("Error finalizing tutorial:", error);
        }
    };

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
        <>
            <Router basename={process.env.PUBLIC_URL}>
                <div id="app">
                    {showTutorial && (
                        <TutorialModal
                            steps={tutorialSteps}
                            onComplete={finishTutorial}
                            onClose={finishTutorial}
                        />
                    )}
                    <svg style={{ position: "absolute", width: 0, height: 0 }}>
                        <defs>
                            <filter id="protanopia">
                                <feColorMatrix
                                    type="matrix"
                                    values="
                                        0.152  1.053 -0.205  0 0
                                        0.115  0.786  0.099  0 0
                                        0.004 -0.048  1.044  0 0
                                        0      0      0      1 0"
                                />
                            </filter>

                            <filter id="deuteranopia">
                                <feColorMatrix
                                    type="matrix"
                                    values="
                                        0.367  0.861 -0.228  0 0
                                        0.280  0.673  0.047  0 0
                                       -0.012  0.043  0.969  0 0
                                        0      0      0      1 0"
                                />
                            </filter>

                            <filter id="tritanopia">
                                <feColorMatrix
                                    type="matrix"
                                    values="
                                        1.256 -0.077 -0.179  0 0
                                       -0.078  0.931  0.148  0 0
                                        0.005  0.691  0.304  0 0
                                        0      0      0      1 0"
                                />
                            </filter>
                            
                            <filter id="achromatopsia">
                                <feColorMatrix
                                    type="matrix"
                                    values="
                                        0.299  0.587  0.114  0 0
                                        0.299  0.587  0.114  0 0
                                        0.299  0.587  0.114  0 0
                                        0      0      0      1 0"
                                />
                            </filter>
                        </defs>
                    </svg>
                
                    <div id="overlay" className="overlay-filter-none"></div>
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
                                    {/* <Route path="/create-community" element={<CreateCommunity />} /> */}
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
                                    <Route path="*" element={<NotFoundPage />} />
                                </Route>
                            </Route>
                        </Routes>
                    </header>
                </div>
            </Router>
        </>
    );
}; export default App;
