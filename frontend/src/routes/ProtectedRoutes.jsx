import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import Dock from "../components/Dock/Dock";
import GlobalHeader from "../components/Header/GlobalHeader";
import PhotoCaptureButton from "../components/PhotoCaptureButton";
import { fetchCurrentUser } from "../store/slices/loggedInUser";
import {
  HomeIcon as DashboardIcon,
  Cog6ToothIcon as SettingsIcon,
  ListBulletIcon as GoalIcon,
  ChartBarIcon as TrackIcon,
} from "@heroicons/react/24/outline";

export const ProtectedRoutes = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const {
    user: currentUser,
    accessToken,
    isLoading,
  } = useSelector((state) => state.loggedInUser);

  useEffect(() => {
    if (accessToken && !currentUser) {
      dispatch(fetchCurrentUser());
    } else if (!accessToken) {
      navigate("/");
    }
  }, [currentUser, accessToken, dispatch, navigate]);

  if (isLoading || !currentUser) return null;

  const _initials = currentUser.first_name
    ? currentUser.first_name.charAt(0).toUpperCase()
    : currentUser.username
      ? currentUser.username.charAt(0).toUpperCase()
      : "";

  const dockItems = [
    { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
    { to: "/goals", label: "Goals", icon: GoalIcon },
    { to: "/track", label: "Track", icon: TrackIcon },
  ];

  // Routes where dock should be hidden
  const hideDockRoutes = ["/camera", "/analysis-results"];
  const shouldHideDock = hideDockRoutes.includes(location.pathname);

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/goals":
        return "Goals";
      case "/profile":
        return "Profile";
      case "/settings":
        return "Settings";
      case "/track":
        return "Track";
      case "/camera":
        return "Camera";
      case "/analysis-results":
        return "Analysis Results";
      default:
        return "MacroMates";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Global Header - always visible */}
      <GlobalHeader pageTitle={getPageTitle()} />

      {/* Main content area */}
      <main className={`flex-1 ${shouldHideDock ? "" : "pb-16"}`}>
        <Outlet />
      </main>

      {/* Bottom navigation - hidden on certain routes */}
      {!shouldHideDock && (
        <div className="relative">
          <PhotoCaptureButton />
          <Dock items={dockItems} />
        </div>
      )}
    </div>
  );
};

export default ProtectedRoutes;
