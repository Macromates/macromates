import useApiRequest from "../../hooks/useApiRequest";
import { UserIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { loginUser } from "../../store/slices/loggedInUser.js";
import { Link, useNavigate } from "react-router";

export default function SignInForm() {
  const [user, setUser] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const { sendRequest, data, error } = useApiRequest();
  const dispatch = useDispatch();

  const handleInput = (e) => {
    setUser({ ...user, [e.target.id]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    sendRequest("post", "auth/token/", user);
  };

  useEffect(() => {
    if (data) {
      dispatch(loginUser({ user: data.user, accessToken: data.access }));
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("auth-token", data.access);
      navigate("/dashboard");
    }
  }, [data, dispatch, navigate]);

  return (
    <form onSubmit={handleLogin} className="w-full max-w-xs mx-auto">
      <div className="text-center">
        <img
          src="/macro_mates_blue_logo.png"
          alt="MacroMates"
          className="h-20 w-auto mx-auto"
        />
      </div>

      <div className="bg-base-200/75 border border-base-300 rounded-box w-xs p-6 mt-4">
        <h2 className="!text-primary-content text-xl mb-6">Login</h2>

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                <UserIcon className="w-5 h-5 text-primary-content" />
              </span>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                onChange={handleInput}
                className="input input-bordered pl-7 w-full text-primary"
                placeholder="Email"
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                <LockClosedIcon className="w-5 h-5 text-primary-content" />
              </span>
              <input
                type="password"
                id="password"
                name="password"
                value={user.password}
                onChange={handleInput}
                className="input input-bordered pl-7 w-full text-primary"
                placeholder="Password"
                required
              />
            </div>
          </div>

          <Link
            to="/forgot-password"
            className="btn btn-link w-full btn-primary-content m-0 text-primary-content"
          >
            Forgot Password?
          </Link>

          {error && (
            <p className="text-sm text-error mb-3">
              {error.message || "Login failed."}
            </p>
          )}

          <button
            type="submit"
            className="btn !btn-primary-content mt-6 w-full border border-primary-content"
          >
            Login
          </button>

          <Link
            to="/signup"
            className="btn btn-link mt-0 w-full text-primary-content"
          >
            Or Register
          </Link>
        </div>
      </div>
    </form>
  );
}
