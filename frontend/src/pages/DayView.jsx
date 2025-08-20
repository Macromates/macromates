import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import useApiRequest from "../hooks/useApiRequest";

const DayView = () => {
  const [dayData, setDayData] = useState(null);
  const { sendRequest, data, loading, error } = useApiRequest({ auth: true });
  const { date } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch day data when component mounts
    if (date) {
      sendRequest("GET", `users/me/days/details/${date}/`);
    }
  }, [date, sendRequest]);

  useEffect(() => {
    if (data && !error) {
      setDayData(data);
      // Debug: Log the image URLs
      if (data.photos && data.photos.length > 0) {
        console.log("Photo data:", data.photos);
        data.photos.forEach((photo, index) => {
          console.log(`Photo ${index + 1} image URL:`, photo.image);
        });
      }
    }
  }, [data, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="alert alert-error">
          <span>Failed to load day data. Please try again.</span>
        </div>
      </div>
    );
  }

  if (!dayData) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="alert alert-info">
          <span>No data available for this day.</span>
        </div>
      </div>
    );
  }

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    // If it's already a full URL, return as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // If it starts with /media-files/, it's the correct Django media path
    if (imageUrl.startsWith("/media-files/")) {
      return `https://macromates.propulsion-learn.ch${imageUrl}`;
    }

    // If it starts with a slash, it's a relative path from the root
    if (imageUrl.startsWith("/")) {
      return `https://macromates.propulsion-learn.ch${imageUrl}`;
    }

    // Otherwise, assume it needs the media prefix
    return `https://macromates.propulsion-learn.ch/media-files/${imageUrl}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Function to parse AI insight into sections (borrowed from AnalysisResults)
  const parseAIInsight = (aiInsight) => {
    if (!aiInsight) return { analysis: "", recommendation: "", alignment: "" };

    const sections = {
      analysis: "",
      recommendation: "",
      alignment: "",
    };

    // Split the insight by the structured format
    const analysisMatch = aiInsight.match(
      /Analysis:\s*(.*?)(?=Recommendation:|$)/s
    );
    const recommendationMatch = aiInsight.match(
      /Recommendation:\s*(.*?)(?=Alignment:|$)/s
    );
    const alignmentMatch = aiInsight.match(/Alignment:\s*(.*?)$/s);

    sections.analysis = analysisMatch ? analysisMatch[1].trim() : aiInsight;
    sections.recommendation = recommendationMatch
      ? recommendationMatch[1].trim()
      : "";
    sections.alignment = alignmentMatch ? alignmentMatch[1].trim() : "";

    return sections;
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            Daily Overview
          </h1>
          <p className="text-base-content/70">{formatDate(dayData.date)}</p>
        </div>
        <button
          onClick={() => navigate("/track")}
          className="btn btn-outline btn-sm gap-2 border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Tracker
        </button>
      </div>

      {/* Daily Macros Summary */}
      <div className="bg-base-100 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Daily Totals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Calories</div>
            <div
              className="stat-value text-[24px]"
              style={{ color: "#6765da" }}
            >
              {Math.round(dayData.day_data?.tot_cal_kcal || 0)}kcal
            </div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Protein</div>
            <div
              className="stat-value text-[24px]"
              style={{ color: "#FF6384" }}
            >
              {Math.round(dayData.day_data?.tot_protein_g || 0)}g
            </div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Carbs</div>
            <div
              className="stat-value text-[24px]"
              style={{ color: "#63ac63" }}
            >
              {Math.round(dayData.day_data?.tot_carbs_g || 0)}g
            </div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Fat</div>
            <div
              className="stat-value text-[24px]"
              style={{ color: "#e9b42f" }}
            >
              {Math.round(dayData.day_data?.tot_fat_g || 0)}g
            </div>
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold mb-4">Meals</h2>
        {dayData.photos && dayData.photos.length > 0 ? (
          dayData.photos.map((meal, index) => {
            const insightSections = parseAIInsight(meal.ai_insight);

            return (
              <div
                key={meal.id}
                className="card bg-base-200 p-6 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]"
              >
                {/* Top Section: Image, Header, and Macros */}
                <div className="flex items-start gap-6 mb-6">
                  {/* Meal Image */}
                  {meal.image && (
                    <div className="flex-shrink-0">
                      <div className="w-40 h-40 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={getImageUrl(meal.image)}
                          alt={`Meal ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log("Image failed to load:", meal.image);
                            console.log(
                              "Constructed URL:",
                              getImageUrl(meal.image)
                            );
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Header and Macros */}
                  <div className="flex-1">
                    {/* Meal Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-base-content">
                        Meal {index + 1}
                      </h3>
                      {meal.meal_score && (
                        <div className="bg-base-100 rounded-lg px-3 py-1">
                          <span className="text-sm text-base-content/60">
                            Score:{" "}
                          </span>
                          <span
                            className="text-lg font-bold"
                            style={{ color: "#882eb1" }}
                          >
                            {meal.meal_score}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Macro Nutrients Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="stat bg-base-100 rounded-lg p-3">
                        <div className="stat-title text-center text-sm font-medium">
                          Calories
                        </div>
                        <div
                          className="stat-value text-center text-lg"
                          style={{ color: "#6765da" }}
                        >
                          {Math.round(meal.cal_kcal)}
                        </div>
                      </div>
                      <div className="stat bg-base-100 rounded-lg p-3">
                        <div className="stat-title text-center text-sm font-medium">
                          Protein
                        </div>
                        <div
                          className="stat-value text-center text-lg"
                          style={{ color: "#FF6384" }}
                        >
                          {Math.round(meal.protein_g)}g
                        </div>
                      </div>
                      <div className="stat bg-base-100 rounded-lg p-3">
                        <div className="stat-title text-center text-sm font-medium">
                          Carbs
                        </div>
                        <div
                          className="stat-value text-center text-lg"
                          style={{ color: "#63ac63" }}
                        >
                          {Math.round(meal.carbs_g)}g
                        </div>
                      </div>
                      <div className="stat bg-base-100 rounded-lg p-3">
                        <div className="stat-title text-center text-sm font-medium">
                          Fat
                        </div>
                        <div
                          className="stat-value text-center text-lg"
                          style={{ color: "#e9b42f" }}
                        >
                          {Math.round(meal.fat_g)}g
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: AI Insights - Full Width */}
                {meal.ai_insight && (
                  <div className="space-y-4">
                    {/* Analysis Section - Full Width */}
                    {insightSections.analysis && (
                      <div className="bg-base-100 rounded-lg p-5">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                            <svg
                              className="w-4 h-4 text-primary-content"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-base-content">
                            Analysis
                          </h4>
                        </div>
                        <p className="text-base text-base-content/90 leading-relaxed">
                          {insightSections.analysis}
                        </p>
                      </div>
                    )}

                    {/* Recommendation Section - Full Width */}
                    {insightSections.recommendation && (
                      <div className="bg-base-100 rounded-lg p-5">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mr-3">
                            <svg
                              className="w-4 h-4 text-secondary-content"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-base-content">
                            Recommendation
                          </h4>
                        </div>
                        <p className="text-base text-base-content/90 leading-relaxed">
                          {insightSections.recommendation}
                        </p>
                      </div>
                    )}

                    {/* Alignment Section - Full Width */}
                    {insightSections.alignment && (
                      <div className="bg-base-100 rounded-lg p-5">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-3">
                            <svg
                              className="w-4 h-4 text-accent-content"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-base-content">
                            Alignment
                          </h4>
                        </div>
                        <p className="text-base text-base-content/90 leading-relaxed">
                          {insightSections.alignment}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-base-100 rounded-lg p-6 text-center">
            <p className="text-base-content/70">
              No meals recorded for this day.
            </p>
            <button
              onClick={() => navigate("/camera")}
              className="btn btn-primary mt-4"
            >
              Add a Meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayView;
