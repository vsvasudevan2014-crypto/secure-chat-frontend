import axios from "axios";

const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://secure-chat-backend-c423.onrender.com/api",
});

API.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401
    ) {
      sessionStorage.clear();
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default API;