import { useEffect } from "react";
import useApiRequest from "./useApiRequest.js";

const useAutoFetch = (method, url, requestData, trigger, auth = false) => {
  const { sendRequest, data, error, loading } = useApiRequest({ auth });

  useEffect(() => {
    sendRequest(method, url, requestData);
  }, [url, trigger]);

  return { data, error, loading };
};

export default useAutoFetch;
