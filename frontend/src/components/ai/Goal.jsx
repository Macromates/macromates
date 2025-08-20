import { motion } from "motion/react";

export default function Goal({ goal, index }) {
  return (
    <motion.div
      className="card bg-base-200 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="card-body">
        {/* Goal Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`badge ${goal.active ? "badge-primary-content text-primary" : "badge-neutral text-primary-content"}`}
            >
              {goal.active ? "Active" : "Inactive"}
            </div>
            {goal.completed && (
              <div className="badge badge-primary-content text-primary">
                Completed
              </div>
            )}
          </div>
          <div className="text-sm text-primary-content">Goal #{goal.id}</div>
        </div>

        {/* Goal Objective */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2 !text-primary-content">
            Objective
          </h3>
          <p className="text-base-content/80">{goal.user_objective}</p>
        </div>

        {/* Goal Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="stat bg-base-100 rounded-lg p-3">
            <div className="stat-title text-xs text-primary">Target Weight</div>
            <div className="stat-value text-lg text-primary">
              {goal.target_weight} kg
            </div>
          </div>
          <div className="stat bg-base-100 rounded-lg p-3">
            <div className="stat-title text-xs text-primary">
              Starting Weight
            </div>
            <div className="stat-value text-lg text-primary">
              {goal.starting_weight} kg
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm">{goal.perc_achieved}%</span>
          </div>
          <div className="w-full bg-base-100 rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(goal.perc_achieved, 100)}%`,
              }}
              transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
            ></motion.div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex justify-between text-sm text-primary-content mb-4">
          <span>Created: {new Date(goal.created_at).toLocaleDateString()}</span>
          {goal.end_date && (
            <span>Ends: {new Date(goal.end_date).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
