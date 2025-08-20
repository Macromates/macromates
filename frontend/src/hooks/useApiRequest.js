import { useState, useCallback } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api.js";

// Set the base URL for axios
axios.defaults.baseURL = API_BASE_URL;
// test comment

const useApiRequest = (options = { auth: true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendRequest = useCallback(
    (method, url, requestData, isFormData) => {
      setLoading(true);
      setData(null);
      setError(null);

      axios.defaults.headers.common["Content-Type"] = isFormData
        ? "multipart/form-data"
        : "application/json";

      if (options.auth === true) {
        const token = localStorage.getItem("auth-token");
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
          delete axios.defaults.headers.common["Authorization"];
        }
      } else {
        delete axios.defaults.headers.common["Authorization"];
      }

      axios({ method, url, data: requestData })
        .then((response) => {
          if (response.status >= 200 && response.status < 300) {
            if (Object.keys(response.data).length === 0) {
              return setData("success");
            } else {
              return setData(response.data);
            }
          }
        })
        .catch((error) => {
          if (error.response) {
            setError(error.response.data);
          } else {
            setError({ message: "Network or server error" });
          }
        })
        .finally(() => setLoading(false));
    },
    [options.auth]
  );

  return { sendRequest, data, error, loading };
};

export { axios };

export default useApiRequest;
