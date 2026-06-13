// src/components/devices/ToggleDeviceStatusButton/ToggleDeviceStatusButton.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock } from "lucide-react";
import styles from "./styles.module.scss";

type ToggleDeviceStatusButtonProps = {
  deviceId: string;
  active: boolean;
  deviceName?: string | null;
};

export function ToggleDeviceStatusButton({
  deviceId,
  active,
  deviceName,
}: ToggleDeviceStatusButtonProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextActive = !active;

  async function updateDeviceStatus() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: nextActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Não foi possível atualizar o dispositivo.");
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
        className={active ? styles.blockButton : styles.unblockButton}
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        title={active ? "Bloquear dispositivo" : "Desbloquear dispositivo"}
        aria-label={active ? "Bloquear dispositivo" : "Desbloquear dispositivo"}
      >
        {active ? (
          <Lock size={18} strokeWidth={2.4} />
        ) : (
          <Unlock size={18} strokeWidth={2.4} />
        )}
      </button>

      {open && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <span
              className={
                active ? styles.warningIconBlock : styles.warningIconUnblock
              }
            >
              {active ? "🔒" : "🔓"}
            </span>

            <h2>
              {active ? "Bloquear dispositivo?" : "Desbloquear dispositivo?"}
            </h2>

            <p>
              Tem certeza que deseja{" "}
              <strong>{active ? "bloquear" : "desbloquear"}</strong> o
              dispositivo <strong>{deviceName || "selecionado"}</strong>?
            </p>

            <p className={active ? styles.dangerText : styles.successText}>
              {active
                ? "Esse aparelho não conseguirá mais acessar o APK."
                : "Esse aparelho voltará a conseguir acessar o APK."}
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
                className={
                  active
                    ? styles.confirmBlockButton
                    : styles.confirmUnblockButton
                }
                type="button"
                onClick={updateDeviceStatus}
                disabled={loading}
              >
                {loading
                  ? active
                    ? "Bloqueando..."
                    : "Desbloqueando..."
                  : active
                    ? "Sim, bloquear"
                    : "Sim, desbloquear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
