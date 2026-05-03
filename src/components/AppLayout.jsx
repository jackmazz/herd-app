import Navbar from "components/Navbar.jsx";
import ReadingMode from "components/ReadingMode.jsx";
import { Outlet } from "react-router-dom";
import React, { useState, useEffect } from "react";

const AppLayout = ({ loggedIn }) => {
    // if (!loggedIn) {
    //     return <Navigate to="/" replace />;
    // }

    const userId = String(sessionStorage.getItem("user"));

    const [isReadingMode, setIsReadingMode] = useState();
    const [user, setUser] = useState();
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    useEffect(() => {
        setReadingMode();
        handleMouseDown();
    }, []);

    useEffect(() => {
        const onResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        const onReadingModeChanged = (event) => {
            const nextValue = event?.detail?.value;
            if (typeof nextValue === "boolean") {
                setIsReadingMode(nextValue);
            }
        };

        window.addEventListener("reading-mode-changed", onReadingModeChanged);
        return () => {
            window.removeEventListener("reading-mode-changed", onReadingModeChanged);
        };
    }, []);

    const setReadingMode = () => {
        fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`)
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setIsReadingMode(data.attributes?.readingMode || false);
                console.log(data.attributes?.readingMode);
        });
    }

    const [selectedText, setSelectedText] = useState("");
    const [selectedHtml, setSelectedHtml] = useState("");

    const handleMouseUp = () => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) return;

        const text = selection.toString().trim();

        if (!text) return;

        // Save plain text
        setSelectedText(text);

        // Optional: save HTML content of selection
        const range = selection.getRangeAt(0);
        const container = document.createElement("div");
        container.appendChild(range.cloneContents());
        setSelectedHtml(container.innerHTML);
    };

    const handleMouseDown = () => {
        setTimeout(() => {
            const selection = window.getSelection();
            console.log(selection.toString());
        }, 0);
    };

    return (
        <div className="app-shell" onMouseUp={handleMouseUp}>
            {(isReadingMode) ? (
                // reading mode open
                <>
                {(screenWidth > 700) ? (
                    <>
                        <div className="split left">
                            <Navbar isReadingMode={true}/>
                            <main className="page-content">
                                <Outlet />
                            </main>
                        </div>

                        <div className="split right">
                            <ReadingMode selectedText={selectedText} screenWidth={screenWidth}/>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <Navbar isReadingMode={true}/>
                            <main className="page-content none">
                                <Outlet />
                            </main>
                        </div>

                        <div className="full">
                            <ReadingMode selectedText={selectedText} screenWidth={screenWidth}/>
                        </div>
                    </>
                )}
                </>
            ):(
                // reading mode not open
                <>
                    <Navbar isReadingMode={false}/>
                    <main className="page-content">
                        <Outlet />
                    </main>
                </>
            )}
        </div>
    );
};

export default AppLayout;