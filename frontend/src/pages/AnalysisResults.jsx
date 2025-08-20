import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import useApiRequest from "../hooks/useApiRequest";
import MacroVerticalBarGraph from "../components/Charts/MacroVerticalSmall";

const AnalysisResults = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedFoodItems, setExpandedFoodItems] = useState({});

  // API request hook for deletion
  const {
    sendRequest: deletePhoto,
    data: deleteData,
    loading: deleteLoading,
    error: deleteError,
  } = useApiRequest({ auth: true });

  useEffect(() => {
    // Get analysis data from localStorage
    const analysisData = localStorage.getItem("currentAnalysis");
    if (analysisData) {
      setAnalysis(JSON.parse(analysisData));
    } else {
      // If no analysis data, redirect back to capture
      navigate("/camera");
    }
  }, [navigate]);

  // Handle delete response
  useEffect(() => {
    if (deleteData) {
      // Successfully deleted, clear analysis and go back to camera
      localStorage.removeItem("currentAnalysis");
      navigate("/camera");
    }
    if (deleteError) {
      console.error("Error deleting photo:", deleteError);
      // Still clear the analysis and go back, as the photo might not exist
      localStorage.removeItem("currentAnalysis");
      navigate("/camera");
    }
  }, [deleteData, deleteError, navigate]);

  // Function to parse AI insight into sections
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

  const handleDiscardData = () => {
    if (!analysis?.id) {
      // If no photo ID, just clear localStorage and go back
      localStorage.removeItem("currentAnalysis");
      navigate("/camera");
      return;
    }

    setIsDeleting(true);
    // Delete the photo from the database
    deletePhoto("DELETE", `food/delete/${analysis.id}/`);
  };

  const handleAcceptData = () => {
    // Photo is already saved in database, just go to dashboard
    localStorage.removeItem("currentAnalysis");
    navigate("/dashboard");
  };

  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        <p className="text-lg text-primary">Loading analysis...</p>
      </div>
    );
  }

  const insightSections = parseAIInsight(analysis.ai_insight);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Main content */}
      <main className="flex-1 p-4 pb-32">
        <div className="max-w-md mx-auto">
          {analysis.error ? (
            <div className="card bg-error text-error-content p-6 mb-4">
              <h3 className="text-lg font-semibold mb-2">{analysis.error}</h3>
              <p>{analysis.details}</p>
            </div>
          ) : (
            <>
              {/* Nutritional Information Card */}
              <div className="card bg-base-200 p-6 mb-4 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]">
                <div className="text-xl text-base-content font-bold mb-4 text-center">
                  Nutritional Analysis
                </div>

                {/* Image and Macros Layout */}
                <div className="flex gap-4 mb-4">
                  {/* Macro Nutrients */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="stat bg-base-100 rounded-lg p-2">
                      <div className="stat-title text-[1rem] text-primary text-center">
                        <strong>Calories</strong>
                      </div>
                      <div className="stat-value text-[1.5rem] text-[#6765da] text-center">
                        {analysis.cal_kcal}
                      </div>
                    </div>
                    <div className="stat bg-base-100 rounded-lg p-2">
                      <div className="stat-title text-[1rem] text-primary text-center">
                        <strong>Protein</strong>
                      </div>
                      <div className="stat-value text-[1.5rem] text-[#FF6384] text-center">
                        {analysis.protein_g}g
                      </div>
                    </div>
                    <div className="stat bg-base-100 rounded-lg p-2">
                      <div className="stat-title text-[1rem] text-primary text-center">
                        <strong>Carbs</strong>
                      </div>
                      <div className="stat-value text-[1.5rem] text-[#63ac63] text-center">
                        {analysis.carbs_g}g
                      </div>
                    </div>
                    <div className="stat bg-base-100 rounded-lg p-2">
                      <div className="stat-title text-[1rem] text-primary text-center">
                        <strong>Fat</strong>
                      </div>
                      <div className="stat-value text-[1.5rem] text-[#e9b42f] text-center">
                        {analysis.fat_g}g
                      </div>
                    </div>
                  </div>

                  {/* Food Image */}
                  {analysis.image_url ? (
                    <div className="flex-shrink-0">
                      <div className="w-33 h-44 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={analysis.image_url}
                          alt="Analyzed food"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide the image container if image fails to load
                            e.target.parentElement.parentElement.style.display =
                              "none";
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Show placeholder if no image URL (e.g., for unauthenticated users)
                    <div className="flex-shrink-0">
                      <div className="w-24 h-32 rounded-lg overflow-hidden bg-base-200 flex items-center justify-center">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-base-content/40"
                        >
                          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Meal Score */}
                <div className="text-center">
                  <div className="text-lg text-base-content/90">
                    <strong>Meal Score</strong>
                  </div>
                  <div className="flex-1 grid grid-cols-1 gap-2 pl-20 pr-20">
                    <div className="text-3xl stat-value bg-base-100 rounded-lg p-2 text-[#882eb1]">
                      {analysis.meal_score}/10
                    </div>
                  </div>
                </div>
              </div>

              {/* Food Items Section */}
              {((analysis.food_items_created &&
                analysis.food_items_created.length > 0) ||
                (analysis.food_items && analysis.food_items.length > 0)) && (
                <div className="card bg-base-200 p-6 mb-4 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]">
                  <div className="text-xl text-base-content/90 font-bold mb-4 text-center">
                    Individual Food Items
                  </div>
                  <div className="space-y-3">
                    {(
                      analysis.food_items_created ||
                      analysis.food_items ||
                      []
                    ).map((foodItem, index) => (
                      <div
                        key={foodItem.id || index}
                        className="bg-base-100 rounded-lg border border-base-300"
                      >
                        {/* Food Item Header - Clickable */}
                        <button
                          onClick={() => {
                            const itemKey = foodItem.id || index;
                            setExpandedFoodItems((prev) => ({
                              ...prev,
                              [itemKey]: !prev[itemKey],
                            }));
                          }}
                          className="w-full p-4 text-left hover:bg-base-200 transition-colors rounded-lg flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center text-primary group-hover:text-base-content/90">
                            <span className="text-lg font-medium">
                              {foodItem.name}
                            </span>
                            <span className="ml-2 text-sm text-primary group-hover:text-base-content/90">
                              {foodItem.cal_kcal} kcal
                            </span>
                          </div>
                          <svg
                            className={`w-5 h-5 text-primary group-hover:text-base-content/90 transition-transform ${
                              expandedFoodItems[foodItem.id || index]
                                ? "rotate-180"
                                : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Expanded Content */}
                        {expandedFoodItems[foodItem.id || index] && (
                          <div className="px-4 pb-4 border-t border-base-300">
                            {/* Macros */}
                            <div className="mt-3 mb-4">
                              <h4 className="text-sm font-semibold text-primary mb-2">
                                Macronutrients
                              </h4>
                              <div className="grid grid-cols-4 gap-2">
                                <div className="text-center p-2 bg-base-200 rounded">
                                  <div className="text-sm text-base-content/90">
                                    Protein
                                  </div>
                                  <div className="text-md font-medium text-[#ffb2c2]">
                                    {foodItem.protein_g}g
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-base-200 rounded">
                                  <div className="text-sm text-base-content/90">
                                    Carbs
                                  </div>
                                  <div className="text-md font-medium text-[#86e786]">
                                    {foodItem.carbs_g}g
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-base-200 rounded">
                                  <div className="text-sm text-base-content/90">
                                    Fat
                                  </div>
                                  <div className="text-md font-medium text-[#facd5c]">
                                    {foodItem.fat_g}g
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-base-200 rounded">
                                  <div className="text-sm text-base-content/90">
                                    Calories
                                  </div>
                                  <div className="text-md font-medium text-[#d3d1ff]">
                                    {foodItem.cal_kcal}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional Nutrients */}
                            {foodItem.nutrients &&
                              foodItem.nutrients.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-primary mb-2">
                                    Additional Nutrients
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {foodItem.nutrients.map(
                                      (nutrient, index) => (
                                        <div
                                          key={index}
                                          className="flex justify-between items-center p-2 bg-base-200 rounded text-sm"
                                        >
                                          <span className="text-base-content/80">
                                            {nutrient.name}
                                          </span>
                                          <span className="font-medium text-base-content">
                                            {nutrient.value}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEW: Daily Progress Chart - Added between Food Items and Goal Information */}
              <MacroVerticalBarGraph />

              {/* Goal Information (if available) */}
              {analysis.hasUserGoal && (
                <div className="card bg-base-200 p-6 mb-4 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]">
                  <h4 className="text-lg font-semibold mb-3 text-base-content">
                    Your Goal Information
                  </h4>
                  <div className="bg-base-100 rounded-lg p-4">
                    <p className="text-sm mb-1 text-[#000000]">
                      <strong>Goal Type:</strong> {analysis.goalType}
                    </p>
                    {analysis.userGoal && (
                      <p className="text-sm text-[#000000]">
                        <strong>Your Objective:</strong>{" "}
                        {analysis.userGoal.objective}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Analysis Section */}
              {insightSections.analysis && (
                <div className="card bg-base-200 p-6 mb-4 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]">
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
                  <div className="bg-base-100 rounded-lg p-4">
                    <p className="text-[#000000] text-sm leading-relaxed">
                      {insightSections.analysis}
                    </p>
                  </div>
                </div>
              )}

              {/* Recommendation Section */}
              {insightSections.recommendation && (
                <div className="card bg-base-200 p-6 mb-4 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]">
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
                  <div className="bg-base-100 rounded-lg p-4">
                    <p className="text-[#000000] text-sm leading-relaxed">
                      {insightSections.recommendation}
                    </p>
                  </div>
                </div>
              )}

              {/* Alignment Section */}
              {insightSections.alignment && (
                <div className="card bg-base-200 p-6 mb-4 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]">
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
                  <div className="bg-base-100 rounded-lg p-4">
                    <p className="text-[#000000] text-sm leading-relaxed">
                      {insightSections.alignment}
                    </p>
                  </div>
                </div>
              )}

              {/* User Profile Card */}
              {analysis.userProfile && (
                <div className="card bg-base-200 p-6 mb-4 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]">
                  <h4 className="text-lg font-semibold mb-3 text-base-content">
                    Analysis Based On Your Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-base-content">
                    <div>
                      <strong>Age:</strong> {analysis.userProfile.age}
                    </div>
                    <div>
                      <strong>Weight:</strong> {analysis.userProfile.weight}kg
                    </div>
                    <div>
                      <strong>Height:</strong> {analysis.userProfile.height}cm
                    </div>
                    <div>
                      <strong>Gender:</strong> {analysis.userProfile.gender}
                    </div>
                    <div className="col-span-2">
                      <strong>Activity Level:</strong>{" "}
                      {analysis.userProfile.activity_level}
                    </div>
                  </div>
                </div>
              )}

              {/* Demo Notice */}
              {!localStorage.getItem("auth-token") && (
                <div className="alert alert-info mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>
                    Sign in to save your analysis history and get personalized
                    insights!
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bottom Action Icons - Full Width Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Full Width Dock Background */}
        <div className="bg-base-300 bg-opacity-95 backdrop-blur-md rounded-t-3xl shadow-2xl border-t-2 border-green-950 px-8 py-4">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {/* Discard Data (Trash Icon) - Left */}
            <div className="tooltip tooltip-top" data-tip="Discard data">
              <button
                onClick={handleDiscardData}
                disabled={isDeleting || deleteLoading}
                className="btn btn-circle btn-error shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)] hover:scale-110 transition-transform"
                style={{ width: "4.5rem", height: "4.5rem" }}
                aria-label="Discard data"
              >
                {isDeleting || deleteLoading ? (
                  <div className="loading loading-spinner loading-md"></div>
                ) : (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                )}
              </button>
            </div>

            {/* Accept Data (Eat/Utensils Icon) - Right */}
            <div className="tooltip tooltip-top" data-tip="Save and continue">
              <button
                onClick={handleAcceptData}
                className="btn btn-circle btn-success shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)] hover:scale-110 transition-transform"
                style={{ width: "4.5rem", height: "4.5rem" }}
                aria-label="Save and continue to dashboard"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
