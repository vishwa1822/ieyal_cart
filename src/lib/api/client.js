import { API_BASE_URL } from "./config";
import { getToken } from "../theme";

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(endpoint, { method = "POST", body, token, params } = {}) {
  // Build the URL — works for both absolute (https://...) and relative (/api) base URLs
  const base = API_BASE_URL.startsWith("http") ? API_BASE_URL : window.location.origin + API_BASE_URL;
  const url = new URL(`${base}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers = { "Content-Type": "application/json" };
  const authToken = token || getToken();
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ApiError("Invalid response from server", res.status);
  }

  const failed = data?.status === "failed" || data?.success === false;
  if (!res.ok || failed) {
    throw new ApiError(data?.message || "Request failed", res.status, data);
  }

  return data;
}

export { ApiError };
