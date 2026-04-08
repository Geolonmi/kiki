import { useMsal } from "@azure/msal-react";
import { apiRequest } from "../config/authConfig";

/**
 * Hook pour effectuer des appels API authentifiés vers le backend.
 * Récupère automatiquement un access token via MSAL avant chaque requête.
 */
export function useApi() {
  const { instance, accounts } = useMsal();

  async function callApi<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const account = accounts[0];
    if (!account) {
      throw new Error("Aucun utilisateur connecté");
    }

    const tokenResponse = await instance.acquireTokenSilent({
      ...apiRequest,
      account,
    });

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${tokenResponse.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    // Pour les réponses 204 No Content, retourner void
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  return { callApi };
}
