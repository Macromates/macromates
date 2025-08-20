import { useState, useEffect } from "react";
import useApiRequest from "./useApiRequest";

export default function useFetchUserGoals() {
  const { sendRequest, data, error, isLoading } = useApiRequest({ auth: true });
  const [hasGoals, setHasGoals] = useState(false);

  const getUserGoals = () => {
    sendRequest("get", "goals/my-goals/");
  };

  useEffect(() => {
    getUserGoals();
  }, []);

  useEffect(() => {
    if (data) {
      setHasGoals(data.results?.length > 0);
    }
  }, [data]);

  return {
    goals: data?.results || [],
    error,
    isLoading,
    getUserGoals,
    hasGoals,
  };
}
