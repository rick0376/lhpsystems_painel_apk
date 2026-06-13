// src/components/apk-users/DeleteApkUserButton/DeleteApkUserButton.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import styles from "./styles.module.scss";

type DeleteApkUserButtonProps = {
  userId: string;
  userName: string;
};

export function DeleteApkUserButton({
  userId,
  userName,
}: DeleteApkUserButtonProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/apk-users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Não foi possível excluir o usuário.");
        return;
      }

      router.push("/apk-users");
      router.refresh();
    } catch {
      setError("Falha de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className={styles.deleteButton}
        type="button"
        onClick={() => setOpen(true)}
        title="Excluir usuário"
        aria-label="Excluir usuário"
      >
        <Trash2 size={18} strokeWidth={2.4} />
      </button>

      {open && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <span className={styles.warningIcon}>⚠️</span>

            <h2>Excluir usuário?</h2>

            <p>
              Tem certeza que deseja excluir o usuário{" "}
              <strong>{userName}</strong>?
            </p>

            <p className={styles.dangerText}>
              Essa ação não poderá ser desfeita.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
              <button
                className={styles.cancelButton}
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                className={styles.confirmButton}
                type="button"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
