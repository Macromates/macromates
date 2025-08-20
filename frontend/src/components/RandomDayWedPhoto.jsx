import { useState, useEffect } from "react";
import useApiRequest from "../hooks/useApiRequest";

const RandomDayGenerator = ({ onDayCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreatedDay, setLastCreatedDay] = useState(null);
  const { sendRequest, data, loading, error } = useApiRequest({ auth: true });

  useEffect(() => {
    if (data && !error) {
      console.log("Random day created:", data);
      setLastCreatedDay(data);
      setIsCreating(false);

      // Call the callback if provided (e.g., to refresh dashboard data)
      if (onDayCreated) {
        onDayCreated(data);
      }
    }

    if (error) {
      console.error("Error creating random day:", error);
      setIsCreating(false);
    }
  }, [data, error, onDayCreated]);

  const handleCreateRandomDay = () => {
    setIsCreating(true);
    setLastCreatedDay(null);
    // Send request with Wednesday spike parameter
    sendRequest("POST", "users/me/days/create-random/", {
      wednesday_spike: true,
      spike_multiplier: 1.3, // 30% increase
    });
  };

  return (
    <div className="w-full max-w-md md:max-w-lg mt-3 p-4 bg-base-200 shadow rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">
            Test Data Generator
          </h3>
          <p className="text-sm text-gray-600">
            Generate 70 days of random macro data with 5 Wednesday meal photos
            per spike day
          </p>
        </div>
        <button
          onClick={handleCreateRandomDay}
          disabled={loading || isCreating}
          className="btn btn-primary btn-sm flex items-center gap-2 disabled:opacity-50"
        >
          {loading || isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating 70 days...</span>
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
              <span>Generate 70 Days</span>
            </>
          )}
        </button>
      </div>

      {lastCreatedDay && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-2">
            ✅ {lastCreatedDay.message}
          </p>

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs text-green-700 mb-3">
            <div>
              <span className="font-medium">Days Created:</span>{" "}
              {lastCreatedDay.statistics.total_created}
            </div>
            <div>
              <span className="font-medium">Days Skipped:</span>{" "}
              {lastCreatedDay.statistics.total_skipped}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Date Range:</span>{" "}
              {lastCreatedDay.statistics.date_range}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Affected Months:</span>{" "}
              {lastCreatedDay.statistics.affected_months.join(", ")}
            </div>
            {/* Wednesday spike info */}
            {lastCreatedDay.statistics.wednesday_days && (
              <div className="col-span-2">
                <span className="font-medium">Wednesday Spikes:</span>{" "}
                {lastCreatedDay.statistics.wednesday_days} days (+30% macros + 5
                meals each)
              </div>
            )}
            {/* Photo creation info */}
            {lastCreatedDay.statistics.photos_created && (
              <div className="col-span-2">
                <span className="font-medium">Meal Photos:</span>{" "}
                {lastCreatedDay.statistics.photos_created} photos created (5 per
                Wednesday)
              </div>
            )}
          </div>

          {/* Sample of created days */}
          {lastCreatedDay.created_days &&
            lastCreatedDay.created_days.length > 0 && (
              <div className="border-t border-green-200 pt-2">
                <p className="text-xs font-medium text-green-800 mb-1">
                  Sample Days Created:
                </p>
                <div className="space-y-1">
                  {lastCreatedDay.created_days.slice(0, 3).map((day, index) => (
                    <div key={index} className="text-xs text-green-600">
                      <span className="font-medium">{day.date}:</span>{" "}
                      {day.calories}cal, {day.protein}g protein, {day.carbs}g
                      carbs, {day.fats}g fats
                      {/* Show if it's a Wednesday spike */}
                      {day.is_wednesday_spike && (
                        <span className="ml-1 px-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                          📈 Wed Spike
                        </span>
                      )}
                      {/* Show if it has meal photos */}
                      {day.has_meal_photo && (
                        <span className="ml-1 px-1 bg-blue-200 text-blue-800 rounded text-xs">
                          📸 {day.photos_count} Photos
                        </span>
                      )}
                    </div>
                  ))}
                  {lastCreatedDay.created_days.length > 3 && (
                    <div className="text-xs text-green-600">
                      ...and {lastCreatedDay.created_days.length - 3} more days
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Sample of created photos */}
          {lastCreatedDay.created_photos &&
            lastCreatedDay.created_photos.length > 0 && (
              <div className="border-t border-green-200 pt-2 mt-2">
                <p className="text-xs font-medium text-green-800 mb-1">
                  Wednesday Meal Photos:
                </p>
                <div className="space-y-1">
                  {lastCreatedDay.created_photos
                    .slice(0, 5)
                    .map((photo, index) => (
                      <div key={index} className="text-xs text-blue-600">
                        <span className="font-medium">
                          {photo.date} Meal {photo.meal_number}:
                        </span>{" "}
                        Fried chicken - {photo.macros.cal_kcal}cal,{" "}
                        {photo.macros.protein_g}g protein,{" "}
                        {photo.macros.carbs_g}g carbs, {photo.macros.fat_g}g fat
                        <span className="ml-1 px-1 bg-orange-200 text-orange-800 rounded text-xs">
                          Score: {photo.macros.meal_score}/10
                        </span>
                      </div>
                    ))}
                  {lastCreatedDay.created_photos.length > 5 && (
                    <div className="text-xs text-blue-600">
                      ...and {lastCreatedDay.created_photos.length - 5} more
                      photos
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ❌ Error:{" "}
            {error.message || error.detail || "Failed to create random day"}
          </p>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <p>• Creates 70 days going backwards from yesterday</p>
        <p>
          • Randomly skips 25% of days (max 2 consecutive) to simulate real
          usage
        </p>
        <p>• Random macros: 250-400g carbs, 100-200g protein, 70-150g fats</p>
        <p>• Calories between 2000-3000, meal scores 6.0-9.5</p>
        <p>
          • <strong>📈 Wednesday Spikes:</strong> Total day macros are 30%
          higher (325-520g carbs, 130-260g protein, 91-195g fats, 2600-3900
          calories)
        </p>
        <p>
          • <strong>📸 5 Meal Photos:</strong> Each Wednesday gets 5 fried
          chicken meals (6000+ extra calories)
        </p>
        <p>
          • <strong>🎯 Keto Context:</strong> Wednesday meals show poor keto
          alignment (score 4/10)
        </p>
        <p>
          • <strong>📊 Massive Spikes:</strong> Wednesdays will have 8600-9900+
          total calories with photos included
        </p>
      </div>
    </div>
  );
};

export default RandomDayGenerator;
