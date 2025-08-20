import useFetchUserGoals from "../../hooks/useFetchUserGoals";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import Goal from "./Goal";

export default function GoalsList() {
  const { goals, isLoading, error } = useFetchUserGoals();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg bg-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="alert alert-error">
          <span>
            Error loading goals: {error.message || "Something went wrong"}
          </span>
        </div>
      </div>
    );
  }

  const handleBack = () => navigate("/dashboard");
  const handleCreateGoal = () => navigate("/ai-validation");

  return (
    <motion.div
      className="flex flex-col min-h-screen mx-auto max-w-[480px] bg-base-100 p-4 md:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.header
        className="w-full flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="btn btn-ghost btn-sm">
            ← Back
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">My Goals</h1>
        </div>
        <button onClick={handleCreateGoal} className="btn btn-primary btn-sm">
          + New Goal
        </button>
      </motion.header>

      {/* Goals List */}
      <main className="flex-1 w-full">
        {!goals || goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No goals yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start by creating your first fitness goal!
            </p>
            <button onClick={handleCreateGoal} className="btn btn-primary">
              Create Your First Goal
            </button>
          </div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {goals.map((goal, index) => (
              <Goal goal={goal} index={index} key={goal.id} />
            ))}
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
