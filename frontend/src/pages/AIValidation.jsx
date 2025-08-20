import { useEffect, useState } from "react";
import GoalSelectionForm from "../components/ai/GoalSelectionForm";
import AIInputForm from "../components/ai/AIInputForm";
import TargetGoalInputs from "../components/ai/TargetGoalInputs";
import Toast from "../components/ui/Toast";
import useAIValidation from "../hooks/useAIValidation";
import useGoalSubmission from "../hooks/useGoalSubmission";
import useGoalForm from "../hooks/useGoalForm";
import StepProgress from "../components/ai/StepProgress";
import AnimatedStepContainer from "../components/ai/AnimatedStepContainer";

export default function AIValidation() {
  const {
    validationResult,
    is_reasonable,
    aiInput,
    loading: validationLoading,
    error: validationError,
    validateGoal,
    clearValidation,
  } = useAIValidation();

  const {
    selectedGoal,
    showSuccessToast,
    showErrorToast,
    partialLoading,
    finalLoading,
    partialError,
    finalError,
    createPartialGoal,
    submitFinalGoal,
    handleRetrySubmit,
    setShowErrorToast,
  } = useGoalSubmission();

  const {
    selectedGoalType,
    targetGoal,
    handleSelectedGoal,
    handleTargets,
    handleRetryValidation: scrollToInput,
  } = useGoalForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionStarted, setSubmissionStarted] = useState(false);

  // Move to step 2 when validation result is available
  useEffect(() => {
    if (validationResult) {
      setCurrentStep(2);
    }
  }, [validationResult]);

  // Auto-submit final goal when conditions are met (only once)
  useEffect(() => {
    if (selectedGoal && is_reasonable && aiInput && !submissionStarted) {
      setSubmissionStarted(true);
      submitFinalGoal(aiInput, targetGoal);
    }
  }, [
    selectedGoal,
    is_reasonable,
    aiInput,
    targetGoal,
    submitFinalGoal,
    submissionStarted,
  ]);

  const handleAIValidation = (validationString) => {
    validateGoal(validationString, selectedGoalType);
  };

  const handleRetryValidation = () => {
    setCurrentStep(1);
    setSubmissionStarted(false); // Reset submission flag
    clearValidation();
    scrollToInput();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmissionStarted(false); // Reset submission flag before starting
    createPartialGoal(selectedGoalType);
  };

  const loading = validationLoading || partialLoading || finalLoading;
  const error = validationError || partialError || finalError;

  const steps = [
    { id: 1, label: "Goal Setup", shortLabel: "Setup" },
    { id: 2, label: "Review & Submit", shortLabel: "Review" },
  ];

  return (
    /* First step will contain goal selection and target inputs */
    <div className="container flex flex-col gap-10 mx-auto px-4 py-8 max-w-4xl">
      <StepProgress currentStep={currentStep} steps={steps} />
      {loading && (
        <div className="loading loading-xl text-primary mx-auto">
          Loading...
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-sm">
              {error?.error ||
                error?.message ||
                JSON.stringify(error) ||
                "An error occurred"}
            </div>
          </div>
        </div>
      )}
      {currentStep === 1 && (
        <AnimatedStepContainer>
          <GoalSelectionForm onGoalSelect={handleSelectedGoal} />
          <TargetGoalInputs onTargetGoalChange={handleTargets} />
          <div data-ai-input-form>
            <AIInputForm onSubmit={handleAIValidation} />
          </div>
        </AnimatedStepContainer>
      )}

      {currentStep === 2 && (
        <AnimatedStepContainer>
          <div className="validation-result mt-8 p-6 bg-base-200/75 rounded-lg border border-base-300">
            <h3 className="text-2xl font-bold !text-primary-content mb-6">
              AI Validation Result
            </h3>
            <div className="grid gap-4">
              <div className="bg-base-100 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-2 text-primary">
                  Extracted Timeframe
                </h4>
                <p className="text-base text-primary">
                  {validationResult.extracted_timeframe}
                </p>
              </div>
              <div className="bg-base-100 p-4 rounded-lg text-primary">
                <h4 className="font-semibold text-lg mb-2">Feedback</h4>
                <p className="text-base">{validationResult.feedback}</p>
              </div>
              <div className="bg-base-100 p-4 rounded-lg text-primary">
                <h4 className="font-semibold text-lg mb-2">Suggestion</h4>
                <p className="text-base">{validationResult.suggestion}</p>
              </div>
              <div className="bg-base-100 p-4 rounded-lg text-primary">
                <h4 className="font-semibold text-lg mb-2">
                  Timeframe in Days
                </h4>
                <p className="font-mono text-xl">
                  {validationResult.timeframe_days} days
                </p>
              </div>
            </div>

            {!is_reasonable && (
              <div className="mt-6 p-4 bg-blue-200/80 border-2 border-blue-400 shadow-lg rounded-lg">
                <p className="mb-4 font-medium text-lg text-error">
                  Validation failed. Please review the feedback and try again
                  with a more specific goal.
                </p>
                <button
                  className="btn btn-error w-full sm:w-auto hover:brightness-90 transition"
                  onClick={handleRetryValidation}
                >
                  Try Again
                </button>
              </div>
            )}

            {is_reasonable && (
              <div className="mt-6 p-4 bg-success/10 border border-success/20 text-success rounded-lg">
                <p className="mb-4 font-medium text-primary-content">
                  ✅ Your goal looks great! Ready to submit?
                </p>
                <button
                  className="btn btn-success w-full sm:w-auto"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Goal"}
                </button>
              </div>
            )}
          </div>
        </AnimatedStepContainer>
      )}

      <Toast
        show={showSuccessToast}
        type="success"
        title="Success!"
        message="Goal submitted successfully. Redirecting to dashboard..."
      />

      <Toast
        show={showErrorToast}
        type="error"
        title="Submission Failed"
        message={
          finalError?.error ||
          finalError?.message ||
          partialError?.error ||
          partialError?.message ||
          "Failed to submit goal. Please try again."
        }
        onRetry={() => {
          setSubmissionStarted(false); // Reset submission flag on retry
          handleRetrySubmit();
        }}
        onClose={() => setShowErrorToast(false)}
      />
    </div>
  );
}
