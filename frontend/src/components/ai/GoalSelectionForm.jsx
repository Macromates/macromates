import { useState } from "react";

const GOAL_CHOICES = [
  { value: 1, label: "Lose Weight" },
  { value: 2, label: "Build Muscle" },
  { value: 3, label: "Improve Health" },
  { value: 4, label: "Other" },
];

export default function GoalSelectionForm({ onGoalSelect }) {
  const [selectedGoal, setSelectedGoal] = useState(1);
  const handleGoalChange = (event) => {
    const value = parseInt(event.target.value);
    setSelectedGoal(value);
    onGoalSelect(value);
  };

  return (
    <div className="goal-selection-form">
      <h2 className="text-lg font-medium">Select Your Goal</h2>
      <div className="mt-4">
        {GOAL_CHOICES.map((goal) => (
          <div key={goal.value} className="form-control">
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="goal"
                value={goal.value}
                checked={selectedGoal === goal.value}
                onChange={handleGoalChange}
                className="radio radio-primary"
              />
              <span className="label-text ml-2 text-primary">{goal.label}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
