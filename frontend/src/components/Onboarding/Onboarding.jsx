import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import useApiRequest from "../../hooks/useApiRequest.js";

// Fields to collect in onboarding
const FIELDS = [
  {
    id: "age",
    label: "Age",
    type: "number",
    description: "Recommended for better calorie estimates.",
  },
  {
    id: "gender",
    label: "Gender",
    type: "select",
    options: ["M", "F", "O"],
    description: "Helps personalize your recommendations.",
  },
  {
    id: "height",
    label: "Height (cm)",
    type: "number",
    description: "Improves portion size analysis.",
  },
  {
    id: "weight",
    label: "Weight (kg)",
    type: "number",
    description: "Used to calculate baseline caloric needs.",
  },
  {
    id: "hand_length",
    label: "Hand Length (cm)",
    type: "number",
    description: "Optional: enhances AI accuracy in food portion estimation.",
  },
  {
    id: "activity_level",
    label: "Activity Level",
    type: "select",
    options: [
      "Every day",
      "A few times a week",
      "Sometimes",
      "Rarely",
      "Never",
    ],
    description: "Tells us about your daily activity for macros.",
  },
  {
    id: "avatar",
    label: "Avatar",
    type: "file",
    description: "Optional: upload a profile picture.",
  },
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [value, setValue] = useState("");
  const [answers, setAnswers] = useState({});
  const {
    data: currentUser,
    sendRequest,
    isLoading,
    error,
  } = useApiRequest({ auth: true, fetchOnMount: true, path: "/users/me/" });

  // Pre-fill existing answers once
  useEffect(() => {
    if (currentUser) {
      const init = {};
      FIELDS.forEach((f) => {
        if (f.type !== "file" && currentUser[f.id] != null) {
          init[f.id] = currentUser[f.id];
        }
      });
      setAnswers(init);
    }
  }, [currentUser]);

  // Determine current field
  const field = FIELDS[step];
  if (!field) {
    // All steps complete: redirect
    return <Navigate to="/dashboard" replace />;
  }

  const isLast = step === FIELDS.length - 1;
  const buttonLabel = isLoading
    ? "Saving…"
    : !value && !isLast
      ? "Skip"
      : isLast
        ? "Finish"
        : "Continue";

  const handleContinue = async () => {
    const newAnswers = { ...answers };
    if (value) newAnswers[field.id] = value;
    setAnswers(newAnswers);

    // Prepare payload
    let payload;
    const options = {};
    if (field.id === "avatar") {
      payload = new FormData();
      Object.entries(newAnswers).forEach(([k, v]) => payload.append(k, v));
      options.multipart = true;
    } else {
      payload = newAnswers;
    }

    try {
      await sendRequest("patch", "/users/me/update/", payload, options);
      setValue("");
      setStep((s) => s + 1);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200/75 p-6">
      <div className="bg-base-100 border border-base-300 rounded-box p-6 w-full max-w-sm space-y-4">
        <h2 className="text-xl font-semibold text-center mb-2">
          Tell Us About You
        </h2>
        <p className="text-sm text-center text-primary">
          You can skip any question and add or edit these later in your profile.
          <br />
          Providing this info helps our AI give you more accurate macro and
          portion guides.
        </p>

        <div className="mt-4">
          <h3 className="text-lg font-medium">{field.label}</h3>
          {field.description && (
            <p className="text-xs text-primary mb-2">{field.description}</p>
          )}

          {field.type === "select" ? (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="select select-bordered w-full text-primary"
            >
              <option value="">(Skip)</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : field.type === "file" ? (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setValue(e.target.files[0] || "")}
              className="file-input file-input-bordered w-full text-primary-content"
            />
          ) : (
            <input
              type={field.type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.label}
              className="input input-bordered w-full border-primary/75 text-primary"
            />
          )}
        </div>

        {error && <p className="text-sm text-error">{error.message}</p>}

        <button
          onClick={handleContinue}
          disabled={isLoading}
          className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
        >
          {buttonLabel}
        </button>

        <div className="flex justify-center mt-4">
          <p className="text-xs text-center text-primary mt-1">
            Step {step + 1} of {FIELDS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
