import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function buildHeaders(headers = {}) {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}
