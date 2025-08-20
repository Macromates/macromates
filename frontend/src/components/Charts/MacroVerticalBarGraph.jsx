import React, { useEffect, useState } from "react";
import useApiRequest from "../../hooks/useApiRequest";

// Macro colors (same as Track)
const macroColors = {
  protein: "#FF6384",
  carbs: "#63ac63",
  fat: "#e9b42f",
  calories: "#6765da",
};

const macroLabels = {
  protein: "Protein (g)",
  carbs: "Carbs (g)",
  fat: "Fat (g)",
  calories: "Calories (kcal)",
};

export default function MacroVerticalBarGraph() {
  const [goalData, setGoalData] = useState(null);
  const [photos, setPhotos] = useState([]);

  // Separate hooks for goals and day data
  const {
    sendRequest: sendGoalsRequest,
    data: goalsData,
    loading: goalsLoading,
    error: goalsError,
  } = useApiRequest({ auth: true });

  const {
    sendRequest: sendDayRequest,
    data: dayData,
    loading: dayLoading,
    error: dayError,
  } = useApiRequest({ auth: true });

  // Fetch data on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    console.log("MacroVerticalBarGraph: Fetching data for date:", today);

    // Fetch goals and day data
    sendGoalsRequest("GET", "goals/my-goals/");
    sendDayRequest("GET", `users/me/days/details/${today}/`);
  }, [sendGoalsRequest, sendDayRequest]);

  // Handle goals response
  useEffect(() => {
    if (goalsData) {
      console.log("MacroVerticalBarGraph: Goals response:", goalsData);
      // Handle paginated response - goals are in goalsData.results
      const goalsList = goalsData.results || goalsData;
      if (Array.isArray(goalsList)) {
        const activeGoal = goalsList.find((goal) => goal.active === true);
        console.log("MacroVerticalBarGraph: Active goal found:", activeGoal);
        setGoalData(activeGoal);
      }
    }
  }, [goalsData]);

  // Handle day data response
  useEffect(() => {
    if (dayData) {
      console.log("MacroVerticalBarGraph: Day response:", dayData);
      if (dayData.photos) {
        console.log(
          "MacroVerticalBarGraph: Photos found:",
          dayData.photos.length
        );
        setPhotos(dayData.photos || []);
      }
    }
  }, [dayData]);

  // Show loading while either request is loading
  const loading = goalsLoading || dayLoading;

  // Don't render if loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  // Show error if there are errors
  if (goalsError || dayError) {
    console.error("MacroVerticalBarGraph errors:", { goalsError, dayError });
    return (
      <div className="flex justify-center items-center h-40">
        <div className="alert alert-error">
          <span>Failed to load macro data. Please try again.</span>
        </div>
      </div>
    );
  }

  // Don't render component if no active goal
  if (!goalData) {
    return null;
  }

  // Calculate total consumed for each macro from photos
  const macroTotals = {
    protein: photos.reduce((sum, photo) => sum + (photo.protein_g || 0), 0),
    carbs: photos.reduce((sum, photo) => sum + (photo.carbs_g || 0), 0),
    fat: photos.reduce((sum, photo) => sum + (photo.fat_g || 0), 0),
    calories: photos.reduce((sum, photo) => sum + (photo.cal_kcal || 0), 0),
  };

  // For each macro, get the meal segments (each photo is a meal)
  const getMealSegments = (macro) => {
    let segments = [];
    let cumSum = 0;
    for (let i = 0; i < photos.length; i++) {
      const value =
        photos[i][`${macro === "calories" ? "cal_kcal" : macro + "_g"}`] || 0;
      if (value > 0) {
        segments.push({ value, cumSum });
        cumSum += value;
      }
    }
    return segments;
  };

  // SVG bar chart dimensions
  const barHeight = 200;
  const barWidth = 40;
  const mealBarWidth = 14;
  const gap = 8;
  const svgWidth = 120; // Increased width for better spacing and text
  const topPadding = 20; // Padding at top to prevent grid label cutoff
  const svgHeight = barHeight + topPadding + 80; // More space for labels

  // Helper to render background grid
  const renderGrid = (maxVal, svgWidth, barHeight, topPadding) => {
    const gridLines = [];
    const steps = 5; // Number of grid lines
    const stepValue = maxVal / steps;

    for (let i = 0; i <= steps; i++) {
      const y = topPadding + barHeight - (i * barHeight) / steps;
      const value = Math.round(i * stepValue);

      gridLines.push(
        <g key={i}>
          {/* Grid line */}
          <line
            x1={0}
            y1={y}
            x2={svgWidth - 30}
            y2={y}
            stroke="#374151"
            strokeWidth={0.5}
            strokeDasharray="2,2"
            opacity={0.3}
          />
          {/* Grid value label */}
          <text
            x={svgWidth - 25}
            y={y + 4}
            fontSize="10"
            fill="#9CA3AF"
            textAnchor="start"
            style={{
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
          >
            {value}
          </text>
        </g>
      );
    }
    return gridLines;
  };

  // Helper to render a macro bar
  const renderMacroBar = (macro, target, total, segments) => {
    // Scale: max is target or total, whichever is higher (ensures everything fits on screen)
    const maxVal = Math.max(target, total, 1);

    return (
      <div key={macro} className="flex flex-col items-center mx-2">
        <svg width={svgWidth} height={svgHeight}>
          {/* Background grid */}
          {renderGrid(maxVal, svgWidth, barHeight, topPadding)}

          {/* Chart background */}
          <rect
            x={0}
            y={topPadding}
            width={svgWidth - 30}
            height={barHeight}
            fill="rgba(55, 65, 81, 0.1)"
            rx={4}
          />

          {/* Target bar (thick, left) */}
          <rect
            x={10}
            y={topPadding + barHeight - (target / maxVal) * barHeight}
            width={barWidth}
            height={(target / maxVal) * barHeight}
            fill={macroColors[macro]}
            rx={6}
            opacity={0.6}
          />

          {/* Meal segments (thin, right, with white gaps) */}
          {segments.map((seg, idx) => (
            <g key={idx}>
              {/* Individual meal bar */}
              <rect
                x={10 + barWidth + gap}
                y={
                  topPadding +
                  barHeight -
                  ((seg.cumSum + seg.value) / maxVal) * barHeight
                }
                width={mealBarWidth}
                height={(seg.value / maxVal) * barHeight}
                fill={macroColors[macro]}
                rx={5}
                opacity={0.9}
              />
              {/* White gap between meals - placed after current meal */}
              {idx < segments.length - 1 && (
                <rect
                  x={10 + barWidth + gap}
                  y={
                    topPadding +
                    barHeight -
                    (seg.cumSum / maxVal) * barHeight -
                    1
                  }
                  width={mealBarWidth}
                  height={2}
                  fill="#ffffff"
                />
              )}
            </g>
          ))}

          {/* Macro name */}
          <text
            x={(svgWidth - 30) / 2}
            y={topPadding + barHeight + 25}
            textAnchor="middle"
            fontWeight="bold"
            fontSize="13.5"
            fill={macroColors[macro]}
            style={{
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
          >
            {macroLabels[macro]}
          </text>

          {/* Consumed / Target values */}
          <text
            x={(svgWidth - 30) / 2}
            y={topPadding + barHeight + 45}
            textAnchor="middle"
            fontWeight="600"
            fontSize="14"
            fill="#6B7280"
            style={{
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
          >
            {Math.round(total)} / {Math.round(target)}
          </text>

          {/* Progress percentage */}
          <text
            x={(svgWidth - 30) / 2}
            y={topPadding + barHeight + 62}
            textAnchor="middle"
            fontWeight="500"
            fontSize="14"
            fill={total > target ? "#EF4444" : "#10B981"}
            style={{
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
          >
            {Math.round((total / target) * 100)}%
          </text>
        </svg>
      </div>
    );
  };

  // Target values from goal
  const targets = {
    protein: goalData?.daily_protein_g || 0,
    carbs: goalData?.daily_carbs_g || 0,
    fat: goalData?.daily_fat_g || 0,
    calories: goalData?.daily_cal_kcal || 0,
  };

  return (
    <div className="flex flex-col items-center bg-base-100 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-primary text-center mb-2">
        Daily Progress
      </h3>
      <div className="bg-gray-100 rounded-lg p-3 mb-4 flex gap-6">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-4 rounded opacity-60"
            style={{ backgroundColor: "#6B7280" }}
          ></div>
          <span className="text-xs text-gray-600">Target</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-4 rounded opacity-90"
            style={{ backgroundColor: "#6B7280" }}
          ></div>
          <span className="text-xs text-gray-600">Meals Consumed</span>
        </div>
      </div>
      <div className="flex flex-row justify-center flex-wrap gap-2">
        {["protein", "carbs", "fat", "calories"].map((macro) =>
          renderMacroBar(
            macro,
            targets[macro],
            macroTotals[macro],
            getMealSegments(macro)
          )
        )}
      </div>
    </div>
  );
}
