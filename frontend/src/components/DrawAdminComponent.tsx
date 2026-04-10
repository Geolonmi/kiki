import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { Wheel } from "./Wheel";
import styles from "./adminStyles";
import type { Draw, Group } from "./adminTypes";

export function DrawAdminComponent() {
  const { callApi } = useApi();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [selectedDrawId, setSelectedDrawId] = useState<string | null>(null);
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStatus = (status: any, expected: string): boolean =>
    String(status).toLowerCase() === expected.toLowerCase();

  const [newDrawTitle, setNewDrawTitle] = useState("");
  const [newDrawDate, setNewDrawDate] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState(1);
  const [participantName, setParticipantName] = useState("");
  const [lastExecutedDraw, setLastExecutedDraw] = useState<Draw | null>(null);
  const [showImportPrompt, setShowImportPrompt] = useState(false);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const loadDraws = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await callApi<Draw[]>("/draw");
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.scheduledDate).getTime() -
          new Date(a.scheduledDate).getTime(),
      );
      setDraws(sortedData);

      const executed = data
        .filter((d) => isStatus(d.status, "executed"))
        .sort(
          (a, b) =>
            new Date(b.executedAt || 0).getTime() -
            new Date(a.executedAt || 0).getTime(),
        );

      if (executed.length > 0) setLastExecutedDraw(executed?.[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

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

  const loadGroups = async () => {
    try {
      const data = await callApi<Group[]>("/group");
      setGroups(data);
    } catch {
      // silencieux — les groupes sont optionnels ici
    }
  };

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
      if (lastExecutedDraw && lastExecutedDraw.participants.length > 0) {
        setShowImportPrompt(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleImportParticipants = async () => {
    if (!currentDraw || !lastExecutedDraw) return;
    try {
      setError(null);
      for (const participant of lastExecutedDraw.participants) {
        await callApi<Draw>(`/draw/${currentDraw.id}/participants`, {
          method: "POST",
          body: JSON.stringify({ name: participant.name }),
        });
      }
      await loadDraw(currentDraw.id);
      setShowImportPrompt(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteDraw = async () => {
    if (!currentDraw) return;
    try {
      setError(null);
      await callApi<void>(`/draw/${currentDraw.id}`, { method: "DELETE" });
      setCurrentDraw(null);
      setSelectedDrawId(null);
      await loadDraws();
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleAddParticipant = async () => {
    if (!currentDraw || !participantName.trim()) {
      setError("Veuillez remplir le nom");
      return;
    }
    try {
      setError(null);
      const data = await callApi<Draw>(`/draw/${currentDraw.id}/participants`, {
        method: "POST",
        body: JSON.stringify({ name: participantName }),
      });
      setCurrentDraw(data);
      setParticipantName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

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

  const handleExecuteDraw = async () => {
    if (!currentDraw) return;
    try {
      setError(null);
      setIsWheelSpinning(true);
      const data = await callApi<Draw>(`/draw/${currentDraw.id}/execute`, {
        method: "POST",
      });
      await new Promise((resolve) => setTimeout(resolve, 4500));
      setCurrentDraw(data);
      await loadDraws();
      setIsWheelSpinning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setIsWheelSpinning(false);
    }
  };

  const handleImportGroup = async () => {
    if (!currentDraw || !selectedGroupId) return;
    const group = groups.find((g) => g.id === selectedGroupId);
    if (!group) return;
    try {
      setError(null);
      const data = await callApi<Draw>(
        `/draw/${currentDraw.id}/participants/bulk`,
        {
          method: "POST",
          body: JSON.stringify({ names: group.participants }),
        },
      );
      setCurrentDraw(data);
      setSelectedGroupId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  useEffect(() => {
    loadDraws();
    loadGroups();
  }, []);

  return (
    <>
      {error && <div style={styles.error}>{error}</div>}

      {showImportPrompt && currentDraw && lastExecutedDraw && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>
              Réutiliser les candidat·e·s du dernier tirage ?
            </h2>
            <p style={styles.modalText}>
              Le tirage précédent "{lastExecutedDraw.title}" contenait{" "}
              <strong>{lastExecutedDraw.participants.length}</strong>{" "}
              candidat·e·s.
            </p>
            <p style={styles.modalText}>
              Voulez-vous importer automatiquement ces candidat·e·s dans le
              nouveau tirage Kiki ?
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.buttonImport}
                onClick={handleImportParticipants}
              >
                ✓ Réutiliser les candidat·e·s
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

      {showDeleteConfirm && currentDraw && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>
              ⚠️ Supprimer le tirage "{currentDraw.title}" ?
            </h2>
            <p style={styles.modalText}>
              Cette action est irréversible. Tou·te·s les participant·e·s et
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

      <div style={styles.grid}>
        {/* Panneau gauche : création + liste */}
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
              onClick={(e) =>
                (e.currentTarget as HTMLInputElement).showPicker?.()
              }
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Nombre de gagnant·e·s</label>
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
                <div style={styles.drawItemTitle}>Kiki {draw.title}</div>
                <div style={styles.drawItemMeta}>
                  {draw.participants.length} participant·e·s
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panneau droit : détail du tirage sélectionné */}
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
                <strong>Gagnant·e·s à sélectionner :</strong>{" "}
                {currentDraw.numberOfWinners}
              </p>
            </div>

            {isStatus(currentDraw.status, "draft") && (
              <>
                <h3 style={styles.sectionTitle}>Ajouter des candidat·e·s</h3>

                {groups.length > 0 && (
                  <div style={styles.groupImportRow}>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">
                        — Utiliser les participant·e·s d'un groupe —
                      </option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.participants.length})
                        </option>
                      ))}
                    </select>
                    <button
                      style={{
                        ...styles.buttonImportGroup,
                        opacity: selectedGroupId ? 1 : 0.4,
                        cursor: selectedGroupId ? "pointer" : "default",
                      }}
                      onClick={handleImportGroup}
                      disabled={!selectedGroupId}
                    >
                      Importer
                    </button>
                  </div>
                )}

                <div style={styles.formGroup}>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddParticipant();
                    }}
                    placeholder="Nom du/de la candidat·e"
                    style={styles.input}
                  />
                </div>
                <button
                  style={styles.buttonSecondary}
                  onClick={handleAddParticipant}
                >
                  Ajouter un·e candidat·e
                </button>
              </>
            )}

            <h3 style={styles.sectionTitle}>
              Candidat·e·s ({currentDraw.participants.length})
            </h3>

            {currentDraw.participants.length === 0 ? (
              <p>Aucun·e candidat·e</p>
            ) : (
              <div style={styles.participantsList}>
                {currentDraw.participants.map((p) => (
                  <div key={p.id} style={styles.participantItem}>
                    <span style={styles.participantName}>{p.name}</span>
                    {isStatus(currentDraw.status, "draft") && (
                      <button
                        style={styles.buttonDeleteInChip}
                        onClick={() => handleRemoveParticipant(p.id)}
                        title="Supprimer"
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
                  🏆 Les élu·e·s ({currentDraw.winners.length})
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
    </>
  );
}
