/// <reference types="vite/client" />
import { Configuration, LogLevel } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
        }
      },
    },
  },
};

/**
 * Scopes demandés lors de l'authentification.
 * Le scope "access_as_user" correspond à celui exposé par l'API backend.
 */
export const loginRequest = {
  scopes: [import.meta.env.VITE_API_SCOPE],
};

/**
 * Scopes pour appeler l'API backend.
 */
export const apiRequest = {
  scopes: [import.meta.env.VITE_API_SCOPE],
};
