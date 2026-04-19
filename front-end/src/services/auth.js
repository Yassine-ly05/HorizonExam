const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function login({ email, password, role }) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login failed");

    return data;
}

export function saveSession(payload, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    // Keep a single source of truth for auth state.
    otherStorage.removeItem("user");
    otherStorage.removeItem("token");

    storage.setItem("user", JSON.stringify(payload.user || null));
    storage.setItem("token", payload.token || "");
}

export function getCurrentUser() {
    const rawUser = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!rawUser) return null;

    try {
        return JSON.parse(rawUser);
    } catch {
        return null;
    }
}

export function getToken() {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
}

export function isAuthenticated() {
    return Boolean(getToken() && getCurrentUser());
}

export async function fetchCurrentUser() {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    return data.user || null;
}

export function logout() {
    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
}