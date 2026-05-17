/**
 * Services d'authentification pour le Frontend
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Tentative de connexion classique
 */
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

/**
 * Tentative de connexion avec Google OAuth
 */
export async function loginWithGoogle(credential) {
    const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Google login failed");

    return data;
}

/**
 * Sauvegarde la session dans localStorage (persistant) ou sessionStorage (temporaire)
 */
export function saveSession(payload, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    // Nettoyage de l'autre stockage pour éviter les conflits
    otherStorage.removeItem("user");
    otherStorage.removeItem("token");

    storage.setItem("user", JSON.stringify(payload.user || null));
    storage.setItem("token", payload.token || "");
}

/**
 * Récupère l'utilisateur actuellement stocké
 */
export function getCurrentUser() {
    const rawUser = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!rawUser) return null;

    try {
        return JSON.parse(rawUser);
    } catch {
        return null;
    }
}

/**
 * Récupère le token JWT stocké
 */
export function getToken() {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function isAuthenticated() {
    return Boolean(getToken() && getCurrentUser());
}

/**
 * Vérifie la validité du token auprès du serveur et récupère les données fraîches
 */
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

/**
 * Déconnexion : Nettoie tout le stockage et redirige vers /login
 */
export function logout() {
    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
}
