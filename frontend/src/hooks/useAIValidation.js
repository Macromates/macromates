import { useState, useEffect } from "react";
import useApiRequest from "./useApiRequest";

export default function useAIValidation() {
  const { sendRequest, error, data, loading } = useApiRequest();
  const [validationResult, setValidationResult] = useState(null);
  const [is_reasonable, setIsReasonable] = useState(false);
  const [aiInput, setAiInput] = useState("");

  useEffect(() => {
    if (data) {
      console.log("AI Validation response:", data);
      setValidationResult(data);
      setIsReasonable(data.is_reasonable);
    }
  }, [data]);

  const validateGoal = (validationString, selectedGoalType) => {
    setAiInput(validationString);
    sendRequest("post", "goals/ai-validate/", {
      goal_type: selectedGoalType,
      user_objective: validationString,
    });
  };

  const clearValidation = () => {
    setValidationResult(null);
    setIsReasonable(false);
  };

  return {
    validationResult,
    is_reasonable,
    aiInput,
    loading,
    error,
    validateGoal,
    clearValidation,
  };
}
