import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import useApiRequest from "../../hooks/useApiRequest.js";
import ResetPasswordProgress from "./ResetPasswordProgress.jsx";

export default function ResetPasswordSection() {
  const resetEmail = localStorage.getItem("reset_email") || "";
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: resetEmail,
    code: "",
    password: "",
    password_repeat: "",
  });
  const [localError, setLocalError] = useState(null);
  const { sendRequest, error, data, isLoading } = useApiRequest({
    auth: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInput = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setLocalError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_repeat) {
      setLocalError("Passwords do not match.");
      return;
    }
    const payload = {
      email: formData.email,
      code: formData.code,
      password: formData.password,
    };
    sendRequest("patch", "auth/password-reset/validation/", payload);
  };

  useEffect(() => {
    if (data) {
      localStorage.removeItem("reset_email");

      setShowSuccess(true);

      const timer = setTimeout(() => {
        navigate("/");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [data, navigate]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
      <div className="text-center">
        <img
          src="/macro_mates_blue_logo.png"
          alt="MacroMates"
          className="h-20 w-auto mx-auto"
        />
      </div>

      <div className="bg-base-200/80 border-base-300 rounded-box w-xs border p-6 space-y-4 mt-4">
        <h2 className="text-xl font-semibold text-center mb-4 !text-primary-content">
          Reset Password
        </h2>

        {/* Reset Code */}
        <div className="md:col-span-1 form-control">
          <label htmlFor="code" className="label">
            <span className="label-text">Reset Code</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 z-10"></span>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={handleInput}
              placeholder="Enter reset code"
              className="input input-bordered w-full text-primary"
              required
            />
          </div>
          {error?.code && (
            <p className="text-sm text-error mt-1">{error.code}</p>
          )}
        </div>

        {/* New Password */}
        <div className="form-control">
          <label htmlFor="password" className="label">
            <span className="label-text">New Password</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 z-10"></span>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInput}
              placeholder="New Password"
              className="input input-bordered w-full text-primary"
              required
            />
          </div>
          {error?.new_password && (
            <p className="text-sm text-error mt-1">{error.new_password}</p>
          )}
        </div>

        {/* Repeat Password */}
        <div className="form-control">
          <label htmlFor="password_repeat" className="label">
            <span className="label-text">Repeat Password</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 z-10"></span>
            <input
              id="password_repeat"
              type="password"
              value={formData.password_repeat}
              onChange={handleInput}
              placeholder="Repeat Password"
              className="input input-bordered w-full text-primary"
              required
            />
          </div>
        </div>

        {localError && (
          <p className="text-sm text-error mt-2 text-center">{localError}</p>
        )}
        {(error?.non_field_errors || error?.detail) && (
          <p className="text-sm text-error mt-2 text-center">
            {error.non_field_errors || error.detail}
          </p>
        )}

        {showSuccess && (
          <div className="alert alert-success max-w-xs">
            <span>Password reset successfully! Redirecting…</span>
          </div>
        )}

        {/* Submit and progress */}
        <button
          type="submit"
          disabled={isLoading || showSuccess}
          className={`btn btn-primary w-full mt-6 ${isLoading ? "loading" : ""}`}
        >
          {isLoading ? "Resetting…" : "Reset Password"}
        </button>

        <div className="flex justify-center mt-4">
          <ResetPasswordProgress step={3} />
        </div>
      </div>
    </form>
  );
}
