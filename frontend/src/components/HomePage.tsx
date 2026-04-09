import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import { Wheel } from "./Wheel";

interface Participant {
  id: string;
  name: string;
  createdAt: string;
}

interface Draw {
  id: string;
  title: string;
  scheduledDate: string;
  numberOfWinners: number;
  participants: Participant[];
  winners: Participant[];
  status: string;
  executedAt?: string;
}

export function HomePage() {
  const { callApi } = useApi();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentDraw = draws[currentIndex] || null;

  // Créer les confettis au chargement
  const createConfetti = () => {
    const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF8C42"];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti-piece";

      const color = colors[Math.floor(Math.random() * colors.length)]!;
      const size = Math.random() * 10 + 5;
      const duration = Math.random() * 1.5 + 2.5;
      const delay = Math.random() * 0.8;
      const left = Math.random() * 100;
      const top = Math.random() * -80 - 20; // Entre -100vh et -20vh
      const horizontalDrift = (Math.random() - 0.5) * 200; // Dérive horizontale aléatoire

      confetti.style.left = left + "%";
      confetti.style.top = top + "vh";
      confetti.style.width = size + "px";
      confetti.style.height = size + "px";
      confetti.style.backgroundColor = color;
      confetti.style.borderRadius = "50%";
      confetti.style.opacity = "1";
      confetti.style.animationDuration = duration + "s";
      confetti.style.animationDelay = delay + "s";
      const verticalDrift = Math.random() * 100 + 50; // Chute variable
      confetti.style.setProperty("--tx", horizontalDrift + "px");
      confetti.style.setProperty("--ty", verticalDrift + "vh");

      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), (duration + delay) * 1000);
    }
  };

  useEffect(() => {
    const loadAllDraws = async () => {
      try {
        const allDraws = await callApi<Draw[]>("/draw");
        // Filtrer et trier les tirages exécutés
        const executed = allDraws
          .filter((d) => String(d.status).toLowerCase() === "executed")
          .sort(
            (a, b) =>
              new Date(b.executedAt || 0).getTime() -
              new Date(a.executedAt || 0).getTime(),
          );

        if (executed.length > 0) {
          setDraws(executed);
          setCurrentIndex(0);
          // Déclencher les confettis quand on a des tirages
          setTimeout(() => createConfetti(), 300);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des tirages", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllDraws();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>On se lance un Kiki ? 🎉</h1>

        {!loading && currentDraw && (
          <div style={styles.lastDrawSection} className="slideInUp">
            {/* Navigation entre les tirages */}
            {draws.length > 1 && (
              <div style={styles.navigation}>
                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === 0 ? draws.length - 1 : prev - 1
                    )
                  }
                  style={styles.navButton}
                >
                  ← Précédent
                </button>
                <span style={styles.navInfo}>
                  {currentIndex + 1} / {draws.length}
                </span>
                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === draws.length - 1 ? 0 : prev + 1
                    )
                  }
                  style={styles.navButton}
                >
                  Suivant →
                </button>
              </div>
            )}

            <h2 style={styles.lastDrawTitle}>
              🏆 Tirage Kiki {currentDraw.title} ?
            </h2>

            {currentDraw.winners.length > 0 && (
              <Wheel winners={currentDraw.winners.map((w) => w.name)} />
            )}

            <div style={styles.lastDrawCard} className="glow subtlePulse">
              <p style={styles.drawDate}>
                Kiki prévu pour le{" "}
                {new Date(currentDraw.scheduledDate).toLocaleDateString(
                  "fr-FR",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
              <p style={styles.drawDate}>
                Kiki tiré au sort le{" "}
                {new Date(currentDraw.executedAt || "").toLocaleDateString(
                  "fr-FR",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>

              {currentDraw.winners.length > 0 && (
                <div style={styles.winnersSection}>
                  <p style={styles.winnersLabel}>Tiré·e·s au sort :</p>
                  <div style={styles.winnersList}>
                    {currentDraw.winners.map((winner, idx) => (
                      <div key={winner.id} style={styles.winnerCard}>
                        <div style={styles.winnerRank}>#{idx + 1}</div>
                        <div style={styles.winnerName}>{winner.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p style={styles.statsText}>
                {currentDraw.participants.length} participant·e·s •{" "}
                {currentDraw.winners.length} gagnant·e·s
              </p>
            </div>
          </div>
        )}

        {!loading && draws.length === 0 && (
          <p style={styles.cta}>
            Aucun tirage Kiki pour le moment. Accédez à l'administration pour
            créer votre premier tirage !
          </p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "calc(100vh - 60px)",
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    backgroundColor: "#fff",
    maxWidth: "900px",
    margin: "0 auto",
    padding: "3rem",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    border: "3px solid #FFD700",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "0.5rem",
    color: "#ff6b35",
    textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#666",
    marginBottom: "2rem",
    fontWeight: "500",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  feature: {
    textAlign: "center" as const,
    padding: "1.5rem",
    backgroundColor: "linear-gradient(135deg, #fff5e1 0%, #ffe8cc 100%)",
    borderRadius: "12px",
    border: "2px solid #f7931e",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
  },
  featureIcon: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
    display: "inline-block",
    animation: "bounce 2s ease-in-out infinite",
  },
  cta: {
    textAlign: "center" as const,
    color: "#666",
    fontSize: "1rem",
    marginTop: "2rem",
  },
  lastDrawSection: {
    marginTop: "3rem",
    paddingTop: "2rem",
    borderTop: "3px solid #FFD700",
  },
  lastDrawTitle: {
    fontSize: "1.5rem",
    color: "#ff6b35",
    marginBottom: "1.5rem",
    textAlign: "center" as const,
    textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
  },
  lastDrawCard: {
    backgroundColor: "linear-gradient(135deg, #fff5e1 0%, #ffe8cc 100%)",
    border: "3px solid #f7931e",
    borderRadius: "12px",
    padding: "1.5rem",
    marginTop: "1rem",
  },
  drawName: {
    fontSize: "1.2rem",
    color: "#1a1a1a",
    margin: "0 0 0.5rem",
  },
  drawDate: {
    color: "#666",
    margin: "0 0 1rem",
    fontSize: "0.95rem",
  },
  winnersSection: {
    marginTop: "1rem",
  },
  winnersLabel: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: "0.75rem",
  },
  winnersList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  winnerCard: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: "1rem",
    borderRadius: "6px",
    border: "1px solid #c8e6c9",
  },
  winnerRank: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#2e7d32",
    minWidth: "3rem",
    textAlign: "center",
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  statsText: {
    marginTop: "1rem",
    fontSize: "0.9rem",
    color: "#666",
  },
  navigation: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  navButton: {
    backgroundColor: "#ff6b35",
    color: "#fff",
    border: "none",
    padding: "0.6rem 1.2rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
  },
  navInfo: {
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#ff6b35",
    minWidth: "50px",
    textAlign: "center" as const,
  },
};