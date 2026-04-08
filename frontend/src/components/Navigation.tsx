import { useMsal } from "@azure/msal-react";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  // Extraire les initiales du nom
  const getInitials = (name: string | undefined): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(account?.name);

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.brand}>🎉 Kiki</div>
        <div style={styles.menu}>
          <button
            style={{
              ...styles.navLink,
              ...(currentPage === "home" ? styles.navLinkActive : {}),
            }}
            onClick={() => onNavigate("home")}
          >
            Accueil
          </button>
          <button
            style={{
              ...styles.navLink,
              ...(currentPage === "admin" ? styles.navLinkActive : {}),
            }}
            onClick={() => onNavigate("admin")}
          >
            Administration
          </button>

          <div style={styles.userSection}>
            <div style={styles.avatar}>{initials}</div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{account?.name ?? "Utilisateur"}</div>
              <div style={styles.userEmail}>{account?.username}</div>
            </div>
          </div>

          <button style={styles.navLogout} onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
    color: "#fff",
    padding: "1rem 0",
    boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)",
  },
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  brand: {
    fontSize: "1.3rem",
    fontWeight: "bold",
    textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
  },
  menu: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
  },
  navLink: {
    backgroundColor: "transparent",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0.5rem 1rem",
  },
  navLinkActive: {
    borderBottom: "3px solid #fff",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    paddingRight: "1rem",
    borderRight: "1px solid rgba(255,255,255,0.3)",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "0.9rem",
  },
  userInfo: {
    fontSize: "0.85rem",
  },
  userName: {
    fontWeight: "600",
    whiteSpace: "nowrap" as const,
  },
  userEmail: {
    fontSize: "0.75rem",
    opacity: 0.9,
    whiteSpace: "nowrap" as const,
  },
  navLogout: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    border: "1px solid #fff",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
  },
};
