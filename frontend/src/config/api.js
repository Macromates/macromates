// Environment-based API configuration
// Priority: VITE_API_BASE_URL > PROD fallback > DEV fallback
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? import.meta.env.VITE_PROD_API_BASE_URL ||
      "https://macromates.propulsion-learn.ch/backend/api/"
    : "http://localhost:8000/backend/api/");

// Debug: Log the API URL being used
console.log("🌐 API Base URL:", API_BASE_URL);
console.log(
  "🔧 Environment:",
  import.meta.env.PROD ? "PRODUCTION" : "DEVELOPMENT"
);

// Export for use in other files
export default API_BASE_URL;
