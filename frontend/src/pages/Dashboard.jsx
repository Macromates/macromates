import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUser } from "../store/slices/loggedInUser";
import useFetchUserMacros from "../hooks/useFetchUserMacros";
import MacroPie from "../components/Charts/MacroPie";
import MacroVerticalBarGraph from "../components/Charts/MacroVerticalBarGraph";
import MacroProgressBarChart from "../components/Charts/MacroProgressBarChart";
import RandomDayWedPhoto from "../components/RandomDayWedPhoto";

export default function Dashboard() {
  const dispatch = useDispatch();

  const { user, isLoading, error } = useSelector(
    (state) => state.loggedInUser || {}
  );

  const {
    dailyMacros,
    totalTargetMacros,
    error: macrosError,
    isLoading: loadingMacros,
  } = useFetchUserMacros();

  // fire the fetch once on mount
  useEffect(() => {
    if (!user) dispatch(fetchCurrentUser());
  }, [dispatch, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col mx-auto max-w-[480px] gap-6 p-4 md:p-6 mb-4">
      {/* Welcome Section */}
      <div className="w-full max-w-md md:max-w-lg bg-base-200 rounded-lg p-4 md:p-6 shadow-[4px_4px_12px_0_rgba(0,0,0,0.28)]">
        <p className="text-lg md:text-xl">
          {user?.first_name
            ? `Hey, ${user.first_name}! Keep track of your daily macros and progress here 🍕`
            : "No user data found."}
        </p>
      </div>
      {loadingMacros && (
        <div className="w-full max-w-md md:max-w-lg">
          <p className="text-lg">Loading macro data...</p>
        </div>
      )}
      {totalTargetMacros && !loadingMacros && (
        <div className="w-full max-w-md md:max-w-lg flex flex-col items-center rounded-lg p-4 shadow-[4px_4px_12px_0_rgba(0,0,0,0.15)]">
          <h3 className="text-lg font-semibold">Macro Distribution</h3>
          <h1 className="text-xs text-center">
            Recommended Daily Intake based <br /> on your active goal
          </h1>
          <div className="w-full flex justify-center">
            <MacroPie
              data={{
                labels: ["Protein", "Carbs", "Fats"],
                values: [
                  totalTargetMacros.protein,
                  totalTargetMacros.carbs,
                  totalTargetMacros.fats,
                ],
                colors: ["#FF6384", "#63ac63", "#FFCE56"],
              }}
            />
          </div>
        </div>
      )}
      {/* New Vertical Bar Chart Component */}
      <div className="w-full max-w-md md:max-w-lg rounded-lg shadow-[4px_4px_12px_0_rgba(0,0,0,0.15)]">
        <MacroVerticalBarGraph />
      </div>
      {!totalTargetMacros && (
        <div className="w-full max-w-md md:max-w-lg p-4 bg-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800">
            {macrosError ||
              "No macro data available. Please check your goals and daily entries."}
          </p>
        </div>
      )}
      {/* Random Day Generator - For testing purposes
      <RandomDayWedPhoto
        onDayCreated={(createdDay) => {
          console.log("Random day created:", createdDay);
        }}
      /> */}
    </div>
  );
}
