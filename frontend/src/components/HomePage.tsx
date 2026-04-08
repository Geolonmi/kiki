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
  const [lastDraw, setLastDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLastDraw = async () => {
      try {
        const draws = await callApi<Draw[]>("/draw");
        // Trouver le dernier tirage exécuté
        const executed = draws
          .filter((d) => String(d.status).toLowerCase() === "executed")
          .sort(
            (a, b) =>
              new Date(b.executedAt || 0).getTime() -
              new Date(a.executedAt || 0).getTime(),
          );

        if (executed.length > 0) {
          setLastDraw(executed?.[0] ?? null);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des tirages", err);
      } finally {
        setLoading(false);
      }
    };

    loadLastDraw();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>On se lance un Kiki ? 🎉</h1>

        {!loading && lastDraw && (
          <div style={styles.lastDrawSection}>
            <h2 style={styles.lastDrawTitle}>
              🏆 Tirage Kiki {lastDraw.title} ?
            </h2>

            {lastDraw.winners.length > 0 && (
              <Wheel winners={lastDraw.winners.map((w) => w.name)} />
            )}

            <div style={styles.lastDrawCard}>
              <p style={styles.drawDate}>
                Kiki prévu pour le{" "}
                {new Date(lastDraw.scheduledDate).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p style={styles.drawDate}>
                Kiki tiré au sort le{" "}
                {new Date(lastDraw.executedAt || "").toLocaleDateString(
                  "fr-FR",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>

              {lastDraw.winners.length > 0 && (
                <div style={styles.winnersSection}>
                  <p style={styles.winnersLabel}>Tirés au sort :</p>
                  <div style={styles.winnersList}>
                    {lastDraw.winners.map((winner, idx) => (
                      <div key={winner.id} style={styles.winnerCard}>
                        <div style={styles.winnerRank}>#{idx + 1}</div>
                        <div style={styles.winnerName}>{winner.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p style={styles.statsText}>
                {lastDraw.participants.length} participant(s) •{" "}
                {lastDraw.winners.length} gagnant(s)
              </p>
            </div>
          </div>
        )}

        {!loading && !lastDraw && (
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
};
