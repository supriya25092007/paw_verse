import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

export const api = axios.create({ baseURL });

const ACCESS_KEY = "pawverse.access";
const REFRESH_KEY = "pawverse.refresh";
let refreshRequest;

export function saveTokens(tokens) {
  sessionStorage.setItem(ACCESS_KEY, tokens.access);
  sessionStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function hasSession() {
  return Boolean(sessionStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(REFRESH_KEY));
}

function notifySessionExpired() {
  clearTokens();
  window.dispatchEvent(new Event("pawverse:session-expired"));
}

api.interceptors.request.use((config) => {
  const access = sessionStorage.getItem(ACCESS_KEY);
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    const isAuthRequest = url.includes("/auth/token/");

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried || isAuthRequest) {
      return Promise.reject(error);
    }

    const refresh = sessionStorage.getItem(REFRESH_KEY);
    if (!refresh) {
      notifySessionExpired();
      return Promise.reject(error);
    }

    originalRequest._retried = true;
    try {
      refreshRequest ??= axios
        .post(`${baseURL}/auth/token/refresh/`, { refresh })
        .then(({ data }) => {
          sessionStorage.setItem(ACCESS_KEY, data.access);
          return data.access;
        })
        .finally(() => {
          refreshRequest = undefined;
        });

      const access = await refreshRequest;
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest);
    } catch (refreshError) {
      notifySessionExpired();
      return Promise.reject(refreshError);
    }
  },
);

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const data = error.response?.data;
  if (!data) return error.message || fallback;
  if (typeof data.detail === "string") return data.detail;

  const messages = Object.entries(data)
    .flatMap(([field, value]) => {
      const errors = Array.isArray(value) ? value : [value];
      return errors.map((message) =>
        field === "non_field_errors" || field === "detail"
          ? String(message)
          : `${field.replaceAll("_", " ")}: ${message}`,
      );
    })
    .filter(Boolean);

  return messages.join(" ") || fallback;
}
