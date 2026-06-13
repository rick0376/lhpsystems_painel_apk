// src/components/layout/LogoutButton/LogoutButton.tsx

"use client";

import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <button className={styles.button} type="button" onClick={handleLogout}>
      Sair
    </button>
  );
}
