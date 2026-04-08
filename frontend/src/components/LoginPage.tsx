import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";

export function LoginPage() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎉 Kiki</h1>
        <p style={styles.subtitle}>Connectez-vous pour acceder à KIKI.</p>
        <button style={styles.button} onClick={handleLogin}>
          Se connecter avec Microsoft
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    backgroundColor: "#fff",
    padding: "3rem",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center" as const,
    maxWidth: "400px",
    border: "3px solid #FFD700",
  },
  title: {
    margin: "0 0 0.5rem",
    fontSize: "2.5rem",
    color: "#ff6b35",
    textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
  },
  subtitle: {
    color: "#666",
    marginBottom: "2rem",
    lineHeight: 1.6,
    fontSize: "1rem",
  },
  button: {
    background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
    color: "#fff",
    border: "2px solid #ff6b35",
    padding: "14px 40px",
    borderRadius: "10px",
    fontSize: "1.05rem",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 6px 20px rgba(255, 107, 53, 0.4)",
    transition: "all 0.3s ease",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
};
