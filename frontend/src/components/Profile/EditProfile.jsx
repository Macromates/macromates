import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { updateUser, fetchCurrentUser } from "../../store/slices/loggedInUser";

// Define allowed activity levels
const ACTIVITY_OPTIONS = [
  "Every day",
  "A few times a week",
  "Sometimes",
  "Rarely",
  "Never",
];

export default function EditProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get current user from Redux
  const userdata = useSelector((state) => state.loggedInUser.user);
  const isLoading = useSelector((state) => state.loggedInUser.isLoading);

  // Local form state and loaded flag
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    about_me: "",
    email: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    hand_length: "",
    activity_level: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);

  // Populate form when userdata arrives
  useEffect(() => {
    if (userdata) {
      setForm({
        first_name: userdata.first_name || "",
        last_name: userdata.last_name || "",
        username: userdata.username || "",
        about_me: userdata.about_me || "",
        email: userdata.email || "",
        age: userdata.age != null ? String(userdata.age) : "",
        weight: userdata.weight != null ? String(userdata.weight) : "",
        height: userdata.height != null ? String(userdata.height) : "",
        gender: userdata.gender || "",
        hand_length:
          userdata.hand_length != null ? String(userdata.hand_length) : "",
        activity_level: userdata.activity_level || "",
      });
      // Set existing avatar preview if available
      const existingAvatar =
        userdata.avatar_url ||
        (userdata.avatar && (userdata.avatar.url || userdata.avatar));
      if (existingAvatar) {
        setAvatarPreview(existingAvatar);
      }
      setFormLoaded(true);
    }
  }, [userdata]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setRemoveAvatar(false);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    setRemoveAvatar(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value === "" || value == null) return;
      if (["age", "weight", "height", "hand_length"].includes(key)) {
        const num = key === "age" ? parseInt(value, 10) : parseFloat(value);
        if (!isNaN(num)) formData.append(key, num);
      } else {
        formData.append(key, value);
      }
    });
    if (avatarFile) {
      formData.append("avatar", avatarFile, avatarFile.name);
    }
    if (removeAvatar) {
      formData.append("remove_avatar", "true");
    }

    const resultAction = await dispatch(updateUser(formData));
    if (updateUser.fulfilled.match(resultAction)) {
      navigate("/profile");
    } else {
      const errorPayload = resultAction.payload;
      console.error("Update failed details:", errorPayload);
      const errorMessage =
        typeof errorPayload === "string"
          ? errorPayload
          : JSON.stringify(errorPayload, null, 2);
      alert("Update failed: " + errorMessage);
    }
  };

  const handleCancel = () => navigate("/profile");

  if (isLoading || !userdata || !formLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-136px)] flex flex-col items-center justify-center bg-base-100 w-full p-6">
      <div className="bg-base-200 border border-base-300 rounded-box max-w-sm p-4">
        <h2 className="!text-primary-content text-xl font-semibold mb-6 text-center">
          Edit Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload & Preview */}
          <div className="flex flex-col items-center">
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
            )}
            <label className="label">
              <span className="label-text">Avatar</span>
            </label>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
              className="file-input file-input-bordered w-full"
            />
          </div>
          {/* Name & Username */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="input input-bordered w-full text-primary"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Last Name</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="input input-bordered w-full text-primary"
              />
            </div>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Username</span>
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="input input-bordered w-full text-primary"
            />
          </div>

          {/* About Me */}
          <div>
            <label className="label">
              <span className="label-text">About Me</span>
            </label>
            <textarea
              name="about_me"
              value={form.about_me}
              onChange={handleChange}
              className="textarea textarea-bordered w-full text-primary"
              rows={3}
            />
          </div>

          {/* Contact & Details */}
          <div>
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input input-bordered w-full text-primary"
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Gender</span>
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="select select-bordered w-full text-primary"
            >
              <option value="">Not Specified</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Age</span>
              </label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                className="input input-bordered w-full text-primary"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Weight (kg)</span>
              </label>
              <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                className="input input-bordered w-full text-primary"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Height (cm)</span>
              </label>
              <input
                type="number"
                name="height"
                value={form.height}
                onChange={handleChange}
                className="input input-bordered w-full text-primary"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Hand Length (cm)</span>
              </label>
              <input
                type="number"
                name="hand_length"
                value={form.hand_length}
                onChange={handleChange}
                className="input input-bordered w-full text-primary"
              />
            </div>
            {/* Updated Activity Level as select */}
            <div>
              <label className="label">
                <span className="label-text">Activity Level</span>
              </label>
              <select
                name="activity_level"
                value={form.activity_level}
                onChange={handleChange}
                className="select select-bordered w-full text-primary"
              >
                <option value="">Select one</option>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
