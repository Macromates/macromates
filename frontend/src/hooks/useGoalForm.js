import { useState, useCallback } from "react";

export default function useGoalForm() {
  const [selectedGoalType, setSelectedGoalType] = useState(1);
  const [targetGoal, setTargetGoal] = useState({
    targetWeight: null,
    targetScore: null,
  });

  const handleSelectedGoal = (goal) => {
    setSelectedGoalType(goal);
  };

  const handleTargets = useCallback((targets) => {
    setTargetGoal(targets);
  }, []);

  const handleRetryValidation = () => {
    // Scroll to AI input form
    const aiInputElement = document.querySelector("[data-ai-input-form]");
    if (aiInputElement) {
      aiInputElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus on the input field
      const inputField = aiInputElement.querySelector("textarea, input");
      if (inputField) {
        inputField.focus();
      }
    }
  };

  return {
    selectedGoalType,
    targetGoal,
    handleSelectedGoal,
    handleTargets,
    handleRetryValidation,
  };
}
