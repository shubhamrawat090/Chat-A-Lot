import axios, { AxiosResponse } from "axios";

// Create Axios instance with default configuration
const axiosInstance = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL,
  baseURL: "http://localhost:5000",
});

// Mandatory headers in case no headers are passed
const mandatoryHeaders = {
  "Content-Type": "application/json",
};

// Define the return type for the API connector function
type ApiConnectorReturnType<T> = Promise<AxiosResponse<T>>;

// Define the API connector function
export const apiConnector = <T>(
  method: string,
  url: string,
  bodyData?: unknown,
  headers?: unknown,
  params?: unknown
): ApiConnectorReturnType<T> => {
  return axiosInstance({
    method: method,
    url: url,
    data: bodyData ? bodyData : undefined,
    headers: headers ? { ...headers, ...mandatoryHeaders } : mandatoryHeaders,
    params: params ? params : undefined,
  });
};
