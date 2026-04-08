import { useState } from "react";
import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import type { IPublicClientApplication } from "@azure/msal-browser";
import { LoginPage } from "./components/LoginPage";
import { HomePage } from "./components/HomePage";
import { DrawAdminPage } from "./components/DrawAdminPage";
import { Navigation } from "./components/Navigation";

interface AppProps {
  msalInstance: IPublicClientApplication;
}

export default function App({ msalInstance }: AppProps) {
  const [currentPage, setCurrentPage] = useState<"home" | "admin">("home");

  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticatedTemplate>
        <Navigation currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as "home" | "admin")} />
        {currentPage === "home" && <HomePage />}
        {currentPage === "admin" && <DrawAdminPage />}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
    </MsalProvider>
  );
}
