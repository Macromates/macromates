import React from "react";
import { useNavigate } from "react-router";
import FoodAnalyzer from "../components/FoodAnalyzer";

const PhotoCapture = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleCaptureComplete = (analysisData) => {
    // Store analysis data for the results page
    localStorage.setItem("currentAnalysis", JSON.stringify(analysisData));
    // Navigate to results page
    navigate("/analysis-results");
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <FoodAnalyzer
        onBack={handleBack}
        onCaptureComplete={handleCaptureComplete}
      />
    </div>
  );
};

export default PhotoCapture;
