import PageRoutes from "./routes";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import useAutoFetch from "./hooks/useAutoFetch";
import { logoutUser, loginUser } from "./store/slices/loggedInUser.js";

(function () {
  try {
    const stored = localStorage.getItem("theme");
    document.documentElement.setAttribute(
      "data-theme",
      stored === "dark" ? "dark" : "light"
    );
  } catch {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();

export default function App() {
  const dispatch = useDispatch();
  const accessToken = localStorage.getItem("auth-token");

  const { error, loading } = useAutoFetch("post", "auth/token/verify/", {
    token: accessToken,
  });

  useEffect(() => {
    if (error === null) {
      // Only set the token, let ProtectedRoutes fetch fresh user data
      dispatch(loginUser({ user: null, accessToken: accessToken }));
    } else {
      dispatch(logoutUser());
      localStorage.clear();
    }
  }, [error, accessToken, dispatch]);

  if (loading)
    return <span className="loading loading-spinner loading-xl"></span>;

  return (
    <div className="min-h-screen flex justify-center flex-col text-primary-content">
      <PageRoutes />
    </div>
  );
}
