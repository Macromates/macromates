import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import useApiRequest from "./useApiRequest";

export default function useGoalSubmission() {
  const navigate = useNavigate();
  const {
    sendRequest: sendPartialRequest,
    error: partialError,
    data: partialData,
    loading: partialLoading,
  } = useApiRequest();
  const {
    sendRequest: sendFinalRequest,
    error: finalError,
    data: finalData,
    loading: finalLoading,
  } = useApiRequest();

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  // Handle partial goal creation response
  useEffect(() => {
    if (partialData) {
      console.log("Partial goal created:", partialData);
      setSelectedGoal(partialData.id);
    }
  }, [partialData]);

  // Handle final goal submission response
  useEffect(() => {
    if (finalData) {
      console.log("Goal submitted successfully:", finalData);
      setShowSuccessToast(true);
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }
  }, [finalData, navigate]);

  // Handle final goal submission error
  useEffect(() => {
    if (finalError) {
      console.log("Goal submission error:", finalError);
      setShowErrorToast(true);
    }
  }, [finalError]);

  const createPartialGoal = (selectedGoalType) => {
    sendPartialRequest("post", "goals/create-partial/", {
      goal_type: selectedGoalType,
    });
  };

  const submitFinalGoal = useCallback(
    (aiInput, targetGoal) => {
      if (selectedGoal && aiInput) {
        console.log("Submitting goal with AI validation");
        sendFinalRequest("patch", `goals/submit-goal/${selectedGoal}/`, {
          user_objective: aiInput,
          target_weight: targetGoal.targetWeight,
          target_score: targetGoal.targetScore,
        });
      }
    },
    [selectedGoal, sendFinalRequest]
  );

  const handleRetrySubmit = () => {
    setShowErrorToast(false);
  };

  return {
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
  };
}
