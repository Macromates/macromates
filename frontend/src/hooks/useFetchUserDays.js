import { useState, useEffect } from "react";
import useApiRequest from "./useApiRequest";

export default function useFetchUserDays() {
  const { sendRequest, data, error, isLoading } = useApiRequest({ auth: true });
  const [days, setDays] = useState([]);

  const fetchUserDays = () => {
    sendRequest("get", "users/me/days/");
  };

  useEffect(() => {
    fetchUserDays();
  }, []);

  useEffect(() => {
    if (data) {
      setDays(data.results || []);
    }
  }, [data]);

  return {
    days,
    error,
    isLoading,
    fetchUserDays,
  };
}
