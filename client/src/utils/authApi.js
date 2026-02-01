import axios from "axios";

// const navigate = useNavigate();

const backendURL = import.meta.env.VITE_API_BASE_URL;

let accessToken = null;
// eslint-disable-next-line no-unused-vars
let isLoggedOut = false;

export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

export function markAsLoggedOut() {
  isLoggedOut = true;
}

const authApi = axios.create({
  baseURL: `${backendURL}/api/user`,
  withCredentials: true,
});

authApi.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

authApi.interceptors.response.use(
  // ✅ Handle all successful responses
  (res) => {
    return {
      status: res.status,
      message: res.data?.message || "Success",
      data: res.data?.data || res.data,
    };
  },

  // ✅ Handle errors
  async (err) => {
    const status = err.response?.status;

    // ✅ 401: Attempt refresh and retry
    if (status === 401) {
      markAsLoggedOut();
      localStorage.clear();
      sessionStorage.clear();

      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }

      return Promise.reject({
        status: 401,
        message: "Session expired. Please log in again.",
        data: null,
      });
    }

    // ✅ Other errors (400, 403, 500, etc.)
    return Promise.reject({
      status: status || 500,
      message: err.response?.data?.message || "Something went wrong",
      data: err.response?.data?.data || null,
    });
  }
);

export default authApi;
