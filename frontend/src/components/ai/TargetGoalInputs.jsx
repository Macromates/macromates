import useTargetGoals from "../../hooks/useTargetGoals";

export default function TargetGoalInputs({ onTargetGoalChange }) {
  const {
    targetWeight,
    targetScore,
    handleWeightChange,
    handleScoreChange,
    incrementWeight,
    decrementWeight,
    incrementScore,
    decrementScore,
  } = useTargetGoals(onTargetGoalChange);

  return (
    <div className="target-goal-inputs flex flex-col space-y-6 mt-7">
      <label className="flex flex-col">
        <span className="text-sm font-medium mb-2 text-primary">
          Target Weight (kg)
        </span>
        <div className="relative flex items-center">
          <button
            type="button"
            className="absolute left-2 z-10 btn btn-xs btn-ghost btn-circle bg-primary/70"
            onClick={decrementWeight}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <input
            className="w-full px-10 py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:border-primary focus:outline-none rounded-none text-center text-primary"
            type="number"
            value={targetWeight}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="60"
            min="1"
          />
          <button
            type="button"
            className="absolute right-2 z-10 btn btn-xs btn-ghost btn-circle bg-primary/70"
            onClick={incrementWeight}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </label>

      <label className="flex flex-col">
        <span className="text-sm font-medium mb-2 text-primary">
          Target Meal Score (1-10)
        </span>
        <div className="relative flex items-center">
          <button
            type="button"
            className="absolute left-2 z-10 btn btn-xs btn-ghost btn-circle bg-primary/70"
            onClick={decrementScore}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <input
            className="w-full px-10 py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:border-primary focus:outline-none rounded-none text-center text-primary"
            type="number"
            value={targetScore}
            onChange={(e) => handleScoreChange(e.target.value)}
            placeholder="1"
            min="1"
            max="10"
          />
          <button
            type="button"
            className="absolute right-2 z-10 btn btn-xs btn-ghost btn-circle bg-primary/70"
            onClick={incrementScore}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </label>
    </div>
  );
}
