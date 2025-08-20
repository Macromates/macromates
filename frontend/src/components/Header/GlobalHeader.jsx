import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { logoutUser } from "../../store/slices/loggedInUser";

export default function GlobalHeader({ pageTitle = "Dashboard" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.loggedInUser || {});

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };
  const handleProfile = () => navigate("/profile");
  const handleSettings = () => navigate("/settings");

  const initials = user?.first_name
    ? user.first_name.charAt(0).toUpperCase()
    : "";
  const avatarSrc = user?.avatar || "";

  return (
    <header className="w-full flex justify-between items-center p-4 md:p-6 bg-base-100 shadow-sm z-100 sticky top-0">
      {/* Logo */}
      <div className="flex items-center">
        <Link to="/dashboard" className="flex items-center">
          <img
            src="/macro_mates_blue_logo.png"
            alt="MacroMates"
            className="h-15 w-auto"
          />
        </Link>
      </div>

      {/* Page Title */}
      <h1 className="text-xl md:text-2xl font-bold text-center flex-1 mx-4">
        {pageTitle}
      </h1>

      {/* Avatar Dropdown */}
      <div className="dropdown dropdown-end">
        <label
          tabIndex={0}
          className="avatar avatar-placeholder cursor-pointer"
        >
          {avatarSrc ? (
            <div className="w-10 rounded-full">
              <img src={avatarSrc} alt="User Avatar" />
            </div>
          ) : (
            <div
              className="text-white w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#007bff" }}
            >
              <span className="text-sm font-medium">{initials}</span>
            </div>
          )}
        </label>
        <ul
          tabIndex={0}
          className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-50"
        >
          <li>
            <button className="text-primary" onClick={handleProfile}>
              Profile
            </button>
          </li>
          <li>
            <button className="text-primary" onClick={handleSettings}>
              Settings
            </button>
          </li>
          <li>
            <button className="text-primary" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
