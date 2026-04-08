import { useState, useEffect } from "react";
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

export function DrawAdminPage() {
  const { callApi } = useApi();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [selectedDrawId, setSelectedDrawId] = useState<string | null>(null);
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper pour comparer le statut (en cas de sérialisation en nombre ou string)
  const isStatus = (status: any, expected: string): boolean => {
    return String(status).toLowerCase() === expected.toLowerCase();
  };

  // Formulaire création tirage
  const [newDrawTitle, setNewDrawTitle] = useState("");
  const [newDrawDate, setNewDrawDate] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState(1);

  // Formulaire participant
  const [participantName, setParticipantName] = useState("");

  // Import participants du dernier tirage
  const [lastExecutedDraw, setLastExecutedDraw] = useState<Draw | null>(null);
  const [showImportPrompt, setShowImportPrompt] = useState(false);

  // État pour l'animation de la roue
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);

  // État pour la confirmation de suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Charger tous les tirages
  const loadDraws = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await callApi<Draw[]>("/draw");
      // Trier par date de tirage du plus récent au plus ancien
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.scheduledDate).getTime() -
          new Date(a.scheduledDate).getTime(),
      );
      setDraws(sortedData);

      // Trouver le dernier tirage exécuté
      const executed = data
        .filter((d) => isStatus(d.status, "executed"))
        .sort(
          (a, b) =>
            new Date(b.executedAt || 0).getTime() -
            new Date(a.executedAt || 0).getTime(),
        );

      if (executed.length > 0) {
        setLastExecutedDraw(executed?.[0] ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // Charger un tirage
  const loadDraw = async (drawId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await callApi<Draw>(`/draw/${drawId}`);
      setCurrentDraw(data);
      setSelectedDrawId(drawId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // Créer un tirage
  const handleCreateDraw = async () => {
    if (!newDrawTitle.trim() || !newDrawDate) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      setError(null);
      const data = await callApi<Draw>("/draw", {
        method: "POST",
        body: JSON.stringify({
          title: newDrawTitle,
          scheduledDate: new Date(newDrawDate).toISOString(),
          numberOfWinners: parseInt(numberOfWinners.toString()),
        }),
      });
      setCurrentDraw(data);
      setSelectedDrawId(data.id);
      setNewDrawTitle("");
      setNewDrawDate("");
      setNumberOfWinners(1);
      await loadDraws();

      // Afficher la proposition d'import s'il y a un tirage précédent
      if (lastExecutedDraw && lastExecutedDraw.participants.length > 0) {
        setShowImportPrompt(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Importer les participants du dernier tirage
  const handleImportParticipants = async () => {
    if (!currentDraw || !lastExecutedDraw) return;

    try {
      setError(null);

      // Ajouter chaque participant du dernier tirage
      for (const participant of lastExecutedDraw.participants) {
        await callApi<Draw>(`/draw/${currentDraw.id}/participants`, {
          method: "POST",
          body: JSON.stringify({
            name: participant.name,
          }),
        });
      }

      // Recharger le tirage courant
      await loadDraw(currentDraw.id);
      setShowImportPrompt(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Supprimer un tirage
  const handleDeleteDraw = async () => {
    if (!currentDraw) return;

    try {
      setError(null);
      await callApi<void>(`/draw/${currentDraw.id}`, {
        method: "DELETE",
      });

      // Réinitialiser l'état et recharger la liste
      setCurrentDraw(null);
      setSelectedDrawId(null);
      await loadDraws();
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Ajouter participant
  const handleAddParticipant = async () => {
    if (!currentDraw) return;
    if (!participantName.trim()) {
      setError("Veuillez remplir le nom");
      return;
    }

    try {
      setError(null);
      const data = await callApi<Draw>(`/draw/${currentDraw.id}/participants`, {
        method: "POST",
        body: JSON.stringify({
          name: participantName,
        }),
      });
      setCurrentDraw(data);
      setParticipantName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Supprimer participant
  const handleRemoveParticipant = async (participantId: string) => {
    if (!currentDraw) return;

    try {
      setError(null);
      const data = await callApi<Draw>(
        `/draw/${currentDraw.id}/participants/${participantId}`,
        { method: "DELETE" },
      );
      setCurrentDraw(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  // Exécuter le tirage
  const handleExecuteDraw = async () => {
    if (!currentDraw) return;

    try {
      setError(null);
      setIsWheelSpinning(true);

      // Appeler l'API immédiatement
      const data = await callApi<Draw>(`/draw/${currentDraw.id}/execute`, {
        method: "POST",
      });

      // Attendre la fin de la roue avant de mettre à jour
      await new Promise((resolve) => setTimeout(resolve, 4500));

      setCurrentDraw(data);
      await loadDraws();
      setIsWheelSpinning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setIsWheelSpinning(false);
    }
  };

  useEffect(() => {
    loadDraws();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎉 Administration Kiki</h1>

      {error && <div style={styles.error}>{error}</div>}

      {/* Modal d'import des participants */}
      {showImportPrompt && currentDraw && lastExecutedDraw && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>
              Réutiliser les candidats du dernier tirage ?
            </h2>
            <p style={styles.modalText}>
              Le tirage précédent "{lastExecutedDraw.title}" contenait{" "}
              <strong>{lastExecutedDraw.participants.length}</strong>{" "}
              candidat(s).
            </p>
            <p style={styles.modalText}>
              Voulez-vous importer automatiquement ces candidats dans le nouveau
              tirage Kiki ?
            </p>

            <div style={styles.modalActions}>
              <button
                style={styles.buttonImport}
                onClick={handleImportParticipants}
              >
                ✓ Réutiliser les candidats
              </button>
              <button
                style={styles.buttonSkip}
                onClick={() => setShowImportPrompt(false)}
              >
                ✕ Passer
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {/* Panneau gauche: créer et lister les tirages */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Créer un tirage Kiki</h2>

          <div style={styles.formGroup}>
            <label>Titre du tirage</label>
            <input
              type="text"
              value={newDrawTitle}
              onChange={(e) => setNewDrawTitle(e.target.value)}
              placeholder="Ex: ramene le petit dej vendredi"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Date du tirage</label>
            <input
              type="date"
              value={newDrawDate}
              onChange={(e) => setNewDrawDate(e.target.value)}
              onClick={(e) => {
                // Force l'ouverture du calendrier au clic
                (e.currentTarget as HTMLInputElement).showPicker?.();
              }}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Nombre de gagnants</label>
            <input
              type="number"
              min="1"
              value={numberOfWinners}
              onChange={(e) => setNumberOfWinners(parseInt(e.target.value))}
              style={styles.input}
            />
          </div>

          <button style={styles.buttonPrimary} onClick={handleCreateDraw}>
            Créer le tirage
          </button>

          <h2 style={{ ...styles.panelTitle, marginTop: "2rem" }}>
            Les derniers tirages Kiki
          </h2>

          {loading && <p>Chargement...</p>}
          {draws.length === 0 && !loading && <p>Aucun tirage créé</p>}

          <div style={styles.drawsList}>
            {draws.map((draw) => (
              <button
                key={draw.id}
                style={{
                  ...styles.drawItem,
                  ...(selectedDrawId === draw.id ? styles.drawItemActive : {}),
                }}
                onClick={() => loadDraw(draw.id)}
              >
                <div style={styles.drawItemTitle}>{draw.title}</div>
                <div style={styles.drawItemMeta}>
                  {draw.participants.length} participant(s)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panneau droit: éditer le tirage sélectionné */}
        {/* Modal de confirmation de suppression */}
        {showDeleteConfirm && currentDraw && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={styles.modalTitle}>
                ⚠️ Supprimer le tirage "{currentDraw.title}" ?
              </h2>
              <p style={styles.modalText}>
                Cette action est irréversible. Tous les participants et
                résultats seront supprimés.
              </p>

              <div style={styles.modalActions}>
                <button style={styles.buttonDelete} onClick={handleDeleteDraw}>
                  ✓ Oui, supprimer
                </button>
                <button
                  style={styles.buttonCancel}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  ✕ Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {currentDraw && (
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Kiki {currentDraw.title} ?</h2>
              <button
                style={styles.buttonDeleteSmall}
                onClick={() => setShowDeleteConfirm(true)}
                title="Supprimer ce tirage"
              >
                🗑️
              </button>
            </div>

            <div style={styles.info}>
              <p>
                <strong>Statut:</strong> {currentDraw.status}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(currentDraw.scheduledDate).toLocaleDateString(
                  "fr-FR",
                )}
              </p>
              <p>
                <strong>Gagnants à sélectionner:</strong>{" "}
                {currentDraw.numberOfWinners}
              </p>
            </div>

            {isStatus(currentDraw.status, "draft") && (
              <>
                <h3 style={styles.sectionTitle}>Ajouter des candidats</h3>

                <div style={styles.formGroup}>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddParticipant();
                      }
                    }}
                    placeholder="Nom du candidat"
                    style={styles.input}
                  />
                </div>

                <button
                  style={styles.buttonSecondary}
                  onClick={handleAddParticipant}
                >
                  Ajouter un candidat
                </button>
              </>
            )}

            <h3 style={styles.sectionTitle}>
              Candidats ({currentDraw.participants.length})
            </h3>

            {currentDraw.participants.length === 0 ? (
              <p>Aucun candidat</p>
            ) : (
              <div style={styles.participantsList}>
                {currentDraw.participants.map((p) => (
                  <div key={p.id} style={styles.participantItem}>
                    <span style={styles.participantName}>{p.name}</span>
                    {isStatus(currentDraw.status, "draft") && (
                      <button
                        style={styles.buttonDeleteInChip}
                        onClick={() => handleRemoveParticipant(p.id)}
                        title="Supprimer ce participant"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isStatus(currentDraw.status, "draft") &&
              currentDraw.participants.length > 0 && (
                <button
                  style={{
                    ...styles.buttonExecute,
                    opacity: isWheelSpinning ? 0.5 : 1,
                    cursor: isWheelSpinning ? "not-allowed" : "pointer",
                  }}
                  onClick={handleExecuteDraw}
                  disabled={isWheelSpinning}
                >
                  {isWheelSpinning
                    ? "🎡 La roue tourne..."
                    : "🎰 Lancer le tirage"}
                </button>
              )}

            {/* Afficher la roue pendant le tirage */}
            {isWheelSpinning && (
              <div style={styles.wheelSection}>
                <h3 style={styles.wheelTitle}>🎡 Kiki lance la roue !</h3>
                <Wheel
                  winners={currentDraw.participants.map((p) => p.name)}
                  isSpinning={isWheelSpinning}
                />
              </div>
            )}

            {isStatus(currentDraw.status, "executed") && (
              <>
                <h3 style={styles.sectionTitle}>
                  🏆 Les chanceux ({currentDraw.winners.length})
                </h3>
                <div style={styles.winnersList}>
                  {currentDraw.winners.map((w, idx) => (
                    <div key={w.id} style={styles.winnerItem}>
                      <span style={styles.winnerRank}>#{idx + 1}</span>
                      <span style={styles.winnerName}>{w.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    minHeight: "calc(100vh - 60px)",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "1.5rem",
    color: "#ff6b35",
    textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
  },
  error: {
    backgroundColor: "#ffebee",
    border: "2px solid #f44336",
    color: "#d32f2f",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  modal: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "2rem",
    maxWidth: "400px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
  },
  modalTitle: {
    fontSize: "1.3rem",
    marginBottom: "1rem",
    color: "#1a1a1a",
  },
  modalText: {
    color: "#666",
    marginBottom: "1rem",
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  buttonImport: {
    backgroundColor: "#4caf50",
    color: "#fff",
    border: "2px solid #4caf50",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1rem",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(76, 175, 80, 0.4)",
  },
  "buttonImport:hover": {
    backgroundColor: "#66bb6a",
    boxShadow: "0 6px 20px rgba(76, 175, 80, 0.6)",
  },
  buttonSkip: {
    backgroundColor: "transparent",
    color: "#666",
    border: "2px solid #ddd",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  buttonCancel: {
    backgroundColor: "transparent",
    color: "#666",
    border: "2px solid #ddd",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  wheelSection: {
    marginTop: "2rem",
    padding: "1rem",
    backgroundColor: "#fff5e1",
    borderRadius: "12px",
    border: "2px solid #f7931e",
    textAlign: "center" as const,
  },
  wheelTitle: {
    fontSize: "1.3rem",
    color: "#ff6b35",
    marginBottom: "1rem",
    animation: "bounce 1.5s ease-in-out infinite",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "2rem",
  },
  panel: {
    backgroundColor: "#fff",
    border: "2px solid #f7931e",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  panelTitle: {
    fontSize: "1.3rem",
    margin: 0,
    color: "#ff6b35",
    fontWeight: "bold",
    flex: 1,
  },
  buttonDeleteSmall: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0.5rem",
    transition: "transform 0.2s ease",
  },
  formGroup: { marginBottom: "1rem", display: "flex", flexDirection: "column" },
  input: {
    padding: "0.75rem",
    border: "2px solid #f7931e",
    borderRadius: "6px",
    fontSize: "0.95rem",
    transition: "border-color 0.3s ease",
  },
  buttonPrimary: {
    backgroundColor: "#ff6b35",
    color: "#fff",
    border: "2px solid #ff6b35",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
    fontSize: "1rem",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(255, 107, 53, 0.4)",
  },
  buttonSecondary: {
    backgroundColor: "#fff",
    color: "#ff6b35",
    border: "2px solid #ff6b35",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "all 0.3s ease",
  },
  buttonDelete: {
    backgroundColor: "transparent",
    color: "#d32f2f",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "0.5rem",
    opacity: 1,
  },
  buttonDeleteInChip: {
    backgroundColor: "transparent",
    color: "#fff",
    border: "none",
    fontSize: "0.9rem",
    cursor: "pointer",
    padding: "0",
    opacity: 0.8,
    transition: "opacity 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  buttonExecute: {
    backgroundColor: "#4caf50",
    color: "#fff",
    border: "2px solid #4caf50",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    marginTop: "1rem",
    fontSize: "1rem",
    fontWeight: "bold",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(76, 175, 80, 0.4)",
  },
  drawsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  drawItem: {
    backgroundColor: "#f9f9f9",
    border: "2px solid #ddd",
    padding: "0.75rem",
    borderRadius: "6px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.3s ease",
  },
  drawItemActive: {
    backgroundColor: "#fff5e1",
    borderColor: "#f7931e",
    boxShadow: "0 4px 12px rgba(247, 147, 30, 0.2)",
  },
  drawItemTitle: { fontWeight: "bold", fontSize: "0.95rem" },
  drawItemMeta: { fontSize: "0.85rem", color: "#666" },
  sectionTitle: {
    fontSize: "1rem",
    marginTop: "1.5rem",
    marginBottom: "0.75rem",
  },
  info: {
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "4px",
    marginBottom: "1rem",
  },
  participantsList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
  },
  participantItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#ff6b35",
    color: "#fff",
    padding: "0.4rem 0.8rem",
    borderRadius: "20px",
    border: "2px solid #ff6b35",
    transition: "all 0.3s ease",
    fontSize: "0.9rem",
  },
  participantName: { fontWeight: "600", fontSize: "0.9rem" },
  winnerName: { fontWeight: "bold", fontSize: "0.9rem" },
  winnersList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  winnerItem: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    background: "linear-gradient(135deg, #fff5e1 0%, #ffe8cc 100%)",
    padding: "0.6rem 0.8rem",
    borderRadius: "8px",
    border: "2px solid #f7931e",
    boxShadow: "0 2px 8px rgba(247, 147, 30, 0.15)",
  },
  winnerRank: {
    fontSize: "1.3rem",
    fontWeight: "bold",
    color: "#ff6b35",
    minWidth: "2rem",
    textAlign: "center",
  },
};
