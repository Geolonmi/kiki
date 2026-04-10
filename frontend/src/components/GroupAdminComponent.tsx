import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import styles from "./adminStyles";
import type { Group } from "./adminTypes";

export function GroupAdminComponent() {
  const { callApi } = useApi();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participantList, setParticipantList] = useState<string[]>([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await callApi<Group[]>("/group");
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const resetForm = () => {
    setEditingGroup(null);
    setGroupName("");
    setParticipantInput("");
    setParticipantList([]);
  };

  const startEditing = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setParticipantList([...group.participants]);
    setParticipantInput("");
  };

  const handleAddParticipantToList = () => {
    const name = participantInput.trim();
    if (!name) return;
    if (participantList.includes(name)) {
      setError("Ce·tte participant·e est déjà dans la liste");
      return;
    }
    setParticipantList((prev) => [...prev, name]);
    setParticipantInput("");
    setError(null);
  };

  const handleRemoveParticipantFromList = (name: string) => {
    setParticipantList((prev) => prev.filter((p) => p !== name));
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      setError("Le nom du groupe est obligatoire");
      return;
    }
    try {
      setError(null);
      const payload = { name: groupName.trim(), participants: participantList };
      if (editingGroup) {
        await callApi<Group>(`/group/${editingGroup.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await callApi<Group>("/group", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      setError(null);
      await callApi<void>(`/group/${groupToDelete.id}`, { method: "DELETE" });
      setShowDeleteConfirm(false);
      setGroupToDelete(null);
      if (editingGroup?.id === groupToDelete.id) resetForm();
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <>
      {error && <div style={styles.error}>{error}</div>}

      {showDeleteConfirm && groupToDelete && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>
              ⚠️ Supprimer le groupe "{groupToDelete.name}" ?
            </h2>
            <p style={styles.modalText}>
              Cette action est irréversible. Les{" "}
              {groupToDelete.participants.length} participant·e·s seront
              supprimé·e·s.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.buttonDelete} onClick={handleDeleteGroup}>
                ✓ Oui, supprimer
              </button>
              <button
                style={styles.buttonCancel}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setGroupToDelete(null);
                }}
              >
                ✕ Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {/* Formulaire création / édition */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>
            {editingGroup
              ? `Modifier "${editingGroup.name}"`
              : "Créer un groupe"}
          </h2>

          <div style={styles.formGroup}>
            <label>Nom du groupe</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: CDPN"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Ajouter un·e participant·e</label>
            <div style={styles.inlineInput}>
              <input
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddParticipantToList();
                }}
                placeholder="Prénom Nom"
                style={{ ...styles.input, flex: 1 }}
              />
              <button
                style={styles.buttonAddInline}
                onClick={handleAddParticipantToList}
              >
                +
              </button>
            </div>
          </div>

          {participantList.length > 0 && (
            <>
              <p style={styles.participantCount}>
                {participantList.length} participant·e·s
              </p>
              <div style={styles.participantsList}>
                {participantList.map((name) => (
                  <div key={name} style={styles.participantItem}>
                    <span style={styles.participantName}>{name}</span>
                    <button
                      style={styles.buttonDeleteInChip}
                      onClick={() => handleRemoveParticipantFromList(name)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={styles.formActions}>
            <button style={styles.buttonPrimary} onClick={handleSaveGroup}>
              {editingGroup ? "💾 Enregistrer" : "Créer le groupe"}
            </button>
            {editingGroup && (
              <button style={styles.buttonCancel} onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Liste des groupes existants */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Groupes existants</h2>

          {loading && <p>Chargement...</p>}
          {!loading && groups.length === 0 && <p>Aucun groupe créé</p>}

          <div style={styles.groupsList}>
            {groups.map((group, index) => (
              <div
                key={group.id}
                style={{
                  ...styles.groupCard,
                  ...(editingGroup?.id === group.id
                    ? styles.groupCardActive
                    : {}),
                  ...(index === groups.length - 1 ? styles.groupCardLast : {}),
                }}
              >
                <div style={styles.groupCardHeader}>
                  <div>
                    <span style={styles.groupCardName}>{group.name}</span>
                    <span style={styles.groupCardCount}>
                      {group.participants.length} participant·e·s
                    </span>
                  </div>
                  <div style={styles.groupCardActions}>
                    <button
                      style={styles.buttonEditSmall}
                      onClick={() => startEditing(group)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      style={styles.buttonDeleteSmall}
                      onClick={() => {
                        setGroupToDelete(group);
                        setShowDeleteConfirm(true);
                      }}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div style={styles.participantsList}>
                  {group.participants.length === 0 ? (
                    <span style={styles.emptyLabel}>Aucun·e participant·e</span>
                  ) : (
                    group.participants.map((name) => (
                      <div key={name} style={styles.participantItem}>
                        <span style={styles.participantName}>{name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
