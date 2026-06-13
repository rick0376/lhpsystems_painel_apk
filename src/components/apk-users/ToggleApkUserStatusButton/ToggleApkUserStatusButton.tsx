// src/components/apk-users/ToggleApkUserStatusButton/ToggleApkUserStatusButton.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff } from "lucide-react";
import styles from "./styles.module.scss";

type ToggleApkUserStatusButtonProps = {
  userId: string;
  active: boolean;
};

export function ToggleApkUserStatusButton({
  userId,
  active,
}: ToggleApkUserStatusButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);

    try {
      await fetch(`/api/apk-users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !active,
        }),
      });

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={active ? styles.disableButton : styles.enableButton}
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={active ? "Desativar usuário" : "Ativar usuário"}
      aria-label={active ? "Desativar usuário" : "Ativar usuário"}
    >
      {active ? (
        <PowerOff size={18} strokeWidth={2.4} />
      ) : (
        <Power size={18} strokeWidth={2.4} />
      )}
    </button>
  );
}
