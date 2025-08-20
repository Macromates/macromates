import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../store/slices/loggedInUser";

export default function Profile({ userdata, isOwnProfile = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  const handleEdit = () => {
    navigate("/profile/edit");
  };

  // Fallback initials from first name or username
  const initials = userdata?.first_name
    ? userdata.first_name.charAt(0).toUpperCase()
    : userdata?.username?.charAt(0).toUpperCase() || "";

  // Construct avatar URL: use absolute if provided
  const avatarSrc = userdata?.avatar || null;

  const genderMap = {
    M: "Male",
    F: "Female",
    O: "Other",
  };

  const readableGender = genderMap[userdata?.gender] || "Not Specified";

  return (
    <div className="min-h-[calc(100vh-136px)] flex flex-col items-center justify-center bg-base-100 p-6 w-full">
      <div className="bg-base-200 border border-base-300 rounded-box p-4 w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-4 m-0">
          {avatarSrc ? (
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img
                src={avatarSrc}
                alt="User Avatar"
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-neutral text-neutral-content flex items-center justify-center text-xl font-medium">
              {initials}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold !text-primary-content">
              {userdata?.first_name || ""} {userdata?.last_name || ""}
            </h2>
            <p className="text-sm text-base-content/70">
              @{userdata?.username || ""}
            </p>
          </div>
        </div>
        <div className="divider"></div>
        {/* Main Info: About + Details */}
        <div className="mb-6 ">
          <div className="bg-base-100 border border-base-300 rounded-box w-full px-4 py-3 mb-2 shadow-sm">
            <h3 className="text-sm font-semibold text-primary mb-2">
              About Me
            </h3>
            <p className="text-center text-primary">
              {userdata?.about_me || "No bio available."}
            </p>
          </div>
          <div className="bg-base-100 border border-base-300 rounded-box w-full px-4 py-3 mb-2 shadow-sm">
            <h3 className="text-sm font-semibold text-base-content mb-2">
              Email:
            </h3>
            <p className="truncate text-center text-primary">
              {userdata?.email || ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="bg-base-100 border border-base-300 rounded-box w-full px-4 py-3 mb-2 shadow-sm">
              <h3 className="text-sm font-semibold text-base-content mb-2">
                Age:
              </h3>
              <p className="text-center text-primary">
                {userdata?.age ?? "No Age set."}
              </p>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-box w-full px-4 py-3 mb-2 shadow-sm">
              <h3 className="text-sm font-semibold text-base-content mb-2">
                Weight:
              </h3>
              <p className="text-center text-primary">
                {userdata?.weight ? `${userdata.weight} kg` : "No Weight set."}
              </p>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-box w-full px-4 py-3 mb-2 shadow-sm">
              <h3 className="text-sm font-semibold text-base-content mb-2">
                Height:
              </h3>
              <p className="text-center text-primary">
                {userdata?.height ? `${userdata.height} cm` : "No Height set."}
              </p>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-box w-full px-4 py-3 mb-2 shadow-sm">
              <h3 className="text-sm font-semibold text-base-content mb-2">
                Gender:
              </h3>
              <p className="text-center text-primary">{readableGender}</p>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-box w-full px-4 py-3 mb-2 shadow-sm">
              <h3 className="text-sm font-semibold text-base-content mb-2">
                Hand Length:
              </h3>
              <p className="text-center text-primary">
                {userdata?.hand_length ? `${userdata.hand_length} cm` : ""}
              </p>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-box w-full px-4 py-3 mb-2 shadow-sm">
              <h3 className="text-sm font-semibold text-base-content mb-2">
                Activity Level:
              </h3>
              <p className="text-center text-primary">
                {userdata?.activity_level || ""}
              </p>
            </div>
            <div />
          </div>
        </div>

        {/* Actions */}
        {isOwnProfile && (
          <div className="flex space-x-4">
            <button
              onClick={handleEdit}
              className="btn btn-outline w-full flex-1"
            >
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-primary w-full flex-1"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
