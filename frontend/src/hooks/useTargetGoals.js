import { useState, useEffect } from "react";

export default function useTargetGoals(onTargetGoalChange) {
  const [targetWeight, setTargetWeight] = useState("60");
  const [targetScore, setTargetScore] = useState("");

  useEffect(() => {
    onTargetGoalChange({
      targetWeight: targetWeight ? Number(targetWeight) : null,
      targetScore: targetScore ? Number(targetScore) : null,
    });
  }, [targetWeight, targetScore, onTargetGoalChange]);

  const handleWeightChange = (value) => {
    const numValue = Math.max(1, Number(value) || 1);
    setTargetWeight(numValue.toString());
  };

  const handleScoreChange = (value) => {
    const numValue = Math.max(1, Math.min(10, Number(value) || 1));
    setTargetScore(numValue.toString());
  };

  const incrementWeight = () => {
    const currentValue = Number(targetWeight) || 1;
    handleWeightChange(currentValue + 1);
  };

  const decrementWeight = () => {
    const currentValue = Number(targetWeight) || 1;
    handleWeightChange(Math.max(1, currentValue - 1));
  };

  const incrementScore = () => {
    const currentValue = Number(targetScore) || 1;
    handleScoreChange(Math.min(10, currentValue + 1));
  };

  const decrementScore = () => {
    const currentValue = Number(targetScore) || 1;
    handleScoreChange(Math.max(1, currentValue - 1));
  };

  return {
    targetWeight,
    targetScore,
    handleWeightChange,
    handleScoreChange,
    incrementWeight,
    decrementWeight,
    incrementScore,
    decrementScore,
  };
}
