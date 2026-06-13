// src/components/devices/DeleteDeviceButton/DeleteDeviceButton.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import styles from "./styles.module.scss";

type DeleteDeviceButtonProps = {
  deviceId: string;
  deviceName: string;
};

export function DeleteDeviceButton({
  deviceId,
  deviceName,
}: DeleteDeviceButtonProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Não foi possível remover o dispositivo.");
        return;
      }

      setOpen(false);
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
        title="Remover dispositivo"
        aria-label="Remover dispositivo"
      >
        <Trash2 size={18} strokeWidth={2.4} />
      </button>

      {open && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <span className={styles.warningIcon}>🗑️</span>

            <h2>Remover dispositivo?</h2>

            <p>
              Tem certeza que deseja remover o dispositivo{" "}
              <strong>{deviceName}</strong>?
            </p>

            <p className={styles.dangerText}>
              Essa ação libera uma vaga no limite de dispositivos do usuário.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.modalActions}>
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
                {loading ? "Removendo..." : "Sim, remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
