import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import useApiRequest from "../../hooks/useApiRequest.js";
import CreateAccountProgress from "./CreateAccountProgress.jsx";
import { loginUser } from "../../store/slices/loggedInUser.js";
import { useDispatch } from "react-redux";

export default function VerificationSection() {
  const registeredEmail = localStorage.getItem("registered_email");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [userData, setUserData] = useState({
    email: registeredEmail,
    code: "",
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    password_repeat: "",
  });

  const [localError, setLocalError] = useState(null);

  // Trigger verification
  const {
    sendRequest: sendVerify,
    data: verifyData,
    error: verifyError,
    isLoading: verifyLoading,
  } = useApiRequest({ auth: false });

  // Trigger login after verification
  const {
    sendRequest: sendLogin,
    data: loginData,
    error: loginError,
    isLoading: loginLoading,
  } = useApiRequest({ auth: false });

  const [showSuccess, setShowSuccess] = useState(false);

  // Flatten server errors
  const getErrorMessages = (err) => {
    if (!err) return [];
    return typeof err === "string"
      ? [err]
      : Object.values(err).flatMap((msgs) =>
          Array.isArray(msgs) ? msgs : [msgs]
        );
  };

  const handleInput = (e) => {
    setUserData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setLocalError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userData.password !== userData.password_repeat) {
      setLocalError("Passwords do not match.");
      return;
    }

    sendVerify("patch", "auth/registration/validation/", {
      email: userData.email,
      code: userData.code,
      password: userData.password,
      username: userData.username.trim() || undefined,
      first_name: userData.first_name.trim() || undefined,
      last_name: userData.last_name.trim() || undefined,
    });
  };

  // After successful verification, send login
  useEffect(() => {
    if (verifyData && !verifyError) {
      sendLogin("post", "auth/token/", {
        email: userData.email,
        password: userData.password,
      });
    }
  }, [verifyData, verifyError, sendLogin, userData.email, userData.password]);

  // After login, dispatch and redirect
  useEffect(() => {
    if (loginData?.access) {
      if (loginData.user) {
        dispatch(
          loginUser({ user: loginData.user, accessToken: loginData.access })
        );
        localStorage.setItem("user", JSON.stringify(loginData.user));
      }
      localStorage.removeItem("registered_email");
      localStorage.setItem("auth-token", loginData.access);
      if (loginData.refresh) {
        localStorage.setItem("auth-refresh", loginData.refresh);
      }
      setShowSuccess(true);
      navigate("/onboarding");
    }
  }, [loginData, dispatch, navigate]);

  const verifyErrors = getErrorMessages(verifyError);
  const loginErrors = getErrorMessages(loginError?.detail || loginError);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
      <div className="text-center">
        <img
          src="/macro_mates_blue_logo.png"
          alt="MacroMates"
          className="h-20 w-auto mx-auto"
        />
      </div>

      <div className="bg-base-200/75 border border-base-300 rounded-box w-xs p-4 mt-4">
        <h2 className="!text-primary-content text-xl font-semibold mb-6 text-center">
          Verification
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 form-control">
              <label htmlFor="code" className="label">
                <span className="label-text">Validation Code</span>
              </label>
              <input
                id="code"
                type="text"
                value={userData.code}
                onChange={handleInput}
                placeholder="Enter code"
                className="input input-bordered w-full text-primary"
                required
              />
            </div>

            <div className="form-control">
              <label htmlFor="email" className="label">
                <span className="label-text">E-mail</span>
              </label>
              <input
                id="email"
                type="email"
                value={userData.email}
                onChange={handleInput}
                placeholder="Email"
                className="input input-bordered w-full text-primary"
                required
              />
            </div>

            <div className="form-control">
              <label htmlFor="username" className="label">
                <span className="label-text">Username</span>
              </label>
              <input
                id="username"
                value={userData.username}
                onChange={handleInput}
                placeholder="Username"
                className="input input-bordered w-full text-primary"
                required
              />
            </div>

            <div className="form-control">
              <label htmlFor="first_name" className="label">
                <span className="label-text">First Name</span>
              </label>
              <input
                id="first_name"
                value={userData.first_name}
                onChange={handleInput}
                placeholder="First Name"
                className="input input-bordered w-full text-primary"
                required
              />
            </div>
            <div className="form-control">
              <label htmlFor="last_name" className="label">
                <span className="label-text">Last Name</span>
              </label>
              <input
                id="last_name"
                value={userData.last_name}
                onChange={handleInput}
                placeholder="Last Name"
                className="input input-bordered w-full text-primary"
              />
            </div>

            <div className="form-control">
              <label htmlFor="password" className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                id="password"
                type="password"
                value={userData.password}
                onChange={handleInput}
                placeholder="Password"
                className="input input-bordered w-full text-primary"
                required
              />
            </div>
            <div className="form-control">
              <label htmlFor="password_repeat" className="label">
                <span className="label-text">Repeat Password</span>
              </label>
              <input
                id="password_repeat"
                type="password"
                value={userData.password_repeat}
                onChange={handleInput}
                placeholder="Repeat Password"
                className="input input-bordered w-full text-primary"
                required
              />
            </div>
          </div>

          {localError && (
            <p className="text-sm text-error mt-4 text-center">{localError}</p>
          )}
          {verifyErrors.map((msg, idx) => (
            <p
              key={`verify-${idx}`}
              className="text-sm text-error mt-4 text-center"
            >
              {msg}
            </p>
          ))}
          {loginErrors.map((msg, idx) => (
            <p
              key={`login-${idx}`}
              className="text-sm text-error mt-4 text-center"
            >
              {msg}
            </p>
          ))}
          {showSuccess && (
            <div className="alert alert-success max-w-xs">
              <span>Verification and login successful! Redirecting…</span>
            </div>
          )}

          <button
            type="submit"
            disabled={verifyLoading || loginLoading || showSuccess}
            className={`btn btn-primary w-full mt-6 ${verifyLoading || loginLoading ? "loading" : ""}`}
          >
            {verifyLoading || loginLoading ? "Processing…" : "Complete"}
          </button>

          <div className="mt-4 flex justify-center">
            <CreateAccountProgress step={3} />
          </div>
        </div>
      </div>
    </form>
  );
}
