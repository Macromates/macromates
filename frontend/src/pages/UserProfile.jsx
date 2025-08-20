import { useParams, useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import useAutoFetch from "../hooks/useAutoFetch.js";
import { logoutUser } from "../store/slices/loggedInUser";
import Profile from "../components/Profile/Profile.jsx";

export default function ProfilePage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user: currentUser } = useSelector(
    (state) => state.loggedInUser || {}
  );

  // Determine endpoint: another user's profile or own
  const endpoint = profileId ? `/users/${profileId}/` : "/users/me/";

  // Auto-fetch user data
  const { data: userdata, error } = useAutoFetch(
    "get",
    endpoint,
    null,
    null,
    true
  );

  // Check if viewing own profile
  const isOwnProfile = !profileId || currentUser?.id === Number(profileId);

  // Loading state if no data and no error
  if (!userdata && !error) return <p>Loading profile...</p>;

  // Error handling for auth issues
  if (error) {
    if (error.detail && error.detail.toLowerCase().includes("token")) {
      dispatch(logoutUser());
      navigate("/");
      return null;
    }
    return <p className="text-error">Error loading profile.</p>;
  }

  return <Profile userdata={userdata} isOwnProfile={isOwnProfile} />;
}
