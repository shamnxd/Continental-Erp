import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);
