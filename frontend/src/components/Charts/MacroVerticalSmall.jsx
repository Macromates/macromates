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
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  calories: "Calories",
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
      <div className="flex justify-center items-center h-20">
        <div className="loading loading-spinner loading-md text-primary"></div>
      </div>
    );
  }

  // Show error if there are errors
  if (goalsError || dayError) {
    console.error("MacroVerticalBarGraph errors:", { goalsError, dayError });
    return (
      <div className="flex justify-center items-center h-20">
        <div className="alert alert-error text-sm">
          <span>Failed to load macro data.</span>
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
  // Sort photos by created_at to ensure the most recent is at the top
  const getMealSegments = (macro) => {
    let segments = [];
    let cumSum = 0;

    // Sort photos by created_at (most recent first)
    const sortedPhotos = [...photos].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    for (let i = 0; i < sortedPhotos.length; i++) {
      const value =
        sortedPhotos[i][
          `${macro === "calories" ? "cal_kcal" : macro + "_g"}`
        ] || 0;
      if (value > 0) {
        segments.push({
          value,
          cumSum,
          isLatest: i === 0, // First item (most recent) is the latest
        });
        cumSum += value;
      }
    }
    return segments;
  };

  // Larger SVG dimensions for 2x2 grid layout
  const barHeight = 130;
  const barWidth = 20; // Increased for better visibility
  const mealBarWidth = 12; // Increased for better visibility
  const gap = 5;
  const svgWidth = 120; // Increased for 2x2 layout
  const topPadding = 10;
  const svgHeight = barHeight + topPadding + 55; // More space for larger text

  // Helper to render background grid
  const renderGrid = (maxVal, svgWidth, barHeight, topPadding) => {
    const gridLines = [];
    const steps = 2;
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
            x2={svgWidth - 20}
            y2={y}
            stroke="#E5E7EB"
            strokeWidth={0.5}
            strokeDasharray="2,2"
            opacity={0.4}
          />
          {/* Grid value label - only show max */}
          {i === steps && (
            <text
              x={svgWidth - 15}
              y={y + 4}
              fontSize="9"
              fill="#4d515a"
              textAnchor="start"
              style={{
                fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
              }}
            >
              {value}
            </text>
          )}
        </g>
      );
    }
    return gridLines;
  };

  // Helper to render a macro bar
  const renderMacroBar = (macro, target, total, segments) => {
    // Scale: max is target or total, whichever is higher
    const maxVal = Math.max(target, total, 1);

    return (
      <div key={macro} className="flex flex-col items-center flex-1">
        <svg width={svgWidth} height={svgHeight} className="mx-auto">
          {/* Background grid */}
          {renderGrid(maxVal, svgWidth, barHeight, topPadding)}

          {/* Chart background */}
          <rect
            x={0}
            y={topPadding}
            width={svgWidth - 20}
            height={barHeight}
            fill="rgba(243, 244, 246, 0.8)"
            rx={4}
            stroke="#E5E7EB"
            strokeWidth={1}
          />

          {/* Target bar (thick, left) */}
          <rect
            x={15}
            y={topPadding + barHeight - (target / maxVal) * barHeight}
            width={barWidth}
            height={(target / maxVal) * barHeight}
            fill={macroColors[macro]}
            rx={3}
            opacity={0.4}
          />

          {/* Meal segments (thin, right, with white gaps) */}
          {segments.map((seg, idx) => (
            <g key={idx}>
              {/* Individual meal bar with different opacity for latest vs previous meals */}
              <rect
                x={15 + barWidth + gap}
                y={
                  topPadding +
                  barHeight -
                  ((seg.cumSum + seg.value) / maxVal) * barHeight
                }
                width={mealBarWidth}
                height={(seg.value / maxVal) * barHeight}
                fill={macroColors[macro]}
                rx={2}
                opacity={seg.isLatest ? 0.95 : 0.5} // Latest meal darker, previous meals lighter
                stroke={seg.isLatest ? macroColors[macro] : "none"} // Add subtle border to latest meal
                strokeWidth={seg.isLatest ? 0.5 : 0}
              />
              {/* White gap between meals */}
              {idx < segments.length - 1 && (
                <rect
                  x={15 + barWidth + gap}
                  y={
                    topPadding +
                    barHeight -
                    (seg.cumSum / maxVal) * barHeight -
                    1
                  }
                  width={mealBarWidth}
                  height={1}
                  fill="#ffffff"
                />
              )}
            </g>
          ))}

          {/* Macro name - larger text */}
          <text
            x={(svgWidth - 20) / 2}
            y={topPadding + barHeight + 18}
            textAnchor="middle"
            fontWeight="bold"
            fontSize="16"
            fill={macroColors[macro]}
            style={{
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
          >
            {macroLabels[macro]}
          </text>

          {/* Consumed / Target values - larger text */}
          <text
            x={(svgWidth - 20) / 2}
            y={topPadding + barHeight + 33}
            textAnchor="middle"
            fontWeight="500"
            fontSize="14"
            fill="#374151"
            style={{
              fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
            }}
          >
            {Math.round(total)}/{Math.round(target)}
          </text>

          {/* Progress percentage - larger text */}
          <text
            x={(svgWidth - 20) / 2}
            y={topPadding + barHeight + 47}
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
    <div className="bg-blue-200 p-4 mb-4 rounded-lg shadow-sm border border-gray-100">
      <div className="text-md text-gray-600 font-bold mb-4 text-center">
        Daily Progress vs Goals
      </div>

      {/* Updated legend to reflect latest vs previous meals */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-4 rounded opacity-40"
            style={{ backgroundColor: "#6B7280" }}
          ></div>
          <span className="text-sm text-gray-600 font-medium">Target</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-4 rounded opacity-95"
            style={{ backgroundColor: "#6B7280" }}
          ></div>
          <span className="text-sm text-gray-600 font-medium">Latest Meal</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-4 rounded opacity-50"
            style={{ backgroundColor: "#6B7280" }}
          ></div>
          <span className="text-sm text-gray-600 font-medium">
            Previous Meals
          </span>
        </div>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="space-y-4">
        {/* Top Row: Protein and Carbs */}
        <div className="flex justify-between gap-3">
          {renderMacroBar(
            "protein",
            targets.protein,
            macroTotals.protein,
            getMealSegments("protein")
          )}
          {renderMacroBar(
            "carbs",
            targets.carbs,
            macroTotals.carbs,
            getMealSegments("carbs")
          )}
        </div>

        {/* Bottom Row: Fat and Calories */}
        <div className="flex justify-between gap-3">
          {renderMacroBar(
            "fat",
            targets.fat,
            macroTotals.fat,
            getMealSegments("fat")
          )}
          {renderMacroBar(
            "calories",
            targets.calories,
            macroTotals.calories,
            getMealSegments("calories")
          )}
        </div>
      </div>
    </div>
  );
}
