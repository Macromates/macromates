import React from "react";
import { useNavigate } from "react-router";

const PhotoCaptureButton = () => {
  const navigate = useNavigate();

  const handlePhotoCapture = () => {
    navigate("/camera");
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-100">
      <button
        onClick={handlePhotoCapture}
        className="w-20 h-20 bg-[#1a8cff] rounded-full shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform border-2 border-white"
        aria-label="Take photo"
        style={{ pointerEvents: "auto" }}
      >
        {/* White camera icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      </button>
    </div>
  );
};

export default PhotoCaptureButton;
