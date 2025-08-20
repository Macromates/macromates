import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import useApiRequest from "../hooks/useApiRequest";

const Track = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trackingData, setTrackingData] = useState(null);
  const [previousTheme, setPreviousTheme] = useState(null);
  const { sendRequest, data, loading, error } = useApiRequest({ auth: true });
  const navigate = useNavigate();

  // Auto switch to dark mode when component mounts
  useEffect(() => {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute("data-theme");
    setPreviousTheme(currentTheme);
    htmlElement.setAttribute("data-theme", "dark");

    // Restore previous theme on unmount
    return () => {
      if (previousTheme) {
        htmlElement.setAttribute("data-theme", previousTheme);
      } else {
        htmlElement.removeAttribute("data-theme");
      }
    };
  }, []);

  // Colors matching AnalysisResults component
  const colors = {
    calories: "#6765da",
    protein: "#FF6384",
    carbs: "#63ac63",
    fat: "#e9b42f",
  };

  // Semi-transparent versions for backgrounds
  const backgroundColors = {
    protein: "rgba(255, 99, 132, 0.2)",
    carbs: "rgba(99, 172, 99, 0.2)",
    fat: "rgba(233, 180, 47, 0.2)",
    calories: "rgba(103, 101, 218, 0.2)",
  };

  const fetchTrackingData = useCallback(
    (year, month) => {
      sendRequest("GET", `users/me/days/tracking/${year}/${month}/`);
    },
    [sendRequest]
  );

  useEffect(() => {
    fetchTrackingData(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate, fetchTrackingData]);

  useEffect(() => {
    if (data && !error) {
      setTrackingData(data);
    }
  }, [data, error]);

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Calculate min/max values for proper auto-scaling
  const getMinMaxValues = (weeks) => {
    const allValues = {
      protein: [],
      carbs: [],
      fat: [],
      calories: [],
    };

    weeks.forEach((week) => {
      week.forEach((day) => {
        if (day.has_data) {
          allValues.protein.push(day.protein);
          allValues.carbs.push(day.carbs);
          allValues.fat.push(day.fat);
          allValues.calories.push(day.calories);
        }
      });
    });

    // Include goal data in min/max calculations
    const goalData = trackingData?.goal_data;
    if (goalData) {
      allValues.protein.push(goalData.daily_protein);
      allValues.carbs.push(goalData.daily_carbs);
      allValues.fat.push(goalData.daily_fat);
      allValues.calories.push(goalData.daily_calories);
    }

    return {
      protein: {
        min: allValues.protein.length > 0 ? Math.min(...allValues.protein) : 0,
        max:
          allValues.protein.length > 0 ? Math.max(...allValues.protein) : 100,
      },
      carbs: {
        min: allValues.carbs.length > 0 ? Math.min(...allValues.carbs) : 0,
        max: allValues.carbs.length > 0 ? Math.max(...allValues.carbs) : 100,
      },
      fat: {
        min: allValues.fat.length > 0 ? Math.min(...allValues.fat) : 0,
        max: allValues.fat.length > 0 ? Math.max(...allValues.fat) : 100,
      },
      calories: {
        min:
          allValues.calories.length > 0 ? Math.min(...allValues.calories) : 0,
        max:
          allValues.calories.length > 0
            ? Math.max(...allValues.calories)
            : 1000,
      },
    };
  };

  // Generate line graph points with even macro spacing and auto-scaling
  const generateLineGraphData = (
    week,
    metric,
    minMaxValues,
    useEvenSpacing = false
  ) => {
    const mainLine = [];
    const thinConnections = [];

    let lastValidPoint = null;
    let pendingThinStart = null;
    let firstDataPointIndex = -1;

    // Find the first data point index
    for (let i = 0; i < week.length; i++) {
      if (week[i][metric] !== null && week[i][metric] !== undefined) {
        firstDataPointIndex = i;
        break;
      }
    }

    week.forEach((day, index) => {
      const x = (index * 100) / 6; // Distribute across 100% width

      if (day[metric] !== null && day[metric] !== undefined) {
        let y;

        if (useEvenSpacing) {
          // Even spacing: divide chart into 3 equal sections
          const { min, max } = minMaxValues[metric];
          const range = max - min;
          const normalizedValue = range > 0 ? (day[metric] - min) / range : 0.5;

          if (metric === "carbs") {
            // Carbs: top third (0-33% of chart, inverted because 0 is top)
            y = (1 - normalizedValue) * 30 + 3; // 3-33% from top
          } else if (metric === "protein") {
            // Protein: middle third (33-66% of chart)
            y = (1 - normalizedValue) * 30 + 36; // 36-66% from top
          } else if (metric === "fat") {
            // Fat: bottom third (66-97% of chart)
            y = (1 - normalizedValue) * 30 + 69; // 69-97% from top
          }
        } else {
          // Regular scaling for calories
          const { min, max } = minMaxValues[metric];
          const range = max - min;
          const normalizedValue = range > 0 ? (day[metric] - min) / range : 0.5;
          y = (1 - normalizedValue) * 90 + 5; // 5-95% from top
        }

        const currentPoint = `${x},${y}`;
        mainLine.push(currentPoint);

        // If this is the first data point and there were missing days before it, create dotted line from start
        if (index === firstDataPointIndex && firstDataPointIndex > 0) {
          thinConnections.push(`0,${y} ${currentPoint}`);
        }

        // If we had missing data before this point, create thin connection
        if (pendingThinStart && lastValidPoint) {
          thinConnections.push(`${lastValidPoint} ${currentPoint}`);
        }

        lastValidPoint = currentPoint;
        pendingThinStart = null;
      } else {
        // Missing data - mark for thin connection
        if (lastValidPoint && !pendingThinStart) {
          pendingThinStart = lastValidPoint;
        }
      }
    });

    // Handle case where missing data extends to end of week
    if (pendingThinStart && lastValidPoint) {
      const lastX = 100; // End of week
      const [, lastY] = lastValidPoint.split(",");
      thinConnections.push(`${lastValidPoint} ${lastX},${lastY}`);
    }

    return {
      mainSegments: mainLine.length > 0 ? [mainLine.join(" ")] : [],
      thinSegments: thinConnections,
    };
  };

  const MacroChart = ({ week, weekIndex, minMaxValues }) => {
    const hasData = week.some((day) => day.has_data);

    if (!hasData) {
      return (
        <div className="bg-base-100 rounded-lg p-4 h-64 flex items-center justify-center">
          <p className="text-base-content/50 text-sm">No data for this week</p>
        </div>
      );
    }

    // Calculate target line positions using even spacing
    const targetPositions = trackingData?.goal_data
      ? (() => {
          const goalData = trackingData.goal_data;

          // Calculate normalized positions within each section
          const carbsRange = minMaxValues.carbs.max - minMaxValues.carbs.min;
          const proteinRange =
            minMaxValues.protein.max - minMaxValues.protein.min;
          const fatRange = minMaxValues.fat.max - minMaxValues.fat.min;

          const carbsNorm =
            carbsRange > 0
              ? (goalData.daily_carbs - minMaxValues.carbs.min) / carbsRange
              : 0.5;
          const proteinNorm =
            proteinRange > 0
              ? (goalData.daily_protein - minMaxValues.protein.min) /
                proteinRange
              : 0.5;
          const fatNorm =
            fatRange > 0
              ? (goalData.daily_fat - minMaxValues.fat.min) / fatRange
              : 0.5;

          return {
            carbs: (1 - carbsNorm) * 30 + 3, // Top third
            protein: (1 - proteinNorm) * 30 + 36, // Middle third
            fat: (1 - fatNorm) * 30 + 69, // Bottom third
          };
        })()
      : {};

    return (
      <div className="bg-base-100 rounded-lg p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-base-content mr-2">
              Week
            </div>
            <div className="text-lg font-semibold text-base-content">
              {weekIndex + 1}
            </div>
            {/* Macro Legend */}
            {trackingData?.goal_data && (
              <div className="flex items-center gap-2 text-xs ml-8">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.carbs }}
                  ></div>
                  <span style={{ color: colors.carbs }}>
                    Carbs {Math.round(trackingData.goal_data.daily_carbs)}g
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.protein }}
                  ></div>
                  <span style={{ color: colors.protein }}>
                    Protein {Math.round(trackingData.goal_data.daily_protein)}g
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.fat }}
                  ></div>
                  <span style={{ color: colors.fat }}>
                    Fat {Math.round(trackingData.goal_data.daily_fat)}g
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.calories }}
                  ></div>
                  <span style={{ color: colors.calories }}>
                    Calories {Math.round(trackingData.goal_data.daily_calories)}
                    kcal
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart Area - Macros */}
        <div className="relative h-40 bg-base-200 rounded overflow-hidden mb-1">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <pattern
                id={`macro-grid-${weekIndex}`}
                width="14.28"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 14.28 0 L 0 0 0 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.2"
                  className="text-base-content/20"
                />
              </pattern>
            </defs>
            <rect
              width="100"
              height="100"
              fill={`url(#macro-grid-${weekIndex})`}
            />

            {/* Section dividers */}
            <line
              x1="0"
              y1="33"
              x2="100"
              y2="33"
              stroke="currentColor"
              strokeWidth="0.1"
              className="text-base-content/10"
            />
            <line
              x1="0"
              y1="66"
              x2="100"
              y2="66"
              stroke="currentColor"
              strokeWidth="0.1"
              className="text-base-content/10"
            />

            {/* Background target areas */}
            {trackingData?.goal_data && (
              <>
                {/* Carbs background - from carbs line to protein line */}
                <rect
                  x="0"
                  y={targetPositions.carbs}
                  width="100"
                  height={targetPositions.protein - targetPositions.carbs}
                  fill={backgroundColors.carbs}
                />
                {/* Protein background - from protein line to fat line */}
                <rect
                  x="0"
                  y={targetPositions.protein}
                  width="100"
                  height={targetPositions.fat - targetPositions.protein}
                  fill={backgroundColors.protein}
                />
                {/* Fat background - from fat line to bottom */}
                <rect
                  x="0"
                  y={targetPositions.fat}
                  width="100"
                  height={97 - targetPositions.fat}
                  fill={backgroundColors.fat}
                />

                {/* Target lines */}
                <line
                  x1="0"
                  y1={targetPositions.carbs}
                  x2="100"
                  y2={targetPositions.carbs}
                  stroke={colors.carbs}
                  strokeWidth="0.8"
                  opacity="0.9"
                />
                <line
                  x1="0"
                  y1={targetPositions.protein}
                  x2="100"
                  y2={targetPositions.protein}
                  stroke={colors.protein}
                  strokeWidth="0.8"
                  opacity="0.9"
                />
                <line
                  x1="0"
                  y1={targetPositions.fat}
                  x2="100"
                  y2={targetPositions.fat}
                  stroke={colors.fat}
                  strokeWidth="0.8"
                  opacity="0.9"
                />
              </>
            )}

            {/* Macro Lines with gap handling */}
            {generateLineGraphData(
              week,
              "carbs",
              minMaxValues,
              true
            ).mainSegments.map((segment, i) => (
              <polyline
                key={`carbs-${i}`}
                fill="none"
                stroke={colors.carbs}
                strokeWidth="2"
                points={segment}
                className="drop-shadow-sm"
              />
            ))}
            {generateLineGraphData(
              week,
              "protein",
              minMaxValues,
              true
            ).mainSegments.map((segment, i) => (
              <polyline
                key={`protein-${i}`}
                fill="none"
                stroke={colors.protein}
                strokeWidth="2"
                points={segment}
                className="drop-shadow-sm"
              />
            ))}
            {generateLineGraphData(
              week,
              "fat",
              minMaxValues,
              true
            ).mainSegments.map((segment, i) => (
              <polyline
                key={`fat-${i}`}
                fill="none"
                stroke={colors.fat}
                strokeWidth="2"
                points={segment}
                className="drop-shadow-sm"
              />
            ))}

            {/* Thin connection lines for missing data */}
            {generateLineGraphData(
              week,
              "carbs",
              minMaxValues,
              true
            ).thinSegments.map((segment, i) => (
              <polyline
                key={`carbs-thin-${i}`}
                fill="none"
                stroke={colors.carbs}
                strokeWidth="0.8"
                points={segment}
                opacity="0.6"
                strokeDasharray="2,2"
              />
            ))}
            {generateLineGraphData(
              week,
              "protein",
              minMaxValues,
              true
            ).thinSegments.map((segment, i) => (
              <polyline
                key={`protein-thin-${i}`}
                fill="none"
                stroke={colors.protein}
                strokeWidth="0.8"
                points={segment}
                opacity="0.6"
                strokeDasharray="2,2"
              />
            ))}
            {generateLineGraphData(
              week,
              "fat",
              minMaxValues,
              true
            ).thinSegments.map((segment, i) => (
              <polyline
                key={`fat-thin-${i}`}
                fill="none"
                stroke={colors.fat}
                strokeWidth="0.8"
                points={segment}
                opacity="0.6"
                strokeDasharray="2,2"
              />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const CalorieChart = ({ week, weekIndex, minMaxValues }) => {
    const hasData = week.some((day) => day.has_data);

    if (!hasData) {
      return (
        <div className="bg-base-100 rounded-lg p-4 h-32 flex items-center justify-center">
          <p className="text-base-content/50 text-sm">No data for this week</p>
        </div>
      );
    }

    const targetPosition = trackingData?.goal_data
      ? (() => {
          const goalData = trackingData.goal_data;
          const caloriesRange =
            minMaxValues.calories.max - minMaxValues.calories.min;
          const caloriesNorm =
            caloriesRange > 0
              ? (goalData.daily_calories - minMaxValues.calories.min) /
                caloriesRange
              : 0.5;
          return (1 - caloriesNorm) * 90 + 5; // 5-95% from top
        })()
      : 50;

    return (
      <div className="bg-base-100 rounded-lg p-4">
        {/* Chart Area - Calories */}
        <div className="relative h-24 bg-base-200 rounded overflow-hidden mb-3">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <pattern
                id={`cal-grid-${weekIndex}`}
                width="14.28"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 14.28 0 L 0 0 0 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.2"
                  className="text-base-content/20"
                />
              </pattern>
            </defs>
            <rect
              width="100"
              height="100"
              fill={`url(#cal-grid-${weekIndex})`}
            />

            {/* Calories background and target line */}
            {trackingData?.goal_data && (
              <>
                <rect
                  x="0"
                  y={targetPosition}
                  width="100"
                  height={100 - targetPosition}
                  fill={backgroundColors.calories}
                />
                <line
                  x1="0"
                  y1={targetPosition}
                  x2="100"
                  y2={targetPosition}
                  stroke={colors.calories}
                  strokeWidth="0.8"
                  opacity="0.9"
                />
              </>
            )}

            {/* Calories line with gap handling */}
            {generateLineGraphData(
              week,
              "calories",
              minMaxValues,
              false
            ).mainSegments.map((segment, i) => (
              <polyline
                key={`calories-${i}`}
                fill="none"
                stroke={colors.calories}
                strokeWidth="2"
                points={segment}
                className="drop-shadow-sm"
              />
            ))}

            {/* Thin connection lines for missing calories data */}
            {generateLineGraphData(
              week,
              "calories",
              minMaxValues,
              false
            ).thinSegments.map((segment, i) => (
              <polyline
                key={`calories-thin-${i}`}
                fill="none"
                stroke={colors.calories}
                strokeWidth="0.8"
                points={segment}
                opacity="0.6"
                strokeDasharray="2,2"
              />
            ))}
          </svg>
        </div>

        {/* Day Labels - only show under calories chart */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
            (dayName, index) => (
              <div key={index} className="text-center">
                <div className="text-base-content/60 mb-1">{dayName}</div>
                <button
                  onClick={() => {
                    if (
                      week[index]?.has_data &&
                      week[index]?.is_current_month
                    ) {
                      const formattedDate = week[index].date.split("T")[0];
                      navigate(`/day/${formattedDate}`);
                    }
                  }}
                  disabled={
                    !week[index]?.has_data || !week[index]?.is_current_month
                  }
                  className={`text-sm font-medium transition-colors rounded px-2 py-1 ${
                    week[index]?.has_data && week[index]?.is_current_month
                      ? "text-primary hover:bg-primary/10 cursor-pointer"
                      : week[index]?.is_current_month
                        ? "text-base-content"
                        : "text-base-content/40"
                  } ${!week[index]?.has_data || !week[index]?.is_current_month ? "cursor-not-allowed" : ""}`}
                  title={
                    week[index]?.has_data && week[index]?.is_current_month
                      ? "Click to view day details"
                      : week[index]?.is_current_month
                        ? "No data for this day"
                        : ""
                  }
                >
                  {week[index]?.day_of_month}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="alert alert-error">
            <span>Failed to load tracking data. Please try again.</span>
          </div>
        </div>
      </div>
    );
  }

  const minMaxValues = trackingData ? getMinMaxValues(trackingData.weeks) : {};

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-2">
              Monthly Overview
            </h1>
            <p className="text-base-content/70">
              Track your macro trends week by week
            </p>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              disabled={!trackingData?.has_prev_month}
              className="btn btn-circle btn-sm btn-ghost disabled:opacity-30"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="text-center min-w-24">
              <div className="text-lg font-semibold text-primary">
                {trackingData?.month_info?.month_year ||
                  currentDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
              </div>
            </div>

            <button
              onClick={() => navigateMonth(1)}
              disabled={!trackingData?.has_next_month}
              className="btn btn-circle btn-sm btn-ghost disabled:opacity-30"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Interactive Tip */}
        {trackingData &&
          trackingData.weeks.some((week) =>
            week.some((day) => day.has_data)
          ) && (
            <div className="bg-info/10 border border-info/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-info"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-info font-medium">
                    💡 Click on any day number below the charts to view detailed
                    macros and meals for that day
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Charts Area */}
        {trackingData && (
          <div className="space-y-4">
            {trackingData.weeks.map((week, index) => (
              <div key={index} className="space-y-2">
                {/* Macro Chart */}
                <MacroChart
                  week={week}
                  weekIndex={index}
                  minMaxValues={minMaxValues}
                />

                {/* Calorie Chart */}
                <CalorieChart
                  week={week}
                  weekIndex={index}
                  minMaxValues={minMaxValues}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {trackingData &&
          trackingData.weeks.every(
            (week) => !week.some((day) => day.has_data)
          ) && (
            <div className="bg-base-100 rounded-lg p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-base-content/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-base-content mb-2">
                No Data Yet
              </h3>
              <p className="text-base-content/70 mb-4">
                Start tracking your meals to see your macro trends here.
              </p>
              <button
                onClick={() => (window.location.href = "/camera")}
                className="btn btn-primary"
              >
                Take Your First Photo
              </button>
            </div>
          )}

        {/* No Goal State */}
        {trackingData && !trackingData.goal_data && (
          <div className="bg-base-100 rounded-lg p-8 text-center mb-6">
            <h3 className="text-lg font-medium text-base-content mb-2">
              No Active Goal
            </h3>
            <p className="text-base-content/70 mb-4">
              Set up a fitness goal to see your daily targets and track your
              progress.
            </p>
            <button
              onClick={() => (window.location.href = "/goals")}
              className="btn btn-primary"
            >
              Create Your Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;
