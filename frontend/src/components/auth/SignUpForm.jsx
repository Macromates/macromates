import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import useApiRequest from "../../hooks/useApiRequest";
import { UserIcon } from "@heroicons/react/24/solid";
import CreateAccountProgress from "./CreateAccountProgress";

export default function SignUpForm() {
  const [userEmail, setEmail] = useState("");
  const navigate = useNavigate();
  const { sendRequest, data, error, isLoading } = useApiRequest({
    auth: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendRequest("POST", "auth/registration/", { email: userEmail });
  };

  useEffect(() => {
    if (data?.message?.toLowerCase().includes("verification code")) {
      localStorage.setItem("registered_email", userEmail);
      navigate("/congratulations");
    }
  }, [data, userEmail, navigate]);

  const getErrorMessage = () => {
    if (!error) return null;

    const resp = error.response?.data ?? error;
    if (resp) {
      if (resp.email) {
        const raw = Array.isArray(resp.email)
          ? resp.email.join(" ")
          : String(resp.email);
        if (raw.toLowerCase().includes("already exists")) {
          return "An account with this email already exists. Try logging in instead.";
        }
        return raw;
      }
      if (resp.non_field_errors) {
        return resp.non_field_errors.join(" ");
      }
      return JSON.stringify(resp);
    }

    return error.message;
  };

  const serverError = getErrorMessage();

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
      <div className="text-center">
        <img
          src="/macro_mates_blue_logo.png"
          alt="MacroMates"
          className="h-20 w-auto mx-auto"
        />
      </div>

      <div className="bg-base-200/70 border border-base-300 rounded-box w-xs p-4 mt-4">
        <h2 className="!text-primary-content text-xl font-semibold mb-6">
          Register
        </h2>

        <div className="space-y-4">
          <div>
            <label className="label text-primary-content mb-2" htmlFor="email">
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
                value={userEmail}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered pl-10 w-full text-primary"
                placeholder="Email"
                required
              />
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-error mb-3 text-center">{serverError}</p>
          )}
          <button
            type="submit"
            className={`btn btn-primary mt-4 w-full ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Sending…" : "Register"}
          </button>
          <Link
            to="/"
            className="btn btn-link mt-2 w-full text-primary-content"
          >
            Or Login
          </Link>
          <CreateAccountProgress step={1} />
        </div>
      </div>
    </form>
  );
}
