import useFetchUserGoals from "./useFetchUserGoals";
import useFetchUserDays from "./useFetchUserDays";

export default function useFetchUserMacros() {
  const { goals, isLoading: goalsLoading } = useFetchUserGoals();
  const { days, isLoading: daysLoading } = useFetchUserDays();
  const today = new Date().toISOString().split("T")[0];

  // More robust date filtering to handle different date formats
  const todayData = days.filter((day) => {
    if (!day.created_at) return false;
    // Extract just the date part from whatever format the backend returns
    const dayDate = day.created_at.split("T")[0];
    return dayDate === today;
  });

  // Return loading state if either goals or days are still loading
  if (goalsLoading || daysLoading) {
    return {
      dailyMacros: null,
      progress: null,
      totalTargetMacros: null,
      isLoading: true,
      error: null,
    };
  }

  // Check if we have goals data
  if (!goals || goals.length === 0) {
    return {
      dailyMacros: null,
      progress: null,
      totalTargetMacros: null,
      isLoading: false,
      error: "No goals found",
    };
  }

  const dailyMacros = todayData[0] || {};
  const {
    tot_cal_kcal = 0,
    tot_protein_g = 0,
    tot_carbs_g = 0,
    tot_fat_g = 0,
  } = dailyMacros;

  console.log("DEBUG - dailyMacros processing:", {
    dailyMacros,
    isEmpty: Object.keys(dailyMacros).length === 0,
    macroValues: { tot_cal_kcal, tot_protein_g, tot_carbs_g, tot_fat_g },
  });
  // get the goals that are active and have valid target_weight values
  const activeGoals = goals.filter(
    (goal) => goal.active && goal.target_weight > 0
  );

  // Check if we have active goals
  if (activeGoals.length === 0) {
    return {
      dailyMacros,
      progress: null,
      totalTargetMacros: null,
      isLoading: false,
      error: "No active goals found",
    };
  }

  const totalTargetMacros = activeGoals.reduce(
    (acc, goal) => {
      acc.calories += goal.daily_cal_kcal || 0;
      acc.protein += goal.daily_protein_g || 0;
      acc.carbs += goal.daily_carbs_g || 0;
      acc.fats += goal.daily_fat_g || 0;
      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    }
  );

  const progress = {
    calorieProgress: (tot_cal_kcal / totalTargetMacros.calories) * 100 || 0,
    proteinProgress: (tot_protein_g / totalTargetMacros.protein) * 100 || 0,
    carbProgress: (tot_carbs_g / totalTargetMacros.carbs) * 100 || 0,
    fatProgress: (tot_fat_g / totalTargetMacros.fats) * 100 || 0,
  };

  // Add percentages to target macros
  const totalTargetMacrosWithPercents = {
    ...totalTargetMacros,
    carbs_perc:
      activeGoals.reduce((acc, goal) => acc + goal.carbs_perc, 0) /
        activeGoals.length || 0,
    protein_perc:
      activeGoals.reduce((acc, goal) => acc + goal.protein_perc, 0) /
        activeGoals.length || 0,
    fat_perc:
      activeGoals.reduce((acc, goal) => acc + goal.fat_perc, 0) /
        activeGoals.length || 0,
  };

  console.log({
    totalTargetMacros,
    withPercents: totalTargetMacrosWithPercents,
    activeGoals,
    hasValidMacros:
      totalTargetMacros.protein > 0 ||
      totalTargetMacros.carbs > 0 ||
      totalTargetMacros.fats > 0,
  });

  // In the charts we want to show the macros distribution in a pie chart
  // and the progress towards the goals in a bar chart on the left side and on each of those bars we want to show a bar on the left with the goal amounts / target amounts. On the right side we show in a lighter color the bar chart with the progress to reach that target / how much it is actually reached today.

  // Check if all macro values are 0, which would cause chart issues
  const hasValidMacros =
    totalTargetMacros.protein > 0 ||
    totalTargetMacros.carbs > 0 ||
    totalTargetMacros.fats > 0;

  if (!hasValidMacros) {
    return {
      dailyMacros,
      progress,
      totalTargetMacros: null,
      isLoading: false,
      error:
        "All macro targets are 0. Please set up your goals with valid macro values.",
    };
  }

  return {
    dailyMacros,
    progress,
    totalTargetMacros: totalTargetMacrosWithPercents,
    isLoading: false,
    error: null,
  };
}
