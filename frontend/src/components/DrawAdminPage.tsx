import { useState } from "react";
import { DrawAdminComponent } from "./DrawAdminComponent";
import { GroupAdminComponent } from "./GroupAdminComponent";
import styles from "./adminStyles";

export function DrawAdminPage() {
  const [activeTab, setActiveTab] = useState<"draws" | "groups">("draws");

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎉 Administration Kiki</h1>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === "draws" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("draws")}
        >
          🎰 Tirages
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "groups" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("groups")}
        >
          👥 Groupes
        </button>
      </div>

      {activeTab === "draws" ? <DrawAdminComponent /> : <GroupAdminComponent />}
    </div>
  );
}
