import Navbar from "components/Navbar.jsx";
import { Outlet, Navigate } from "react-router-dom";

const AppLayout = ({ loggedIn }) => {
    // if (!loggedIn) {
    //     return <Navigate to="/" replace />;
    // }

    return (
        <div className="app-shell">
            <Navbar />
            <main className="page-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;