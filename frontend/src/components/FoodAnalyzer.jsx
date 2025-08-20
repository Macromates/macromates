import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import useApiRequest from "../hooks/useApiRequest";

const FoodAnalyzer = ({ onCaptureComplete, onBack }) => {
  const webcamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showSnapEffect, setShowSnapEffect] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Use the API request hook
  const { sendRequest, data, loading, error } = useApiRequest({ auth: true });

  // Debug: Log camera access
  useEffect(() => {
    console.log("FoodAnalyzer mounted, checking camera access...");

    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Camera not supported by this browser. Please use a modern browser with HTTPS."
      );
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        console.log("Camera access granted");
        stream.getTracks().forEach((track) => track.stop()); // Clean up
      })
      .catch((error) => {
        console.error("Camera access denied:", error);
        let errorMessage = "Camera not available: ";

        if (error.name === "NotAllowedError") {
          errorMessage +=
            "Permission denied. Please allow camera access and refresh.";
        } else if (error.name === "NotFoundError") {
          errorMessage += "No camera found on this device.";
        } else if (error.name === "NotSupportedError") {
          errorMessage += "Camera not supported. Try using HTTPS.";
        } else {
          errorMessage += error.message;
        }

        setCameraError(errorMessage);
      });
  }, []);

  // Handle API response
  useEffect(() => {
    if (data) {
      console.log("Backend response:", data);
      // Log full authentication state
      console.log("Authentication state:", {
        hasToken: !!localStorage.getItem("auth-token"),
        responseHasGoal: data.hasUserGoal,
        goalType: data.goalType,
        fullResponse: data,
      });

      // Log goal-related information
      if (data.hasUserGoal) {
        console.log("Goal info:", {
          hasUserGoal: data.hasUserGoal,
          goalType: data.goalType,
          userGoal: data.userGoal,
        });
      }

      // Optional: Save analysis to local storage if user is not authenticated
      if (!localStorage.getItem("auth-token")) {
        const savedAnalyses = JSON.parse(
          localStorage.getItem("foodAnalyses") || "[]"
        );
        savedAnalyses.push({
          ...data,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem("foodAnalyses", JSON.stringify(savedAnalyses));
      }

      // Pass analysis data to parent component for navigation
      onCaptureComplete(data);
      setIsLoading(false);
      // Reset all states since we're navigating away
      setCapturedImage(null);
      setShowConfirmation(false);
    }

    if (error) {
      console.error("Error analyzing food:", error);
      // Add user-friendly error message
      const errorData = {
        error: "Failed to analyze food. Please try again.",
        details: error.message || "There was a problem analyzing the image.",
      };
      onCaptureComplete(errorData);
      setIsLoading(false);
      // Reset all states so user can retake photo
      setCapturedImage(null);
      setShowConfirmation(false);
    }
  }, [data, error, onCaptureComplete]);

  const capture = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();

      // Show snap effect
      setShowSnapEffect(true);
      setTimeout(() => setShowSnapEffect(false), 200);

      // Store captured image and show confirmation
      setCapturedImage(imageSrc);
      setShowConfirmation(true);
    }
  }, [webcamRef]);

  const confirmCapture = useCallback(async () => {
    if (capturedImage) {
      setShowConfirmation(false);
      setIsLoading(true);

      try {
        // Convert base64 to blob
        const blob = await fetch(capturedImage).then((res) => res.blob());

        // Create form data with proper MIME type
        const formData = new FormData();
        formData.append("image", blob, "food.jpeg");

        // Send to your backend using useApiRequest hook
        sendRequest("POST", "food/analyze/", formData, true);
      } catch (error) {
        console.error("Error preparing food analysis:", error);
        const errorData = {
          error: "Failed to prepare image for analysis. Please try again.",
          details: error.message,
        };
        onCaptureComplete(errorData);
        setIsLoading(false);
        setCapturedImage(null); // Reset on error
        setShowConfirmation(false);
      }
    }
  }, [capturedImage, sendRequest, onCaptureComplete]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Camera Error Display */}
      {cameraError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <div className="text-white text-center p-6">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="text-lg font-semibold mb-2">
              Camera Access Required
            </h3>
            <p className="text-sm text-gray-300 mb-4">{cameraError}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="block w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Retry Camera Access
              </button>
              <label className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors cursor-pointer">
                Upload Photo Instead
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Use the useApiRequest hook for file upload
                      setIsLoading(true);
                      const formData = new FormData();
                      formData.append("image", file);
                      sendRequest("POST", "food/analyze/", formData, true);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen webcam or captured image */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        {capturedImage ? (
          /* Show captured image */
          <img
            src={capturedImage}
            alt="Captured food"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Show live camera feed */
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment", // Use back camera on mobile
            }}
            className="w-full h-full object-cover"
            width="100%"
            height="100%"
            onUserMedia={() => setCameraError(null)}
            onUserMediaError={(error) => {
              console.error("Camera error:", error);
              setCameraError(
                "Camera access denied or not available. Please check your camera permissions."
              );
            }}
          />
        )}
      </div>

      {/* Snap effect overlay */}
      {showSnapEffect && (
        <div className="absolute inset-0 bg-white opacity-80 z-50 animate-pulse"></div>
      )}

      {/* Framing overlay - Only show during live camera feed */}
      {!capturedImage && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Top overlay with instructions */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-black bg-opacity-10 flex items-center justify-center">
            {!cameraError && (
              <div className="bg-black bg-opacity-60 px-4 py-2 rounded-lg">
                <p className="text-white text-sm font-medium text-center">
                  Point camera at your food
                </p>
              </div>
            )}
          </div>

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-black bg-opacity-10"></div>

          {/* Left overlay */}
          <div className="absolute top-24 bottom-28 left-0 w-8 bg-black bg-opacity-10"></div>

          {/* Right overlay */}
          <div className="absolute top-24 bottom-28 right-0 w-8 bg-black bg-opacity-50"></div>

          {/* Corner brackets for framing guide */}
          <div className="absolute top-24 left-8 w-6 h-6 border-t-2 border-l-2 border-white opacity-60"></div>
          <div className="absolute top-24 right-8 w-6 h-6 border-t-2 border-r-2 border-white opacity-60"></div>
          <div className="absolute bottom-28 left-8 w-6 h-6 border-b-2 border-l-2 border-white opacity-60"></div>
          <div className="absolute bottom-28 right-8 w-6 h-6 border-b-2 border-r-2 border-white opacity-60"></div>
        </div>
      )}

      {/* Analysis in progress overlay for captured image */}
      {capturedImage && (isLoading || loading) && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-24 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-black bg-opacity-60 px-4 py-2 rounded-lg">
              <p className="text-white text-sm font-medium text-center">
                Analyzing your food...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation overlay for captured image */}
      {capturedImage && showConfirmation && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-24 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-black bg-opacity-60 px-4 py-2 rounded-lg">
              <p className="text-white text-sm font-medium text-center">
                Keep this photo?
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar - Fixed z-index to show above dock */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-between px-8 pointer-events-auto z-[60]">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-90 rounded-full text-black hover:bg-opacity-100 hover:scale-105 transition-all shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)] cursor-pointer"
          aria-label="Go back"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Capture/Confirm button - changes based on state */}
        <button
          onClick={showConfirmation ? confirmCapture : capture}
          disabled={isLoading || loading}
          className={`w-20 h-20 rounded-full shadow-lg ring-2 flex items-center justify-center cursor-pointer hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            showConfirmation
              ? "bg-green-500 ring-green-500"
              : "bg-primary ring-primary"
          }`}
          aria-label={showConfirmation ? "Confirm photo" : "Capture food"}
        >
          {isLoading || loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          ) : showConfirmation ? (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
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
              className="text-white"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          )}
        </button>

        {/* Retake button - only show when image is captured */}
        {capturedImage ? (
          <button
            onClick={() => {
              setCapturedImage(null);
              setShowConfirmation(false);
              setIsLoading(false);
            }}
            className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-90 rounded-full text-black hover:bg-opacity-100 hover:scale-105 transition-all shadow-lg cursor-pointer"
            aria-label="Retake photo"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
        ) : (
          <div className="w-12 h-12"></div>
        )}
      </div>
    </div>
  );
};

export default FoodAnalyzer;
