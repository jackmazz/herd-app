import { Link } from "react-router-dom";
import logoutIcon from "../assets/logout.png";
import gearIcon from "../assets/gear_test.png";
import tilesIcon from "../assets/tiles.svg";
import homeIcon from "../assets/home.svg";
import plusIcon from "../assets/plus.svg";
import logoIcon from "../assets/logo.svg";
import aboutDevsIcon from "../assets/aboutDev.svg";
import defaultProfileIcon from "../assets/default-profile.svg";

// import settings from "./Component/Settings";
// import login from "./Component/LoginForm.jsx";

const Navbar = ({ user, onLogout }) => {
  return (
      <nav className="topnav">

        {/* LEFT: LOGO + APP NAME */}
        <div className="nav-logo">
          <Link to="/">
            <img src={logoIcon} alt="Herd Logo" className="topnav-icon" />
          </Link>
          <span className="app-name">Herd</span>
        </div>

        {/* RIGHT: NAV ICONS */}
        <ul className="nav-right">

          <li>
            <Link to="/homePage">
              <img src={homeIcon} alt="Home" className="topnav-icon" />
            </Link>
          </li>

          <li>
            <Link to="/feed">
              <img src={tilesIcon} alt="Feed" className="topnav-icon" />
            </Link>
          </li>

          <li>
            <Link to="/postForm">
              <img src={plusIcon} alt="Post" className="topnav-icon" />
            </Link>
          </li>

          <li>
            <Link to="/settings">
              <img src={gearIcon} alt="Settings" className="topnav-icon" />
            </Link>
          </li>

          <li>
            <Link to="/about-me-links">
              <img src={aboutDevsIcon} alt="About Developers" className="topnav-icon" />
            </Link>
          </li>

          <li>
            <Link to="/profile">
              <img
                  src={user?.profilePhoto || defaultProfileIcon}
                  alt="Profile"
                  className="topnav-icon profile-photo"
              />
            </Link>
          </li>

          <li>
            <Link to="/register">
            <button onClick={onLogout} className="logout-btn">
              <img src={logoutIcon} alt="Logout" className="topnav-icon" />
            </button>
            </Link>
          </li>

        </ul>
      </nav>
  );
};

export default Navbar;
