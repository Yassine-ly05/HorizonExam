/**
 * Client API de base utilisant Fetch
 */
import { getToken } from "./auth";

// URL de base de l'API (Back-end)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Prépare les en-têtes de la requête (Content-Type, Token d'authentification)
 */
function buildHeaders(headers = {}) {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    // Ajoute le token Bearer si l'utilisateur est connecté
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

/**
 * Fonction générique pour effectuer des requêtes HTTP vers le back-end
 */
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

  // Gestion des erreurs HTTP (4xx, 5xx)
  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}
