import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import useApiRequest from "../../hooks/useApiRequest.js";
import { UserIcon } from "@heroicons/react/24/solid";
import ResetPasswordProgress from "./ResetPasswordProgress.jsx";

export default function ForgotPasswordSection() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { sendRequest, error, data, isLoading } = useApiRequest({
    auth: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendRequest("post", "auth/password-reset/", { email });
  };

  useEffect(() => {
    console.log("🔁 reset data:", data);
    if (data?.message) {
      localStorage.setItem("reset_email", email);
      navigate("/reset-code");
    }
  }, [data, email, navigate]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
      <div className="text-center">
        <img
          src="/macro_mates_blue_logo.png"
          alt="MacroMates"
          className="h-20 w-auto mx-auto"
        />
      </div>

      <div className="bg-base-200/75 border-base-300 rounded-box w-xs border p-6 space-y-4 mt-4">
        <h2 className="text-xl font-semibold text-center mb-4 !text-primary-content">
          Reset Password
        </h2>
        {/* Email input */}
        <label className="label" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
            <UserIcon className="w-5 h-5 text-primary" />
          </span>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered pl-10 w-full text-primary"
            placeholder="Email"
            required
          />
        </div>

        {/* Server error */}
        {error?.detail && (
          <p className="text-sm text-error text-center">{error.detail}</p>
        )}

        {/* Submit + progress */}
        <div className="space-y-4">
          <button
            type="submit"
            className={`btn btn-primary mt-6 w-full ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Sending…" : "Reset Password"}
          </button>

          <Link to="/" className="btn btn-link w-full text-primary-content">
            back to Login
          </Link>
        </div>
        <ResetPasswordProgress step={1} />
      </div>
    </form>
  );
}
